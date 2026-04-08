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
import { Box, Paper, Typography, Chip, keyframes, Grid, Divider, Card, CardContent, IconButton, Menu, List, ListItem, Slider, MenuItem, alpha, LinearProgress, Button } from '@mui/material';
import { Client } from '@stomp/stompjs';
import { DirectionsCar, LocationOn, Notifications, PlayArrow, Settings, Speed, Visibility, VolumeUp } from '@mui/icons-material';
import AlertPreviewDialog from './components/PreviewDialog';
import PlacaMercosul from '../../components/PlacaMercosul';
import SockJS from 'sockjs-client';
import { toast } from 'react-toastify';
import { getSession } from 'next-auth/react';
import UseAudioSystem from './components/UseAudioSystem';

const formatDateTime = (dateTimeString: string) => {
    if (!dateTimeString) return "N/A";
    return new Date(dateTimeString).toLocaleString('pt-BR');
};

// Opções de sons disponíveis
const AVAILABLE_SOUNDS = [
    { label: 'Sirene Padrão', url: '/sounds/police-operation-siren.mp3', icon: '🚨' },
    { label: 'Sirene Guerra', url: '/sounds/alarme-guerra.mp3', icon: '⚠️' },
    { label: 'Sirene Alarme', url: '/sounds/alarme-intelbras.mp3', icon: '🔔' }
];

const TOAST_DURATION = 5000; 

export default function MonitoramentoRealtimePage() {
    // --- ESTADOS PRINCIPAIS DA PÁGINA ---
    const [rows, setRows] = useState<AlertHistoryRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [rowCount, setRowCount] = useState(0);      
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });
    
    //Estados para o Dialog de preview
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [selectedRowData, setSelectedRowData] = useState<AlertHistoryRow | null>(null);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);    

    // Hook de áudio
    const { audioVolume, audioSource, isAudioReady, setAudioVolume, setAudioSource, playSound, testSound, audioStatus, unlockAudio } = UseAudioSystem();

    // Referências para controle
    const processedAlertsRef = useRef(new Set<number>());
    
    // --- REFERÊNCIAS PARA CONTROLE DE EFEITOS ---
    // --- Referências para o alerta sonoro ---
    const audioRef = useRef<HTMLAudioElement | null>(null);
    //const audioCooldownRef = useRef(false);
    //const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    

    // Função de Ordenação Blindada contra Null e Strings
    const sortAlerts = useCallback((alerts: AlertHistoryRow[]): AlertHistoryRow[] => {
        if (!alerts || !Array.isArray(alerts)) return []; // Proteção extra

        return [...alerts].sort((a, b) => {
            const getTimestamp = (dateVal: any, timeVal: any) => {
                if (!dateVal || !timeVal) return 0; // Previne quebra de tela

                // Se o Java enviar como Array: [2026, 4, 2] e [15, 15, 27]
                if (Array.isArray(dateVal) && Array.isArray(timeVal)) {
                    return new Date(
                        dateVal[0], 
                        dateVal[1] - 1, 
                        dateVal[2], 
                        timeVal[0], 
                        timeVal[1], 
                        timeVal[2] || 0
                    ).getTime();
                }
                
                // Se o Java enviar como String: "2026-04-02" e "15:15:27"
                if (typeof dateVal === 'string' && typeof timeVal === 'string') {
                    return new Date(`${dateVal}T${timeVal}`).getTime();
                }

                return 0;
            };

            return getTimestamp(b.data, b.hora) - getTimestamp(a.data, a.hora);
        });
    }, []);

    // ========================================================================
    // SISTEMA DE NOTIFICAÇÕES
    // ========================================================================

    /**
     * Exibe toast e reproduz som para novo alerta
     */
    const notifyNewAlert = useCallback((placa: string) => {
       // 1. Reproduz o som
        playSound();

        // 2. Exibe o toast
        toast.info(
          <div className="flex items-center gap-3"> 
            <Notifications sx={{ color: '#fca311', fontSize: 28 }} />
            <div>
              <strong className="text-[#14213d] block mb-1">🚨 Veículo Detectado!</strong>
              <span className="text-sm text-gray-600">
                Placa: <strong className="text-[#fca311]">{placa}</strong>
              </span>
            </div>
          </div>,
          { 
            position: "top-right",
            autoClose: TOAST_DURATION,
            icon: false,
            // hideProgressBar: false,
            // closeOnClick: true,
            // pauseOnHover: true,
            // draggable: true,
          }
        );
    }, [playSound]);
    
    // ========================================================================
    // BUSCA DE DADOS
    // ========================================================================
    // Função para buscar o histórico paginado da API, com ordenação
    const fetchInitialHistory = useCallback(async () => {
        setLoading(true);
        try {
            const data = await monitoringService.getAlertHistory({
                page: paginationModel.page,
                size: paginationModel.pageSize,
                //sort: 'dataHora,desc' // Ordena por dataHora decrescente
            });

            console.log("Data fetchHistory  ==>", data);
            // Força a ordenação no frontend também, para garantir
            const sortedContent = sortAlerts(data.content || []);     
            setRows(sortedContent);
            setRowCount(data.page?.totalElements || 0);

            // Notifica apenas se for a primeira página e houver dados
            // Dispara o som e o toast para a placa mais recente carregada
            // if (sortedContent.length > 0 && paginationModel.page === 0) {
            //     const latestAlert = sortedContent[0];

            //     // Verifica se já foi processado
            //     if (!processedAlertsRef.current.has(latestAlert.id)) {
            //       processedAlertsRef.current.add(latestAlert.id);
            //       notifyNewAlert(latestAlert.placa);
            //     }
            // }
        } catch (error) {
            console.error("Erro ao buscar histórico de alertas:", error);
            toast.error("Não foi possível carregar o histórico de alertas.");
        } finally {
            setLoading(false);
        }
    }, [paginationModel, sortAlerts]);   

    // ========================================================================
    // WEBSOCKET
    // ========================================================================
    // 3. Lógica do WebSocket para receber NOVOS alertas confirmados.
    useEffect(() => {
      let client: Client | null = null;
      let reconnectTimeout: NodeJS.Timeout | null = null;
      let isConnected = false;

      const connectWebSocket = async () => {
        try {
            const session = await getSession();
            const token = session?.accessToken;

            if (!token) {
                console.warn('⚠️ Token não disponível. Tentando reconectar em 5s...');
                reconnectTimeout = setTimeout(connectWebSocket, 5000);
                return;
            }

            console.log('🔄 Iniciando conexão WebSocket com SockJS...');

            client = new Client({
                // ✅ CRÍTICO: SEM token na URL
                webSocketFactory: () => new SockJS('/ws'),
                //webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
                
                // ✅ Token vai APENAS no header do STOMP CONNECT
                connectHeaders: {
                    Authorization: `Bearer ${token}`
                },
                
                reconnectDelay: 5000,
                heartbeatIncoming: 25000,
                heartbeatOutgoing: 25000,
                
                debug: (str) => console.log('🔍 STOMP:', str),
                
                onConnect: () => {
                    console.log('✅ WebSocket Conectado com sucesso!');
                    isConnected = true;
                    
                    client?.subscribe('/topic/confirmed-alerts', (message) => {
                        if (message.body) {
                            try {
                                const newAlert:  AlertHistoryRow =  JSON.parse(message.body);
                                console.log('📩 Novo Alerta:', newAlert);

                                setRows((currentRows) => {
                                    // Previne linhas duplicadas na tabela
                                    if (currentRows.some(r => r.id === newAlert.id)) {
                                        return currentRows;
                                    }

                                    // Junta o novo registro aos atuais
                                    const updatedRows = [newAlert, ...currentRows];
                    
                                    // Ordena novamente para garantir que fique no topo e fatia no tamanho da página (ex: 25)
                                    return sortAlerts(updatedRows).slice(0, paginationModel.pageSize);
                                });

                                // Atualiza a lista
                                setRows((prev) => sortAlerts([newAlert, ...prev]));
                                    
                                // Incrementa o contador apenas se for novo (opcional, mas recomendado)
                                // Se você quiser contar mesmo repetidos, mova para fora da verificação acima,
                                // mas cuidado com a contagem desincronizada.
                                // Para segurança, recomendo atualizar o rowCount baseado no tamanho real:
                                setRowCount(prev => prev + 1);
            
                                // Toca o som (você pode decidir se quer tocar som para repetidos ou não)
                                //notifyNewAlert(newAlert.placa);
                            } catch (error) {
                                console.error('❌ Erro ao processar alerta:', error);
                            }
                        }
                    });
                },
                
                onStompError: (frame) => {
                        const errorMessage = frame.headers['message'] || 'Erro desconhecido';
                        console.error('🔥 Erro STOMP:', errorMessage);
                        
                        // Mostra toast apenas para erros críticos
                        if (!errorMessage.includes('timeout') && !errorMessage.includes('heartbeat')) {
                            toast.error(`Erro na conexão: ${errorMessage}`);
                        }
                    },
                
                onWebSocketError: (event) => {
                        // Ignora erros vazios ou de conexão inicial comum
                        if (event && Object.keys(event).length > 0) {
                            console.warn('⚠️ Evento WebSocket:', {
                                type: event.type || 'unknown',
                                target: event.target?.url || 'unknown',
                                timestamp: new Date().toISOString()
                            });
                        }
                        
                        // Apenas loga se houver informação útil
                        if (isConnected) {
                            console.log('🔄 Tentando reconectar...');
                        }
                    },
                
                onDisconnect: () => {
                        if (isConnected) {
                            console.warn('⚠️ WebSocket Desconectado');
                            isConnected = false;
                        }
                    }
            });

            client.activate();
            
        } catch (err) {
            console.error('💥 Erro ao conectar WebSocket:', err);
            reconnectTimeout = setTimeout(connectWebSocket, 5000);
        }
      };

      connectWebSocket();

      return () => {        
          if (reconnectTimeout) clearTimeout(reconnectTimeout);        
          if (client?.active) {
              console.log('🔌 Desconectando WebSocket...');
              client.deactivate();
          }
      };
    }, [sortAlerts, notifyNewAlert]);
    
    // ========================================================================
    // EFEITOS
    // ========================================================================
    // 1. Busca o histórico inicial e sempre que a paginação muda.
    useEffect(() => {
        fetchInitialHistory();
    }, [fetchInitialHistory]);

    // Solicita permissão para notificação ao carregar
    useEffect(() => {
      if ("Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission().catch(() => {});
      }
    }, []);

    // ========================================================================
    // HANDLERS
    // ========================================================================
    
    // --- Funções para controlar o Dialog ---
    const handlePreviewClick = (row: AlertHistoryRow) => {
      setSelectedRowData(row);
      setIsPreviewOpen(true);
    };

    const handleClosePreview = () => {
      setIsPreviewOpen(false);
    };       

    // Função para lidar com a mudança de som no menu
    const handleSoundChange = (newSource: string) => {
        setAudioSource(newSource);
        setAnchorEl(null); // Fecha o menu
    };

    // Função para lidar com a mudança de volume
    const handleVolumeChange = (_event: Event, newValue: number | number[]) => {
        setAudioVolume(newValue as number);
    };

     // ========================================================================
    // DADOS DERIVADOS
    // ========================================================================

    // NOVO: Derivamos o alerta mais recente diretamente da lista de 'rows'.
    //const mostRecentAlert = rows.length > 0 ? rows[0] : null;
    const mostRecentAlert = rows[0]; // Como está ordenado, o 0 é sempre o último
     console.log('Most Recent Alert ==>', mostRecentAlert);    

    // ========================================================================
    // COLUNAS DA TABELA
    // ========================================================================    

    const columns: GridColDef[] = [    
        { 
            field: 'data', 
            headerName: 'Data', 
            width: 130,
            headerAlign: 'center',
            align: 'center',
            valueFormatter: (value: any) => {
                if (!value) return 'N/A';
                
                // Formata caso venha como array [2026, 4, 2]
                if (Array.isArray(value)) {
                    return `${String(value[2]).padStart(2, '0')}/${String(value[1]).padStart(2, '0')}/${value[0]}`;
                }
                
                // Formata caso venha como texto "2026-04-02"
                if (typeof value === 'string') {
                    const parts = value.split('-');
                    if (parts.length === 3) {
                        return `${parts[2]}/${parts[1]}/${parts[0]}`; // Retorna 02/04/2026
                    }
                    return value;
                }
                return 'N/A';
            }
        },
        { 
            field: 'hora', 
            headerName: 'Hora', 
            width: 100,
            headerAlign: 'center',
            align: 'center',
            valueFormatter: (value: any) => {
                if (!value) return 'N/A';
                
                if (Array.isArray(value)) {
                    return `${String(value[0]).padStart(2, '0')}:${String(value[1]).padStart(2, '0')}:${String(value[2] || 0).padStart(2, '0')}`;
                }
                
                if (typeof value === 'string') {
                    // Já vem como '15:15:27' então só exibe
                    return value;
                }
                return 'N/A';
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
            <Typography sx={{ fontWeight: 600, color: '#14213d', fontSize: '14px', letterSpacing: '0.5px', lineHeight: '3.5'}}>
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
            {/* Header */}
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
                    <div className='flex items-center justify-between'>
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
                                    sx={{ letterSpacing: '-0.5px', textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}
                                >
                                    Monitoramento em Tempo Real
                                </Typography>
                                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '15px', fontWeight: 500 }}>
                                    Sistema inteligente de alertas • <span className={isAudioReady ? 'text-green-400' : 'text-yellow-400'}>{audioStatus}</span>
                                </Typography>
                            </div>
                        </div>

                        {/* Botão de Teste de Áudio */}
                        <Button
                            variant="contained"
                            startIcon={<PlayArrow />}
                            onClick={testSound}
                            sx={{
                                bgcolor: '#fca311',
                                color: '#14213d',
                                fontWeight: 700,
                                '&:hover': {
                                    bgcolor: '#ff8800',
                                },
                                boxShadow: '0 4px 12px rgba(252, 163, 17, 0.4)'
                            }}
                        >
                            Testar Som
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Latest Alert Card */}
            <Card
                className="overflow-hidden max-w-7xl mx-auto mb-6"
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
                <Box sx={{ background: 'linear-gradient(135deg, #fca311 0%, #ff8800 100%)', padding: '20px 24px', color: '#14213d' }}>
                    <div className="flex items-center gap-2 mb-1">
                        <Notifications sx={{ fontSize: 24 }} />
                        <Typography variant="h6" className="font-bold">Última Passagem</Typography>
                    </div>
                    <Typography variant="caption" sx={{ opacity: 0.8, fontWeight: 500 }}>
                        Atualização em tempo real
                    </Typography>
                </Box>

                <CardContent className="p-6">
                    {mostRecentAlert ? (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Box>
                                    <Typography variant="caption" sx={{ color: '#6c757d', fontWeight: 600, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
                                        <DirectionsCar sx={{ fontSize: 16 }} />
                                        Placa Identificada
                                    </Typography>
                                    <PlacaMercosul placa={mostRecentAlert.placa} />
                                </Box>

                                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                            🗓️ DATA
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#14213d' }}>
                                            {`${mostRecentAlert.data[2]}/${mostRecentAlert.data[1]}/${mostRecentAlert.data[0]}`}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                            ⏰ Horário
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#14213d' }}>
                                            {`${mostRecentAlert.hora[0]}:${mostRecentAlert.hora[1]}:${mostRecentAlert.hora[2]}`}
                                        </Typography>
                                    </Box>
                                </Box>
                            </div>

                            <Divider />

                            <Box>
                                <Typography variant="caption" sx={{ color: '#6c757d', fontWeight: 600, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                                    <LocationOn sx={{ fontSize: 16 }} />
                                    Localização
                                </Typography>
                                <Box sx={{ bgcolor: alpha('#fca311', 0.1), p: 2, borderRadius: 2, borderLeft: '4px solid #fca311' }}>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#14213d', mb: 1 }}>
                                        {mostRecentAlert.rodovia} KM {mostRecentAlert.km}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {mostRecentAlert.praca} • {mostRecentAlert.sentido}
                                    </Typography>
                                </Box>
                            </Box>

                            <Divider />

                            <Box>
                                <Typography variant="caption" sx={{ color: '#6c757d', fontWeight: 600, textTransform: 'uppercase', mb: 2, display: 'block' }}>
                                    Dados do Veículo
                                </Typography>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Modelo</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#14213d' }}>
                                            {mostRecentAlert?.placaMonitorada?.marcaModelo}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Cor</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#14213d' }}>
                                            {mostRecentAlert?.placaMonitorada?.cor}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>Motivo</Typography>
                                        <Chip label={mostRecentAlert?.placaMonitorada?.motivo} size="small" sx={{ bgcolor: '#fff3cd', color: '#856404', fontWeight: 600, fontSize: '12px' }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Interessado</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#14213d' }}>
                                            {mostRecentAlert?.placaMonitorada?.interessado}
                                        </Typography>
                                    </Box>
                                </div>
                            </Box>
                        </div>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', textAlign: 'center', color: '#adb5bd' }}>
                            <Notifications sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>Aguardando novos alertas...</Typography>
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* DataGrid */}
            <Card className="overflow-hidden" sx={{ boxShadow: '0 10px 40px rgba(0,0,0,0.08)', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.06)' }}>
                <Box sx={{ background: 'linear-gradient(135deg, #14213d 0%, #1a2b4a 100%)', padding: '24px 28px' }}>
                    <div className="flex justify-between items-center">
                        <div>
                            <Typography variant="h6" className="font-bold text-white mb-1">Histórico de Alertas</Typography>
                            {rowCount > 0 && (
                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                    <strong className="text-[#fca311]">{rowCount}</strong> {rowCount === 1 ? 'registro' : 'registros'}
                                </Typography>
                            )}
                        </div>

                        <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ bgcolor: 'rgba(252, 163, 17, 0.15)', color: '#fca311', '&:hover': { bgcolor: 'rgba(252, 163, 17, 0.25)' } }}>
                            <Settings />
                        </IconButton>
                    </div>

                    {loading && <LinearProgress sx={{ mt: 2, bgcolor: 'rgba(255,255,255,0.1)', '& .MuiLinearProgress-bar': { bgcolor: '#fca311' } }} />}
                </Box>

                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)} PaperProps={{ sx: { mt: 1, borderRadius: 2, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', minWidth: 280 } }}>
                    <Box sx={{ p: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#14213d', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <VolumeUp sx={{ fontSize: 18, color: '#fca311' }} />
                            Configurações de Áudio
                        </Typography>

                        <Typography variant="caption" sx={{ color: '#6c757d', fontWeight: 600, display: 'block', mb: 1 }}>Volume</Typography>
                        <Slider value={audioVolume} min={0} max={1} step={0.01} onChange={handleVolumeChange} sx={{ color: '#fca311', '& .MuiSlider-thumb': { bgcolor: '#fca311', boxShadow: '0 2px 8px rgba(252, 163, 17, 0.4)' } }} />

                        <Divider sx={{ my: 2 }} />

                        <Typography variant="caption" sx={{ color: '#6c757d', fontWeight: 600, display: 'block', mb: 1 }}>Selecionar Som</Typography>
                        {AVAILABLE_SOUNDS.map((sound) => (
                            <MenuItem
                                key={sound.url}
                                selected={audioSource === sound.url}
                                onClick={() => handleSoundChange(sound.url)}
                                sx={{ borderRadius: 1, mb: 0.5, '&.Mui-selected': { bgcolor: alpha('#fca311', 0.1), '&:hover': { bgcolor: alpha('#fca311', 0.15) } } }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <span style={{ fontSize: '18px' }}>{sound.icon}</span>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{sound.label}</Typography>
                                </Box>
                            </MenuItem>
                        ))}
                    </Box>
                </Menu>

                <CardContent className="p-0">
                    <Box className="h-[43.1rem] w-full">
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
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#adb5bd' }}>
                                        <Notifications sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>Nenhum alerta registrado</Typography>
                                    </Box>
                                )
                            }}
                            sx={{
                                border: 'none',
                                '& .MuiDataGrid-columnHeaders': { backgroundColor: 'transparent', borderBottom: '1px solid #E0E0E0', color: '#616161' },
                                '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 'bold' },
                                '& .MuiDataGrid-cell': { borderBottom: '1px solid #F0F0F0' },
                                '& .MuiDataGrid-row:hover': { backgroundColor: '#F5F5F5' },
                                '& .MuiDataGrid-footerContainer': { backgroundColor: '#EAEFEF' }
                            }}
                        />
                    </Box>
                </CardContent>
            </Card>

            <AlertPreviewDialog open={isPreviewOpen} onClose={handleClosePreview} data={selectedRowData} />
        </div>
    );
}