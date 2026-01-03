'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Search, MapPin, TrendingUp, Crosshair, Clock, Calendar, RefreshCw } from 'lucide-react';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import { toast } from 'react-toastify';

// Importações de Serviços e Tipos
import { radarsService } from '../../services';
import { RadarLocationDTO, RadarsDTO } from '../../types/types';
import { PageResponse } from '@/model/response/PageResponse';

// Importações de Componentes
import DetailsTable from '../../components/DetailsTable';
import CustomPagination from '../../components/CustomPagination';
import { Box, Card, CardContent, Chip, Pagination, Stack } from '@mui/material';
import { DataGrid, GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import CustomNoRowsOverlay from './componentes/CustomNoRowsOverlay';
import { set } from 'react-hook-form';
import GeoResultsGrid from './componentes/GeoResultsGrid';



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

// =============================================
// Tipos e Interfaces
// =============================================

interface GeoSearchFormData {
  data: string;
  horaInicio: string;
  horaFim: string;
  latitude: string;
  longitude: string;
  raio: string;
}

const INITIAL_FORM_DATA: GeoSearchFormData = {
  data: "",//new Date().toISOString().split('T')[0],
  horaInicio: '00:00',
  horaFim: '23:59',
  latitude: '',
  longitude: '',
  raio: '15000',
};

const DEFAULT_PAGE_SIZE = 10;


export default function PesquisaGeoPage() {
  // 1. Estado do Formulário (O que o usuário digita)
  const [formData, setFormData] = useState<GeoSearchFormData>(INITIAL_FORM_DATA);

  // 2. Estado da Busca Ativa (O que está valendo na Grid)
  // Isso separa o que está digitado do que foi realmente pesquisado
  const [activeParams, setActiveParams] = useState<GeoSearchFormData | null>(null);

  // 3. Estados da Grid
  const [rows, setRows] = useState<RadarsDTO[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // 4. Paginação
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  // Novo estado para controlar se já houve busca
  const [hasSearched, setHasSearched] = useState(false);
  // --- NOVO: Estado para armazenar os pontos de radar no mapa ---
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
    return true;
  };

  // =========================================================
  // LÓGICA DE BUSCA E PAGINAÇÃO REFATORADA
  // =========================================================

  // Função pura de busca que recebe parâmetros
  const fetchRadarsData = async (params: GeoSearchFormData, page: number, size: number) => {
    setLoading(true);
    try {
      const latFinal = Number(parseFloat(sanitizeValue(params.latitude)).toFixed(6));
      const lonFinal = Number(parseFloat(sanitizeValue(params.longitude)).toFixed(6));
      const raioSanitized = parseFloat(sanitizeValue(params.raio));

      // Chama o serviço
      const data = await radarsService.searchByGeoLocation({
        latitude: latFinal,
        longitude: lonFinal,
        raio: raioSanitized,
        data: params.data,
        horaInicio: params.horaInicio,
        horaFim: params.horaFim,
        page: page, // Backend Spring geralmente é 0-based, igual MUI DataGrid
        size: size,
      });

      console.log("Resposta da API:", data);

      // Tratamento de vazios e atualização de estado
      if (data && data.content) {
          setRows(data.content);
          setRowCount(data.totalElements);
          
          if (page === 0) {
             if (data.totalElements === 0) toast.info('ℹ️ Nenhum veículo encontrado.');
             else toast.success(`✅ ${data.totalElements} registro(s) encontrado(s)!`);
          }
      } else {
          // Fallback caso a API retorne algo inesperado
          setRows([]);
          setRowCount(0);
          if (page === 0) toast.info('ℹ️ Nenhum veículo encontrado (Resposta vazia).');
      }

    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast.error('❌ Erro ao buscar dados. Verifique o console.');
      setRows([]);
      setRowCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Efeito principal: Dispara a busca quando activeParams ou paginação mudam
  useEffect(() => {
    // Só busca se tiver parâmetros ativos (usuário clicou em buscar)
    if (activeParams) {
      fetchRadarsData(activeParams, paginationModel.page, paginationModel.pageSize);
    }
  }, [activeParams, paginationModel]);

  // Handler do Botão BUSCAR
  const handleSearchClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(formData)) return;

    // 1. Reseta a página para 0 sempre que uma NOVA busca é feita (importante!)
    setPaginationModel(prev => ({ ...prev, page: 0 }));

    // 2. Define os parâmetros ativos. Isso vai disparar o useEffect acima.
    // Usamos o spread para garantir uma nova referência de objeto e disparar o efeito
    setActiveParams({ ...formData });
  };

  // Handler de Exportação Refatorado
  const handleExport = useCallback(async () => {
    // Usa activeParams para garantir que exportamos o que está na tela, não o que está no form
    if (!activeParams) {
      toast.warn('⚠️ Realize uma busca antes de exportar.');
      return;
    }

    setExporting(true);
    try {
      const latFinal = Number(parseFloat(sanitizeValue(activeParams.latitude)).toFixed(6));
      const lonFinal = Number(parseFloat(sanitizeValue(activeParams.longitude)).toFixed(6));
      const raioSanitized = parseFloat(sanitizeValue(activeParams.raio));

      const paramsExport = {
        latitude: latFinal,
        longitude: lonFinal,
        raio: raioSanitized,
        data: activeParams.data,
        horaInicio: activeParams.horaInicio,
        horaFim: activeParams.horaFim,
      };

      await radarsService.searchAllByLocalForExport(paramsExport);
      toast.success("Arquivo gerado com sucesso! Verifique seus downloads.");
    } catch (error) {
      console.error(error);
      toast.error('❌ Erro ao exportar. Tente novamente.');
    } finally {
      setExporting(false);
    }
  }, [activeParams]);

  const handleReset = () => {
    setFormData(INITIAL_FORM_DATA);
    setActiveParams(null); // Desativa a busca
    setRows([]);
    setRowCount(0);
    setPaginationModel({ page: 0, pageSize: DEFAULT_PAGE_SIZE });
    toast.info('🔄 Filtros limpos.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-[#fef3e2]/30 to-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div >
        
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
                <div className="grid grid-cols-3 gap-4">
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
                <LocationPickerMap onLocationSelect={handleLocationSelect} radarPoints={radarLocations} />
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
            hasSearched={!!activeParams} // Converte objeto para boolean (null = false)
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