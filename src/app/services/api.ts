import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { getSession, signOut } from "next-auth/react";
import { LocalSearchParams, MonitoredPlate, MonitoredPlateFormData, PaginatedAlertHistory, PaginatedMonitoredPlates } from "../types/types"; // Supondo que você moveu suas interfaces para cá

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
//const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API || "http://192.168.0.6:8081/api"; // MUDE PARA ISTO
//const API_GATEWAY_URL = "http://localhost:8080/api"; 
// ✅ CORREÇÃO: URL base SEM /api (backend não tem esse prefixo)
const ENV_HOST = "http://192.168.0.6:8081";

const API_BASE_URL = `${ENV_HOST}/api`;

// Cria instância do Axios com configuração base
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  // ✅ CORREÇÃO: Permite enviar cookies e credentials
  withCredentials: false, // Mudamos para false porque usamos Bearer token
});

// ✅ Interceptor de REQUEST - Adiciona token automaticamente
api.interceptors.request.use(
  async (config) => {
    const session = await getSession();
    if (session && session.accessToken) {
      config.headers["Authorization"] = `Bearer ${session.accessToken}`;
    }
    // Log para confirmar para onde a requisição está indo
    console.log(`🚀 [Axios] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Erro no interceptor de request:', error);
    return Promise.reject(error);
  }
);

// Response: Trata erros globais
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // O servidor respondeu com um status de erro (4xx, 5xx)
      console.error(`❌ [API Error ${error.response.status}]:`, {
        url: error.config?.url,
        message: error.response.data?.message || error.message,
      });

      switch (error.response.status) {
        case 401:
          console.warn('🔒 Token inválido/expirado. Deslogando...');
          // Evita loop de redirecionamento se já estiver na página de login
          if (typeof window !== 'undefined' && window.location.pathname !== '/') {
             signOut({ callbackUrl: '/' });
          }
          break;
        case 403:
          console.error('🚫 Acesso negado (403). Verifique as roles do usuário.');
          break;
        case 404:
          console.error('🔍 Endpoint não encontrado (404). Verifique a URL e o Gateway.');
          break;
      }
    } else if (error.request) {
      // A requisição foi feita mas não houve resposta (Timeout, Rede, CORS, Backend down)
      console.error("❌ [API Network] Sem resposta. Backend offline ou bloqueio de CORS.");
    } else {
      console.error('⚙️ Erro na configuração do Axios:', error.message);
    }

    return Promise.reject(error);
  }
);


// =============================================
// Rotas do RadarsBFFController
// =============================================

export async function searchByPlaca(placa: string, page: number, pageSize: number) {
  // O Axios cuida do 'response.json()'
  // O caminho é /radares/placa... (o /api já está na baseURL)
  const response = await api.get(`/radares/placa/${placa}`, {
    params: { page, size: pageSize }
  });
  return response.data;
}

export async function searchByLocal(params: LocalSearchParams) {
  const { concessionaria, page, pageSize, ...filters } = params;
  
  // O Axios transforma o objeto 'params' em query string automaticamente
  const response = await api.get(`/radares/concessionaria/${concessionaria}/filtros`, {
    params: {
      page,
      size: pageSize,
      ...filters // Adiciona rodovia, km, sentido, etc.
    }
  });
  return response.data;
}

/**
 * Busca opções de filtro para uma concessionária.
 */
export async function getFilterOptions(concessionaria: string): Promise<any> {
  try {
    console.log(`⚙️ Buscando opções de filtro para: ${concessionaria}`);
    const response = await api.get(`/radares/concessionaria/${concessionaria}/opcoes-filtro`,
      {
        // Sobrescreve o timeout global de 10s para 20s apenas nesta requisição
        timeout: 45000 
      }
    );

    // Validação extra: Se veio 200 mas arrays vazios, pode ser Circuit Breaker
    const data = response.data;
    if (data.rodovias.length === 0 && data.pracas.length === 0) {
        console.warn("⚠️ [API] Recebido objeto vazio. Possível fallback do Circuit Breaker.");
    } else {
        console.log('✅ [API] Filtros recebidos com sucesso!', response.data);
    }
    
    return response.data;
  } catch (error: any) {
    // Tratamento específico para timeout
    if (error.code === 'ECONNABORTED') {
        console.warn(`⚠️ Timeout nos filtros da ${concessionaria}. Retornando vazio para não travar a tela.`);
         // Retorna objeto vazio para a UI não quebrar
         return { rodovias: [], pracas: [], kms: [], sentidos: [] };
    } else {
        console.error('❌ Erro ao buscar opções de filtro:', error.message);
    }
    throw error;
  }
}

export async function getKmsByRodovia(concessionaria: string, rodovia: string) {
  if (!concessionaria || !rodovia) return [];

  const response = await api.get(`/radares/concessionaria/${concessionaria}/kms-por-rodovia`, {
    params: { rodovia }
  });
  return response.data;
}

/**
 * Busca os últimos radares processados de cada concessionária.
 * ✅ CORREÇÃO: Rota corrigida sem /api
 */
export async function getLatestRadars(): Promise<RadarEvent[]> {
  try {
    console.log('📡 Buscando últimos radares...');
    const response = await api.get<RadarEvent[]>('/radares/ultimos-processados');
    console.log('✅ Radares recebidos:', response.data.length);
    return response.data;
  } catch (error: any) {
    console.error('❌ Erro ao buscar últimos radares:', error.message);
    throw error;
  }
}

/**
 * Busca radares com filtros e paginação.
 */
export async function getRadarsWithFilters(params: {
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
}): Promise<any> {
  try {
    console.log('🔍 Buscando radares com filtros:', params);
    const response = await api.get('/radares/filtros', { params });
    console.log('✅ Resultados recebidos:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Erro ao buscar radares com filtros:', error.message);
    throw error;
  }
}

export async function searchAllByLocalForExport(params: Omit<LocalSearchParams, 'page' | 'pageSize'>) {
  const response = await api.get('/radares/exportar', {
    params: params // Envia todos os filtros
  });
  return response.data;
}

// =============================================
// Rotas do MonitoramentoBFFController
// =============================================

/**
 * Busca placas monitoradas com paginação.
 */
export async function getMonitoredPlates(params: {
  page?: number;
  size?: number;
}): Promise<any> {
  try {
    console.log('👁️ Buscando placas monitoradas:', params);
    const response = await api.get('/monitoramento', { params });
    console.log('✅ Placas recebidas:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Erro ao buscar placas monitoradas:', error.message);
    throw error;
  }
}

/**
 * Cria uma nova placa monitorada.
 */
export async function createMonitoredPlate(data: {
  placa: string;
  marcaModelo?: string;
  cor?: string;
  motivo: string;
  interessado?: string;
  observacao?: string;
}): Promise<any> {
  try {
    console.log('➕ Criando placa monitorada:', data);
    const response = await api.post('/monitoramento', data);
    console.log('✅ Placa criada:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Erro ao criar placa monitorada:', error.message);
    throw error;
  }
}

/**
 * Atualiza uma placa monitorada.
 */
export async function updateMonitoredPlate(id: number, data: any): Promise<any> {
  try {
    console.log(`📝 Atualizando placa ${id}:`, data);
    const response = await api.put(`/monitoramento/${id}`, data);
    console.log('✅ Placa atualizada:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Erro ao atualizar placa:', error.message);
    throw error;
  }
}

/**
 * Deleta uma placa monitorada.
 */
export async function deleteMonitoredPlate(id: number): Promise<void> {
  try {
    console.log(`🗑️ Deletando placa ${id}`);
    await api.delete(`/monitoramento/${id}`);
    console.log('✅ Placa deletada');
  } catch (error: any) {
    console.error('❌ Erro ao deletar placa:', error.message);
    throw error;
  }
}

/**
 * Busca alertas de passagem.
 */
export async function getAlerts(params: {
  page?: number;
  size?: number;
}): Promise<any> {
  try {
    console.log('🚨 Buscando alertas:', params);
    const response = await api.get('/monitoramento/alertas', { params });
    console.log('✅ Alertas recebidos:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Erro ao buscar alertas:', error.message);
    throw error;
  }
}

export async function getAlertHistory(
  page: number, 
  pageSize: number, 
  sort: string 
): Promise<PaginatedAlertHistory> {
  const response = await api.get('/monitoramento/alertas', {
    params: { page, size: pageSize, sort }
  });
  return response.data;
}

// =============================================
// Rotas do LogController e Análise (com /api/ extra)
// =============================================

/**
 * Busca logs no Elasticsearch.
 */
export async function searchLogs(params: {
  query?: string;
  page?: number;
  size?: number;
}): Promise<any> {
  try {
    console.log('📋 Buscando logs:', params);
    const response = await api.get('/logs/search', { params });
    console.log('✅ Logs recebidos:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Erro ao buscar logs:', error.message);
    throw error;
  }
}

export async function analisarPlacaComIA(placa: string): Promise<string> {
  // Esta rota também parece ter o /api/ extra
  const response = await api.post('/api/analise/convoy', { placa: placa });
  return response.data; // Retorna o texto (Markdown)
}

// Exporta a instância principal do axios caso você precise dela diretamente
export default api;