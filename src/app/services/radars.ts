import { PageResponse } from "@/model/response/PageResponse";
import { GeoSearchParams, GeoSearchResponse, LocalSearchParams, RadarLocationDTO, RadarsDTO } from "../types/types";
import api from "./client";
import { log } from "console";

// DTOs para o novo Domínio (Gestão de Rodovias)
export interface RodoviaDTO {
  id: number;
  nome: string;
}

export interface PracaDTO {
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

  // ─── Mecanismo de Cache para Localizações do Mapa ─────────────────────────
  private radarLocationsCache: RadarLocationDTO[] | null = null;
  private radarLocationsPromise: Promise<RadarLocationDTO[]> | null = null;
  
  /**
   * Busca os últimos radares processados (Dashboard)
   * Endpoint: GET /radares/ultimos-processados
   */
  async getLatestRadars(): Promise<RadarEvent[]> {
    try {
      const { data } = await api.get<RadarEvent[]>('/radares/ultimos-processados');
      console.log("Ultimos-processados ===> ", data);
      
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('❌ Erro ao buscar últimos radares:', error);
      return [];
    }
  }

  // =================================================================================================
  // 1. BUSCAS OTIMIZADAS
  // =================================================================================================

  /**
   * Busca por Placa (Histórico Completo)
   * Endpoint: GET /radares/busca-placa
   * 
   * @param placa - Placa do veículo (obrigatório)
   * @param page - Número da página (default: 0)
   * @param pageSize - Tamanho da página (default: 20)
   */
  async searchByPlaca(
    placa: string, 
    page: number = 0, 
    pageSize: number = 20
  ): Promise<PageResponse<RadarsDTO>> {
    console.group('🔍 [Service] Busca por Placa');
    console.log(`Placa: ${placa} | Page: ${page} | Size: ${pageSize}`);
    
    try {
      const { data } = await api.get<PageResponse<RadarsDTO>>('/radares/busca-placa', {
        params: {
          placa: placa.trim().toUpperCase(),
          page,
          size: pageSize,
          sort: 'data,desc'
        }
      });
      
      console.log(`✅ Sucesso: ${data.page?.totalElements || 0} registros encontrados`);
      console.groupEnd();
      
      return data;
    } catch (error: any) {
      console.error('❌ Erro na busca por placa:', error);
      console.groupEnd();
      
      throw new Error(
        error.response?.data?.message || 
        'Erro ao buscar dados da placa. Verifique e tente novamente.'
      );
    }
  }

  

  /**
   * Busca por Local (Filtros Operacionais)
   * Endpoint: GET /radares/busca-local
   * 
   * IMPORTANTE: Data é obrigatória para performance do índice
   */
  async searchByLocal(params: LocalSearchParams): Promise<PageResponse<RadarsDTO>> {
    console.group('🔍 [Service] Busca por Local');
    console.log('Parâmetros recebidos da tela:', params);

    try {
      // Validação de campo obrigatório
      if (!params.data) {
        throw new Error('O campo "data" é obrigatório para busca por local.');
      }

      // Monta parâmetros limpos (remove undefined/null/vazios)
      const queryParams: Record<string, any> = {
        page: params.page ?? 0,
        size: params.pageSize ?? 20,
        data: params.data, // YYYY-MM-DD (obrigatório)
      };

      // Garantindo que a concessionária vá para o backend
      // Verificamos tanto o plural (se você alterou na interface) quanto o singular
      const concessionariaValue = params.concessionarias || params.concessionaria;
      if (concessionariaValue) {
        // Forçamos a chave no singular porque é o que o @RequestParam do Java espera
        queryParams.concessionaria = concessionariaValue; 
      }

      // Adiciona parâmetros opcionais apenas se tiverem valor
      if (params.horaInicial) queryParams.horaInicial = params.horaInicial;
      if (params.horaFinal) queryParams.horaFinal = params.horaFinal;
      if (params.rodovia) queryParams.rodovia = params.rodovia;
      if (params.km) queryParams.km = params.km;
      if (params.sentido) queryParams.sentido = params.sentido;
      if (params.praca) queryParams.praca = params.praca;

      console.log('Parâmetros enviados ao backend:', queryParams);

      const { data } = await api.get<PageResponse<RadarsDTO>>('/radares/busca-local', {
        params: queryParams
      });

      console.log(`✅ Sucesso: ${data.page?.totalElements || 0} registros | ${data.content?.length || 0} na página`);
      console.groupEnd();

      return data;
    } catch (error: any) {
      console.error('❌ Erro na busca por local:', error);
      console.error('Detalhes do erro:', error.response?.data);
      console.groupEnd();

      throw new Error(
        error.response?.data?.message || 
        error.message ||
        'Erro ao buscar dados por local. Verifique os filtros e tente novamente.'
      );
    }
  }

  /**
   * Busca por Geolocalização (Mapa)
   * Endpoint: GET /radares/geo-search
   */
  async searchByGeoLocation(params: GeoSearchParams): Promise<GeoSearchResponse> {
    console.group('📡 [Service] Busca Geo');
    
    try {
      const queryParams = {
        latitude: params.latitude,
        longitude: params.longitude,
        raio: params.raio,
        data: params.data,
        horaInicio: params.horaInicio,
        horaFim: params.horaFim,
        page: params.page ?? 0,
        size: params.size ?? 20,
      };

      console.log('Parâmetros geo:', queryParams);

      const { data } = await api.get<GeoSearchResponse>('/radares/geo-search', {
        params: queryParams
      });

      console.log(`✅ Geo Results: ${data.page?.totalElements || 0} registros`);
      console.groupEnd();
      
      return data;
    } catch (error: any) {
      console.error('❌ Erro Geo:', error);
      console.groupEnd();
      
      throw new Error(
        error.response?.data?.message || 
        'Erro na busca geográfica.'
      );
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
  async getRodovias(concessionaria?: string): Promise<RodoviaDTO[]> {
    try {
      console.log('📍 Buscando rodovias...');
      const url = concessionaria 
        ? `/radares/rodovias?concessionaria=${concessionaria}` 
        : '/radares/rodovias';
      const response = await api.get<RodoviaDTO[]>(url);
      console.log("REsponse getRodovias ===> ",response);
      
      return response.data;
    } catch (error) {
      console.error("❌ Erro ao buscar rodovias:", error);
      return [];
    }
  }

  /**
   * Busca KMs de uma rodovia específica pelo ID da rodovia.
   * Endpoint: GET /radares/rodovias/{id}/kms
   * Requer que o frontend saiba o ID da rodovia selecionada.
   */
  async getKmsByRodoviaId(rodoviaId: number, concessionaria: string): Promise<KmRodoviaDTO[]> {
   if (!rodoviaId) {
      console.warn('⚠️ ID de rodovia não fornecido');
      return [];
    }

    try {
      console.log(`📍 Buscando KMs da rodovia ${rodoviaId}...`);
      const { data } = await api.get<KmRodoviaDTO[]>(`/radares/rodovias/${rodoviaId}/kms`, {
        params: { concessionaria }
      });
      
      // Ordena numericamente
      const sorted = data.sort((a, b) => parseFloat(a.valor) - parseFloat(b.valor));
      console.log(`✅ ${sorted.length} KMs carregados`);
      
      return sorted;
    } catch (error) {
      console.error(`❌ Erro ao buscar KMs da rodovia ${rodoviaId}:`, error);
      return [];
    }
  }

  /**
   * Busca praças (placeholder - implementar quando backend disponibilizar)
   * TODO: Criar endpoint no backend
   */
  async getPracas(): Promise<PracaDTO[]> {
    try {
      console.log('📍 Buscando praças...');
      const { data } = await api.get<PracaDTO[]>('/radares/rodovias');
      console.log(`✅ ${data.length} praças carregadas`);
      return data;
      
      // Placeholder temporário
      //console.warn('⚠️ Endpoint de praças ainda não implementado');
      //return [];
    } catch (error) {
      console.error("❌ Erro ao buscar praças:", error);
      return [];
    }
  }

  /**
   * Busca lista de sentidos (Estático ou via endpoint se criado).
   * Como decidimos não criar tabela, retornamos estático aqui.
   */
  async getSentidos(): Promise<string[]> {
    return ["Norte", "Sul", "Leste", "Oeste"];
  }

  // =================================================================================================
  // 3. EXPORTAÇÃO E UTILITÁRIOS
  // =================================================================================================

  async searchAllByGeoLocationForExport(params: Omit<GeoSearchParams, 'page' | 'size'>): Promise<RadarsDTO[]> {
    console.group('📊 [Service] Exportação Geo');
    
    try {
      const { data } = await api.get<RadarsDTO[]>('/radares/geo-exportar', {
        params: params
      });
      
      console.log(`✅ Exportação geo: ${data.length} registros`);
      console.groupEnd();
      
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('❌ Erro na exportação geo:', error);
      console.groupEnd();
      return [];
    }
  }

  /**
   * Exporta dados da busca local (Excel).
   * Se o BFF não tiver o endpoint /exportar explícito, usamos o /busca-local com paginação alta
   * ou o endpoint dedicado se foi criado. (Assumindo endpoint dedicado existente no BFF refatorado ou usando lógica de paginação grande)
   */
  async searchAllByLocalForExport(params: any): Promise<RadarsDTO[]> {
    console.group('📊 [Service] Exportação Local');
    
    try {
      // Criamos o objeto sem tipar como Record, usando 'any' 
      // para permitir manipulação livre das chaves (como o delete)
      const exportParams: any = {
        ...params,
        page: 0,
        pageSize: 100000,
      };

      // 🚀 Garante que o backend receba o parâmetro exato (concessionaria no singular)
      const concessionariaValue = params.concessionarias || params.concessionaria;
      if (concessionariaValue) {
        exportParams.concessionaria = concessionariaValue;
        delete exportParams.concessionarias; // Remove o plural para não confundir o Spring
      }

      console.log('Parâmetros de exportação:', exportParams);

      try {
        const { data } = await api.get<RadarsDTO[]>('/radares/exportar', {
          params: exportParams
        });
        
        console.log(`✅ Exportação via /exportar: ${data.length} registros`);
        console.groupEnd();
        
        return Array.isArray(data) ? data : [];
      } catch (exportError) {
        console.warn('⚠️ Endpoint /exportar falhou, usando /busca-local');
        // Usamos "as LocalSearchParams" para o TypeScript entender que as propriedades
        // obrigatórias (page e pageSize) estão dentro deste objeto.
        const response = await this.searchByLocal(exportParams as LocalSearchParams);
        return response.content || [];
      }
    } catch (error: any) {
      console.error('❌ Erro na exportação:', error);
      console.groupEnd();
      throw new Error(error.response?.data?.message || 'Erro ao exportar dados.');
    }
  }

  /**
   * Busca pinos do mapa com Deduplicação e Cache em Memória
   * Impede que o frontend dispare múltiplas requisições idênticas simultânea
   * Endpoint: GET /radares/all-locations
   */
  async getRadarLocations(forceRefresh = false): Promise<RadarLocationDTO[]> {
    // 1. Retorna do cache se já estiver carregado
    if (!forceRefresh && this.radarLocationsCache) {
      console.log('⚡ [Frontend Cache] Retornando localizações da memória.');
      return this.radarLocationsCache;
    }

    // 2. Se já existe uma requisição em andamento, agrupa a resposta (evita double-fetch)
    if (!forceRefresh && this.radarLocationsPromise) {
      console.log('⏳ [Frontend Cache] Requisição de mapa em andamento. Aguardando...');
      return this.radarLocationsPromise;
    }

    // 3. Dispara a requisição real e armazena a Promise
    this.radarLocationsPromise = (async () => {
      try {
        console.log('📍 Buscando localizações de radares na API...');
        const { data } = await api.get<RadarLocationDTO[]>('/radares/all-locations');
        
        this.radarLocationsCache = data; // Salva o resultado
        console.log(`✅ ${data.length} localizações carregadas.`);
        return data;
      } catch (error) {
        console.error('❌ Erro ao buscar localizações:', error);
        return []; // Retorna array vazio para o Leaflet não quebrar
      } finally {
        // Limpa a Promise após a conclusão (sucesso ou erro)
        this.radarLocationsPromise = null; 
      }
    })();

    return this.radarLocationsPromise;
  }

  async searchByLocalWithDetran(params: LocalSearchParams): Promise<PageResponse<RadarsDTO>> {
    console.group('🔍 [Service] Busca por Local com Detran');

    try {
      if (!params.data) throw new Error('O campo "data" é obrigatório para busca por local.');

      const queryParams: Record<string, any> = {
        page: params.page ?? 0,
        size: params.pageSize ?? 20,
        data: params.data,
      };

      const concessionariaValue = params.concessionarias || params.concessionaria;
      if (concessionariaValue) queryParams.concessionaria = concessionariaValue;
      if (params.horaInicial) queryParams.horaInicial = params.horaInicial;
      if (params.horaFinal) queryParams.horaFinal = params.horaFinal;
      if (params.rodovia) queryParams.rodovia = params.rodovia;
      if (params.km) queryParams.km = params.km;
      if (params.sentido) queryParams.sentido = params.sentido;
      if (params.praca) queryParams.praca = params.praca;

      const { data } = await api.get<PageResponse<RadarsDTO>>('/radares/busca-local-detran', {
        params: queryParams
      });

      console.log(`✅ Sucesso (Detran): ${data.page?.totalElements || 0} registros | ${data.content?.length || 0} na página`);
      console.groupEnd();

      return data;

    } catch (error: any) {
      console.error('❌ Erro na busca por local com Detran:', error);
      console.groupEnd();

      throw new Error(
        error.response?.data?.message || 
        'Erro ao buscar dados por local com Detran. Verifique os filtros e tente novamente.'
      );
    }
  }

  //Exportação com dados do Detran
  async exportAllWithDetran(params: any): Promise<RadarsDTO[]> {
    try {
      const { data } = await api.get<RadarsDTO[]>('/radares/exportar-detran', {
        params: {
          ...params,
          concessionaria: params.concessionarias || params.concessionaria
        }
      });
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('❌ Erro na exportação Detran:', error);
      throw error;
    }
  }
}

export const radarsService = new RadarsService();