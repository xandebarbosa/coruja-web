'use client';

import { useState, useEffect, useCallback } from 'react';
import { DataGrid, GridColDef, GridPaginationModel } from '@mui/x-data-grid';
//import { searchByPlaca } from '../../services/radars';
import { radarsService } from '../../services'
import CustomPagination from '../../components/CustomPagination';
import { Box, Button, Card, CardContent, Chip, Grid, InputAdornment, TextField, Tooltip, Typography } from '@mui/material';
import { InfoIcon, PaletteIcon, SearchIcon, TrendingUpIcon } from 'lucide-react';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { toast } from 'react-toastify';
import { exportToExcel } from '@/app/components/ExportExcel';
import { set } from 'react-hook-form';
import { RadarsDTO } from '@/app/types/types';
import { DirectionsCar, DirectionsCarOutlined, LocationCity, LocationCityOutlined, Palette, PaletteOutlined } from '@mui/icons-material';

// Define as colunas do DataGrid
const columns: GridColDef[] = [
  { 
    field: 'data', 
    headerName: 'Data', 
    width: 150,
    headerAlign: 'center',
    align: 'center', 
    valueFormatter: (value: string) => {
      if (!value) return '';
      // Adiciona T00:00:00 para garantir que o navegador interprete como data local,
    // evitando um bug comum de fuso horário que poderia mostrar o dia anterior.
      const date = new Date(`${value}T00:00:00`);
      return date.toLocaleDateString('pt-BR');
    } 
  },
  { 
    field: 'hora', 
    headerName: 'Hora', 
    width: 110,
    headerAlign: 'center',
    align: 'center'    
  },
  { 
    field: 'placa', 
    headerName: 'Placa', 
    width: 180,
    headerAlign: 'center',
    align: 'center',
    renderCell: (params) => (
      <Chip
        label={params.value}
        size="medium"
        sx={{
          fontWeight: 600,
          bgcolor: '#3f51b5',
          color: 'white',
          fontSize: '14px',
          fontFamily: 'Roboto',
          letterSpacing: '0.5px'
        }}
      />
    ) 
  },
  { 
    field: 'praca', 
    headerName: 'Praça', 
    width: 300,
    headerAlign: 'left', 
  },  
  { 
    field: 'rodovia', 
    headerName: 'Rodovia', 
    width: 300,
    headerAlign: 'center',
    align: 'center',
    renderCell: (params) => (
      <span style={{ fontWeight: '600', color: '#14213d' }}>
        {params.value}
      </span>
    ) 
  },
  { 
    field: 'km', 
    headerName: 'KM', 
    width: 100,
    headerAlign: 'center',
    align: 'center'     
  },
  { 
    field: 'sentido', 
    headerName: 'Sentido', 
    width: 150 ,
    headerAlign: 'center',
    align: 'center'
  },
];

export default function ConsultaPlaca() {
  const [placaInput, setPlacaInput] = useState('');
  const [rows, setRows] = useState<RadarsDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [rowCount, setRowCount] = useState(0);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [latestRowId, setLatestRowId] = useState<number | null>(null);
  const [hasSearched, setHasSearched] = useState(false);  
  const [exporting, setExporting] = useState(false);
  //Estado para controlar o loading do botão copiar
  const [copying, setCopying] = useState(false);

  //Estado para armazernar os dados do Detran
  const [veiculoInfo, setVeiculoInfo] = useState<{marcaModelo?: string, cor?: string, municipio?: string} | null>(null);

  // Função de busca encapsulada
  const fetchRadars = useCallback(async (placa: string, page: number, pageSize: number) => {
    setLoading(true);

    try {
      const data = await radarsService.searchByPlaca(placa, page, pageSize);

      if (data.content && data.content.length > 0) {
        // Usamos 'reduce' para encontrar o objeto com a data/hora mais recente
        const maisRecente = data.content.reduce((latest: RadarsDTO, current: RadarsDTO) => {
            const latestDateTime = new Date(`${latest.data}T${latest.hora}`);
            const currentDateTime = new Date(`${current.data}T${current.hora}`);
            return currentDateTime > latestDateTime ? current : latest;
        });
        setLatestRowId(maisRecente.id); // Guarda o ID do mais recente

        // Extrai as informações do Detran (pega do primeiro registro válido que tenha os dados)
        const detranInfo = data.content.find((item: RadarsDTO) => item.marcaModelo || item.cor || item.municipio);
        if (detranInfo) {
          setVeiculoInfo({
            marcaModelo: detranInfo.marcaModelo,
            cor: detranInfo.cor,
            municipio: detranInfo.municipio
          });
        } else {
          setVeiculoInfo(null); // Nenhum registro com info do Detran encontrado
        }

      } else {
        setLatestRowId(null); // Nenhum registro encontrado
      }

      setRows(data.content);
      setRowCount(data.page.totalElements);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao buscar dados da placa..');
    } finally {
      setLoading(false);
    }
  }, [])

  const handleSearch = () => {
    if (!placaInput.trim()) {
      toast.info("'Por favor, insira uma placa.");      
      return;
    }
    setHasSearched(true);
    // Reinicia a paginação na primeira página a cada nova busca
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
    fetchRadars(placaInput, 0, paginationModel.pageSize)
  };
  
  // Efeito para buscar dados quando a paginação muda
  useEffect(() => {
    // Só busca se já houver uma busca inicial (placaInput não está vazio)
    if(placaInput && hasSearched) {
      fetchRadars(placaInput, paginationModel.page, paginationModel.pageSize);
    }
  }, [paginationModel.page, paginationModel.pageSize]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  //Função de exportação
  const handleExport = async () => {
    if (!placaInput) {
        toast.warn("Realize uma busca antes de exportar.");
        return;
    }

    setExporting(true);

    try {
      // 1. Cria o objeto de parâmetros usando diretamente o input do usuário
      // Isso garante consistência entre o que ele vê e o que ele exporta
      const paramsToExport = {
        placa: placaInput,
        // Adicione outros filtros aqui se futuramente esta tela tiver mais campos
        // rodovia: undefined, 
        // data: undefined
      };

      // 2. Chama o serviço
      const allData = await radarsService.searchAllByLocalForExport(paramsToExport);

      // 3. Validações
      if (!allData || allData.length === 0) {
        toast.warn("Nenhum dado encontrado para exportar com a placa informada.");
        return;
      }

      // 4. Gera o Excel
      // Sanitiza o nome do arquivo removendo caracteres especiais da placa se houver
      const safePlacaName = placaInput.replace(/[^a-zA-Z0-9]/g, '');
      exportToExcel(allData, `Relatorio_Placa_${safePlacaName}`);
      
      toast.success("Relatório gerado com sucesso!");
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      toast.error("Erro ao gerar relatório. Tente novamente.");
    } finally {
      setExporting(false);
    }
  };

  //Função para copiar para texto
  const handleCopy = async () => {
    if (!rows || rows.length === 0) {
      toast.warn("Não há dados na página atual para copiar.");
      return;
    }

    setCopying(true);

    try {
      // Usa diretamente o estado "rows" que contém os itens da página atual
      let textToCopy = `🚗 *Relatório da Placa: ${placaInput}*\n`;
      textToCopy += `📅 Gerado em: ${new Date().toLocaleString('pt-BR')}\n\n`;
      //textToCopy += `📊 Registros copiados: ${rows.length}\n\n`;

      // Inclui informações do Detran no texto copiado, se disponíveis
      if (veiculoInfo) {
          textToCopy += `\n📋 *DADOS DO VEÍCULO*\n`;
          if (veiculoInfo.marcaModelo) textToCopy += `🔹 Marca/Modelo: ${veiculoInfo.marcaModelo}\n`;
          if (veiculoInfo.cor) textToCopy += `🎨 Cor: ${veiculoInfo.cor}\n`;
          if (veiculoInfo.municipio) textToCopy += `📍 Município: ${veiculoInfo.municipio}\n`;
      }

      textToCopy += `-------------------------------------\n`;
      textToCopy += `-------------------------------------\n`;
      
      textToCopy += `\n🔍 *ÚLTIMOS REGISTROS (Página Atual)*\n\n`;

      // Mapeamento de sentidos para ícones direcionais
      const getSentidoIcon = (sentido: string): string => {
        const s = sentido?.toLowerCase().trim();
      
        if (s?.includes('leste'))  return '➡️'; // seta verde para direita
        if (s?.includes('oeste'))  return '⬅️'; // seta azul para esquerda
        if (s?.includes('norte'))  return '⬆️'; // seta cinza (sem cor nativa, usa emoji padrão)
        if (s?.includes('sul'))    return '⬇️'; // seta laranja para baixo
      
        return '↔️'; // fallback genérico
      };

      rows.forEach((row, index) => {
        const dataFormatada = new Date(`${row.data}T00:00:00`).toLocaleDateString('pt-BR');
        
        textToCopy += `*${index + 1}. ${dataFormatada} às ${row.hora}*\n`;
        textToCopy += `🚘 Placa: ${row.placa}\n`;
        textToCopy += `🛣️ Local: ${row.rodovia || ''}\n`;
        // 2. Adiciona o KM na linha de baixo apenas se ele existir e não for nulo
        if (row.km !== null && row.km !== undefined && row.km !== '') {
          textToCopy += `🚩 KM: ${row.km}\n`;
        }

        if (row.praca !== null && row.praca !== undefined && row.praca !== '') {
          textToCopy += `📍 Praça: ${row.praca}\n`;
        }
        textToCopy += `${getSentidoIcon(row.sentido)} Sentido: ${row.sentido}\n`;
        textToCopy += `--------------------------------\n`;
      });

      // Fallback para cópia em ambientes onde navigator.clipboard não é suportado (HTTP / IP local)
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;
        
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        
        textArea.focus();
        textArea.select();

        try {
          const successful = document.execCommand('copy');
          if (!successful) {
            throw new Error('Falha no fallback de cópia');
          }
        } catch (err) {
          console.error('Fallback: Erro ao copiar', err);
          throw new Error("Não foi possível copiar o texto automaticamente neste navegador/ambiente.");
        } finally {
          document.body.removeChild(textArea);
        }
      }

      toast.success(`Copiados ${rows.length} registros da página atual para a área de transferência!`);

    } catch (err) {
      console.error('Erro ao copiar:', err);
      toast.error("Erro ao copiar os dados para a área de transferência.");
    } finally {
      setCopying(false);
    }
  }

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
          <div className='flex items-center gap-4'>
            <div className='bg-white/10 p-3 rounded-xl backdrop-blur-sm'>
              <DirectionsCarIcon sx={{ fontSize: 40, color: '#fca311' }} />
            </div>
            <div>
              <Typography 
                variant="h4" 
                className="font-bold text-white mb-1"
                sx={{ letterSpacing: '-0.5px' }}
              >
                Consulta por Placa
              </Typography>
              <Typography variant="body2" className="text-gray-300">
                Sistema de rastreamento e monitoramento de veículos
              </Typography>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Search Card */}
      <Card className="mb-6 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <TextField
              fullWidth
              label="Placa do Veículo"
              placeholder="ABC-1234"
              variant="outlined"
              value={placaInput}
              onChange={(e) => setPlacaInput(e.target.value.toUpperCase())}
              onKeyPress={handleKeyPress}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <DirectionsCarIcon sx={{ color: '#fca311' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': { borderColor: '#fca311' },
                  '&.Mui-focused fieldset': { borderColor: '#fca311' },
                },
                '& .MuiInputLabel-root.Mui-focused': { color: '#fca311' },
              }}
            />          
            <Button
              variant='contained'
              onClick={handleSearch}
              disabled={loading}
              size="large"
              startIcon={<SearchIcon />}
              sx={{
                minWidth: '160px',
                height: '56px',
                bgcolor: '#fca311',
                color: '#14213d',
                fontWeight: 600,
                fontSize: '16px',
                textTransform: 'none',
                boxShadow: '0 4px 14px rgba(252, 163, 17, 0.4)',
                '&:hover': {
                  bgcolor: '#e09200',
                  boxShadow: '0 6px 20px rgba(252, 163, 17, 0.5)',
                  transform: 'translateY(-2px)',
                },
                '&:disabled': { bgcolor: '#e5e7eb', color: '#9ca3af' },
                transition: 'all 0.3s ease',
              }}
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </Button>          
          </div>
        </CardContent>
      </Card>

      {/* Painel de Informações do Veículo (Detran) */}
      {hasSearched && veiculoInfo && (
        <Card className="mb-6 shadow-md border-l-4 border-[#1976d2]">
            <CardContent className="p-5">
                <Typography variant="h6" className="text-gray-800 font-bold mb-4 flex items-center gap-2">
                    <InfoIcon color="primary" /> Informações do Veículo
                </Typography>
                <Grid container spacing={3}>
                    <Grid size={{xs: 12, md: 4}}>
                        <Box display="flex" alignItems="center" gap={2}>
                            <div className="bg-blue-50 p-2 rounded-lg">
                                <DirectionsCarOutlined sx={{ color: '#1976d2' }} />
                            </div>
                            <Box>
                                <Typography variant="caption" color="textSecondary">Marca / Modelo</Typography>
                                <Typography variant="body1" fontWeight="600">{veiculoInfo.marcaModelo || 'Não informado'}</Typography>
                            </Box>
                        </Box>
                    </Grid>
                    <Grid size={{xs: 12, md: 4}}>
                        <Box display="flex" alignItems="center" gap={2}>
                            <div className="bg-purple-50 p-2 rounded-lg">
                                <PaletteOutlined sx={{ color: '#9c27b0' }} />
                            </div>
                            <Box>
                                <Typography variant="caption" color="textSecondary">Cor</Typography>
                                <Typography variant="body1" fontWeight="600">{veiculoInfo.cor || 'Não informada'}</Typography>
                            </Box>
                        </Box>
                    </Grid>
                    <Grid size={{xs: 12, md: 4}}>
                        <Box display="flex" alignItems="center" gap={2}>
                            <div className="bg-green-50 p-2 rounded-lg">
                                <LocationCityOutlined sx={{ color: '#2e7d32' }} />
                            </div>
                            <Box>
                                <Typography variant="caption" color="textSecondary">Município</Typography>
                                <Typography variant="body1" fontWeight="600">{veiculoInfo.municipio || 'Não informado'}</Typography>
                            </Box>
                        </Box>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
      )}

      {/* Stats Row & Actions */}
      {hasSearched && (
        <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className='flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200'>
                <TrendingUpIcon style={{ color: '#fca311', fontSize: 20 }} />
                <Typography variant="body2" className="text-gray-600">
                    Total de passagens registradas: <strong className="text-gray-900">{rowCount}</strong>
                </Typography>
                {latestRowId && (
                    <Chip 
                    label="Registro mais recente destacado" 
                    size="small"
                    sx={{ bgcolor: '#fef3e2', color: '#d97706', fontWeight: 500, fontSize: '12px', ml: 2 }}
                    />
                )}
            </div>
            
            {rowCount > 0 && (
            <div className="flex gap-2">
                <Tooltip title="Copiar registros da PÁGINA ATUAL para WhatsApp/Telegram">
                <Button
                    variant="outlined"
                    color="primary"
                    onClick={handleCopy}
                    disabled={loading || copying}
                    size="medium"
                    startIcon={<ContentCopyIcon />}
                    sx={{ bgcolor: 'white', '&:hover': { bgcolor: '#f3f4f6' } }}
                >
                    {copying ? 'Copiando...' : 'Copiar'}
                </Button>
                </Tooltip>

                <Button
                variant="contained"
                color="success"
                onClick={handleExport}
                disabled={exporting || loading}
                size="medium"
                >
                {exporting ? 'Exportando...' : 'Exportar Excel'}
                </Button>
            </div>
            )}
        </div>
      )}
      
      {/* DataGrid Card */}
      <Card className="shadow-lg overflow-hidden">
        <CardContent className="p-0">
          <Box sx={{ height: 750, width: '100%' }}>
            <DataGrid
              rows={rows}
              columns={columns}
              rowCount={rowCount}
              loading={loading}
              pageSizeOptions={[10, 25, 50]}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              paginationMode="server"
              hideFooter={!hasSearched}
              autoHeight={false}
              getRowClassName={(params) => {
                return params.id === latestRowId ? 'highlighted-row' : '';
              }}
              slots={{
                pagination: CustomPagination,
                noRowsOverlay: () => {
                  if (!hasSearched) return null;
                  return (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2 }}>
                      <DirectionsCarIcon sx={{ fontSize: 60, color: '#d1d5db' }} />
                      <Typography variant="h6" sx={{ color: '#6b7280', fontWeight: 500 }}>
                        Nenhum registro de passagens localizado da placa {placaInput}
                      </Typography>
                    </Box>
                  );
                },
              }}
              sx={{
                border: 'none',
                '& .MuiDataGrid-columnHeaders': {
                  bgcolor: '#14213d', color: 'white', fontSize: '14px', fontWeight: 600, borderRadius: 0,
                  minHeight: '56px !important', maxHeight: '56px !important',
                },
                '& .MuiDataGrid-columnHeader': { outline: 'none !important' },
                '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 600, color: '#134074' },
                '& .MuiDataGrid-columnSeparator': { color: 'rgba(255,255,255,0.2)' },
                '& .MuiDataGrid-row': {
                  '&:hover': { bgcolor: '#fef3e2' },
                  '&.Mui-selected': { bgcolor: '#fef9f0 !important' },
                },
                '& .MuiDataGrid-row.highlighted-row': {
                  bgcolor: '#fef3e2', borderLeft: '4px solid #fca311',
                  '&:hover': { bgcolor: '#fde8c0 !important' },
                },
                '& .MuiDataGrid-cell': { borderColor: '#f3f4f6', fontSize: '14px' },
                '& .MuiDataGrid-footerContainer': { borderTop: '2px solid #f3f4f6', bgcolor: '#fafafa' },
                '& .MuiTablePagination-root': { color: '#14213d' },
                '& .MuiDataGrid-virtualScroller': { bgcolor: 'white' },
              }}
            />
          </Box>
        </CardContent>
      </Card>
    </div>
  );
}
