'use client';

import { useState, useEffect, useCallback } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { radarsService } from '../../services'
import { LocalSearchParams, RadarsDTO } from '../../types/types';
import CustomPagination from '../../components/CustomPagination';
import { Box, Button, Card, CardContent, Chip, CircularProgress, FormControl, IconButton, InputLabel, Menu, MenuItem, Select, SelectChangeEvent, TextField, Tooltip, Typography } from '@mui/material';
import { exportToExcel } from '../../components/ExportExcel';
import { toast } from 'react-toastify';
import { SearchIcon } from 'lucide-react';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import FilterListIcon from '@mui/icons-material/FilterList';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ClearIcon from '@mui/icons-material/Clear';
import { RodoviaDTO } from '@/app/services/radars';
import { InfoOutlined } from '@mui/icons-material';
import { exportToExcelDetram } from './componentes/ExportExcelDetran';

// =============================================
// Tipos e Interfaces
// =============================================

interface FilterState {
  concessionaria: string;
  rodovia: string; // Nome da rodovia (para enviar ao back)
  rodoviaId: number | ''; // ID da rodovia (para buscar KMs)
  km: string;
  sentido: string;  
  data: string;
  horaInicial: string;
  horaFinal: string;
}

interface OptionsState {
  rodovias: RodoviaDTO[]; // Agora guarda objetos {id, nome}
  kms: string[];
  sentidos: string[];  
}

const INITIAL_FILTERS: FilterState = {
  concessionaria: '',
  rodovia: '',
  rodoviaId: '',
  km: '',
  sentido: '',  
  data: new Date().toISOString().split('T')[0], // Data de hoje como padrão
  horaInicial: '',
  horaFinal: '',
};

const INITIAL_OPTIONS: OptionsState = {
  rodovias: [],
  kms: [],
  sentidos: [],
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
    field: 'marcaModelo',
    headerName: 'Marca/Modelo',
    width: 200,
    headerAlign: 'center',
    align: 'center',
    renderCell: (params) => (
        <span style={{ fontWeight: 500, color: '#4b5563' }}>
            {params.value || 'Carregando...'}
        </span>
    )
  },
  {
    field: 'cor',
    headerName: 'Cor',
    width: 130,
    headerAlign: 'center',
    align: 'center',
    renderCell: (params) => (
        <span style={{ fontWeight: 500, color: '#4b5563' }}>
            {params.value || 'Carregando...'}
        </span>
    )
  },
  {
    field: 'municipio',
    headerName: 'Município',
    width: 180,
    headerAlign: 'center',
    align: 'center',
    renderCell: (params) => (
        <span style={{ fontWeight: 500, color: '#4b5563' }}>
            {params.value || 'Carregando...'}
        </span>
    )
  },
  { 
    field: 'rodovia', 
    headerName: 'Rodovia / Local', 
    width: 340,
    headerAlign: 'center',
    align: 'center',
    renderCell: (params) => (
      <span style={{ fontWeight: 600, color: '#14213d' }}>
        {params.value}
      </span>
    )
  },
  {
    field: 'praca',
    headerName: 'Praça',
    width: 240,
    headerAlign: 'center',
    align: 'center',
  },
  { 
    field: 'km', 
    headerName: 'KM', 
    width: 150,
    headerAlign: 'center',
    align: 'center',
  },
  { 
    field: 'sentido', 
    headerName: 'Sentido', 
    width: 180,
    headerAlign: 'center',
    align: 'center',
  },
];

export default function PesquisaLocalDetra() {
 // Estados
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [activeFilters, setActiveFilters] = useState<FilterState | null>(null);
  const [options, setOptions] = useState<OptionsState>(INITIAL_OPTIONS);
  
  const [loading, setLoading] = useState(false);
  const [loadingRodovias, setLoadingRodovias] = useState(false);  
  const [loadingKms, setLoadingKms] = useState(false);
  
  const [rows, setRows] = useState<RadarsDTO[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });
  const [exporting, setExporting] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // 1. Carrega Rodovias e Sentidos
  useEffect(() => {
  const fetchRodovias = async () => {
    // Sentidos estáticos
      const sentidos = await radarsService.getSentidos();
      setOptions(prev => ({ ...prev, sentidos }));
    // Se não houver concessionária, limpa as opções
    if (!filters.concessionaria) {
      setOptions(prev => ({ ...prev, rodovias: [] }));
      return;
    }

    setLoadingRodovias(true);
    try {
      // Busca rodovias específicas da concessionária selecionada
      const data = await radarsService.getRodovias(filters.concessionaria);
      const sorted = [...data].sort((a, b) => a.nome.localeCompare(b.nome));
      setOptions(prev => ({ ...prev, rodovias: sorted }));
      
      // Reseta a rodovia selecionada anteriormente para evitar conflitos
      setFilters(prev => ({ ...prev, rodovia: '', rodoviaId: '' }));
    } catch (err) {
      toast.error("Erro ao carregar rodovias da " + filters.concessionaria);
    } finally {
      setLoadingRodovias(false);
    }
  };

  fetchRodovias();
}, [filters.concessionaria]); // Dependência crucial para a separação

  // 2. Carrega KMs quando a Rodovia muda
  useEffect(() => {
    const fetchKms = async () => {
      if (!filters.rodoviaId || !filters.concessionaria) {
        setOptions(prev => ({ ...prev, kms: [] }));
        return;
      }
      
      setLoadingKms(true);
      try {
        // Busca KMs usando o ID da rodovia
        const kmsData = await radarsService.getKmsByRodoviaId(Number(filters.rodoviaId), filters.concessionaria);
        console.log("KmsDAta===> ",kmsData);
        
        setOptions(prev => ({ ...prev, kms: kmsData.map(k => k.valor) }));
      } catch (error) {
        console.error('Erro ao carregar KMs:', error);
        toast.error("Erro ao carregar KMs.");
      } finally {
        setLoadingKms(false);
      }
    };

    fetchKms();
  }, [filters.rodoviaId, filters.concessionaria]);

  
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
        concessionarias: filtersToUse.concessionaria || undefined,
        rodovia: filtersToUse.rodovia || undefined, 
        km: filtersToUse.km || undefined,
        sentido: filtersToUse.sentido || undefined,
        // O campo 'rodovia' agora leva o nome da Rodovia ou da Praça
        // rodovia: filtersToUse.rodovia || undefined, 
        // km: filtersToUse.km || undefined,
      };      

      console.log('📤 Parâmetros enviados para busca:', params);

      const response = await radarsService.searchByLocalWithDetran(params);
      
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
        concessionarias: filtersToExport.concessionaria,
        data: filtersToExport.data,
        horaInicial: filtersToExport.horaInicial,
        horaFinal: filtersToExport.horaFinal,
        rodovia: filtersToExport.rodovia,
        km: filtersToExport.km,
        sentido: filtersToExport.sentido,        
        page: 0,
        pageSize: 1000 // Tamanho grande para exportação
      };

      const data = await radarsService.exportAllWithDetran(params);
      if (data.length > 0) {
        exportToExcelDetram(data, `Relatorio_Radares_${filtersToExport.concessionaria}`);
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
                Consulta por Local e Concessionária com Dados do Detran
              </Typography>
              <Typography variant="body2" className="text-gray-300">
                Filtros de localização enriquecidos com Marca, Modelo e Cor (Base Nacional)
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
                <MenuItem value="monitorasp">MonitoraSP</MenuItem>
              </Select>
            </FormControl>       

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
                  <InputLabel>Local</InputLabel>
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

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1}}>
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

                {/* Tootip de informação */}
                <Tooltip
                  arrow
                  placement='top-end'
                  title={
                    <Box sx={{ p: 0.5, maxWidth: 280 }}>
                      <Typography variant='subtitle2' sx={{ fontWeight: 700, mb: 1, borderBottom: '1px solid rgba(255,255,255,0.2)', pb: 0.5}}>
                        Referências
                      </Typography>
                      <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', lineHeight: '1.6' }}>
                        <li>SP 270 KM 639 - Caiuá</li>
                        <li>SP 270 KM 590 - Presidente Bernardes</li>
                        <li>SP 270 KM 541 - Regente Feijó</li>
                        <li>SP 270 KM 512 - Rancharia</li>
                        <li>SP 270 KM 454 - Assis</li>
                        <li>SP 270 KM 413 - Palmital</li>
                        <li>SP 327 KM 14 - Ourinhos</li>
                        <li>SP 225 KM 300 - Sta Cruz do Rio Pardo</li>
                        <li>SP 225 KM 251 - Piratininga</li>
                      </ul>
                    </Box>
                  }
                >
                  <IconButton
                    size='small'
                    sx={{ color: '#fca311', bgcolor: 'rgba(252, 163, 17, 0.08)', '&:hover': { bgcolor: 'rgba(252, 163, 17, 0.15)'}
                  }}
                  >
                    <InfoOutlined fontSize='small'  />
                  </IconButton>
                </Tooltip>
                </Box>      
                

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