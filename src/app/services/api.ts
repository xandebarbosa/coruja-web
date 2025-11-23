import axios from "axios";
import { getSession, signOut } from "next-auth/react";
import { LocalSearchParams, MonitoredPlate, MonitoredPlateFormData, PaginatedAlertHistory, PaginatedMonitoredPlates } from "../types/types"; // Supondo que você moveu suas interfaces para cá

// 1. A URL BASE CORRETA
// Aponta para o seu API Gateway na porta 8081 e já inclui o prefixo /api
// const API_GATEWAY_URL = "/api"; // ISSO DEPENDE DE UM PROXY
//const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API || "http://192.168.0.6:8081/api"; // MUDE PARA ISTO
//const API_GATEWAY_URL = "http://localhost:8080/api"; 
const API_GATEWAY_URL = "http://localhost:8081/api"

// 2. CRIA A INSTÂNCIA CENTRALIZADA DO AXIOS
const api = axios.create({
  baseURL: API_GATEWAY_URL,
});

// 3. INTERCEPTOR DE REQUISIÇÃO (INJETA O TOKEN)
// Isso é o que faz a autenticação funcionar automaticamente
api.interceptors.request.use(
  async (config) => {
    const session = await getSession(); // Pega a sessão do Next-Auth
    if (session && session.accessToken) {
      // Adiciona o token Bearer no cabeçalho
      config.headers["Authorization"] = `Bearer ${session.accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Flag para evitar loops de logout
let isSigningOut = false;

// 4. INTERCEPTOR DE RESPOSTA (LIDA COM TOKEN EXPIRADO)
api.interceptors.response.use(
  (response) => response, // Sucesso: apenas repassa a resposta
  (error) => {
    // Se o erro for 401 (Não Autorizado), o token expirou ou é inválido
    if (error.response && error.response.status === 401) {
      
      // MUDANÇA AQUI:
      // Evita que 10 chamadas de API falhem e tentem fazer logout 10 vezes
      if (!isSigningOut) {
        isSigningOut = true;
        console.error("Erro 401 detectado. Token inválido ou expirado. Deslogando...");
        
        // Em vez de redirecionar para a página de signout,
        // usamos a função signOut() que limpa a sessão e 
        // nos redireciona para a página de login (definida no callbackUrl).
        signOut({ callbackUrl: '/' });
      }
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

export async function getFilterOptions(concessionaria: string) {
  if (!concessionaria) return { rodovias: [], pracas: [], kms: [], sentidos: [] };

  const response = await api.get(`/radares/concessionaria/${concessionaria}/opcoes-filtro`);
  return response.data;
}

export async function getKmsByRodovia(concessionaria: string, rodovia: string) {
  if (!concessionaria || !rodovia) return [];

  const response = await api.get(`/radares/concessionaria/${concessionaria}/kms-por-rodovia`, {
    params: { rodovia }
  });
  return response.data;
}

export async function getLatestRadars() {
  console.log("api object:", api);
  try {
    const response = await api.get('/radares/ultimos-processados');
    console.log("getLatestRadars response ==>", response);
    return response.data;
  } catch (err) {
    console.error("getLatestRadars erro =>", err);
    // se for axios:
    if ((err as any)?.response) {
      console.error("status:", (err as any).response.status);
      console.error("data:", (err as any).response.data);
      console.error('[getLatestRadars] erro:', (err as any).message);
      // opcional: lançar um erro customizado para UI
      throw new Error('Falha ao buscar radares. Verifique console/network.');
    } else {
      console.error("message:", (err as any).message);
    }
    throw err; // repropagar se necessário
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

export async function getMonitoredPlates(
  page: number, 
  pageSize: number, 
  sort: string = 'createdAt,asc'
): Promise<PaginatedMonitoredPlates> {
  const response = await api.get('/monitoramento', {
    params: { page, size: pageSize, sort }
  });
  return response.data;
}

export async function createMonitoredPlate(data: MonitoredPlateFormData): Promise<MonitoredPlate> {
  // O Axios converte o objeto 'data' para JSON automaticamente
  const response = await api.post('/monitoramento', data);
  return response.data;
}

export async function updateMonitoredPlate(id: number, data: MonitoredPlateFormData): Promise<MonitoredPlate> {
  const response = await api.put(`/monitoramento/${id}`, data);
  return response.data;
}

export async function deleteMonitoredPlate(id: number): Promise<void> {
  await api.delete(`/monitoramento/${id}`);
  // O Axios trata o 204 No Content automaticamente
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

export async function searchLogs(query: string, page: number, pageSize: number) {
  // Esta rota tem um /api/ extra por causa do @RequestMapping no seu BFF
  const response = await api.get('/api/logs/search', {
    params: { query, page, size: pageSize }
  });
  return response.data;
}

export async function analisarPlacaComIA(placa: string): Promise<string> {
  // Esta rota também parece ter o /api/ extra
  const response = await api.post('/api/analise/convoy', { placa: placa });
  return response.data; // Retorna o texto (Markdown)
}

// Exporta a instância principal do axios caso você precise dela diretamente
export default api;