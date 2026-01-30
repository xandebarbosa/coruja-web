import { PageResponse } from "@/model/response/PageResponse";
import { GeoSearchParams, GeoSearchResponse, LocalSearchParams, RadarLocationDTO, RadarsDTO } from "../types/types";
import api from "./client";

// DTOs para o novo Domínio (Gestão de Rodovias)
export interface RodoviaDTO {
  id: number;
  nome: string;
}

export interface KmRodoviaDTO {
  id: number;
  valor: string;
  rodoviaId: number;
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

// Interface auxiliar para os parâmetros de busca por local (alinhada com o BFF)
interface SearchLocalParams {
  concessionaria?: string | string[]; // BFF aceita lista
  data: string;          // YYYY-MM-DD (Obrigatório)
  horaInicial?: string;  // HH:mm:ss (Opcional no front, mas BFF pode exigir)
  horaFinal?: string;    // HH:mm:ss
  rodovia?: string;
  km?: string;
  sentido?: string;
  praca?: string;
  page?: number;
  size?: number;
}

class RadarsService {
  
  /**
   * Busca os últimos radares processados (Dashboard)
   * Endpoint: GET /radares/ultimos-processados
   */
  async getLatestRadars(): Promise<RadarEvent[]> {
    const { data } = await api.get<RadarEvent[]>('/radares/ultimos-processados');
    return data;
  }

  // =================================================================================================
  // 1. BUSCAS OTIMIZADAS
  // =================================================================================================

  /**
   * Busca por Placa (Histórico Completo)
   * Endpoint: GET /radares/busca-placa
   */
  async searchByPlaca(placa: string, page: number = 0, pageSize: number = 20): Promise<PageResponse<RadarsDTO>> {
    console.log(`📍 [Service] Buscando placa: ${placa}`);
    
    const { data } = await api.get<PageResponse<RadarsDTO>>('/radares/busca-placa', {
      params: {
        placa,
        page,
        size: pageSize,
        sort: 'data,desc' // Garante ordenação cronológica
      }
    });
    return data;
  }

  

  /**
   * Busca por Local (Filtros Operacionais)
   * Endpoint: GET /radares/busca-local
   * Agora aceita 'concessionaria' como parâmetro opcional (lista ou string)
   */
  async searchByLocal(params: LocalSearchParams): Promise<PageResponse<RadarsDTO>> {
    console.group('🔍 [Service] Busca por Local');
    console.log('Params:', params);

    // Desestrutura para separar paginação e filtros
    const { concessionaria, page, pageSize, ...filters } = params;

    // Monta objeto de query compatível com o novo BFF
    const queryParams: any = {
      page: page ?? 0,
      size: pageSize ?? 20,
      data: filters.data, // Data é obrigatória na nova arquitetura para performance
      horaInicial: filters.horaInicial,
      horaFinal: filters.horaFinal,
      rodovia: filters.rodovia,
      km: filters.km,
      sentido: filters.sentido
    };

    // Remove chaves undefined/vazias para limpar a URL
    Object.keys(queryParams).forEach(key => {
      const k = key as keyof SearchLocalParams;
      if (queryParams[k] === undefined || queryParams[k] === '') {
        delete queryParams[k];
      }
    });

    try {
      const { data } = await api.get<PageResponse<RadarsDTO>>('/radares/busca-local', {
        params: queryParams
      });
      console.log('✅ Sucesso:', data.page?.totalElements, 'registros.');
      console.groupEnd();
      return data;
    } catch (error) {
      console.error('❌ Erro na busca por local:', error);
      console.groupEnd();
      throw error; // Repassa o erro para o componente tratar (ex: Toast)
    }
  }

  /**
   * Busca por Geolocalização (Mapa)
   * Endpoint: GET /radares/geo-search
   */
  async searchByGeoLocation(params: GeoSearchParams): Promise<GeoSearchResponse> {
    console.group('📡 [Service] Busca Geo');
    
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

    try {
      const { data } = await api.get<GeoSearchResponse>('/radares/geo-search', {
        params: paramsEnviados
      });
      console.log('✅ Geo Results:', data.page?.totalElements);
      console.groupEnd();
      return data;
    } catch (error) {
      console.error('❌ Erro Geo:', error);
      console.groupEnd();
      throw error;
    }
  }

  // =================================================================================================
  // 2. GESTÃO DE DOMÍNIO (Substitui os antigos 'getFilterOptions')
  // =================================================================================================

  /**
   * Busca todas as rodovias cadastradas no sistema.
   * Endpoint: GET /radares/rodovias
   * Use isso para popular o Select de Rodovias.
   */
  async getRodovias(): Promise<RodoviaDTO[]> {
    try {
      const { data } = await api.get<RodoviaDTO[]>('/radares/rodovias');
      return data;
    } catch (error) {
      console.error("Erro ao buscar rodovias:", error);
      return [];
    }
  }

  /**
   * Busca KMs de uma rodovia específica pelo ID da rodovia.
   * Endpoint: GET /radares/rodovias/{id}/kms
   * Requer que o frontend saiba o ID da rodovia selecionada.
   */
  async getKmsByRodoviaId(rodoviaId: number): Promise<KmRodoviaDTO[]> {
    if (!rodoviaId) return [];
    try {
      const { data } = await api.get<KmRodoviaDTO[]>(`/radares/rodovias/${rodoviaId}/kms`);
      // Ordena numericamente os KMs para ficar bonito no select
      return data.sort((a, b) => parseFloat(a.valor) - parseFloat(b.valor));
    } catch (error) {
      console.error(`Erro ao buscar KMs da rodovia ${rodoviaId}:`, error);
      return [];
    }
  }

  /**
   * Busca lista de sentidos (Estático ou via endpoint se criado).
   * Como decidimos não criar tabela, retornamos estático aqui.
   */
  async getSentidos(): Promise<string[]> {
    return ["Norte", "Sul", "Leste", "Oeste", "Crescente", "Decrescente"];
  }

  // =================================================================================================
  // 3. EXPORTAÇÃO E UTILITÁRIOS
  // =================================================================================================

  async searchAllByGeoLocationForExport(params: Omit<GeoSearchParams, 'page' | 'size'>): Promise<RadarsDTO[]> {
    try {
      const { data } = await api.get<RadarsDTO[]>('/radares/geo-exportar', {
        params: params
      });
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('❌ Erro Export Geo:', error);
      return [];
    }
  }

  /**
   * Exporta dados da busca local (Excel).
   * Se o BFF não tiver o endpoint /exportar explícito, usamos o /busca-local com paginação alta
   * ou o endpoint dedicado se foi criado. (Assumindo endpoint dedicado existente no BFF refatorado ou usando lógica de paginação grande)
   */
  async searchAllByLocalForExport(params: any): Promise<RadarsDTO[]> {
    // Reutiliza a lógica de busca local, mas forçando paginação máxima
    // Ajuste a URL caso tenha mantido o /radares/exportar no controller
    const { data } = await api.get<any>('/radares/exportar', { 
      params: { 
        ...params, 
        page: 0, 
        size: 100000 
      } 
    });
    
    // Tratamento para garantir retorno de array
    if (data && Array.isArray(data.content)) return data.content;
    if (Array.isArray(data)) return data;
    return [];
  }

  /**
   * Busca pinos do mapa (Todas as localizações)
   * Endpoint: GET /radares/all-locations
   */
  async getRadarLocations(): Promise<RadarLocationDTO[]> {
    const response = await api.get<RadarLocationDTO[]>('/radares/all-locations');
    return response.data;
  }
}

export const radarsService = new RadarsService();