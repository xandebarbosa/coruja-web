'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Search, MapPin } from 'lucide-react';
import { toast } from 'react-toastify';

// Importações de Serviços e Tipos
import { radarsService } from '../../services';
import { RadarsDTO } from '../../types/types';
import { PageResponse } from '@/model/response/PageResponse';

// Importações de Componentes
import DetailsTable from '../../components/DetailsTable';
import CustomPagination from '../../components/CustomPagination';
import { Pagination, Stack } from '@mui/material';



// Importação dinâmica do mapa (desativa SSR)
const LocationPickerMap = dynamic(() => import('../../components/LocationPickerMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
      <p className="text-gray-500">Carregando mapa...</p>
    </div>
  ),
});

// =============================================
// Tipos e Interfaces
// =============================================

interface GeoSearchFormData {
  data: string;
  horaInicial: string;
  horaFinal: string;
  latitude: string;
  longitude: string;
  raio: string;
}

const INITIAL_FORM_DATA: GeoSearchFormData = {
  data: new Date().toISOString().split('T')[0],
  horaInicial: '00:00',
  horaFinal: '23:59',
  latitude: '',
  longitude: '',
  raio: '1000',
};

const DEFAULT_PAGE_SIZE = 20;

// =============================================
// Componente Principal
// =============================================

export default function PesquisaGeoPage() {
  // Estados
  const [formData, setFormData] = useState<GeoSearchFormData>(INITIAL_FORM_DATA);
  const [resultado, setResultado] = useState<PageResponse<RadarsDTO> | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0); // API usa 0-based index

  // =============================================
  // Handlers
  // =============================================

  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
    }));
    toast.success(`Localização selecionada: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
  }, []);

  const handleInputChange = useCallback(
    (field: keyof GeoSearchFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    },
    []
  );

  const validateForm = (): boolean => {
    if (!formData.latitude || !formData.longitude) {
      toast.warn('Por favor, selecione um ponto no mapa ou digite as coordenadas.');
      return false;
    }
    if (!formData.data) {
      toast.warn('Por favor, selecione uma data.');
      return false;
    }
    const raioNum = parseFloat(formData.raio);
    if (isNaN(raioNum) || raioNum <= 0) {
      toast.warn('O raio deve ser um número positivo.');
      return false;
    }
    return true;
  };

  const handleSearch = useCallback(
    async (paginaAtual: number = 0) => {
      if (!validateForm()) return;

      setLoading(true);

      try {
        // ✅ Correção: Chamada ao método buscarPorGeolocalizacao do RadarsService
        const data = await radarsService.searchByGeoLocation({
          lat: parseFloat(formData.latitude),
          lon: parseFloat(formData.longitude),
          raio: parseFloat(formData.raio),
          data: formData.data,
          horaInicial: formData.horaInicial,
          horaFinal: formData.horaFinal,
          page: paginaAtual,
          size: DEFAULT_PAGE_SIZE,
        });

        setResultado(data);
        setPage(paginaAtual);

        if (data.totalElements === 0) {
          toast.info('Nenhum veículo encontrado com os filtros selecionados.');
        } else {
          toast.success(`${data.totalElements} veículo(s) encontrado(s)!`);
        }
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
        toast.error('Erro ao buscar dados. Verifique os filtros e tente novamente.');
      } finally {
        setLoading(false);
      }
    },
    [formData]
  );

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    // Material UI usa 1-based index, API usa 0-based. Subtraímos 1.
    handleSearch(value - 1);
  };

  const handleReset = useCallback(() => {
    setFormData(INITIAL_FORM_DATA);
    setResultado(null);
    setPage(0);
    toast.info('Formulário resetado.');
  }, []);

  // =============================================
  // Renderização
  // =============================================

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MapPin className="text-blue-600" />
          Pesquisa por Geolocalização
        </h1>
        <button
          onClick={handleReset}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Limpar Filtros
        </button>
      </div>

      {/* Grid de Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Formulário */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200 h-fit">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch(0);
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Data *</label>
                <input
                  type="date"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                  value={formData.data}
                  onChange={handleInputChange('data')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Hora Inicial *</label>
                <input
                  type="time"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                  value={formData.horaInicial}
                  onChange={handleInputChange('horaInicial')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Hora Final *</label>
                <input
                  type="time"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                  value={formData.horaFinal}
                  onChange={handleInputChange('horaFinal')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Latitude *</label>
                <input
                  type="number"
                  step="any"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-50 p-2 border"
                  value={formData.latitude}
                  onChange={handleInputChange('latitude')}
                  placeholder="-22.12345"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Longitude *</label>
                <input
                  type="number"
                  step="any"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-50 p-2 border"
                  value={formData.longitude}
                  onChange={handleInputChange('longitude')}
                  placeholder="-49.12345"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Raio de Busca (metros) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                  value={formData.raio}
                  onChange={handleInputChange('raio')}
                  placeholder="Ex: 1000"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Pesquisando...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Buscar Veículos
                </>
              )}
            </button>
          </form>
        </div>
        
        {/* Mapa */}
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <h2 className="text-sm font-semibold mb-3 text-gray-500 uppercase tracking-wider">
            Selecione no Mapa
          </h2>
          <LocationPickerMap onLocationSelect={handleLocationSelect} />
          <p className="text-xs text-gray-400 mt-2 text-center">
            Clique no mapa para preencher latitude e longitude automaticamente.
          </p>
        </div>

        
      </div>

      {/* Resultados */}
      {resultado && (
        <div className="bg-white shadow rounded-lg p-4 border border-gray-200 animate-fadeIn">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Resultados Encontrados: <span className="text-blue-600">{resultado.totalElements}</span>
            </h2>
            {resultado.totalElements > 0 && (
              <p className="text-sm text-gray-500">
                Página {page + 1} de {resultado.totalPages ?? 0 }
              </p>
            )}
          </div>

          {resultado.content.length > 0 ? (
            <>
              {/* ✅ Correção 2: Passa apenas o array 'content' para a prop 'dados' */}
              <DetailsTable dados={resultado.content} />
              
              {(resultado.totalPages ?? 0) > 1 &&(
                <div className="mt-6 flex justify-center">
                  {/* ✅ Correção 3: Uso do Pagination padrão do MUI */}
                  <Stack spacing={2}>
                    <Pagination 
                      count={resultado.totalPages} 
                      page={page + 1} 
                      onChange={handlePageChange} 
                      color="primary" 
                      shape="rounded"
                      showFirstButton 
                      showLastButton
                    />
                  </Stack>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <MapPin className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Nenhum veículo encontrado nesta localização.</p>
              <p className="text-sm text-gray-400 mt-2">Tente aumentar o raio de busca.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}