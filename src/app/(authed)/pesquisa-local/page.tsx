'use client';

import { useState, useEffect, useCallback } from 'react';
import { DataGrid, GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import { radarsService } from '../../services'
import { LocalSearchParams, RadarsDTO } from '../../types/types';
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
import { PracaDTO, RodoviaDTO } from '@/app/services/radars';
//import { ExportExcel } from '../components/ExportExcel';

// =============================================
// Tipos e Interfaces
// =============================================

interface FilterState {
  concessionaria: string;
  rodovia: string; // Nome da rodovia (para enviar ao back)
  rodoviaId: number | ''; // ID da rodovia (para buscar KMs)
  km: string;
  sentido: string;
  praca: string; // Nome da praça (para enviar ao back)
  pracaId: string;
  data: string;
  horaInicial: string;
  horaFinal: string;
}

interface OptionsState {
  rodovias: RodoviaDTO[]; // Agora guarda objetos {id, nome}
  kms: string[];
  sentidos: string[];
  pracas: PracaDTO[]; // Se tiver endpoint de praças, use aqui
}

const INITIAL_FILTERS: FilterState = {
  concessionaria: '',
  rodovia: '',
  rodoviaId: '',
  km: '',
  sentido: '',
  praca: '',
  pracaId: '',
  data: new Date().toISOString().split('T')[0], // Data de hoje como padrão
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
 // Estados
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [activeFilters, setActiveFilters] = useState<FilterState | null>(null);
  const [options, setOptions] = useState<OptionsState>(INITIAL_OPTIONS);
  
  const [loading, setLoading] = useState(false);
  const [loadingRodovias, setLoadingRodovias] = useState(false);
  const [loadingPracas, setLoadingPracas] = useState(false);
  const [loadingKms, setLoadingKms] = useState(false);
  
  const [rows, setRows] = useState<RadarsDTO[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });
  const [exporting, setExporting] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // 1. Carrega opções estáticas e iniciais ao montar
  useEffect(() => {
    const initOptions = async () => {
      // Sentidos estáticos
      const sentidos = await radarsService.getSentidos();
      setOptions(prev => ({ ...prev, sentidos }));
      
      // Carrega Rodovias (Independente de concessionária por enquanto, ou filtre se backend suportar)
      setLoadingRodovias(true);
      try {
        const rodovias = await radarsService.getRodovias();
        setOptions(prev => ({ ...prev, rodovias }));
      } catch (err) {
        toast.error("Erro ao carregar rodovias.");
      } finally {
        setLoadingRodovias(false);
      }
    };
    initOptions();
  }, []);

  // 2. Carrega KMs quando a Rodovia muda
  useEffect(() => {
    const fetchKms = async () => {
      if (!filters.rodoviaId) {
        setOptions(prev => ({ ...prev, kms: [] }));
        return;
      }
      
      setLoadingKms(true);
      try {
        // Busca KMs usando o ID da rodovia
        const kmsData = await radarsService.getKmsByRodoviaId(Number(filters.rodoviaId));
        setOptions(prev => ({ ...prev, kms: kmsData.map(k => k.valor) }));
      } catch (error) {
        console.error('Erro ao carregar KMs:', error);
        toast.error("Erro ao carregar KMs.");
      } finally {
        setLoadingKms(false);
      }
    };

    fetchKms();
  }, [filters.rodoviaId]);

  // =============================================
  // 3. Carrega praças quando concessionária Eixo é selecionada
  // =============================================
  useEffect(() => {
    const fetchPracas = async () => {
      if (filters.concessionaria !== 'eixo') {
        setOptions(prev => ({ ...prev, pracas: [] }));
        return;
      }
      
      setLoadingPracas(true);
      try {
        // TODO: Implementar endpoint de praças no service
        const pracas = await radarsService.getPracas();
        setOptions(prev => ({ ...prev, pracas }));
        
        // Placeholder temporário
        setOptions(prev => ({ ...prev, pracas: [] }));
        //toast.info("Carregamento de praças ainda não implementado no backend.");
      } catch (error) {
        console.error('Erro ao carregar praças:', error);
        toast.error("Erro ao carregar praças.");
      } finally {
        setLoadingPracas(false);
      }
    };
    fetchPracas();
  }, [filters.concessionaria]);


  // =============================================
  // HANDLERS
  // =============================================
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;

    // Reset completo ao mudar concessionária
    if (name === 'concessionaria') {
      setFilters({
        ...INITIAL_FILTERS,
        concessionaria: value,
        data: filters.data,
      });
      return;
    }
    
    // Tratamento especial para rodovia (mantém ID e nome)
    if (name === 'rodoviaId') {
      const selectedRodovia = options.rodovias.find(r => r.id === Number(value));
      setFilters(prev => ({
        ...prev,
        rodoviaId: value as unknown as number,
        rodovia: selectedRodovia?.nome || '',
        km: '', // Reset KM ao mudar rodovia
      }));
      return;
    }

    // Tratamento para praça (se necessário manter ID e nome)
    if (name === 'pracaId') {
      const selectedPraca = options.pracas.find(p => p.id === Number(value));
      setFilters(prev => ({
        ...prev,
        pracaId: value,
        praca: selectedPraca?.nome || '',
      }));
      return;
    }

    // Demais campos
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleTextFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };


  // =============================================
  // BUSCA DE DADOS
  // =============================================
  const fetchRadars = useCallback(async (page: number, size: number, filtersToUse: FilterState) => {
    setLoading(true);
    
    try {
      // Monta os parâmetros conforme interface LocalSearchParams
      const params: LocalSearchParams = {
        page,
        pageSize: size,
        data: filtersToUse.data,
        horaInicial: filtersToUse.horaInicial || undefined,
        horaFinal: filtersToUse.horaFinal || undefined,
        sentido: filtersToUse.sentido || undefined,
        concessionaria: filtersToUse.concessionaria,
      };

      // Adiciona filtros específicos por concessionária
      if (filtersToUse.concessionaria === 'cart') {
        if (filtersToUse.rodovia) params.rodovia = filtersToUse.rodovia;
        if (filtersToUse.km) params.km = filtersToUse.km;
      } else if (filtersToUse.concessionaria === 'eixo' || 
                 filtersToUse.concessionaria === 'rondon' || 
                 filtersToUse.concessionaria === 'entrevias') {
        if (filtersToUse.praca) params.praca = filtersToUse.praca;
      }

      console.log('📤 Parâmetros enviados para busca:', params);

      const response = await radarsService.searchByLocal(params);
      
      console.log('📥 Resposta recebida:', response);

      if (response?.content && Array.isArray(response.content)) {
        setRows(response.content);
        setRowCount(response.page?.totalElements || 0);
        
        if (response.content.length === 0) {
          toast.info("Nenhum registro encontrado com os filtros aplicados.");
        } else {
          toast.success(`${response.page?.totalElements || response.content.length} registros encontrados.`);
        }
      } else {
        console.warn('⚠️ Resposta inesperada:', response);
        setRows([]);
        setRowCount(0);
        toast.warning("Resposta do servidor em formato inesperado.");
      }
    } catch (error: any) {
      console.error('❌ Erro na busca:', error);
      setRows([]);
      setRowCount(0);
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          "Erro ao buscar dados. Verifique os filtros e tente novamente.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // =============================================
  // AÇÕES
  // =============================================
  // Botão Buscar
  const handleSearchClick = () => {
    // Validação: Data é obrigatória
    if (!filters.data) {
      toast.warning("⚠️ A Data é obrigatória para realizar a busca.");
      return;
    }

    // Validação: Pelo menos um filtro além da data
    const hasAdditionalFilter = 
      filters.concessionaria ||
      filters.rodovia ||
      filters.km ||
      filters.sentido ||
      filters.praca ||
      filters.horaInicial ||
      filters.horaFinal;

    if (!hasAdditionalFilter) {
      toast.warning("⚠️ Selecione pelo menos um filtro adicional além da data.");
      return;
    }

    console.log('🔍 Iniciando busca com filtros:', filters);

    setActiveFilters(filters);
    setHasSearched(true);
    setPaginationModel(prev => ({ ...prev, page: 0 }));
  };

  // Limpar
  const handleClear = () => {
    setFilters(INITIAL_FILTERS);
    setActiveFilters(null);
    setRows([]);
    setRowCount(0);
    setHasSearched(false);
  };

  // Exportar
  const handleExport = async () => {
    const filtersToExport = activeFilters || filters;
    if (!filtersToExport.concessionaria) {
      toast.warning('Selecione uma concessionária para exportar.');
      return;
    }
    
    setExporting(true);
    try {
      // Mapeamento manual para LocalSearchParams
      const params: LocalSearchParams = {
        concessionaria: filtersToExport.concessionaria,
        data: filtersToExport.data,
        horaInicial: filtersToExport.horaInicial,
        horaFinal: filtersToExport.horaFinal,
        rodovia: filtersToExport.rodovia,
        km: filtersToExport.km,
        sentido: filtersToExport.sentido,
        praca: filtersToExport.praca,
        page: 0,
        pageSize: 1000 // Tamanho grande para exportação
      };

      const data = await radarsService.searchAllByLocalForExport(params);
      if (data.length > 0) {
        exportToExcel(data, `Relatorio_Radares_${filtersToExport.concessionaria}`);
        toast.success("Download iniciado!");
      } else {
        toast.info("Sem dados para exportar.");
      }
    } catch (err) {
      toast.error("Erro na exportação.");
    } finally {
      setExporting(false);
    }
  };

  // =============================================
  // EFEITO DE PAGINAÇÃO
  // =============================================
  useEffect(() => {
    if (activeFilters) {
      fetchRadars(paginationModel.page, paginationModel.pageSize, activeFilters);
    }
  }, [paginationModel, activeFilters, fetchRadars]);

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6'>
      {/* Header */}
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

      {/* Filtros */}
      <Card className="mb-6 shadow-md">
        <CardContent className="p-6">
          <div className='flex items-center gap-2 mb-4'>
            <FilterListIcon sx={{ color: '#fca311', fontSize: 24 }} />
            <Typography variant="h6" className="font-semibold text-gray-800">
              Filtros de Pesquisa
            </Typography>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            
            {/* Concessionária */}
            <FormControl 
              size="small" 
              fullWidth
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
                name="concessionaria"
                value={filters.concessionaria}
                label="Concessionária"
                onChange={handleSelectChange}
              >
                <MenuItem value=""><em>Selecione</em></MenuItem>
                <MenuItem value="cart">Cart</MenuItem>
                <MenuItem value="eixo">Eixo</MenuItem>
                <MenuItem value="rondon">Rondon</MenuItem>
                <MenuItem value="entrevias">Entrevias</MenuItem>
              </Select>
            </FormControl>        

             {/* FILTROS CART */}
            {filters.concessionaria === 'cart' && (
              <>
                <FormControl 
                  fullWidth 
                  size="small"
                  disabled={loadingRodovias}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: '#fca311' },
                      '&.Mui-focused fieldset': { borderColor: '#fca311' },
                    },
                    '& .MuiInputLabel-root.Mui-focused': { color: '#fca311' },
                  }}
                >
                  <InputLabel>Rodovia</InputLabel>
                  <Select 
                    name="rodoviaId" 
                    value={String(filters.rodoviaId)} 
                    label="Rodovia"
                    onChange={handleSelectChange}
                  >
                    <MenuItem value=""><em>Todas</em></MenuItem>
                    {options.rodovias.map(r => (
                      <MenuItem key={r.id} value={r.id}>{r.nome}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl 
                  size="small" 
                  fullWidth 
                  disabled={!filters.rodoviaId || loadingKms}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: '#fca311' },
                      '&.Mui-focused fieldset': { borderColor: '#fca311' },
                    },
                    '& .MuiInputLabel-root.Mui-focused': { color: '#fca311' },
                  }}
                >
                  <InputLabel>KM</InputLabel>
                  <Select
                    name="km"
                    value={filters.km}
                    label="KM"
                    onChange={handleSelectChange}
                  >
                    <MenuItem value=""><em>Todos</em></MenuItem>
                    {options.kms.map(k => (
                      <MenuItem key={k} value={k}>{k}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </>
            )}

            {/* FILTROS EIXO/RONDON/ENTREVIAS */}
            {(filters.concessionaria === 'eixo' || 
              filters.concessionaria === 'rondon' || 
              filters.concessionaria === 'entrevias') && (
              <FormControl 
                fullWidth 
                size="small"
                disabled={loadingPracas}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: '#fca311' },
                    '&.Mui-focused fieldset': { borderColor: '#fca311' },
                  },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#fca311' },
                }}
              >
                <InputLabel>Praça</InputLabel>
                <Select 
                  name="pracaId" 
                  value={filters.pracaId} 
                  label="Praça"
                  onChange={handleSelectChange}
                >
                  <MenuItem value=""><em>Todas</em></MenuItem>
                  {options.pracas.map(p => (
                    <MenuItem key={p.id} value={p.id}>{p.nome}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )} 

            

            {/* Sentido */}
            <FormControl 
              size="small" 
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': { borderColor: '#fca311' },
                  '&.Mui-focused fieldset': { borderColor: '#fca311' },
                },
                '& .MuiInputLabel-root.Mui-focused': { color: '#fca311' },
              }}
            >
              <InputLabel id="sentido-select-label">Sentido</InputLabel>
              <Select
                name="sentido"
                value={filters.sentido}
                label="Sentido"
                onChange={handleSelectChange}
              >
                <MenuItem value=""><em>{loading ? 'Buscando...' : 'Todos os Sentidos'}</em></MenuItem>
                {options.sentidos.map(s => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Data (Obrigatória) */}
            <TextField
              label="Data *"
              type="date"
              name="data"
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={filters.data}
              onChange={handleTextFieldChange}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': { borderColor: '#fca311' },
                  '&.Mui-focused fieldset': { borderColor: '#fca311' },
                },
                '& .MuiInputLabel-root.Mui-focused': { color: '#fca311' },
              }}
            />

            {/* Horários */}
            <TextField
              label="Hora Inicial"
              type="time"
              name="horaInicial"
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={filters.horaInicial}
              onChange={handleTextFieldChange}
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
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={filters.horaFinal}
              onChange={handleTextFieldChange}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': { borderColor: '#fca311' },
                  '&.Mui-focused fieldset': { borderColor: '#fca311' },
                },
                '& .MuiInputLabel-root.Mui-focused': { color: '#fca311' },
              }}
            />
          </div>

          {/* Botões de Ação */}
          <div className="mt-6 flex gap-3">
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={loading ? <CircularProgress size={20} color="inherit"/> : <SearchIcon />}
              onClick={handleSearchClick}
              disabled={loading}
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
              variant="outlined" 
              startIcon={<ClearIcon />}
              onClick={handleClear}
              disabled={loading}
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

            <Button 
              variant="contained" 
              color="success" 
              startIcon={exporting ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <FileDownloadIcon />}
              onClick={handleExport}
              disabled={exporting || !hasSearched}
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
        </CardContent>
      </Card>

      {/* Tabela de Resultados */}
      <Card className="shadow-lg">
        <Box sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={rows}
            columns={columns}
            rowCount={rowCount}
            loading={loading}
            pageSizeOptions={[20, 50, 100]}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            paginationMode="server"
            getRowId={(row) => row.id || Math.random()} // Fallback seguro para ID
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
      </Card>
    </div>
  );
}