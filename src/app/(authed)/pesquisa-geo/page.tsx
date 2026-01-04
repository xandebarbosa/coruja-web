'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Search, MapPin, Crosshair, Clock, Calendar, RefreshCw } from 'lucide-react';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import { toast } from 'react-toastify';
import { radarsService } from '../../services';
import { GeoSearchFormData, RadarLocationDTO, RadarsDTO } from '../../types/types';
import { Card, CardContent, Box } from '@mui/material';
import { GridPaginationModel } from '@mui/x-data-grid';
import GeoResultsGrid from './componentes/GeoResultsGrid';
import { exportToExcel } from '@/app/components/ExportExcel';
import { log } from 'console';

// Importação dinâmica do mapa (desativa SSR)
const LocationPickerMap = dynamic(() => import('../../components/LocationPickerMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[320px] w-full bg-[#fef3e2] rounded-2xl flex items-center justify-center animate-pulse">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 border-4 border-[#fca311] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#14213d] font-medium">Carregando mapa...</p>
      </div>
    </div>
  ),
});

const INITIAL_FORM_DATA: GeoSearchFormData = {
  data: "",
  horaInicio: '00:00',
  horaFim: '23:59',
  latitude: '',
  longitude: '',
  raio: '15000',
};

const DEFAULT_PAGE_SIZE = 10;

export default function PesquisaGeoPage() {
  // Estados do Formulário
  const [formData, setFormData] = useState<GeoSearchFormData>(INITIAL_FORM_DATA);

  // 2. Estado da Busca Executada (Congela os filtros usados na última busca válida)
  const [executedSearch, setExecutedSearch] = useState<GeoSearchFormData | null>(null);
  
  // Estado da Busca Ativa (snapshot dos filtros que estão sendo usados)
  const [activeParams, setActiveParams] = useState<GeoSearchFormData | null>(null);

  // Estados da Grid
  const [rows, setRows] = useState<RadarsDTO[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Paginação
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  
  const [hasSearched, setHasSearched] = useState(false);
  const [radarLocations, setRadarLocations] = useState<RadarLocationDTO[]>([]);

  // Carregar pontos do mapa ao iniciar
  useEffect(() => {
    const loadRadarsOnMap = async () => {
      try {
        const points = await radarsService.getRadarLocations();
        setRadarLocations(points || []);
      } catch (error) {
        console.error("Erro ao carregar pontos de radar:", error);
      }
    };
    loadRadarsOnMap();
  }, []);

  // Helpers
  const sanitizeValue = (val: string) => val.replace(',', '.').trim();

  const handleInputChange = (field: keyof GeoSearchFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
    }));
    toast.success(`📍 Localização selecionada: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
  }, []);

  // Validação
  const validateForm = (data: GeoSearchFormData): boolean => {
    if (!data.latitude || !data.longitude) {
      toast.warn('⚠️ Selecione um ponto no mapa ou digite as coordenadas.');
      return false;
    }
    if (!data.data) {
      toast.warn('⚠️ Selecione uma data.');
      return false;
    }
    const raioNum = parseFloat(sanitizeValue(data.raio));
    if (isNaN(raioNum) || raioNum <= 0) {
      toast.warn('⚠️ O raio deve ser um número positivo.');
      return false;
    }
    
    // Validação das horas
    if (data.horaInicio && data.horaFim) {
      if (data.horaInicio > data.horaFim) {
        toast.warn('⚠️ A hora inicial não pode ser maior que a hora final.');
        return false;
      }
    }
    
    return true;
  };

  // =========================================================
  // FUNÇÃO DE BUSCA CORRIGIDA
  // =========================================================
  const fetchRadarsData = useCallback(async (params: GeoSearchFormData, page: number, pageSize: number) => {
    setLoading(true);
    
    try {
        // 1. Prepara o Payload
        const payload = {
            latitude: Number(params.latitude.replace(',', '.')),
            longitude: Number(params.longitude.replace(',', '.')),
            raio: Number(params.raio),
            data: params.data,
            horaInicio: params.horaInicio,
            horaFim: params.horaFim,
            page: page,      // O backend espera índice 0 (conforme seu JSON "number": 0)
            size: pageSize,   // O backend espera "size": 10            
        };

        console.log("🚀 Enviando requisição:", payload);

        // 2. Chamada ao Serviço
        // Importante: Verifique se o seu service retorna o objeto completo ou apenas o data do axios
        const response = await radarsService.searchByGeoLocation(payload);

        console.log("📦 Resposta recebida:", response);

        // 3. Mapeamento CORRIGIDO baseado no seu JSON
        // O array de dados está em 'content'
        const listaVeiculos = response.content || [];

        // --- CORREÇÃO DE ORDENAÇÃO (Menor Horário -> Maior Horário) ---
        // Ordenamos o array recebido antes de exibir na tela
        listaVeiculos.sort((a: RadarsDTO, b: RadarsDTO) => {
            // Combina Data + Hora para garantir ordenação correta
            const timeA = `${a.data}T${a.hora}`;
            const timeB = `${b.data}T${b.hora}`;
            return timeA.localeCompare(timeB);
        });
        
        // O segredo está aqui: ler o total de dentro de 'page'
        // Se response.page existir, pega totalElements, senão 0.
        const totalRegistros = response.page?.totalElements || 0;

        // 4. Atualiza os estados
        setRows(listaVeiculos);
        setRowCount(totalRegistros);

        // 5. Feedback visual (apenas na busca inicial)
        if (page === 0) {
             if (listaVeiculos.length === 0) {
                 toast.info('Nenhum registro encontrado.');
             } else {
                 toast.success(`✅ ${totalRegistros} registros encontrados.`);
             }
        }

    } catch (error) {
        console.error("❌ Erro na busca:", error);
        toast.error('Erro ao buscar dados.');
        setRows([]);
        setRowCount(0);
    } finally {
        setLoading(false);
    }
  }, []);

  // =========================================================
  // EFFECT PARA PAGINAÇÃO - CORRIGIDO
  // =========================================================
  useEffect(() => {
    // Só busca se tiver parâmetros ativos
    if (activeParams) {
      console.log('🔄 Mudança detectada - Buscando página:', paginationModel.page);
      fetchRadarsData(activeParams, paginationModel.page, paginationModel.pageSize);
    }
  }, [activeParams, paginationModel, fetchRadarsData]);

  // =========================================================
  // HANDLER DO BOTÃO BUSCAR - CORRIGIDO
  // =========================================================
  const handleSearchClick = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm(formData)) return;

    console.log('🔍 Nova busca iniciada com filtros:', formData);

    // 1. Reseta a página para 0 (importante!)
    setPaginationModel(prev => ({ ...prev, page: 0 }));

    // 2. Define os parâmetros ativos (dispara o useEffect)
    setActiveParams({ ...formData });
    
    // 3. Marca que houve busca
    setHasSearched(true);
  };

  // =========================================================
  // HANDLER DE EXPORTAÇÃO - CORRIGIDO
  // =========================================================
  // Handler de Exportação Refatorado
  const handleExport = useCallback(async () => {
    // 1. Usa activeParams para consistência (o que está na tela), 
    // ou formData se o usuário quiser exportar sem ter clicado em "Buscar" antes (fallback)
    const paramsToUse = activeParams || formData;

    // Validação básica antes de chamar o serviço
    if (!paramsToUse.latitude || !paramsToUse.longitude || !paramsToUse.raio) {
      toast.warn('⚠️ Parâmetros de localização incompletos para exportação.');
      return;
    }

    setExporting(true);
    try {
      // Prepara os parâmetros (Sanitização)
      const latFinal = Number(parseFloat(sanitizeValue(paramsToUse.latitude)).toFixed(6));
      const lonFinal = Number(parseFloat(sanitizeValue(paramsToUse.longitude)).toFixed(6));
      const raioSanitized = parseFloat(sanitizeValue(paramsToUse.raio));

      const paramsExport = {
        latitude: latFinal,
        longitude: lonFinal,
        raio: raioSanitized,
        data: paramsToUse.data,
        horaInicio: paramsToUse.horaInicio,
        horaFim: paramsToUse.horaFim,
      };

      // 2. Busca TODOS os dados para exportação
      // NOTA: Verifique se o seu 'radarsService' possui um método que retorna a LISTA de dados (Array)
      // para Geo, similar ao 'searchAllByLocalForExport'.
      // Abaixo estou chamando de 'searchAllByGeoLocationForExport' como sugestão.
      const allData = await radarsService.searchAllByGeoLocationForExport(paramsExport);

      // 3. Validação se retornou dados
      if (!allData || allData.length === 0) {
        toast.warn("Nenhum registro encontrado para exportar com os filtros selecionados.");
        return;
      }

      // 4. Gera o Excel no Frontend (Padrão do ConsultaLocal)
      exportToExcel(allData, "Relatorio_Geolocalizacao");
      toast.success("Relatório exportado com sucesso!");

    } catch (error) {
      console.error("Erro na exportação:", error);
      toast.error('❌ Erro ao exportar o relatório. Tente novamente.');
    } finally {
      setExporting(false);
    }
  }, [activeParams, formData]); // Adicionado formData nas dependências para o fallback funcionar

  // =========================================================
  // HANDLER DE RESET
  // =========================================================
  const handleReset = () => {
    setFormData(INITIAL_FORM_DATA);
    setActiveParams(null);
    setRows([]);
    setRowCount(0);
    setHasSearched(false);
    setPaginationModel({ page: 0, pageSize: DEFAULT_PAGE_SIZE });
    toast.info('🔄 Filtros limpos.');
  };

  // FUNÇÃO AUXILIAR para preparar os dados para o mapa
  const getSearchLocationForMap = () => {
    // Só mostra o marcador de busca se tivermos parâmetros ATIVOS (busca realizada)
    if (!activeParams?.latitude || !activeParams?.longitude) return null;

    const lat = parseFloat(activeParams.latitude.replace(',', '.'));
    const lng = parseFloat(activeParams.longitude.replace(',', '.'));
    
    if (isNaN(lat) || isNaN(lng)) return null;

    return { lat, lng };
  };

  const getSearchRadiusForMap = () => {
    if (!activeParams?.raio) return 0;
    return parseFloat(activeParams.raio.replace(',', '.'));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-[#fef3e2]/30 to-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div>
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-[#fca311] to-[#ff8800] p-4 rounded-2xl shadow-lg shadow-[#fca311]/30">
                <MapPin className="text-white" size={32} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-[#14213d] tracking-tight">
                  Pesquisa por Geolocalização
                </h1>
                <p className="text-gray-600 mt-1">
                  Localize veículos em áreas específicas com precisão
                </p>
              </div>
            </div>
            
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-6 py-3 text-[#14213d] font-semibold border-2 border-[#14213d] rounded-xl hover:bg-[#14213d] hover:text-white transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              <RefreshCw size={18} />
              Limpar Filtros
            </button>
          </div>
        </div>

        {/* Grid Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Formulário */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-6">
                <Search className="text-[#fca311]" size={24} />
                <h2 className="text-xl font-bold text-[#14213d]">Filtros de Busca</h2>
              </div>
              
              <form onSubmit={handleSearchClick} className="space-y-4">
                {/* Data */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-[#14213d]">
                    <Calendar size={16} className="text-[#fca311]" />
                    Data *
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full px-4 py-3 bg-[#fef3e2] border-2 border-transparent rounded-xl focus:border-[#fca311] focus:bg-white focus:outline-none transition-all duration-300 text-[#14213d] font-medium"
                    value={formData.data}
                    onChange={handleInputChange('data')}
                  />
                </div>

                {/* Horas */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-[#14213d]">
                      <Clock size={16} className="text-[#fca311]" />
                      Hora Inicial *
                    </label>
                    <input
                      type="time"
                      required
                      className="w-full px-4 py-3 bg-[#fef3e2] border-2 border-transparent rounded-xl focus:border-[#fca311] focus:bg-white focus:outline-none transition-all duration-300 text-[#14213d] font-medium"
                      value={formData.horaInicio}
                      onChange={handleInputChange('horaInicio')}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-[#14213d]">
                      <Clock size={16} className="text-[#fca311]" />
                      Hora Final *
                    </label>
                    <input
                      type="time"
                      required
                      className="w-full px-4 py-3 bg-[#fef3e2] border-2 border-transparent rounded-xl focus:border-[#fca311] focus:bg-white focus:outline-none transition-all duration-300 text-[#14213d] font-medium"
                      value={formData.horaFim}
                      onChange={handleInputChange('horaFim')}
                    />
                  </div>
                </div>

                {/* Coordenadas */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-[#14213d]">
                      <Crosshair size={16} className="text-[#fca311]" />
                      Latitude *
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      required
                      className="w-full px-4 py-3 bg-[#fef3e2] border-2 border-transparent rounded-xl focus:border-[#fca311] focus:bg-white focus:outline-none transition-all duration-300 text-[#14213d] font-medium"
                      value={formData.latitude}
                      onChange={handleInputChange('latitude')}
                      placeholder="-22.12345"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-[#14213d]">
                      <Crosshair size={16} className="text-[#fca311]" />
                      Longitude *
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      required
                      className="w-full px-4 py-3 bg-[#fef3e2] border-2 border-transparent rounded-xl focus:border-[#fca311] focus:bg-white focus:outline-none transition-all duration-300 text-[#14213d] font-medium"
                      value={formData.longitude}
                      onChange={handleInputChange('longitude')}
                      placeholder="-49.12345"
                    />
                  </div>
                </div>

                {/* Raio */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-[#14213d]">
                    <MapPin size={16} className="text-[#fca311]" />
                    Raio de Busca (metros) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="1"
                      className="w-full px-4 py-3 bg-[#fef3e2] border-2 border-transparent rounded-xl focus:border-[#fca311] focus:bg-white focus:outline-none transition-all duration-300 text-[#14213d] font-medium pr-20"
                      value={formData.raio}
                      onChange={handleInputChange('raio')}
                      placeholder="Ex: 15000"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
                      metros
                    </span>
                  </div>
                </div>

                {/* Botão de Busca */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6 bg-gradient-to-r from-[#fca311] to-[#ff8800] text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-[#fca311]/30 hover:shadow-xl hover:shadow-[#fca311]/40 hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                      Pesquisando...
                    </>
                  ) : (
                    <>
                      <Search size={20} />
                      Buscar Veículos
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Mapa */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="text-[#fca311]" size={24} />
                <h2 className="text-xl font-bold text-[#14213d]">Selecione no Mapa</h2>
              </div>
              
              <div className="rounded-2xl overflow-hidden">
                <LocationPickerMap 
                  onLocationSelect={handleLocationSelect} 
                  radarPoints={radarLocations}  // <--- ESSENCIAL PARA OS PONTOS APARECEREM
                  searchLocation={getSearchLocationForMap()}
                  searchRadius={getSearchRadiusForMap()}
                />
              </div>
              
              <p className="text-center text-sm text-gray-500 mt-4 flex items-center justify-center gap-2">
                <span className="text-[#fca311]">📍</span>
                Clique no mapa para coordenadas. Marcadores azuis indicam radares.
              </p>
            </div>
          </div>
        </div>

        {/* Resultados */}
        <Card className="shadow-lg overflow-hidden">
          <CardContent className="p-0">
            <GeoResultsGrid
              rows={rows}
              rowCount={rowCount}
              loading={loading}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              onExportCSV={handleExport}
              hasSearched={hasSearched}
              isExporting={exporting}
            />
          </CardContent>
        </Card>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}