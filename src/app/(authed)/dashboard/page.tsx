'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Client, Frame, IMessage } from '@stomp/stompjs';
import { Box, Card, CardContent, Chip, CircularProgress, Grid, Paper, Typography } from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import BusinessIcon from '@mui/icons-material/Business';
import SignpostIcon from '@mui/icons-material/Signpost';
import DashboardIcon from '@mui/icons-material/Dashboard';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import PlacaMercosul from '../../components/PlacaMercosul';
import { RadarsService } from '../../services';
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

   // ✅ CORREÇÃO: URL base do backend
  const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://192.168.0.6:8081").replace(/\/$/, "");

   // Busca dados iniciais
  useEffect(() => {
    if (status === 'authenticated') {
      async function fetchInitialData() {
        try {
          console.log("📡 Carregando dados iniciais...");
          const latestRadars: RadarEvent[] = await RadarsService.getLatestRadars();
          const initialRadarsState = latestRadars.reduce((acc, radar) => {
            acc[radar.concessionaria.toUpperCase()] = radar;
            return acc;
          }, {} as Record<string, RadarEvent>);

          console.log("✅ Dados iniciais carregados:", Object.keys(initialRadarsState).length, "radares");
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

    // Use NEXT_PUBLIC_API_URL se tiver, ou hardcode para teste com IP da máquina
    const socketUrl= `${API_BASE_URL}/api/ws?access_token=${token}`;
    console.log("🔌 Confirmando apiBaseUrl para:", socketUrl);
    // ATENÇÃO: SockJS não suporta passar headers no handshake HTTP padrão.
    // Precisamos passar o token na Query String para o handshake inicial.
    //const sockJsUrl = `${socketUrl}/ws?access_token=${token}`;

    console.log("🔌 [Front] Conectando em:", socketUrl);


    const client = new Client({
      // A factory cria o socket apontando para a URL com token
      webSocketFactory: () => new SockJS(socketUrl),
      
      // Também enviamos o token no cabeçalho STOMP para validação dupla/padrão
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      
      // Debug apenas em desenvolvimento
      debug: (str) => {
        if (process.env.NODE_ENV === 'development') console.debug('[STOMP]', str);
      },
    });

    client.onConnect = (frame) => {
      console.log('✅ [WS] Conectado e Autenticado!');
      setIsConnected(true);
      setConnectionError(null);

      client.subscribe('/topic/last-radar', (message) => {
        if (message.body) {
          try {
            const event: RadarEvent = JSON.parse(message.body);
            setLastRadars(prev => ({
              ...prev,
              [event.concessionaria.toUpperCase()]: event
            }));
          } catch (e) { console.error("Erro ao processar mensagem WS:", e); }
        }
      });
    };

    client.onStompError = (frame) => {
      console.error('❌ Erro STOMP:', frame.headers['message']);
      setConnectionError("Erro de protocolo WebSocket");
    };

    client.onWebSocketError = (e) => {
        console.error('❌ Erro de Rede WebSocket:', e);
        setConnectionError("Falha na conexão com servidor");
        setIsConnected(false);
    }

    client.activate();
    clientRef.current = client;

    return () => {
      if (clientRef.current) {
        console.log("bs [WS] Desconectando...");
        clientRef.current.deactivate();
      }
    };
  }, [status, API_BASE_URL, session]);

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
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6'>
      {/* Header Card */}
      <Card 
        className='mb-6 overflow-hidden'
        sx={{
          background: 'linear-gradient(135deg, #14213d 0%, #1a2b4a 100%)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
        }}
      >
        <CardContent className='py-8'>          
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <div className='bg-white/10 p-3 rounded-xl backdrop-blur-sm'>
                <DashboardIcon sx={{ fontSize: 40, color: '#fca311' }} />
              </div>
              <div>
                <Typography 
                  variant="h4" 
                  className="font-bold text-white mb-1"
                  sx={{ letterSpacing: '-0.5px'}}
                >
                  Dashboard
                </Typography>
                <Typography variant="body2" className="text-gray-300">
                  Monitoramento em tempo real
                </Typography>
              </div>
            </div>
            
            {/* Status Indicators */}
            <div className='flex flex-col gap-2 items-end'>
              <div className='flex items-center gap-3'>
                {isConnected ? (
                  <Chip
                    icon={<WifiIcon sx={{ color: 'white !important' }} />}
                    label="Conectado"
                    size="small"
                    sx={{
                      bgcolor: '#059669',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '13px',
                      '& .MuiChip-icon': {
                        color: 'white',
                      },
                    }}
                  />
                ) : (
                  <Chip
                    icon={<WifiOffIcon sx={{ color: 'white !important' }} />}
                    label="Desconectado"
                    size="small"
                    sx={{
                      bgcolor: '#ef4444',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '13px',
                      '& .MuiChip-icon': {
                        color: 'white',
                      },
                    }}
                  />
                )}
                
                {isSubscribed && (
                  <Chip
                    icon={<SignalCellularAltIcon sx={{ color: 'white !important' }} />}
                    label="Recebendo eventos"
                    size="small"
                    sx={{
                      bgcolor: '#3b82f6',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '13px',
                      '& .MuiChip-icon': {
                        color: 'white',
                      },
                    }}
                  />
                )}
              </div>

              {connectionError && (
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: '#fca311',
                    bgcolor: 'rgba(252, 163, 17, 0.1)',
                    padding: '4px 12px',
                    borderRadius: '6px',
                    fontWeight: 500,
                  }}
                >
                  ⚠️ {connectionError}
                </Typography>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Loading State */}
      {isLoading ? (
        <Box className="flex flex-col items-center justify-center p-12">
          <CircularProgress 
            size={60}
            sx={{ 
              color: '#fca311',
              marginBottom: 2,
            }} 
          />
          <Typography variant="body1" className="text-gray-600 font-medium">
            Carregando dados dos radares...
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Mapeia os valores do objeto de radares e ordena por nome da concessionária */}
          {Object.values(lastRadars)
            .sort((a, b) => a.concessionaria.localeCompare(b.concessionaria))
            .map((radar) => (
            <Grid size={{ xs: 12, lg: 6 }} key={radar.concessionaria}>
              <Card 
                elevation={0}
                className="h-full transition-all duration-300 hover:shadow-xl"
                sx={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  overflow: 'hidden',
                }}
              >
                {/* Card Header */}
                <Box 
                  sx={{
                    background: 'linear-gradient(135deg, #fca311 0%, #e09200 100%)',
                    padding: '16px 24px',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                        <BusinessIcon sx={{ color: 'white', fontSize: 24 }} />
                      </div>
                      <div>
                        <Typography variant="caption" className="text-white/80 uppercase tracking-wide font-medium">
                          Último Radar
                        </Typography>
                        <Typography variant="h6" className="text-white font-bold">
                          {radar.concessionaria.toUpperCase()}
                        </Typography>
                      </div>
                    </div>
                  </div>
                </Box>

                {/* Card Content */}
                <CardContent sx={{ padding: '24px' }}>
                  <Grid container spacing={3}>              
                    {/* Placa Section */}
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Box className="bg-gray-50 rounded-lg p-4 h-full flex flex-col justify-center items-center">
                        <div className="flex items-center gap-2 mb-3">
                          <DirectionsCarIcon sx={{ color: '#6b7280', fontSize: 20 }} />
                          <Typography variant="body2" className="text-gray-600 font-medium">
                            Placa
                          </Typography>
                        </div>
                        <PlacaMercosul placa={radar.placa} />
                      </Box>
                    </Grid>

                    {/* Info Section */}
                    <Grid size={{ xs: 12, md: 6 }}>
                      <div className="flex flex-col gap-4">
                        {/* Data e Hora */}
                        <Box className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <CalendarTodayIcon sx={{ color: '#fca311', fontSize: 18 }} />
                            <Typography variant="caption" className="text-gray-600 font-medium uppercase tracking-wide">
                              Data e Hora
                            </Typography>
                          </div>
                          <Typography variant="body1" className="font-mono font-semibold text-gray-800">
                            {formatDateTime(radar.data, radar.hora)}
                          </Typography>
                        </Box>

                        {/* Localização */}
                        <Box className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <SignpostIcon sx={{ color: '#fca311', fontSize: 18 }} />
                            <Typography variant="caption" className="text-gray-600 font-medium uppercase tracking-wide">
                              Localização
                            </Typography>
                          </div>
                          <Typography variant="body1" className="font-semibold text-gray-800">
                            {radar.rodovia} {radar.km !== 'N/A' && `KM ${radar.km}`}
                          </Typography>
                          <Typography variant="caption" className="text-gray-600 mt-1 block">
                            {radar.praca} • {radar.sentido}
                          </Typography>
                        </Box>
                      </div>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </div>
  );
}