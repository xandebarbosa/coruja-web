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
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const { data: session, status } = useSession();
  const router = useRouter();

  // guarda referência do client para cleanup
  const clientRef = useRef<Client | null>(null);
  // guarda id da subscription para cancelar se necessário
  const subscriptionRef = useRef<any>(null);

  // Busca dados iniciais
  useEffect(() => {
    if (status === 'authenticated') {
      async function fetchInitialData() {
        try {
          const latestRadars: RadarEvent[] = await getLatestRadars();
          const initialRadarsState = latestRadars.reduce((acc, radar) => {
            acc[radar.concessionaria.toUpperCase()] = radar;
            return acc;
          }, {} as Record<string, RadarEvent>);

          console.log("✅ Dados iniciais carregados:", initialRadarsState);
          setLastRadars(initialRadarsState);
        } catch (error) {
          console.error("❌ Erro na carga inicial:", error);
          setConnectionError("Falha ao carregar dados iniciais");
        } finally {
          setIsLoading(false);
        }
      }
      fetchInitialData();
    }
  }, [status]);

  // Configura conexão WebSocket
  useEffect(() => {
    if (status !== 'authenticated') return;

    // Extrai token de diferentes locais possíveis
    const token = 
      (session as any)?.accessToken ||
      (session as any)?.user?.accessToken ||
      (session as any)?.user?.access_token ||
      (session as any)?.idToken;

    console.log("🔑 Token encontrado:", token ? "Sim" : "Não");

    if (!token) {
      console.warn('⚠️ Nenhum access token encontrado. Redirecionando...');
      setConnectionError("Token de autenticação não encontrado");
      router.push('/');
      return;
    }

    // CORREÇÃO 1: Use apenas o endpoint base do WebSocket
    // O SockJS automaticamente adiciona /info e outros sufixos
    const sockJsBaseUrl = `http://localhost:8081/api/ws`;

    console.log("🔌 Iniciando conexão WebSocket para:", sockJsBaseUrl);

    const client = new Client({
      webSocketFactory: () => {
        // CORREÇÃO 2: Crie o SockJS com configurações adequadas
        const socket = new SockJS(sockJsBaseUrl, null, {
          // Timeout aumentado para dar tempo ao backend processar
          timeout: 10000,
        });

        // CORREÇÃO 3: Adicione listeners para debug
        socket.onopen = () => console.log("✅ SockJS conectado");
        socket.onerror = (e) => console.error("❌ Erro SockJS:", e);
        
        return socket;
      },

      // CORREÇÃO 4: Configure headers de conexão com o token
      connectHeaders: {
        Authorization: `Bearer ${token}`,
        // Alguns servidores podem esperar o token aqui também
        'X-Authorization': `Bearer ${token}`,
      },

      debug: (str) => {
        // Logs detalhados apenas em desenvolvimento
        if (process.env.NODE_ENV === 'development') {
          console.debug('[STOMP]', str);
        }
      },

      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
    });

    client.onConnect = (frame: Frame) => {
      console.info('✅ STOMP conectado com sucesso', frame);
      setIsConnected(true);
      setConnectionError(null);

      try {
        // Subscribe ao tópico com headers de autenticação
        const sub = client.subscribe(
          '/topic/last-radar',
          (message: IMessage) => {
            if (message.body) {
              try {
                const newRadarEvent: RadarEvent = JSON.parse(message.body);
                console.log("📡 Novo evento recebido:", newRadarEvent);
                
                setLastRadars((current) => ({
                  ...current,
                  [newRadarEvent.concessionaria.toUpperCase()]: newRadarEvent,
                }));
              } catch (err) {
                console.error('❌ Erro ao parsear mensagem:', err);
              }
            }
          },
          // CORREÇÃO 5: Adicione headers na subscription também
          {
            Authorization: `Bearer ${token}`,
          }
        );
        
        subscriptionRef.current = sub;
        setIsSubscribed(true);
        console.log("✅ Inscrito no tópico /topic/last-radar");
      } catch (err) {
        console.error('❌ Erro ao subscrever:', err);
        setConnectionError("Falha ao se inscrever no tópico");
      }
    };

    client.onStompError = (frame) => {
      console.error('❌ Erro STOMP:', frame.headers['message']);
      console.error('Detalhes:', frame.body);
      setConnectionError(`Erro STOMP: ${frame.headers['message']}`);
      setIsConnected(false);
    };

    client.onWebSocketClose = (evt) => {
      console.warn('⚠️ WebSocket fechado', evt);
      setIsConnected(false);
      setIsSubscribed(false);
    };

    client.onWebSocketError = (evt) => {
      console.error('❌ Erro WebSocket', evt);
      setConnectionError("Erro na conexão WebSocket");
    };

    clientRef.current = client;
    
    // Ativa a conexão
    client.activate();

    // Cleanup
    return () => {
      console.log("🧹 Limpando conexões WebSocket");
      try {
        if (subscriptionRef.current) {
          subscriptionRef.current.unsubscribe();
          subscriptionRef.current = null;
        }
        if (clientRef.current) {
          clientRef.current.deactivate();
          clientRef.current = null;
        }
      } catch (err) {
        console.error('❌ Erro no cleanup:', err);
      }
    };
  }, [status, session, router]);

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
        <Typography className="ml-4">Carregando...</Typography>
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
          {/* Indicadores de status */}
          <Box className="flex gap-2 mt-2">
            <Typography variant="caption" className={isConnected ? 'text-green-600' : 'text-red-600'}>
              {isConnected ? '🟢 Conectado' : '🔴 Desconectado'}
            </Typography>
            {isSubscribed && (
              <Typography variant="caption" className="text-blue-600">
                📡 Recebendo eventos
              </Typography>
            )}
          </Box>

          {/* Erro de conexão */}
          {connectionError && (
            <Typography variant="body2" className="text-red-600 mt-2">
              ⚠️ {connectionError}
            </Typography>
          )}
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