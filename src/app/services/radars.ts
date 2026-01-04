import { searchByLocal, searchByPlaca } from './index';
import { PageResponse } from "@/model/response/PageResponse";
import { GeoSearchParams, GeoSearchResponse, LocalSearchParams, RadarLocationDTO, RadarsDTO } from "../types/types";
import api from "./client";

// Interfaces locais para parâmetros específicos deste serviço
export interface FilterOptions {
  rodovias: string[];
  pracas: string[];
  kms: string[];
  sentidos: string[];
}

export interface RadarEvent {
  concessionaria: string;
  data: string;
  hora: string;
  placa: string;
  rodovia: string;
  praca: string;
  sentido: string;
  km: string;
}

class RadarsService {
  
  /**
   * Busca os últimos radares processados (Dashboard)
   */
  async getLatestRadars(): Promise<RadarEvent[]> {
    // Chamada final: /api/radares/ultimos-processados
    const { data } = await api.get<RadarEvent[]>('/radares/ultimos-processados');
    return data;
  }

  /**
   * Busca radares com filtros avançados
   */
  async getRadarsWithFilters(params: any): Promise<PageResponse<RadarsDTO>> {
    const { data } = await api.get<PageResponse<RadarsDTO>>('/radares/filtros', { params });
    return data;
  }

  /**
   * Busca radares por geolocalização (Mapa)
   */
  // async searchByGeoLocation(params: GeoSearchParams): Promise<PageResponse<RadarsDTO>> {
  //  const { data } = await api.get<PageResponse<RadarsDTO>>('/radares/geo-search', {
  //     params: {
  //       latitude: params.latitude,
  //       longitude: params.longitude,
  //       raio: params.raio,
  //       data: params.data,
  //       horaInicio: params.horaInicio,
  //       horaFim: params.horaFim,
  //       page: params.page ?? 0,
  //       size: params.size ?? 20,
  //     }
  //   });

  //   console.log("Busca por Geolocalização ==> ", data);
    
  //   return data;
  // }
  
  async searchByGeoLocation(params: GeoSearchParams): Promise<GeoSearchResponse> {
  console.group('📡 [Service] Nova Busca por Geolocalização');
  console.log('📥 Parâmetros brutos recebidos:', params);

  const paramsEnviados = {
    latitude: params.latitude,
    longitude: params.longitude,
    raio: params.raio,
    data: params.data,
    horaInicio: params.horaInicio,
    horaFim: params.horaFim,
    page: params.page ?? 0,
    size: params.size ?? 20,
  };

  console.log('🚀 Payload enviado para API (/radares/geo-search):', paramsEnviados);

  try {
    const { data } = await api.get<GeoSearchResponse>('/radares/geo-search', {
      params: paramsEnviados
    });

    console.log('📤 Resposta recebida da API:', data);
    console.log('✅ [Sucesso] Total de elementos:', data.page?.totalElements);
    console.log('✅ [Sucesso] Página atual:', data.page?.number);
    console.groupEnd();
    
    return data;

  } catch (error: any) {
    console.error('❌ [Erro] Falha na requisição de geolocalização');
    
    if (error.response) {
      console.error('🔴 Status Code:', error.response.status);
      console.error('🔴 Dados do Erro:', error.response.data);
      console.error('🔴 Headers:', error.response.headers);
    } else if (error.request) {
      console.error('⚠️ Sem resposta do servidor:', error.request);
    } else {
      console.error('⚠️ Erro de configuração:', error.message);
    }
    
    console.groupEnd();
    throw error;
  }
}

/**
   * NOVO: Busca TODOS os dados por geolocalização para Exportação Excel
   * Chama o endpoint específico /radares/geo-exportar
   */
  async searchAllByGeoLocationForExport(params: Omit<GeoSearchParams, 'page' | 'size'>): Promise<RadarsDTO[]> {
    console.group('📡 [Service] Exportação Excel por Geolocalização');
    console.log('📥 Parâmetros Export:', params);

    const paramsEnviados = {
        latitude: params.latitude,
        longitude: params.longitude,
        raio: params.raio,
        data: params.data,
        horaInicio: params.horaInicio,
        horaFim: params.horaFim
    };

    try {
      // Nota: O endpoint /radares/geo-exportar retorna uma List<RadarDTO> direta, não paginada
      const { data } = await api.get<RadarsDTO[]>('/radares/geo-exportar', {
        params: paramsEnviados
      });

      console.log(`✅ [Sucesso] ${data?.length || 0} registros recuperados para exportação.`);
      console.groupEnd();
      
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('❌ [Erro] Falha na exportação Geo:', error);
      console.groupEnd();
      return [];
    }
  }

  /**
   * Busca opções de filtro para uma concessionária (Cacheado no BFF)
   */
  async getFilterOptions(concessionaria: string): Promise<FilterOptions> {
    try {
      const { data } = await api.get<FilterOptions>(
        `/radares/concessionaria/${concessionaria}/opcoes-filtro`,
        { timeout: 45000 } // Timeout maior para carga inicial
      );
      return data;
    } catch (error: any) {
      if (error.code === 'ECONNABORTED') {
        console.warn(`⚠️ Timeout filtros (${concessionaria}). Retornando vazio.`);
        return { rodovias: [], pracas: [], kms: [], sentidos: [] };
      }
      throw error;
    }
  }

  async getKmsByRodovia(concessionaria: string, rodovia: string): Promise<string[]> {
    if (!rodovia) return [];
    const { data } = await api.get<string[]>(`/radares/concessionaria/${concessionaria}/kms-por-rodovia`, {
      params: { rodovia }
    });
    return data;
  }

  async searchAllByLocalForExport(params: any): Promise<RadarsDTO[]> {
    const paramsExport = { ...params, page: 0, size: 100000 };
    const { data } = await api.get<any>('/radares/exportar', { params: paramsExport });
    
    if (data && Array.isArray(data.content)) {
        return data.content;
    } else if (Array.isArray(data)) {
        return data;
    }
    return [];
  }

  async searchByPlacaExport(params: any): Promise<RadarsDTO[]> {
    // Força size grande para pegar tudo, já que o endpoint é paginado
    const paramsExport = { ...params, page: 0, size: 100000 };

    // CORREÇÃO: Usamos <any> aqui para o TypeScript não reclamar ao acessar .content
    const { data } = await api.get<any>('/radares/exportar', { params: paramsExport });
    
    // Tratamento de robustez: Extrai .content se for uma Page, ou retorna o próprio array
    if (data && Array.isArray(data.content)) {
        return data.content;
    } else if (Array.isArray(data)) {
        return data;
    }
    return []; // Retorna array vazio em caso de erro ou resposta inesperada
  }
  
  // Mantido para compatibilidade, se ainda usado
  async searchByPlaca(placa: string, page: number, pageSize: number) {
    const { data } = await api.get(`/radares/placa/${placa}`, {
      params: { page, size: pageSize }
    });
    return data;
  }

  async searchByLocal(params: LocalSearchParams) {
    const { concessionaria, page, pageSize, ...filters } = params;

    const { data } = await api.get(`/radares/concessionaria/${concessionaria}/filtros`, {
      params: {
        page,
        size: pageSize,
        ...filters
      }
    });

    console.log("Dados retornados da busca por local: ", data);
    return data;
  }

  async getRadarLocations(): Promise<RadarLocationDTO[]> {
    const response = await api.get<RadarLocationDTO[]>('/radares/all-locations');
    return response.data;
  }
}

export const radarsService = new RadarsService();