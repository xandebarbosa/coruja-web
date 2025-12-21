import { LocalSearchParams, RadarsDTO } from "../types/types"; // Supondo que você moveu suas interfaces para cá
import { PageResponse } from "@/model/response/PageResponse";
import api from "./client";

interface RadarEvent {
  concessionaria: string;
  data: string;
  hora: string;
  placa: string;
  rodovia: string;
  praca: string;
  sentido: string;
  km: string;
}

export interface FilterOptions {
  rodovias: string[];
  pracas: string[];
  kms: string[];
  sentidos: string[];
}

export interface RadarFilters {
  concessionaria?: string[];
  placa?: string;
  praca?: string;
  rodovia?: string;
  km?: string;
  sentido?: string;
  data?: string;
  horaInicial?: string;
  horaFinal?: string;
  page?: number;
  size?: number;
}

export interface GeoSearchParams {
  lat: number;
  lon: number;
  raio: number;
  data: string;
  horaInicial: string;
  horaFinal: string;
  page?: number;
  size?: number;
}

class RadarsService {
  /**
   * Busca radares por placa com paginação
   */
  async searchByPlaca(placa: string, page: number, pageSize: number) {
    const { data } = await api.get(`/radares/placa/${placa}`, {
      params: { page, size: pageSize }
    });
    return data;
  }

  /**
   * Busca radares por local com filtros
   */
  async searchByLocal(params: LocalSearchParams) {
    const { concessionaria, page, pageSize, ...filters } = params;
    
    const { data } = await api.get(`/radares/concessionaria/${concessionaria}/filtros`, {
      params: {
        page,
        size: pageSize,
        ...filters
      }
    });
    return data;
  }

  /**
   * Busca opções de filtro para uma concessionária
   */
  async getFilterOptions(concessionaria: string): Promise<FilterOptions> {
    try {
      console.log(`⚙️ Buscando opções de filtro: ${concessionaria}`);
      
      const { data } = await api.get<FilterOptions>(
        `/radares/concessionaria/${concessionaria}/opcoes-filtro`,
        { timeout: 45000 }
      );

      if (data.rodovias.length === 0 && data.pracas.length === 0) {
        console.warn("⚠️ Recebido objeto vazio. Possível fallback do Circuit Breaker.");
      } else {
        console.log('✅ Filtros recebidos com sucesso!');
      }
      
      return data;
    } catch (error: any) {
      if (error.code === 'ECONNABORTED') {
        console.warn(`⚠️ Timeout nos filtros da ${concessionaria}.`);
        return { rodovias: [], pracas: [], kms: [], sentidos: [] };
      }
      console.error('❌ Erro ao buscar opções de filtro:', error.message);
      throw error;
    }
  }

  /**
   * Busca KMs por rodovia
   */
  async getKmsByRodovia(concessionaria: string, rodovia: string): Promise<string[]> {
    if (!concessionaria || !rodovia) return [];

    const { data } = await api.get(`/radares/concessionaria/${concessionaria}/kms-por-rodovia`, {
      params: { rodovia }
    });
    return data;
  }

  /**
   * Busca os últimos radares processados
   */
  async getLatestRadars(): Promise<RadarEvent[]> {
    try {
      console.log('📡 Buscando últimos radares...');
      const { data } = await api.get<RadarEvent[]>('/radares/ultimos-processados');
      console.log('✅ Radares recebidos:', data.length);
      return data;
    } catch (error: any) {
      console.error('❌ Erro ao buscar últimos radares:', error.message);
      throw error;
    }
  }

  /**
   * Busca radares com filtros e paginação
   */
  async getRadarsWithFilters(params: RadarFilters) {
    try {
      console.log('🔍 Buscando radares com filtros:', params);
      const { data } = await api.get('/radares/filtros', { params });
      console.log('✅ Resultados recebidos');
      return data;
    } catch (error: any) {
      console.error('❌ Erro ao buscar radares:', error.message);
      throw error;
    }
  }

  /**
   * Exporta radares por local (sem paginação)
   */
  async searchAllByLocalForExport(params: Omit<LocalSearchParams, 'page' | 'pageSize'>) {
    const { data } = await api.get('/radares/exportar', { params });
    return data;
  }

  /**
   * Busca radares por geolocalização
   */
  async searchByGeoLocation(params: GeoSearchParams): Promise<PageResponse<RadarsDTO>> {
    const queryParams = new URLSearchParams({
      lat: params.lat.toString(),
      lon: params.lon.toString(),
      raio: params.raio.toString(),
      data: params.data,
      horaInicial: params.horaInicial,
      horaFinal: params.horaFinal,
      page: (params.page || 0).toString(),
      size: (params.size || 20).toString(),
    });

    const { data } = await api.get<PageResponse<RadarsDTO>>(
      `/radares/geo-search?${queryParams.toString()}`
    );
    
    return data;
  }
}

export const radarsService = new RadarsService();