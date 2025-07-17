'use client';

import React, { useEffect, useState } from 'react';
import { Client } from '@stomp/stompjs';
import { Box, Card, CardContent, Chip, CircularProgress, Grid, Paper, Typography } from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import BusinessIcon from '@mui/icons-material/Business';
import SignpostIcon from '@mui/icons-material/Signpost';
import PlacaMercosul from '../components/PlacaMercosul';
import { getLatestRadars } from '../services/api';
import SockJS from 'sockjs-client';


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

  // NOVO: useEffect para a carga inicial dos dados
  useEffect(() => {
    async function fetchInitialData() {
      try {
        const latestRadars: RadarEvent[] = await getLatestRadars();
        const initialRadarsState = latestRadars.reduce((acc, radar) => {
          acc[radar.concessionaria.toUpperCase()] = radar;
          return acc;
        }, {} as Record<string, RadarEvent>);
        setLastRadars(initialRadarsState);
      } catch (error) {
        console.error("Erro na carga inicial:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchInitialData();
  }, []);

  useEffect(() => {
    // Cria um cliente STOMP sobre uma conexão SockJS
    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'), // URL do endpoint WebSocket no BFF
      debug: (str) => {
        console.log(new Date(), str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = (frame) => {
      client.subscribe('/topic/last-radar', (message) => {
        if (message.body) {
          const newRadarEvent: RadarEvent = JSON.parse(message.body);
          
          // MUDANÇA: Atualiza apenas a concessionária que enviou o dado
          setLastRadars(currentRadars => ({
            ...currentRadars,
            [newRadarEvent.concessionaria.toUpperCase()]: newRadarEvent,
          }));
        }
      });
    };

    client.activate();
    return () => { client.deactivate(); };
  },[]);  

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