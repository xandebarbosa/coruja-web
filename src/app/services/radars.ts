import { searchByLocal } from './index';
import { PageResponse } from "@/model/response/PageResponse";
import { LocalSearchParams, RadarsDTO } from "../types/types";
import api from "./client";

// Interfaces locais para parâmetros específicos deste serviço
export interface FilterOptions {
  rodovias: string[];
  pracas: string[];
  kms: string[];
  sentidos: string[];
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
  async searchByGeoLocation(params: GeoSearchParams): Promise<PageResponse<RadarsDTO>> {
    // Monta a query string explicitamente para garantir a formatação
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

    const { data } = await api.get<PageResponse<RadarsDTO>>(`/radares/geo-search?${queryParams.toString()}`);
    return data;
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
    const { data } = await api.get<RadarsDTO[]>('/radares/exportar', { params });
    return data;
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
    return data;
  }
}

export const radarsService = new RadarsService();