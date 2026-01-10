'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { DataGrid, GridActionsCellItem, GridColDef, GridPaginationModel, GridRenderCellParams } from '@mui/x-data-grid';
import BusinessIcon from '@mui/icons-material/Business';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SignpostIcon from '@mui/icons-material/Signpost';
import DriveEtaIcon from '@mui/icons-material/DriveEta';

import ColorLensIcon from '@mui/icons-material/ColorLens';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import PersonIcon from '@mui/icons-material/Person';
import { monitoringService } from  '../../services'; // Ajuste a importação se necessário
import { AlertHistoryRow, MonitoredPlate } from '../../types/types';
import CustomPagination from '../../components/CustomPagination';
import { Box, Paper, Typography, Chip, keyframes, Grid, Divider, Card, CardContent, IconButton, Menu, List, ListItem, Slider, MenuItem, alpha, LinearProgress } from '@mui/material';
import { Client } from '@stomp/stompjs';
import { DirectionsCar, LocationOn, Notifications, Settings, Speed, Visibility, VolumeUp } from '@mui/icons-material';
import AlertPreviewDialog from './components/PreviewDialog';
import PlacaMercosul from '../../components/PlacaMercosul';
import SockJS from 'sockjs-client';
import { toast } from 'react-toastify';

const formatDateTime = (dateTimeString: string) => {
    if (!dateTimeString) return "N/A";
    return new Date(dateTimeString).toLocaleString('pt-BR');
};

export default function MonitoramentoRealtimePage() {
    // --- ESTADOS PRINCIPAIS DA PÁGINA ---
    const [rows, setRows] = useState<AlertHistoryRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [rowCount, setRowCount] = useState(0);    
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });
    
    //Estados para o Dialog de preview
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [selectedRowData, setSelectedRowData] = useState<AlertHistoryRow | null>(null);
    
    // Estados para as Configurações de Áudio
    // NOVO: Estado para sabermos se o áudio foi "desbloqueado" pelo usuário
    const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
    const [audioVolume, setAudioVolume] = useState<number>(() => {
        if (typeof window !== 'undefined') {
            const savedVolume = localStorage.getItem('audioVolume');
            return savedVolume ? parseFloat(savedVolume) : 0.5; // Padrão 50%
        }
        return 0.5;
    });
     // Ao iniciar o estado, tentamos ler o valor salvo. Se não houver, usamos o padrão.
    const [audioSource, setAudioSource] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('selectedAudioSource') || '/sounds/siren-alert.mp3';
        }
        return '/sounds/siren-alert.mp3';
    });
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);    
    
    // --- REFERÊNCIAS PARA CONTROLE DE EFEITOS ---
    // --- Referências para o alerta sonoro ---
    const audioCooldownRef = useRef(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    //const sockJsUrl = `${process.env.NEXT_PUBLIC_WS_URL}?access_token=${encodeURIComponent(token)}`;
    
    // --- Funções para controlar o Dialog ---
    const handlePreviewClick = (row: AlertHistoryRow) => {
      setSelectedRowData(row);
      setIsPreviewOpen(true);
    };

    const handleClosePreview = () => {
      setIsPreviewOpen(false);
    };    

    // Função para buscar o histórico paginado da API, com ordenação
    const fetchInitialHistory = useCallback(async () => {
        setLoading(true);
        try {
            const data = await monitoringService.getAlertHistory({
                page: paginationModel.page,
                size: paginationModel.pageSize,
                sort: 'dataHora,desc' // Ordena por dataHora decrescente
            });
            console.log("Data fetchHistory  ==>", data);
            
            setRows(data.content || []);
            setRowCount(data.page?.totalElements || 0);
        } catch (error) {
            console.error("Erro ao buscar histórico de alertas:", error);
            toast.error("Não foi possível carregar o histórico de alertas.");
        } finally {
            setLoading(false);
        }
    }, [paginationModel]);

     // Função para tocar som e notificar
    const playSoundAndNotify = useCallback((placa: string) => {
        if (isAudioUnlocked && !audioCooldownRef.current && audioRef.current) {
            audioCooldownRef.current = true;

            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(e => console.error("Erro de autoplay do áudio:", e));

            // Pausa o som após o tempo definido
            setTimeout(() => {
                if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                }
                audioCooldownRef.current = false;
            }, 5000); // 5 segundos de som

            // Usa a placa recebida para criar uma mensagem customizada
             toast.info(
                <div className="flex items-center gap-3">
                    <Notifications sx={{ color: '#fca311', fontSize: 28 }} />
                    <div>
                        <strong className="text-[#14213d] block mb-1">🚨 Novo alerta detectado!</strong>
                        <span className="text-sm text-gray-600">Placa: <strong className="text-[#fca311]">{placa}</strong></span>
                    </div>
                </div>, 
                {
                    position: "top-right",
                    autoClose: 5000,
                    style: {
                        background: 'linear-gradient(135deg, #ffffff 0%, #fef3e2 100%)',
                        border: '2px solid #fca311',
                        borderRadius: '12px',
                        boxShadow: '0 8px 24px rgba(252, 163, 17, 0.3)'
                    }
                }
            );
        }
    }, [isAudioUnlocked]);

    // 1. Busca o histórico inicial e sempre que a paginação muda.
    useEffect(() => {
        fetchInitialHistory();
    }, [fetchInitialHistory]);
    
    // 2. Prepara o objeto de áudio quando as configurações mudam.
    useEffect(() => {
        // Salva a escolha do usuário no localStorage
        localStorage.setItem('selectedAudioSource', audioSource);
        localStorage.setItem('audioVolume', String(audioVolume));

        // Prepara o objeto de áudio com as novas configurações
        audioRef.current = new Audio(audioSource);
        audioRef.current.volume = audioVolume;
    }, [audioSource, audioVolume]);  

    // Função para lidar com a mudança de som no menu
    const handleSoundChange = (newSource: string) => {
        setAudioSource(newSource);
        setAnchorEl(null); // Fecha o menu
    };

    // Função para lidar com a mudança de volume
    const handleVolumeChange = (event: Event, newValue: number | number[]) => {
        setAudioVolume(newValue as number);
    };

     // 3. Lógica do WebSocket para receber NOVOS alertas confirmados.
    useEffect(() => {
        const client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
            reconnectDelay: 5000,
        });
        

        client.onConnect = () => {
            console.log('[WebSocket] Conectado ao tópico de alertas confirmados.');
            // Ouve o tópico que envia APENAS os alertas de placas monitoradas
            client.subscribe('/topic/confirmed-alerts', (message) => {
                if (message.body) {

                     // 1. Recebe o novo alerta. 'data' e 'hora' são STRINGS.
                    const newAlertFromServer: any = JSON.parse(message.body);
                    console.log('[WebSocket] Alerta bruto recebido:', newAlertFromServer);

                    // =======================================================
                    // ##          CONVERSÃO E PADRONIZAÇÃO DOS DADOS         ##
                    // =======================================================
                    // 2. Transforma as strings de data e hora em arrays de números,
                    //    para que o formato seja idêntico ao da API REST.
                    const dateParts = newAlertFromServer.data.split('-').map(Number); // "2025-07-15" -> [2025, 7, 15]
                    const timeParts = newAlertFromServer.hora.split(':').map(Number); // "10:30:00" -> [10, 30, 0]

                    // 3. Cria um novo objeto com o formato correto
                    const formattedAlert: AlertHistoryRow = {
                        ...newAlertFromServer,
                        data: dateParts,
                        hora: timeParts,
                    };

                    // Limpa o timer anterior
                    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

                    // Inicia um novo timer para agrupar as notificações
                    debounceTimerRef.current = setTimeout(() => {
                        console.log('Pausa nas mensagens, atualizando a interface...');
                        // 4. Adiciona o alerta JÁ FORMATADO ao estado da tabela
                        setRows(currentRows => [formattedAlert, ...currentRows]);
                        setRowCount(currentCount => currentCount + 1);
                
                        playSoundAndNotify(formattedAlert.placa);
                    }, 1000); // Debounce de 1 segundo
                
                    

                    // const newAlert: AlertHistoryRow = JSON.parse(message.body);
                    // console.log('[WebSocket] Novo alerta confirmado recebido:', newAlert);

                    // // Adiciona o novo alerta no topo da lista na tela
                    // setRows(currentRows => [newAlert, ...currentRows]);
                    // setRowCount(currentCount => currentCount + 1);
                    
                    
                    // // Dispara o som e a notificação visual
                    // playSoundAndNotify(newAlert.placa);
                }
            });
        };
        client.activate();
        return () => { if (client.active) client.deactivate(); };
    }, [playSoundAndNotify]); // A dependência garante que a função de som tenha o estado de permissão atualizado


    // 4. Lógica para desbloquear o áudio na primeira interação do usuário.
    useEffect(() => {
        const unlockAudio = () => {
            if (!isAudioUnlocked) {
                const audio = new Audio();
                audio.play().catch(() => {});
                setIsAudioUnlocked(true);
                window.removeEventListener('click', unlockAudio);
            }
        };
        window.addEventListener('click', unlockAudio);
        return () => window.removeEventListener('click', unlockAudio);
    }, [isAudioUnlocked]);
    

   

    // Solicita permissão para notificação ao carregar
    useEffect(() => {
      if ("Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission().catch(() => {});
      }
    }, []);

    // NOVO: Derivamos o alerta mais recente diretamente da lista de 'rows'.
    const mostRecentAlert = rows.length > 0 ? rows[0] : null;

    // Opções de sons disponíveis
    const availableSounds = [
       { label: 'Sirene Padrão', url: '/sounds/police-operation-siren.mp3', icon: '🚨' },
       { label: 'Sirene Guerra', url: '/sounds/alarme-guerra.mp3', icon: '⚠️' },
       { label: 'Sirene Alarme', url: '/sounds/alarme-intelbras.mp3', icon: '🔔' }
    ];

    const columns: GridColDef[] = [    
        { 
            field: 'data', 
            headerName: 'Data', 
            width: 130,
            headerAlign: 'center',
            align: 'center',
            valueFormatter: (value: number[]) => {
                if (!value || !Array.isArray(value) || value.length < 3) return '';
                return new Date(value[0], value[1] - 1, value[2]).toLocaleDateString('pt-BR');
            }
        },
        { 
            field: 'hora', 
            headerName: 'Hora', 
            width: 100,
            headerAlign: 'center',
            align: 'center',
            valueFormatter: (value: number[]) => {
                if (!value || !Array.isArray(value) || value.length < 2) return '00:00:00';
                return [
                    String(value[0]).padStart(2, '0'),
                    String(value[1]).padStart(2, '0'),
                    value.length > 2 ? String(value[2]).padStart(2, '0') : '00'
                ].join(':');
            } 
        },
        { 
          field: 'placa', 
          headerName: 'Placa', 
          width: 140,
          headerAlign: 'center',
          align: 'center',
          renderCell: (params) => (
            <Chip
              label={params.value}
              sx={{
                fontWeight: 700,
                bgcolor: '#fca311',
                color: '#14213d',
                fontSize: '15px',
                fontFamily: 'Roboto Mono, monospace',
                letterSpacing: '1px',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(252, 163, 17, 0.3)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(252, 163, 17, 0.4)',
                }
              }}
            />
          )
        },
        { 
          field: 'rodovia', 
          headerName: 'Rodovia', 
          width: 140,
          headerAlign: 'center',
          align: 'center',
          renderCell: (params) => (
            <Typography sx={{ fontWeight: 600, color: '#14213d', fontSize: '14px' }}>
              {params.value}
            </Typography>
          )
        },
        { 
          field: 'km', 
          headerName: 'KM', 
          width: 100,
          headerAlign: 'center',
          align: 'center',
          renderCell: (params) => (
            <Chip
              label={params.value}
              size="small"
              variant="outlined"
              sx={{
                borderColor: '#14213d',
                color: '#14213d',
                fontWeight: 600
              }}
            />
          )
        },
        { 
          field: 'sentido', 
          headerName: 'Sentido', 
          width: 120,
          headerAlign: 'center',
          align: 'center'
        },
        { 
            field: 'marcaModelo', 
            headerName: 'Marca/Modelo',
            width: 180,
            valueGetter: (value: any, row: AlertHistoryRow) => row.placaMonitorada?.marcaModelo || 'N/A'
        },
        { 
            field: 'motivo', 
            headerName: 'Motivo',
            flex: 1,
            minWidth: 250,
            renderCell: (params) => (
              <Box
                sx={{
                  bgcolor: alpha('#fca311', 0.08),
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1,
                  borderLeft: '3px solid #fca311',
                  width: '100%'
                }}
              >
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 600, 
                    color: '#14213d',
                    fontSize: '13px'
                  }}
                >
                  {params.row.placaMonitorada?.motivo || 'N/A'}
                </Typography>
              </Box>
            )
        },    
        {
          field: 'actions',
          type: 'actions',
          headerName: 'Ações',
          width: 100,
          headerAlign: 'center',
          getActions: (params) => [
            <GridActionsCellItem
              key={`preview-${params.id}`}
              icon={<Visibility sx={{ color: '#fca311' }} />}
              label="Detalhes"
              onClick={() => handlePreviewClick(params.row)} 
              showInMenu={false}
            />,
          ],
        },
    ];    

    return (
        <div className='min-h-screen bg-gradient-to-br from-gray-50 via-[#fef9f3] to-gray-50 p-6'>
        {/* Hero Header */}
        <Card 
          className='mb-6 overflow-hidden'
          sx={{
            background: 'linear-gradient(135deg, #14213d 0%, #1a2b4a 100%)',
            boxShadow: '0 20px 60px rgba(20, 33, 61, 0.3)',
            borderRadius: '16px',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #fca311 0%, #ff8800 100%)',
            }
          }}
        >
          <CardContent className='py-10 px-8'>
            <div className='flex items-center gap-5'>
              <Box
                sx={{
                  background: 'rgba(252, 163, 17, 0.15)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(252, 163, 17, 0.3)',
                  borderRadius: '16px',
                  p: 2.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 32px rgba(252, 163, 17, 0.2)',
                }}
              >
                <Speed sx={{ fontSize: 48, color: '#fca311' }} />
              </Box>
              
              <div>
                <Typography 
                  variant="h3" 
                  className="font-bold text-white mb-2"
                  sx={{ 
                    letterSpacing: '-0.5px',
                    textShadow: '0 2px 10px rgba(0,0,0,0.2)'
                  }}
                >
                  Monitoramento em Tempo Real
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: 'rgba(255,255,255,0.8)',
                    fontSize: '15px',
                    fontWeight: 500
                  }}
                >
                  Sistema inteligente de alertas e rastreamento de veículos
                </Typography>
              </div>
            </div>
          </CardContent>
        </Card>
        

        {/* Main Grid */}
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
          {/* Sidebar - Latest Alert */}
          <div className='lg:col-span-4 xl:col-span-3'>
            <Card 
              className="h-full overflow-hidden"
              sx={{
                boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
                borderRadius: '16px',
                border: '1px solid rgba(0,0,0,0.06)',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'linear-gradient(90deg, #fca311 0%, #ff8800 100%)',
                }
              }}
            >
              <Box 
                sx={{ 
                  background: 'linear-gradient(135deg, #fca311 0%, #ff8800 100%)',
                  padding: '20px 24px',
                  color: '#14213d'
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Notifications sx={{ fontSize: 24 }} />
                  <Typography variant="h6" className="font-bold">
                    Última Passagem
                  </Typography>
                </div>
                <Typography variant="caption" sx={{ opacity: 0.8, fontWeight: 500 }}>
                  Atualização em tempo real
                </Typography>
              </Box>
              
              <CardContent className="p-6">
                {mostRecentAlert ? (
                  <div className="space-y-5">
                    {/* Placa */}
                    <Box>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: '#6c757d',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          mb: 1.5
                        }}
                      >
                        <DirectionsCar sx={{ fontSize: 16 }} />
                        Placa Identificada
                      </Typography>
                      <PlacaMercosul placa={mostRecentAlert.placa} />
                    </Box>
                    
                    {/* Stats Grid */}
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 2,
                        p: 2,
                        bgcolor: '#f8f9fa',
                        borderRadius: 2,
                      }}
                    >
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                          Data
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#14213d' }}>
                          {new Date(mostRecentAlert.data[0], mostRecentAlert.data[1] - 1, mostRecentAlert.data[2]).toLocaleDateString('pt-BR')}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                          Hora
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#14213d' }}>
                          {[
                            String(mostRecentAlert.hora[0]).padStart(2, '0'), 
                            String(mostRecentAlert.hora[1]).padStart(2, '0'), 
                          ].join(':')}
                        </Typography>
                      </Box>
                    </Box>

                    <Divider />

                    {/* Location Info */}
                    <Box>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: '#6c757d',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          mb: 1
                        }}
                      >
                        <LocationOn sx={{ fontSize: 16 }} />
                        Localização
                      </Typography>
                      <Box
                        sx={{
                          bgcolor: alpha('#fca311', 0.1),
                          p: 2,
                          borderRadius: 2,
                          borderLeft: '4px solid #fca311'
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#14213d', mb: 1 }}>
                          {mostRecentAlert.rodovia} KM {mostRecentAlert.km}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {mostRecentAlert.praca} • {mostRecentAlert.sentido}
                        </Typography>
                      </Box>
                    </Box>

                    <Divider />

                    {/* Vehicle Details */}
                    <Box className="space-y-3">
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: '#6c757d',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          display: 'block',
                          mb: 1
                        }}
                      >
                        Dados do Veículo
                      </Typography>
                      
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          Modelo
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#14213d' }}>
                          {mostRecentAlert?.placaMonitorada?.marcaModelo}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          Cor
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#14213d' }}>
                          {mostRecentAlert?.placaMonitorada?.cor}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
                          Motivo do Monitoramento
                        </Typography>
                        <Chip 
                          label={mostRecentAlert?.placaMonitorada?.motivo} 
                          size="small"
                          sx={{
                            bgcolor: '#fff3cd',
                            color: '#856404',
                            fontWeight: 600,
                            fontSize: '12px'
                          }}
                        />
                      </Box>
                      
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          Interessado
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#14213d' }}>
                          {mostRecentAlert?.placaMonitorada?.interessado}
                        </Typography>
                      </Box>
                    </Box>
                  </div>
                ) : (
                  <Box 
                    sx={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: '400px',
                      textAlign: 'center',
                      color: '#adb5bd'
                    }}
                  >
                    <Notifications sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Aguardando novos alertas...
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
            </div>
        </div>
          
          {/* Main Content */}
          <div className='lg:col-span-8 xl:col-span-9'>
            <Card 
              className="overflow-hidden"
              sx={{
                boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
                borderRadius: '16px',
                border: '1px solid rgba(0,0,0,0.06)'
              }}
            >
              <Box 
                sx={{ 
                  background: 'linear-gradient(135deg, #14213d 0%, #1a2b4a 100%)',
                  padding: '24px 28px',
                }}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <Typography variant="h6" className="font-bold text-white mb-1">
                      Histórico de Alertas
                    </Typography>
                    {rowCount > 0 && (
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                        <strong className="text-[#fca311]">{rowCount}</strong> {rowCount === 1 ? 'registro encontrado' : 'registros encontrados'}
                      </Typography>
                    )}
                  </div>
                  
                  {/* Audio Settings */}
                  <IconButton
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                    sx={{
                      bgcolor: 'rgba(252, 163, 17, 0.15)',
                      color: '#fca311',
                      '&:hover': {
                        bgcolor: 'rgba(252, 163, 17, 0.25)',
                      }
                    }}
                  >
                    <Settings />
                  </IconButton>
                </div>
                
                {loading && (
                  <LinearProgress 
                    sx={{ 
                      mt: 2,
                      bgcolor: 'rgba(255,255,255,0.1)',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: '#fca311'
                      }
                    }} 
                  />
                )}
              </Box>

              <Menu 
                anchorEl={anchorEl} 
                open={Boolean(anchorEl)} 
                onClose={() => setAnchorEl(null)}
                PaperProps={{
                  sx: {
                    mt: 1,
                    borderRadius: 2,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                    minWidth: 280
                  }
                }}
              >
                <Box sx={{ p: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#14213d', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <VolumeUp sx={{ fontSize: 18, color: '#fca311' }} />
                    Configurações de Áudio
                  </Typography>
                  
                  <Typography variant="caption" sx={{ color: '#6c757d', fontWeight: 600, display: 'block', mb: 1 }}>
                    Volume
                  </Typography>
                  <Slider
                    value={audioVolume}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={handleVolumeChange}
                    sx={{
                      color: '#fca311',
                      '& .MuiSlider-thumb': {
                        bgcolor: '#fca311',
                        boxShadow: '0 2px 8px rgba(252, 163, 17, 0.4)'
                      }
                    }}
                  />
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="caption" sx={{ color: '#6c757d', fontWeight: 600, display: 'block', mb: 1 }}>
                    Selecionar Som
                  </Typography>
                  {availableSounds.map((sound) => (
                    <MenuItem
                      key={sound.url}
                      selected={audioSource === sound.url}
                      onClick={() => handleSoundChange(sound.url)}
                      sx={{
                        borderRadius: 1,
                        mb: 0.5,
                        '&.Mui-selected': {
                          bgcolor: alpha('#fca311', 0.1),
                          '&:hover': {
                            bgcolor: alpha('#fca311', 0.15),
                          }
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <span style={{ fontSize: '18px' }}>{sound.icon}</span>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {sound.label}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Box>
              </Menu>
              <CardContent className="p-0">
                <Box className="h-[43.1rem] w-full bg-gray-300 rounded-lg shadow-sm">
                    <DataGrid
                      rows={rows}
                      columns={columns}
                      getRowId={(row) => row.id ?? Math.random()}
                      rowCount={rowCount}
                      loading={loading}
                      paginationModel={paginationModel}
                      pageSizeOptions={[10, 25, 50, 100]}
                      onPaginationModelChange={setPaginationModel}
                      disableRowSelectionOnClick
                      paginationMode="server"
                      autoHeight={false}
                      slots={{ 
                        pagination: CustomPagination, 
                        noRowsOverlay: () => (
                            <Box 
                              sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              height: '100%',
                              color: '#adb5bd'
                             }}
                            >
                                <Notifications sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                  Nenhum alerta registrado
                                </Typography>
                            </Box> 
                        )
                      }} //
                      sx={{
                        // Remove todas as bordas para um visual flutuante
                        border: 'none', 
            
                        // Estilo para o CABEÇALHO
                        '& .MuiDataGrid-columnHeaders': {
                            backgroundColor: 'transparent', // Fundo transparente
                            borderBottom: '1px solid #E0E0E0', // Apenas uma linha sutil abaixo
                            color: '#616161', // Cor de texto mais suave (cinza escuro)
                        },
                        '& .MuiDataGrid-columnHeaderTitle': {
                            fontWeight: 'bold', // Títulos em negrito
                        },

                        // Remove as bordas verticais entre as células
                        '& .MuiDataGrid-cell': {
                            borderBottom: '1px solid #F0F0F0', // Linha separadora bem sutil
                        },

                        // Remove o efeito "zebra" para um visual mais limpo
                        '& .MuiDataGrid-row:nth-of-type(odd)': {
                            backgroundColor: 'transparent',
                        },

                        // Efeito de hover suave
                        '& .MuiDataGrid-row:hover': {
                            backgroundColor: '#F5F5F5', // Um cinza muito claro
                        },

                        // Remove a borda do rodapé
                        '& .MuiDataGrid-footerContainer': {
                            //borderTop: 'none',
                            backgroundColor: '#EAEFEF'
                        },
                    }}
                    />                    
                  </Box>
              </CardContent>
              </Card>
                                    
                  
                 
                
              
            
            
            <AlertPreviewDialog
                open={isPreviewOpen}
                onClose={handleClosePreview}
                data={selectedRowData}
            />            
        </div>
        </div>
    );
}