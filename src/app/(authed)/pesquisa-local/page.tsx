'use client';

import { useState, useEffect, useCallback } from 'react';
import { DataGrid, GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import { radarsService } from '../../services'
import { LocalSearchParams } from '../../types/types';
import CustomPagination from '../../components/CustomPagination';
import { Box, Button, Card, CardContent, Chip, CircularProgress, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, TextField, Typography } from '@mui/material';
import { exportToExcel } from '../../components/ExportExcel';
import { toast } from 'react-toastify';
import { set } from 'react-hook-form';
import { SearchIcon, TrendingUpIcon } from 'lucide-react';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import FilterListIcon from '@mui/icons-material/FilterList';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ClearIcon from '@mui/icons-material/Clear';
//import { ExportExcel } from '../components/ExportExcel';

// =============================================
// Tipos e Interfaces
// =============================================

interface FilterState {
  concessionaria: string;
  rodovia: string;
  praca: string;
  km: string;
  sentido: string;
  data: string;
  horaInicial: string;
  horaFinal: string;
}

interface OptionsState {
  rodovias: string[];
  kms: string[];
  sentidos: string[];
  pracas: string[];
}

const INITIAL_FILTERS: FilterState = {
  concessionaria: '',
  rodovia: '',
  praca: '',
  km: '',
  sentido: '',
  data: '',
  horaInicial: '',
  horaFinal: '',
};

const INITIAL_OPTIONS: OptionsState = {
  rodovias: [],
  kms: [],
  sentidos: [],
  pracas: [],
};


// =============================================
// Configuração das Colunas
// =============================================

const columns: GridColDef[] = [
  { 
    field: 'data', 
    headerName: 'Data', 
    width: 130,
    headerAlign: 'center',
    align: 'center',
    valueFormatter: (value: string) => {
      if (!value) return '';
      const date = new Date(`${value}T00:00:00`);
      return date.toLocaleDateString('pt-BR');
    }
  },
  { 
    field: 'hora', 
    headerName: 'Hora', 
    width: 110,
    headerAlign: 'center',
    align: 'center',
  },
  { 
    field: 'placa', 
    headerName: 'Placa', 
    width: 130,
    headerAlign: 'center',
    align: 'center',
    renderCell: (params) => (
      <Chip 
        label={params.value} 
        size="medium"
        variant="outlined"
        sx={{ 
          fontWeight: 600,
          bgcolor: '#3f51b5',
          color: 'white',
          fontFamily: 'Roboto',
          letterSpacing: '0.5px'
        }}
      />
    )
  },
  { 
    field: 'praca', 
    headerName: 'Praça', 
    width: 220,
    headerAlign: 'left',
  },
  { 
    field: 'rodovia', 
    headerName: 'Rodovia', 
    width: 140,
    headerAlign: 'center',
    align: 'center',
    renderCell: (params) => (
      <span style={{ fontWeight: 600, color: '#14213d' }}>
        {params.value}
      </span>
    )
  },
  { 
    field: 'km', 
    headerName: 'KM', 
    width: 100,
    headerAlign: 'center',
    align: 'center',
  },
  { 
    field: 'sentido', 
    headerName: 'Sentido', 
    width: 140,
    headerAlign: 'center',
    align: 'center',
  },
];

export default function ConsultaLocal() {
  // 1. Estado do Formulário (O que o usuário vê e digita)
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);

  // 2. Estado dos Filtros ATIVOS (O que realmente foi buscado por último)
  // É esse estado que a paginação e a exportação vão usar!
  const [activeFilters, setActiveFilters] = useState<FilterState | null>(null);
  
  const [options, setOptions] = useState<OptionsState>(INITIAL_OPTIONS);
  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [kmsLoading, setKmsLoading] = useState(false); // Novo estado de loading para os KMs
  const [rows, setRows] = useState<any[]>([]); // Tipado como any[] para evitar erro no getRowId por enquanto
  const [rowCount, setRowCount] = useState(0);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [exporting, setExporting] = useState(false);  
  const [hasSearched, setHasSearched] = useState(false);

  //useEffect para buscar as opções quando a concessionária muda
  useEffect(() => {
    const fetchOptions = async () => {
      if (!filters.concessionaria) {
        setOptions({ rodovias: [], pracas: [], kms: [], sentidos: []});
        return;
      }
      setOptionsLoading(true);

      try {
        const data = await radarsService.getFilterOptions(filters.concessionaria);
        // Inicializamos os KMs como uma lista vazia
        setOptions({ ...data, kms: [] });
      } catch (error) {
        console.log(error);
        toast.error("Não foi possível carregar as opções de filtro por concessionária.");
        alert('Não foi possível carregar as opções de filtro.');        
      } finally {
        setOptionsLoading(false);
      }
    };

    fetchOptions();
  }, [filters.concessionaria]); // Roda sempre que o valor de 'concessionaria' muda

  // =================================================================
    // ##  useEffect PARA OS FILTROS DEPENDENTES
    // =================================================================
    useEffect(() => {
        const fetchKms = async () => {
            // Só busca se tivermos uma concessionária E uma rodovia selecionada
            if (!filters.concessionaria || !filters.rodovia) {
                setOptions(prev => ({ ...prev, kms: [] })); // Limpa os KMs se a rodovia for desmarcada
                return;
            }
            setKmsLoading(true);
            try {
                const kmsData = await radarsService.getKmsByRodovia(filters.concessionaria, filters.rodovia);
                setOptions(prev => ({ ...prev, kms: kmsData }));
            } catch (error) {
                console.error("Erro ao buscar KMs:", error);
                toast.error("Erro ao buscar KMs para a rodovia selecionada.");
                setOptions(prev => ({ ...prev, kms: [] })); // Limpa em caso de erro
            } finally {
                setKmsLoading(false);
            }
        };

        fetchKms();
    }, [filters.rodovia]); // Este hook RODA SEMPRE QUE a rodovia for alterada

    // HANDLERS DO FORMULÁRIO
    const handleSelectChange = (e: SelectChangeEvent) => {
      const { name, value } = e.target;
      // Começamos com uma cópia dos filtros atuais e atualizamos o campo que mudou
      const newFilters = {
        ...filters,
        [name]: value,
      };

    // Agora, aplicamos as regras de reset em cascata
    
    // REGRA 1: Se a CONCESSIONÁRIA mudou, limpe todos os filtros de LOCALIZAÇÃO dependentes.
    // Mas mantenha os filtros de data e hora!
    if (name === 'concessionaria') {
      newFilters.rodovia = '';
      newFilters.praca = '';
      newFilters.km = '';
      newFilters.sentido = '';
      // Limpa os resultados da busca anterior
      setRows([]);
      setRowCount(0);
      setActiveFilters(null); // Reseta a busca ativa se mudar concessionária
      setHasSearched(false);
    }

    // REGRA 2: Se a RODOVIA mudou, limpe apenas o KM, que depende dela.
    if (name === 'rodovia') {
      newFilters.km = '';
    }
    
    // Atualiza o estado com todos os filtros (o que mudou e o que foi resetado)
    setFilters(newFilters);
  };

  // NOVO: Handler específico para os componentes TextField (data/hora)
  const handleTextFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };
  
  
  // =================================================================
  // FUNÇÃO DE BUSCA ISOLADA (Usa filtersToUse, não o state 'filters')
  // =================================================================
  const fetchRadars = useCallback(async (page: number, size: number, filtersToUse: FilterState) => {
    setLoading(true);

    // DEBUG: Verifique no Console do Navegador (F12) se "page" muda ao clicar na paginação
    console.log(`📡 Buscando dados: Página=${page}, Tamanho=${size}`, filtersToUse);

    const paramsToSend: LocalSearchParams = {
      page,
      pageSize: size,
      concessionaria: filtersToUse.concessionaria,
      rodovia: filtersToUse.concessionaria !== 'eixo' ? filtersToUse.rodovia : undefined,
      km: filtersToUse.concessionaria !== 'eixo' ? filtersToUse.km : undefined,
      praca: filtersToUse.concessionaria === 'eixo' ? filtersToUse.praca : undefined,
      sentido: filtersToUse.sentido || undefined,
      data: filtersToUse.data || undefined,
      horaInicial: filtersToUse.horaInicial || undefined,
      horaFinal: filtersToUse.horaFinal || undefined,
    };

    try {
      const data = await radarsService.searchByLocal(paramsToSend);      

      // DEBUG: Verifique se o backend retornou conteúdo
      console.log("✅ Dados recebidos:", data);
      if (data && data.content) {
          setRows(data.content);
          // Proteção contra totalElements nulo
          setRowCount(data.page?.totalElements || 0); 
      } else {
          setRows([]);
          setRowCount(0);
      }
    } catch (error) {
      console.error("❌ Erro na busca:", error);      
      toast.error("Erro ao buscar dados consulta por Local.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // =================================================================
  // AÇÃO DO BOTÃO BUSCAR
  // =================================================================
  const handleSearchClick = () => {
    if (!filters.concessionaria) {
      toast.warning('Por favor, selecione uma concessionária.');
      return;
    }

    // 1. Salva o "Snapshot" dos filtros atuais
    setActiveFilters(filters);
    setHasSearched(true);
    // 2. Reseta para a primeira página. 
    // OBS: Isso vai disparar o useEffect abaixo automaticamente.
    setPaginationModel(prev => ({ ...prev, page: 0 }));

    // Pequena otimização: se já estiver na página 0, o useEffect pode não disparar pela mudança de página,
    // mas vai disparar pela mudança do activeFilters. Então tudo certo.
  };
  
  // =================================================================
  // EFFECT DA PAGINAÇÃO  
  // =================================================================
  useEffect(() => {
    // Só busca se tivermos filtros ativos (usuário clicou em buscar pelo menos uma vez)
    if (activeFilters) {
      fetchRadars(paginationModel.page, paginationModel.pageSize, activeFilters);
    }
  }, [paginationModel, activeFilters, fetchRadars]);

  // =================================================================
  // EXPORTAÇÃO (Agora usa activeFilters para consistência)
  // =================================================================
  const handleExport = async () => {
    // Usa activeFilters se existir (consistência com a tabela), senão usa filters (se o usuário não buscou ainda)
    const filtersToExport = activeFilters || filters;

    if (!filtersToExport.concessionaria) {
      alert('Por favor, selecione uma concessionária para exportar.');
      return;
    }
    
    setExporting(true);
    try {
      const paramsToExport = {
        concessionaria: filtersToExport.concessionaria,
        rodovia: filtersToExport.concessionaria !== 'eixo' ? filtersToExport.rodovia : undefined,
        km: filtersToExport.concessionaria !== 'eixo' ? filtersToExport.km : undefined,
        praca: filtersToExport.concessionaria === 'eixo' ? filtersToExport.praca : undefined,
        sentido: filtersToExport.sentido || undefined,
        data: filtersToExport.data || undefined,
        horaInicial: filtersToExport.horaInicial || undefined,
        horaFinal: filtersToExport.horaFinal || undefined,
      };

      const allData = await radarsService.searchAllByLocalForExport(paramsToExport);

      if (!allData || allData.length === 0) {
        toast.warn("Nenhum dado encontrado para exportar com os filtros selecionados.");
        return;
      }

      exportToExcel(allData, "Relatorio_Radares");
      toast.success("Relatório exportado com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar o relatório.");
    } finally {
      setExporting(false);
    }
  };

  const handleClear = () => {
    setFilters(INITIAL_FILTERS);
    setActiveFilters(null);
    setRows([]);
    setRowCount(0);
    setHasSearched(false);
    setPaginationModel({ page: 0, pageSize: 10 });
    setOptions(INITIAL_OPTIONS);
    toast.info("Filtros limpos com sucesso!");
  };

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
              <LocationOnIcon sx={{ fontSize: 40, color: '#fca311' }} />
            </div>
            <div>
              <Typography 
                variant="h4" 
                className="font-bold text-white mb-1"
                sx={{ letterSpacing: '-0.5px' }}
              >
                Consulta por Local e Concessionária
              </Typography>
              <Typography variant="body2" className="text-gray-300">
                Filtros avançados de localização e horário
              </Typography>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Filters Card */}
      <Card className="mb-6 shadow-lg">
        <CardContent className="p-6">
          <div className='flex items-center gap-2 mb-4'>
            <FilterListIcon sx={{ color: '#fca311', fontSize: 24 }} />
            <Typography variant="h6" className="font-semibold text-gray-800">
              Filtros de Pesquisa
            </Typography>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <FormControl 
              fullWidth 
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': { borderColor: '#fca311' },
                  '&.Mui-focused fieldset': { borderColor: '#fca311' },
                },
                '& .MuiInputLabel-root.Mui-focused': { color: '#fca311' },
              }}
            >
              <InputLabel id="concessionaria-select-label">Concessionária</InputLabel>
              <Select
                labelId="concessionaria-select-label"
                label="Concessionária"
                name="concessionaria"
                value={filters.concessionaria}
                onChange={handleSelectChange}
              >
                <MenuItem value=""><em>Selecione a Concessionária</em></MenuItem>
                <MenuItem value="cart">Cart</MenuItem>
                <MenuItem value="eixo">Eixo</MenuItem>
                <MenuItem value="rondon">Rondon</MenuItem>
                <MenuItem value="entrevias">Entrevias</MenuItem>
              </Select>
            </FormControl>

            {filters.concessionaria === 'eixo' ? (
              <>
                <FormControl 
                  fullWidth 
                  size="small" 
                  disabled={optionsLoading || !filters.concessionaria}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: '#fca311' },
                      '&.Mui-focused fieldset': { borderColor: '#fca311' },
                    },
                    '& .MuiInputLabel-root.Mui-focused': { color: '#fca311' },
                  }}
                >
                  <InputLabel id="local-select-label">Local</InputLabel>
                  <Select
                    labelId="local-select-label"
                    label="Local"
                    name="praca"
                    value={filters.praca}
                    onChange={handleSelectChange}
                  >
                    <MenuItem value="">
                      <em>{optionsLoading ? 'Buscando...' : 'Todos os Locais'}</em>
                    </MenuItem>
                    {options?.pracas?.map(local => <MenuItem key={local} value={local}>{local}</MenuItem>)}
                  </Select>
                </FormControl>
                <Box /> 
              </>
            ) : (
              <>
                <FormControl 
                  fullWidth 
                  size="small" 
                  disabled={optionsLoading || !filters.concessionaria}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: '#fca311' },
                      '&.Mui-focused fieldset': { borderColor: '#fca311' },
                    },
                    '& .MuiInputLabel-root.Mui-focused': { color: '#fca311' },
                  }}
                >
                  <InputLabel id="rodovia-select-label">Rodovia</InputLabel>
                  <Select 
                    name="rodovia" 
                    value={filters.rodovia} 
                    onChange={handleSelectChange} 
                    label="Rodovia"
                    IconComponent={optionsLoading ? () => <CircularProgress size={15} sx={{ marginRight: '12px'}}/> : undefined}
                  >
                    <MenuItem value="">
                      <em>{optionsLoading ? 'Buscando...' : 'Todas as Rodovias'}</em>
                    </MenuItem>
                    {options.rodovias.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                  </Select>
                </FormControl>

                <FormControl 
                  fullWidth 
                  size="small" 
                  disabled={optionsLoading || !filters.rodovia || kmsLoading}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: '#fca311' },
                      '&.Mui-focused fieldset': { borderColor: '#fca311' },
                    },
                    '& .MuiInputLabel-root.Mui-focused': { color: '#fca311' },
                  }}
                >
                  <InputLabel id="km-select-label">KM</InputLabel>
                  <Select 
                    name="km" 
                    value={filters.km} 
                    onChange={handleSelectChange} 
                    label="KM"
                    IconComponent={kmsLoading ? () => <CircularProgress size={20} sx={{ marginRight: '12px' }} /> : undefined}
                  >
                    <MenuItem value="">
                      <em>{kmsLoading ? 'Buscando...' : 'Todos os KMs'}</em>
                    </MenuItem>
                    {options.kms.map(k => <MenuItem key={k} value={k}>{k}</MenuItem>)}
                  </Select>
                </FormControl>
              </>
            )}

            <FormControl 
              fullWidth 
              size="small" 
              disabled={optionsLoading || !filters.concessionaria}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': { borderColor: '#fca311' },
                  '&.Mui-focused fieldset': { borderColor: '#fca311' },
                },
                '& .MuiInputLabel-root.Mui-focused': { color: '#fca311' },
              }}
            >
              <InputLabel id="sentido-select-label">Sentido</InputLabel>
              <Select name="sentido" value={filters.sentido} onChange={handleSelectChange} label="Sentido">
                <MenuItem value=""><em>{optionsLoading ? 'Buscando...' : 'Todos os Sentidos'}</em></MenuItem>
                {options.sentidos.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
                    
            <TextField 
              label="Data" 
              type="date" 
              name="data" 
              value={filters.data} 
              onChange={handleTextFieldChange} 
              InputLabelProps={{ shrink: true }} 
              size="small" 
              fullWidth 
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': { borderColor: '#fca311' },
                  '&.Mui-focused fieldset': { borderColor: '#fca311' },
                },
                '& .MuiInputLabel-root.Mui-focused': { color: '#fca311' },
              }}
            />
            <TextField 
              label="Hora Inicial" 
              type="time" 
              name="horaInicial" 
              value={filters.horaInicial} 
              onChange={handleTextFieldChange} 
              InputLabelProps={{ shrink: true }} 
              size="small" 
              fullWidth 
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': { borderColor: '#fca311' },
                  '&.Mui-focused fieldset': { borderColor: '#fca311' },
                },
                '& .MuiInputLabel-root.Mui-focused': { color: '#fca311' },
              }}
            />
            <TextField 
              label="Hora Final" 
              type="time" 
              name="horaFinal" 
              value={filters.horaFinal} 
              onChange={handleTextFieldChange} 
              InputLabelProps={{ shrink: true }} 
              size="small" 
              fullWidth 
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': { borderColor: '#fca311' },
                  '&.Mui-focused fieldset': { borderColor: '#fca311' },
                },
                '& .MuiInputLabel-root.Mui-focused': { color: '#fca311' },
              }}
            />
          </div>

          <div className="mt-6 flex justify-between items-center gap-4">
            <div className='justify-self-start gap-4'>
              <Button
              variant='contained'
              onClick={handleSearchClick}
              disabled={loading}
              size="large"
              startIcon={<SearchIcon />}
              sx={{
                minWidth: '160px',
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
            <Button
                variant='outlined'
                onClick={handleClear}
                disabled={loading || exporting}
                size="large"
                startIcon={<ClearIcon />}
                sx={{
                  minWidth: '140px',
                  borderColor: '#3f51b5',
                  color: '#5c6bc0',
                  fontWeight: 600,
                  fontSize: '16px',
                  marginLeft: '10px',
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: '#512da8',
                    bgcolor: '#9fa8da',
                    color: '#e8eaf6',
                    transform: 'translateY(-2px)',
                  },
                  '&:disabled': {
                    borderColor: '#3d5afe',
                    color: '#8c9eff',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Limpar
              </Button>
            </div>
            
            <Button 
              variant="contained"
              onClick={handleExport}
              disabled={exporting || loading || !hasSearched}
              size="large"
              startIcon={exporting ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <FileDownloadIcon />}
              sx={{
                minWidth: '200px',
                bgcolor: '#059669',
                color: 'white',
                fontWeight: 600,
                fontSize: '16px',
                textTransform: 'none',
                boxShadow: '0 4px 14px rgba(5, 150, 105, 0.4)',
                '&:hover': {
                  bgcolor: '#047857',
                  boxShadow: '0 6px 20px rgba(5, 150, 105, 0.5)',
                  transform: 'translateY(-2px)',
                },
                '&:disabled': {
                  bgcolor: '#e5e7eb',
                  color: '#9ca3af',
                },
                transition: 'all 0.3s ease',
              }}
            >
              {exporting ? 'Exportando...' : 'Exportar para Excel'}
            </Button>
          </div>

          {hasSearched && rowCount > 0 && (
            <div className='mt-4 flex items-center gap-4 pt-4 border-t border-gray-200'>
              <div className='flex items-center gap-2'>
                <TrendingUpIcon style={{ color: '#fca311', fontSize: 20 }} />
                <Typography variant="body2" className="text-gray-600">
                  Total de registros: <strong className="text-gray-900">{rowCount}</strong>
                </Typography>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* DataGrid Card */}
      <Card className="shadow-lg overflow-hidden">
        <CardContent className="p-0">
          <Box sx={{ height: 620, width: '100%' }}>
            <DataGrid
              rows={rows}
              columns={columns}
              rowCount={rowCount}
              loading={loading}
              pageSizeOptions={[10, 25, 50, 100]}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              paginationMode="server"
              hideFooter={!hasSearched}
              autoHeight={false}
              getRowId={(row) => row.id || `${row.placa}-${row.data}-${row.hora}-${Math.random()}`}
              slots={{
                pagination: CustomPagination,
                noRowsOverlay: () => {
                  if (!hasSearched) {
                    return null;
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
                        Nenhum registro encontrado com os filtros selecionados
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