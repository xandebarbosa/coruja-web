'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Client, Frame, IMessage } from '@stomp/stompjs';
import { Box, Card, CardContent, Chip, CircularProgress, Grid, Paper, Typography } from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import BusinessIcon from '@mui/icons-material/Business';
import SignpostIcon from '@mui/icons-material/Signpost';
import PlacaMercosul from '../../components/PlacaMercosul';
import { getLatestRadars } from '../../services/api';
import SockJS from 'sockjs-client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';


// Crie uma interface para o objeto de radar que virá do WebSocket
interface RadarEvent {
  concessionaria: string;
  data: string;
  hora: string;
  placa: string;
  rodovia: string;
  praca: string;
  sentido: string;
  km: string;
}

export default function Dashboard() {

  // MUDANÇA: O estado agora é um objeto que usa o nome da concessionária como chave
  const [lastRadars, setLastRadars] = useState<Record<string, RadarEvent>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const { data: session, status } = useSession();
  const router = useRouter();

  // guarda referência do client para cleanup
  const clientRef = useRef<Client | null>(null);
  // guarda id da subscription para cancelar se necessário
  const subscriptionRef = useRef<any>(null);

  // NOVO: useEffect para a carga inicial dos dados
  useEffect(() => {
    // Só busca os dados se a sessão estiver autenticada
    if (status === 'authenticated') {
      async function fetchInitialData() {
        try {
          const latestRadars: RadarEvent[] = await getLatestRadars();
          const initialRadarsState = latestRadars.reduce((acc, radar) => {
            acc[radar.concessionaria.toUpperCase()] = radar;
            return acc;
          }, {} as Record<string, RadarEvent>);

          console.log("latestRadars ==>", latestRadars);
          console.log("initialRadarsState ==>", initialRadarsState);
          
          setLastRadars(initialRadarsState);
        } catch (error) {
          console.error("Erro na carga inicial:", error);
        } finally {
          setIsLoading(false);
        }
      }
      fetchInitialData();
    }
  }, [status]); // NOVO: Disparar quando o 'status' mudar para 'authenticated'

    useEffect(() => {
    if (status !== 'authenticated') return;

    // TENTATIVAS COMUNS DE ONDE O accessToken PODE ESTAR NO session:
    const maybeToken =
      // next-auth callback pode colocar em session.accessToken
      (session as any)?.accessToken ||
      // ou em session.user.accessToken
      (session as any)?.user?.accessToken ||
      (session as any)?.user?.access_token ||
      (session as any)?.idToken; // fallback

    if (!maybeToken) {
      console.warn('Nenhum access token encontrado na sessão. Verifique callbacks do next-auth.');
    }

    const token = maybeToken ?? '';

    // encode token para query param (cautela com caracteres especiais)
    const sockJsUrl = `http://localhost:8080/api/ws?access_token=${encodeURIComponent(token)}`;

    const client = new Client({
      // webSocketFactory é usado para SockJS
      webSocketFactory: () => new SockJS(sockJsUrl),
      debug: (str) => {
        // descomente se quiser logs verbosos
        console.debug('[STOMP]', str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      // Quando usar brokerURL em vez de webSocketFactory, brokerURL é ignorado ao fornecer webSocketFactory.
    });

    client.onConnect = (frame: Frame) => {
      console.info('STOMP conectado', frame);
      setIsConnected(true);

      // passe token também via headers do STOMP CONNECT (alguns servers usam isso)
      // Note: ao usar client.activate(), connect headers podem ser passados por client.connectHeaders,
      //   mas aqui vamos passar no subscribe/send conforme necessário.
      try {
        // subscribe ao tópico
        const sub = client.subscribe('/topic/last-radar', (message: IMessage) => {
          if (message.body) {
            try {
              const newRadarEvent: RadarEvent = JSON.parse(message.body);
              setLastRadars((current) => ({
                ...current,
                [newRadarEvent.concessionaria.toUpperCase()]: newRadarEvent,
              }));
            } catch (err) {
              console.error('Erro parseando mensagem STOMP:', err);
            }
          }
        });
        subscriptionRef.current = sub;
        setIsSubscribed(true);
      } catch (err) {
        console.error('Erro ao subscrever:', err);
      }
    };

    client.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Detalhes: ' + frame.body);
    };

    client.onWebSocketClose = (evt) => {
      console.warn('WebSocket fechado', evt);
      setIsConnected(false);
      setIsSubscribed(false);
    };

    client.onWebSocketError = (evt) => {
      console.error('WebSocket error', evt);
    };

    // Se quiser que o STOMP envie headers no connect:
    if (token) {
      (client as any).connectHeaders = {
        Authorization: `Bearer ${token}`,
      };
    }

    clientRef.current = client;
    client.activate();

    // Cleanup quando o componente desmontar ou status mudar
    return () => {
      try {
        if (subscriptionRef.current) {
          subscriptionRef.current.unsubscribe();
          subscriptionRef.current = null;
        }
        if (clientRef.current) {
          clientRef.current.deactivate(); // fecha conexões e para reconexão
          clientRef.current = null;
        }
      } catch (err) {
        console.error('Erro no cleanup do STOMP client:', err);
      }
    };
  }, [status, session])

  // Função auxiliar para formatar a data/hora
  const formatDateTime = (data: string, hora: string) => {
    try {
      return new Date(`${data}T${hora}`).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch (e) {
      return 'Data/Hora inválida';
    }
  };

  // --- NOVO: Lógica de Proteção da Página ---
  if (status === 'loading') {
    return (
      <Box className="flex justify-center items-center h-screen">
        <CircularProgress color="warning" />
      </Box>
    );
  }

  if (status === 'unauthenticated') {
    // Redireciona para a página de login (ou home)
    router.push('/');
    return null; // Retorna null enquanto redireciona
  }
  // --- Fim da Lógica de Proteção ---

  // Se chegou aqui, status === 'authenticated', então renderiza a página

  return (
    <div className='p-4'>
      <Card className='mb-4'>
        <CardContent>
          <Typography variant="h4" className="text-3xl font-roboto font-black text-gray-800">Dashboard</Typography>
        </CardContent>
      </Card>
      
      {isLoading ? (
        <Box className="flex justify-center p-8"><CircularProgress color="warning" /></Box>
      ) : (
        <Grid container spacing={4}>
          {/* Mapeia os valores do objeto de radares e ordena por nome da concessionária */}
          {Object.values(lastRadars)
            .sort((a, b) => a.concessionaria.localeCompare(b.concessionaria))
            .map((radar) => (
            <Grid size={{ xs: 12, md: 6 }} key={radar.concessionaria}>
              <Paper elevation={3} className="p-6 rounded-lg h-full flex flex-col">
                <Typography variant="h6" component="h2" className="font-semibold text-gray-700 mb-4 flex items-center">
                  <BusinessIcon className="text-orange-500 mr-2" />
                  Último Radar - 
                  <Chip label={radar.concessionaria.toUpperCase()} color="primary" size="small" className="bg-orange-600 font-semibold ml-2" />
                </Typography>
                
                <Grid container spacing={3} className="flex-grow">              

                  <Grid size={{ xs: 12, md: 6 }} className="flex items-center">
                    <Box>
                      <Typography variant="body2" className="text-gray-500">
                          <DirectionsCarIcon className="text-gray-600 mr-1 mb-1"/>
                          Placa
                      </Typography>                                           
                      <PlacaMercosul placa={radar.placa} />
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }} className="flex flex-col justify-center space-y-4">
                    <Box>
                      <CalendarTodayIcon className="text-gray-600" />
                      <div>
                        <Typography variant="body2" className="text-gray-500">Data e Hora</Typography>
                        <Typography variant="subtitle1" component="p" className="font-mono">
                          {formatDateTime(radar.data, radar.hora)}
                        </Typography>
                      </div>
                      
                    </Box>

                    <Box>
                      <SignpostIcon className="text-gray-600" />
                      <Typography variant="body2" className="text-gray-500">Localização</Typography>
                      <Typography variant="subtitle1" component="p">
                        {radar.rodovia} {radar.km !== 'N/A' && `KM ${radar.km}`}
                      </Typography>
                      <Typography variant="caption" className="text-gray-600">
                        {radar.praca} ({radar.sentido})
                      </Typography>
                    </Box>
                  </Grid>

                </Grid>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </div>

  );  
}