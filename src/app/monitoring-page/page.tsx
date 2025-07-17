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
import { getAlertHistory, getMonitoredPlates, MonitoredPlate } from '../services/api'; // Ajuste a importação se necessário
import CustomPagination from '../components/CustomPagination';
import { Box, Paper, Typography, Chip, keyframes, Grid, Divider, Card, CardContent, IconButton, Menu, List, ListItem, Slider, MenuItem } from '@mui/material';
import { Client } from '@stomp/stompjs';
import { Settings, Visibility } from '@mui/icons-material';
import AlertPreviewDialog from './components/PreviewDialog';
import PlacaMercosul from '../components/PlacaMercosul';
import SockJS from 'sockjs-client';
import { toast } from 'react-toastify';

// Interface para os dados que chegam do WebSocket
// A interface para os dados que chegam em tempo real
interface RadarEvent {
    concessionaria: string;
    data: string;
    hora: string;
    placa: string;
    marcaModelo: string;
    cor: string;
    motivo: string;
    observacao: string;
    interessado: string;
    praca: string;
    rodovia: string;
    km: string;
    sentido: string;
}

// A interface para os dados do histórico
// Representa um evento de passagem (a placa, onde e quando ela passou).
interface AlertHistoryRow { 
    id: number; 
    placa: string; 
    data: number[];
    hora: number[]; 
    rodovia: string; 
    concessionaria: string;
    km: string; 
    sentido: string; 
    praca: string;
    timestampAlerta: string; 
    placaMonitorada: {
        id: number;
        marcaModelo: string;
        cor: string;
        motivo: string;
        interessado: string;
  };
}

const formatDateTime = (dateTimeString: string) => {
    if (!dateTimeString) return "N/A";
    return new Date(dateTimeString).toLocaleString('pt-BR');
};

export default function MonitoramentoRealtimePage() {
    // --- ESTADOS PRINCIPAIS DA PÁGINA ---
    const [rows, setRows] = useState<AlertHistoryRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [rowCount, setRowCount] = useState(0);    
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
            const data = await getAlertHistory(paginationModel.page, paginationModel.pageSize, 'timestampAlerta,desc');
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
                <div>
                    <strong>🚨 Novo alerta recebido!</strong>
                    <p>Passagem detectada para a placa: <strong>{placa}</strong></p>
                </div>, 
                {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true
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
      { label: 'Sirene Padrão', url: '/sounds/police-operation-siren.mp3' },
      { label: 'Sirene Guerra', url: '/sounds/alarme-guerra.mp3' },
      { label: 'Sirene alarme', url: '/sounds/alarme-intelbras.mp3' },
    ];

    const columns: GridColDef[] = [    
        { 
            field: 'data', 
            headerName: 'Data', 
            width: 100,
            valueFormatter: (value: number[]) => {
                if (!value || !Array.isArray(value) || value.length < 3) return '';
                // Constrói a data a partir do array e formata para pt-BR
                // Lembre-se: o mês no JavaScript é 0-indexed (0=Janeiro), por isso o 'value[1] - 1'
                return new Date(value[0], value[1] - 1, value[2]).toLocaleDateString('pt-BR');
            }
        },

        // NOVO: Coluna separada para a Hora da Passagem
        { 
            field: 'hora', 
            headerName: 'Hora', 
            width: 80,
            valueFormatter: (value: number[]) => {
                if (!value || !Array.isArray(value) || value.length < 2) {
                    return '00:00:00';
                }
                // Pega a hora e o minuto, garantindo 2 dígitos com padStart
                const hora = String(value[0]).padStart(2, '0');
                const minuto = String(value[1]).padStart(2, '0');
                // Pega o segundo se existir, senão usa '00'
                const segundo = value.length > 2 ? String(value[2]).padStart(2, '0') : '00';

                return `${hora}:${minuto}:${segundo}`;
            } 
        },
        { 
          field: 'placa', 
          headerName: 'Placa', 
          width: 120,
          renderCell: (params: GridRenderCellParams) => <strong className="font-mono">{params.value}</strong>
        },
        //{ field: 'concessionaria', headerName: 'Concessionária', width: 130 },
        { field: 'rodovia', headerName: 'Rodovia', width: 200 },
        { field: 'km', headerName: 'KM', width: 80 },
        //{ field: 'praca', headerName: 'Praça/Local', flex: 1, minWidth: 200 },
        { field: 'sentido', headerName: 'Sentido', width: 80 },
        { 
            field: 'marcaModelo', 
            headerName: 'Marca/Modelo',
            flex: 1, // 'flex: 1' faz a coluna ocupar o espaço restante
            minWidth: 120,
            // Usamos 'valueGetter' para acessar o dado dentro de 'placaMonitorada'
            valueGetter: (value: any, row: AlertHistoryRow) => row.placaMonitorada?.marcaModelo || 'N/A'
        },

        // NOVO: Coluna para o Motivo do monitoramento
        { 
            field: 'motivo', 
            headerName: 'Motivo',
            flex: 1,
            minWidth: 250,
            valueGetter: (value: any, row: AlertHistoryRow) => row.placaMonitorada?.motivo || 'N/A'
        },    
        // { 
        //     field: 'interessado', 
        //     headerName: 'Interessado',
        //     width: 150,
        //     valueGetter: (value: any, row: AlertHistoryRow) => row.placaMonitorada?.interessado || 'N/A'
        // },
        {
          field: 'actions',
          type: 'actions',
          headerName: 'Detalhes',
          width: 80,
          getActions: (params) => [
            <GridActionsCellItem
              key={`preview-${params.id}`}
              icon={<Visibility />}
              label="Visualizar Detalhes da Passagem"          
              onClick={() => handlePreviewClick(params.row)} 
            />,
          ],
        },
    ];    

    return (
         <div className='h-full flex flex-col gap-4 p-4 md:p-6'>
            <Card className='mb-2'>
                <CardContent>
                  <Typography variant="h4" className="text-3xl font-bold text-gray-800  mb-4 flex-shrink-0">Monitoramento em Tempo Real</Typography>
                </CardContent>
            </Card>            

            {/* 2. Grid principal que divide a tela em duas colunas
                flex-1 -> Faz este grid "crescer" para ocupar o espaço vertical restante
                min-h-0 -> Impede problemas de overflow com o flexbox
            */}
            <Grid container spacing={4} className="flex-1 min-h-0">

              {/* ======================================================= */}
              {/* ##           COLUNA DA ESQUERDA (Resumo)             ## */}
              {/* ======================================================= */}
              <Grid size={{ xs: 12, md: 4, lg: 3 }} className="flex flex-col">
                <Paper elevation={3} className="p-4 rounded-lg h-full overflow-y-auto">
                    <Typography variant="h6" className="font-semibold text-gray-700 mb-2">
                      Última Passagem Registrada
                    </Typography>
                    <Divider className="mb-4" />
            
                    {/* ATUALIZADO: O card agora lê os dados de 'mostRecentAlert' */}
                    {mostRecentAlert ? (
                      <Box className="space-y-4">
                        <Box>
                            <Box className="flex items-center gap-1 text-gray-500 mb-1">
                             <DriveEtaIcon sx={{ fontSize: '1rem' }} />
                             <Typography variant="body2">Placa</Typography>
                            </Box>
                            <PlacaMercosul placa={mostRecentAlert.placa} />
                            </Box>
                        <Box>
                            <Box className="flex items-center gap-1 text-gray-500 mb-1">
                                <BusinessIcon sx={{ fontSize: '1rem' }} />
                                <Typography variant="body2">Concessionária</Typography>
                            </Box>
                            <Chip label={mostRecentAlert.concessionaria.toUpperCase()} color="primary" size="small" className="bg-orange-600 font-semibold" />
                        </Box>
                        <Box>
                            <Box className="flex items-center gap-1 text-gray-500 mb-1">
                                <CalendarTodayIcon sx={{ fontSize: '1rem' }} />
                                <Typography variant="body2">Data da Passagem</Typography>
                            </Box>
                            <Typography component="p" className="font-semibold text-gray-800">
                                { new Date(mostRecentAlert.data[0], mostRecentAlert.data[1] - 1, mostRecentAlert.data[2]).toLocaleDateString('pt-BR') }
                            </Typography>
                        </Box>

                        <Box>
                            <Box className="flex items-center gap-1 text-gray-500 mb-1">
                                <AccessTimeIcon sx={{ fontSize: '1rem' }} />
                                <Typography variant="body2">Hora da Passagem</Typography>
                            </Box>
                            <Typography component="p" className="font-semibold text-gray-800">
                                { 
                                // Lógica para formatar a HORA a partir do array
                                    [ 
                                        String(mostRecentAlert.hora[0]).padStart(2, '0'), 
                                        String(mostRecentAlert.hora[1]).padStart(2, '0'), 
                                        //String(mostRecentAlert.hora[2] || 0).padStart(2, '0') 
                                    ].join(':') 
                                }
                            </Typography>
                 
                        </Box>
                        
                        <Box>
                            <Box className="flex items-center gap-1 text-gray-500 mb-1">
                                <SignpostIcon sx={{ fontSize: '1rem' }} />
                                <Typography variant="body2">Localização</Typography>
                            </Box>
                            <Typography variant="subtitle1" component="p" className="font-semibold text-gray-800">
                                {mostRecentAlert.rodovia} {mostRecentAlert.km !== 'N/A' && `KM ${mostRecentAlert.km}`} - {mostRecentAlert.praca} ({mostRecentAlert.sentido})
                            </Typography>
                        </Box>

                        <Divider className="my-4" />

                        {/* --- Dados do Cadastro do Veículo --- */}
                        <Box>
                            <Box className="flex items-center gap-1 text-gray-500 mb-1">
                                <DriveEtaIcon sx={{ fontSize: '1rem' }} />
                                <Typography variant="body2">Marca/Modelo</Typography>
                            </Box>
                            <Typography variant="subtitle1" component="p" className="font-semibold text-gray-800">
                                {mostRecentAlert?.placaMonitorada?.marcaModelo}
                            </Typography>
                        </Box>
                        <Box>
                            <Box className="flex items-center gap-1 text-gray-500 mb-1">
                                <ColorLensIcon sx={{ fontSize: '1rem' }} />
                                <Typography variant="body2">Cor</Typography>
                            </Box>
                            <Typography variant="subtitle1" component="p" className="font-semibold text-gray-800">
                                {mostRecentAlert?.placaMonitorada?.cor}
                            </Typography>
                        </Box>
                        <Box>
                            <Box className="flex items-center gap-1 text-gray-500 mb-1">
                                <HelpOutlineIcon sx={{ fontSize: '1rem' }} />
                                <Typography variant="body2">Motivo do Monitoramento</Typography>
                            </Box>
                            <Chip label={mostRecentAlert?.placaMonitorada?.motivo} color="warning" size="small" className="font-semibold" />
                        </Box>
                         <Box>
                        <Box className="flex items-center gap-1 text-gray-500 mb-1">
                            <PersonIcon sx={{ fontSize: '1rem' }} />
                            <Typography variant="body2">Interessado</Typography>
                        </Box>
                            <Typography variant="subtitle1" component="p" className="font-semibold text-gray-800">
                                {mostRecentAlert?.placaMonitorada?.interessado}
                            </Typography>
                        </Box>
                      </Box>
                    ) : (
                      <Box className="flex items-center justify-center h-full">
                        <Typography className="text-gray-500 text-center">Nenhum evento no histórico.</Typography>
                      </Box>
                    )}
                </Paper>
              </Grid>
              
              {/* ======================================================= */}
              {/* ##                COLUNA DA DIREITA (Tabela)           ## */}
              {/* ======================================================= */}
              <Grid size={{ xs: 12, md: 8, lg: 9 }} className="flex flex-col">
                <Paper elevation={3} className="flex-1 flex flex-col overflow-hidden rounded-lg">
                    <Box className="
                        p-4                 
                        bg-amber-500
                        border-b            // Borda inferior sutil
                        border-slate-200    // Cor da borda
                        flex-shrink-0       // Impede que o título encolha  
                        flex items-center justify-between 
                    ">
                        <Typography 
                            variant="h6" 
                            className="text-slate-700 font-bold"
                        >
                         Histórico de Alertas
                        </Typography>
                        
                        <IconButton
                            size='small'
                            aria-label='Configurações de som'
                            onClick={(e) => setAnchorEl(e.currentTarget)}
                        >
                            <Settings />
                        </IconButton>
                    </Box>

                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={() => setAnchorEl(null)}
                    >
                        <List dense sx={{ width: 250 }}>
                          <ListItem>
                            <Typography variant="subtitle2">Volume</Typography>
                          </ListItem>
                          <ListItem>
                            <Slider
                              value={audioVolume}
                              min={0}
                              max={1}
                              step={0.01}
                              onChange={handleVolumeChange}
                            />
                          </ListItem>
                          <ListItem>
                            <Typography variant="subtitle2">Selecionar Som</Typography>
                          </ListItem>
                          {availableSounds.map((sound) => (
                            <MenuItem
                              key={sound.url}
                              selected={audioSource === sound.url}
                              onClick={() =>handleSoundChange(sound.url)}
                            >
                              {sound.label}
                            </MenuItem>
                          ))}
                        </List>
                    </Menu>
                                    
                  <Box className="h-[43.1rem] w-full bg-gray-300 rounded-lg shadow-sm">
                    <DataGrid
                      rows={rows}
                      columns={columns}
                      getRowId={(row) => row.id ?? Math.random()} // Fallback seguro para o ID
                      rowCount={rowCount}
                      loading={loading}
                      paginationModel={paginationModel}
                      pageSizeOptions={[10, 25, 50, 100]}
                      onPaginationModelChange={setPaginationModel}
                      disableRowSelectionOnClick
                      paginationMode="server"
                      slots={{ 
                        pagination: CustomPagination, 
                        noRowsOverlay: () => <Box sx={{p:4, textAlign: 'center'}}>Nenhum alerta no histórico.</Box> 
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
                 
                </Paper>
              </Grid>
            </Grid>
            
            <AlertPreviewDialog
                open={isPreviewOpen}
                onClose={handleClosePreview}
                data={selectedRowData}
            />            
        </div>
    );
}