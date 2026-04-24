'use client';

import { useState, useEffect, useCallback } from 'react';
import { DataGrid, GridActionsCellItem, GridColDef } from '@mui/x-data-grid';
import { monitoringService } from '../../services';
import { AlertHistoryRow } from '../../types/types';
import CustomPagination from '../../components/CustomPagination';
import { Box, Typography, Chip, Divider, Card, CardContent, alpha, LinearProgress, Button } from '@mui/material';
import { Client } from '@stomp/stompjs';
import { DirectionsCar, LocationOn, Notifications, Visibility, PlayArrow } from '@mui/icons-material';
import AlertPreviewDialog from './components/PreviewDialog';
import PlacaMercosul from '../../components/PlacaMercosul';
import SockJS from 'sockjs-client';
import { getSession } from 'next-auth/react';
import { toast } from 'react-toastify';

export default function MonitoramentoRealtimePage() {
    // --- ESTADOS PRINCIPAIS DA PÁGINA ---
    const [rows, setRows] = useState<AlertHistoryRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [rowCount, setRowCount] = useState(0);      
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });
    
    // Estados para o Dialog de preview
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [selectedRowData, setSelectedRowData] = useState<AlertHistoryRow | null>(null);

    // Função para desbloquear o áudio no navegador
    const testarAudio = () => {
        try {
            const savedSource = localStorage.getItem('selectedAudioSource') || '/sounds/police-operation-siren.mp3';
            const savedVolume = localStorage.getItem('audioVolume') || '0.5';
            const cleanSource = savedSource.replace('/public', '');
            
            const audio = new Audio(cleanSource);
            audio.volume = parseFloat(savedVolume);
            
            audio.play().then(() => {
                toast.success("Áudio ativado com sucesso! Alertas sonoros desbloqueados.");
            }).catch((e) => {
                console.error("Erro ao tocar áudio:", e);
                toast.error("O navegador bloqueou o áudio. Tente interagir novamente com a página.");
            });
        } catch (error) {
            console.error("Erro geral no sistema de som:", error);
        }
    };

    // Função de Ordenação Blindada contra Null e Strings
    const sortAlerts = useCallback((alerts: AlertHistoryRow[]): AlertHistoryRow[] => {
        if (!alerts || !Array.isArray(alerts)) return [];

        return [...alerts].sort((a, b) => {
            const getTimestamp = (dateVal: any, timeVal: any) => {
                if (!dateVal || !timeVal) return 0;

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
                
                if (typeof dateVal === 'string' && typeof timeVal === 'string') {
                    return new Date(`${dateVal}T${timeVal}`).getTime();
                }

                return 0;
            };

            return getTimestamp(b.data, b.hora) - getTimestamp(a.data, a.hora);
        });
    }, []);

    // ========================================================================
    // BUSCA DE DADOS INICIAIS
    // ========================================================================
    const fetchInitialHistory = useCallback(async () => {
        setLoading(true);
        try {
            const data = await monitoringService.getAlertHistory({
                page: paginationModel.page,
                size: paginationModel.pageSize,
            });

            const sortedContent = sortAlerts(data.content || []);     
            setRows(sortedContent);
            setRowCount(data.page?.totalElements || 0);

        } catch (error) {
            console.error("Erro ao buscar histórico de alertas:", error);
        } finally {
            setLoading(false);
        }
    }, [paginationModel, sortAlerts]);   

    // ========================================================================
    // WEBSOCKET (Apenas Atualização de UI)
    // ========================================================================
    useEffect(() => {
      let client: Client | null = null;
      let reconnectTimeout: NodeJS.Timeout | null = null;
      let isConnected = false;

      const connectWebSocket = async () => {
        try {
            const session = await getSession();
            const token = session?.accessToken;

            if (!token) {
                reconnectTimeout = setTimeout(connectWebSocket, 5000);
                return;
            }

            client = new Client({
                webSocketFactory: () => new SockJS('/ws'),
                connectHeaders: {
                    Authorization: `Bearer ${token}`
                },
                reconnectDelay: 5000,
                heartbeatIncoming: 25000,
                heartbeatOutgoing: 25000,
                
                onConnect: () => {
                    isConnected = true;
                    
                    client?.subscribe('/topic/confirmed-alerts', (message) => {
                        if (message.body) {
                            try {
                                const newAlert: AlertHistoryRow = JSON.parse(message.body);
                                
                                setRows((currentRows) => {
                                    if (currentRows.some(r => r.id === newAlert.id)) {
                                        return currentRows;
                                    }
                                    const updatedRows = [newAlert, ...currentRows];
                                    return sortAlerts(updatedRows).slice(0, paginationModel.pageSize);
                                });
                                    
                                setRowCount(prev => prev + 1);

                            } catch (error) {
                                console.error('❌ Erro ao processar alerta:', error);
                            }
                        }
                    });
                },
                
                onStompError: (frame) => {
                    console.error('🔥 Erro STOMP:', frame.headers['message'] || 'Erro desconhecido');
                },
                onWebSocketError: () => {
                    if (isConnected) console.log('🔄 Tentando reconectar...');
                },
                onDisconnect: () => {
                    if (isConnected) isConnected = false;
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
          if (client?.active) client.deactivate();
      };
    }, [paginationModel.pageSize, sortAlerts]);
    
    // ========================================================================
    // EFEITOS E HANDLERS
    // ========================================================================
    useEffect(() => {
        fetchInitialHistory();
    }, [fetchInitialHistory]);

    const handlePreviewClick = (row: AlertHistoryRow) => {
      setSelectedRowData(row);
      setIsPreviewOpen(true);
    };

    const handleClosePreview = () => {
      setIsPreviewOpen(false);
    };       

    // ========================================================================
    // DADOS DERIVADOS
    // ========================================================================
    const mostRecentAlert = rows[0];

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
                if (Array.isArray(value)) {
                    return `${String(value[2]).padStart(2, '0')}/${String(value[1]).padStart(2, '0')}/${value[0]}`;
                }
                if (typeof value === 'string') {
                    const parts = value.split('-');
                    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`; 
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
                if (typeof value === 'string') return value;
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
          width: 250,
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
          renderCell: (params) => {
            if (!params.value) return null; // <-- adicione isso

            return (
              <Chip
                label={params.value}
                size="small"
                variant="outlined"
                sx={{ borderColor: '#14213d', color: '#14213d', fontWeight: 600 }}
              />
            );
          }
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
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#14213d', fontSize: '13px' }}>
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
                        top: 0, left: 0, right: 0,
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
                                <Notifications sx={{ fontSize: 48, color: '#fca311' }} />
                            </Box>
                            <div>
                                <Typography
                                    variant="h3"
                                    className="font-bold text-white mb-2"
                                    sx={{ letterSpacing: '-0.5px', textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}
                                >
                                    Monitoramento de Placas
                                </Typography>
                                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '15px', fontWeight: 500 }}>
                                    Sistema inteligente de visualização em tempo real. Os alertas globais estão ativos.
                                </Typography>
                            </div>
                        </div>

                        {/* Botão de Ativar/Testar Som */}
                        <Button
                            variant="contained"
                            startIcon={<PlayArrow />}
                            onClick={testarAudio}
                            sx={{
                                bgcolor: '#fca311',
                                color: '#14213d',
                                fontWeight: 700,
                                px: 3,
                                py: 1.5,
                                borderRadius: '10px',
                                '&:hover': { 
                                    bgcolor: '#ff8800',
                                    transform: 'translateY(-2px)'
                                },
                                transition: 'all 0.2s ease',
                                boxShadow: '0 4px 12px rgba(252, 163, 17, 0.4)'
                            }}
                        >
                            Ativar / Testar Som
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
                        top: 0, left: 0, right: 0,
                        height: '4px',
                        background: 'linear-gradient(90deg, #fca311 0%, #ff8800 100%)',
                    }
                }}
            >
                <Box sx={{ background: 'linear-gradient(135deg, #fca311 0%, #ff8800 100%)', padding: '20px 24px', color: '#14213d' }}>
                    <div className="flex items-center gap-2 mb-1">
                        <DirectionsCar sx={{ fontSize: 24 }} />
                        <Typography variant="h6" className="font-bold">Última Passagem Detectada</Typography>
                    </div>
                </Box>

                <CardContent className="p-6">
                    {mostRecentAlert ? (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Box>
                                    <PlacaMercosul placa={mostRecentAlert.placa} />
                                </Box>

                                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>🗓️ DATA</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#14213d' }}>
                                            {`${mostRecentAlert.data[2]}/${mostRecentAlert.data[1]}/${mostRecentAlert.data[0]}`}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>⏰ Horário</Typography>
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
                                            {mostRecentAlert?.placaMonitorada?.marcaModelo || 'N/A'}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Cor</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#14213d' }}>
                                            {mostRecentAlert?.placaMonitorada?.cor || 'N/A'}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>Motivo</Typography>
                                        <Chip label={mostRecentAlert?.placaMonitorada?.motivo || 'N/A'} size="small" sx={{ bgcolor: '#fff3cd', color: '#856404', fontWeight: 600, fontSize: '12px' }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Interessado</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#14213d' }}>
                                            {mostRecentAlert?.placaMonitorada?.interessado || 'N/A'}
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
                    </div>
                    {loading && <LinearProgress sx={{ mt: 2, bgcolor: 'rgba(255,255,255,0.1)', '& .MuiLinearProgress-bar': { bgcolor: '#fca311' } }} />}
                </Box>

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