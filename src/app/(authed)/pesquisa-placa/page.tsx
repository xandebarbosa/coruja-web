'use client';

import { useState, useEffect, useCallback } from 'react';
import { DataGrid, GridColDef, GridPaginationModel } from '@mui/x-data-grid';
//import { searchByPlaca } from '../../services/radars';
import { radarsService } from '../../services'
import CustomPagination from '../../components/CustomPagination';
import { Box, Button, Card, CardContent, Chip, InputAdornment, TextField, Tooltip, Typography } from '@mui/material';
import { SearchIcon, TrendingUpIcon } from 'lucide-react';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { toast } from 'react-toastify';
import { exportToExcel } from '@/app/components/ExportExcel';
import { set } from 'react-hook-form';
import { RadarsDTO } from '@/app/types/types';

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
    width: 180,
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
      const allData = await radarsService.searchByPlacaExport(paramsToExport);

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
    if (!placaInput) {
      toast.warn("Realize uma busca antes de copiar.");
      return;
    }

    setCopying(true); // Ativa loading do botão copiar

    try {
      // 1. Busca TODOS os dados da API (mesma lógica da exportação)
      const allData = await radarsService.searchByPlacaExport({ placa: placaInput });

      if (!allData || allData.length === 0) {
        toast.warn("Nenhum dado encontrado para copiar.");
        return;
      }

      // 2. Monta o cabeçalho
      let textToCopy = `🚗 *Relatório Completo - Placa: ${placaInput}*\n`;
      textToCopy += `📅 Gerado em: ${new Date().toLocaleString('pt-BR')}\n`;
      textToCopy += `📊 Total de Registros: ${allData.length}\n\n`;

      // 3. Itera sobre TODOS os dados retornados
      allData.forEach((row, index) => {
        const dataFormatada = new Date(`${row.data}T00:00:00`).toLocaleDateString('pt-BR');
        
        textToCopy += `*${index + 1}. ${dataFormatada} às ${row.hora}*\n`;
        textToCopy += `🚘 Placa: ${row.placa}\n`;
        textToCopy += `🛣️ ${row.rodovia} - KM ${row.km}\n`;
        textToCopy += `📍 ${row.praca}\n`;
        textToCopy += `↔️ Sentido: ${row.sentido}\n`;
        textToCopy += `--------------------------------\n`;
      });

      // 4. Copia para a área de transferência
      await navigator.clipboard.writeText(textToCopy);
      toast.success(`Copiados ${allData.length} registros para a área de transferência!`);

    } catch (err) {
      console.error('Erro ao copiar:', err);
      toast.error("Erro ao buscar dados completos para cópia.");
    } finally {
      setCopying(false); // Desativa loading
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
                  '&:hover fieldset': {
                    borderColor: '#fca311',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#fca311',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#fca311',
                },
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
                '&:disabled': {
                  bgcolor: '#e5e7eb',
                  color: '#9ca3af',
                },
                transition: 'all 0.3s ease',
              }}
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </Button>          
          </div>

          {/* Stats Row & Actions */}
          {hasSearched && (
            <div className="mt-4 gap-4 pt-4 border-t border-gray-200 justify-between flex flex-col md:flex-row md:items-center">
              <div className='flex items-center '>
                <div className='flex items-center gap-2'>
                  <TrendingUpIcon style={{ color: '#fca311', fontSize: 20 }} />
                  <Typography variant="body2" className="text-gray-600">
                    Total de registros: <strong className="text-gray-900">{rowCount}</strong>
                  </Typography>
                </div>
                {latestRowId && (
                  <Chip 
                    label="Registro mais recente destacado" 
                    size="small"
                    sx={{ 
                      bgcolor: '#fef3e2',
                      color: '#d97706',
                      fontWeight: 500,
                      fontSize: '12px',
                      ml: 2
                    }}
                  />
                )}
              </div>
              
              {/* Botões de Ação */}
              {rowCount > 0 && (
                <div className="flex gap-2">
                  <Tooltip title="Copiar TODOS os registros para WhatsApp/Telegram">
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={handleCopy}
                      disabled={loading || copying} // Desabilita se estiver copiando
                      size="large"
                      startIcon={<ContentCopyIcon />}
                      sx={{ borderColor: '#1976d2', color: '#1976d2' }}
                    >
                      {copying ? 'Copiando...' : 'Copiar Tudo'}
                    </Button>
                  </Tooltip>

                  <Button
                    variant="contained"
                    color="success"
                    onClick={handleExport}
                    disabled={exporting || loading}
                    size="large"
                  >
                    {exporting ? 'Exportando...' : 'Exportar Relatório'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
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
                return params.id === latestRowId 
                    ? 'highlighted-row' 
                    : '';
              }}
              slots={{
                pagination: CustomPagination,
                noRowsOverlay: () => {
                  // Só mostra a mensagem se já foi feita uma busca
                  if (!hasSearched) {
                    return null; // Tabela vazia inicialmente
                  }
                  return (
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        gap: 2,
                      }}
                    >
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
                  bgcolor: '#14213d',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 600,
                  borderRadius: 0,
                  minHeight: '56px !important',
                  maxHeight: '56px !important',
                },
                '& .MuiDataGrid-columnHeader': {
                  outline: 'none !important',
                },
                '& .MuiDataGrid-columnHeaderTitle': {
                  fontWeight: 600,
                  color: '#134074',
                },
                '& .MuiDataGrid-columnSeparator': {
                  color: 'rgba(255,255,255,0.2)',
                },
                '& .MuiDataGrid-row': {
                  '&:hover': {
                    bgcolor: '#fef3e2',
                  },
                  '&.Mui-selected': {
                    bgcolor: '#fef9f0 !important',
                  },
                },
                '& .MuiDataGrid-row.highlighted-row': {
                  bgcolor: '#fef3e2',
                  borderLeft: '4px solid #fca311',
                  '&:hover': {
                    bgcolor: '#fde8c0 !important',
                  },
                },
                '& .MuiDataGrid-cell': {
                  borderColor: '#f3f4f6',
                  fontSize: '14px',
                },
                '& .MuiDataGrid-footerContainer': {
                  borderTop: '2px solid #f3f4f6',
                  bgcolor: '#fafafa',
                },
                '& .MuiTablePagination-root': {
                  color: '#14213d',
                },
                '& .MuiDataGrid-virtualScroller': {
                  bgcolor: 'white',
                },
              }}
            />
          </Box>
        </CardContent>
      </Card>
    </div>
  );
}
