'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import {
  Box, Card, CardContent, Chip, CircularProgress,
  Grid, Typography
} from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import BusinessIcon from '@mui/icons-material/Business';
import SignpostIcon from '@mui/icons-material/Signpost';
import DashboardIcon from '@mui/icons-material/Dashboard';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import PlacaMercosul from '../../components/PlacaMercosul';
import { RadarsService } from '../../services';
import SockJS from 'sockjs-client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

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
  const [lastRadars, setLastRadars] = useState<Record<string, RadarEvent>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const { data: session, status } = useSession();
  const router = useRouter();
  const clientRef = useRef<Client | null>(null);

  const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://192.168.0.6:8081").replace(/\/$/, "");

  useEffect(() => {
    if (status === 'authenticated') {
      async function fetchInitialData() {
        try {
          const latestRadars: RadarEvent[] = await RadarsService.getLatestRadars();
          const initialState = latestRadars.reduce((acc, radar) => {
            acc[radar.concessionaria.toUpperCase()] = radar;
            return acc;
          }, {} as Record<string, RadarEvent>);
          setLastRadars(initialState);
        } catch (error) {
          setConnectionError("Falha ao carregar dados iniciais");
        } finally {
          setIsLoading(false);
        }
      }
      fetchInitialData();
    }
  }, [status]);

  useEffect(() => {
    if (status !== 'authenticated') return;

    const token =
      (session as any)?.accessToken ||
      (session as any)?.user?.accessToken ||
      (session as any)?.idToken;

    if (!token) {
      setConnectionError("Token de autenticação não encontrado");
      router.push('/');
      return;
    }

    const socketUrl = `${API_BASE_URL}/api/ws?access_token=${token}`;
    const client = new Client({
      webSocketFactory: () => new SockJS(socketUrl),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
    });

    client.onConnect = () => {
      setIsConnected(true);
      setConnectionError(null);
      client.subscribe('/topic/last-radar', (message) => {
        if (message.body) {
          try {
            const event: RadarEvent = JSON.parse(message.body);
            setLastRadars(prev => ({ ...prev, [event.concessionaria.toUpperCase()]: event }));
          } catch (e) { }
        }
      });
    };

    client.onWebSocketError = () => {
      setConnectionError("Falha na conexão com servidor");
      setIsConnected(false);
    };

    client.activate();
    clientRef.current = client;

    return () => { clientRef.current?.deactivate(); };
  }, [status, API_BASE_URL, session]);

  const formatDateTime = (data: string, hora: string) => {
    try {
      return new Date(`${data}T${hora}`).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      });
    } catch { return 'Data/Hora inválida'; }
  };

  if (status === 'loading') {
    return (
      <Box className="flex justify-center items-center h-screen">
        <CircularProgress color="warning" />
      </Box>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 md:p-6">
      {/* Header */}
      <Card
        className="mb-4 overflow-hidden md:mb-6"
        sx={{
          background: "linear-gradient(135deg, #14213d 0%, #1a2b4a 100%)",
          boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
        }}
      >
        <CardContent className="px-4 py-5 md:px-6 md:py-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/10 p-2 md:p-3">
                <DashboardIcon
                  sx={{ fontSize: { xs: 28, md: 40 }, color: "#fca311" }}
                />
              </div>
              <div>
                <Typography
                  variant="h5"
                  className="font-bold text-white"
                  sx={{ fontSize: { xs: "1.1rem", md: "1.5rem" } }}
                >
                  Dashboard
                </Typography>
                <Typography variant="body2" className="text-xs text-gray-300">
                  Monitoramento em tempo real
                </Typography>
              </div>
            </div>

            {/* Status indicators */}
            <div className="flex flex-wrap items-center gap-2">
              {isConnected ? (
                <Chip
                  icon={
                    <WifiIcon
                      sx={{ color: "white !important", fontSize: 16 }}
                    />
                  }
                  label="Conectado"
                  size="small"
                  sx={{
                    bgcolor: "#059669",
                    color: "white",
                    fontWeight: 600,
                    fontSize: "12px",
                  }}
                />
              ) : (
                <Chip
                  icon={
                    <WifiOffIcon
                      sx={{ color: "white !important", fontSize: 16 }}
                    />
                  }
                  label="Desconectado"
                  size="small"
                  sx={{
                    bgcolor: "#ef4444",
                    color: "white",
                    fontWeight: 600,
                    fontSize: "12px",
                  }}
                />
              )}
              {connectionError && (
                <Typography
                  variant="caption"
                  sx={{
                    color: "#fca311",
                    bgcolor: "rgba(252,163,17,0.1)",
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1,
                  }}
                >
                  ⚠️ {connectionError}
                </Typography>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de radar */}
      {isLoading ? (
        <Box className="flex flex-col items-center justify-center p-12">
          <CircularProgress size={50} sx={{ color: "#fca311", mb: 2 }} />
          <Typography variant="body1" className="text-gray-600">
            Carregando dados dos radares...
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={{ xs: 2, md: 2 }}>
          {Object.values(lastRadars)
            .sort((a, b) => a.concessionaria.localeCompare(b.concessionaria))
            .map((radar) => (
              <Grid size={{ xs: 10, lg: 3 }} key={radar.concessionaria}>
                <Card
                  elevation={0}
                  className="h-full transition-all duration-300 hover:shadow-xl"
                  sx={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    overflow: "hidden",
                  }}
                >
                  {/* Card Header */}
                  <Box
                    sx={{
                      background:
                        "linear-gradient(135deg, #fca311 0%, #e09200 100%)",
                      padding: "12px 16px",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-white/20 p-1.5">
                        <BusinessIcon sx={{ color: "white", fontSize: 20 }} />
                      </div>
                      <div>
                        <Typography
                          variant="caption"
                          className="text-xs font-medium uppercase tracking-wide text-white/80"
                        >
                          Último Radar
                        </Typography>
                        <Typography
                          variant="subtitle1"
                          className="font-bold leading-tight text-white"
                        >
                          {radar.concessionaria.toUpperCase()}
                        </Typography>
                      </div>
                    </div>
                  </Box>

                  {/* Card Content */}
                  <CardContent sx={{ padding: "16px !important" }}>
                    <div className="flex flex-col gap-4 sm:flex-row">
                      {/* Placa */}
                      <Box className="flex flex-col items-center justify-center rounded-lg bg-gray-50 p-3 sm:w-1/2">
                        <div className="mb-2 flex items-center gap-1">
                          <DirectionsCarIcon
                            sx={{ color: "#6b7280", fontSize: 16 }}
                          />
                          <Typography
                            variant="caption"
                            className="text-xs font-medium text-gray-600"
                          >
                            Placa
                          </Typography>
                        </div>
                        <PlacaMercosul placa={radar.placa} />
                      </Box>

                      {/* Info */}
                      <div className="flex flex-col gap-2 sm:w-1/2">
                        <Box className="rounded-lg bg-gray-50 p-2.5">
                          <div className="mb-1 flex items-center gap-1">
                            <CalendarTodayIcon
                              sx={{ color: "#fca311", fontSize: 14 }}
                            />
                            <Typography
                              variant="caption"
                              className="text-xs font-medium uppercase tracking-wide text-gray-600"
                            >
                              Data e Hora
                            </Typography>
                          </div>
                          <Typography
                            variant="body2"
                            className="font-mono text-sm font-semibold text-gray-800"
                          >
                            {formatDateTime(radar.data, radar.hora)}
                          </Typography>
                        </Box>

                        <Box className="rounded-lg bg-gray-50 p-2.5">
                          <div className="mb-1 flex items-center gap-1">
                            <SignpostIcon
                              sx={{ color: "#fca311", fontSize: 14 }}
                            />
                            <Typography
                              variant="caption"
                              className="text-xs font-medium uppercase tracking-wide text-gray-600"
                            >
                              Localização
                            </Typography>
                          </div>
                          <Typography
                            variant="body2"
                            className="text-sm font-semibold text-gray-800"
                          >
                            {radar.rodovia}{" "}
                            {radar.km &&
                              radar.km !== "N/A" &&
                              radar.km !== "null" &&
                              `KM ${radar.km}`}
                          </Typography>
                          <Typography
                            variant="caption"
                            className="block text-gray-500"
                          >
                            {radar.praca} • {radar.sentido}
                          </Typography>
                        </Box>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Grid>
            ))}
        </Grid>
      )}
    </div>
  );
}