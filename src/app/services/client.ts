import axios, { AxiosError, AxiosInstance } from "axios";
// Removi o signOut da importação por enquanto
import { getSession, signOut } from "next-auth/react"; 

const API_BASE_URL = "/api";

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 180000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, 
});

api.interceptors.request.use(
  async (config) => {
    const session = await getSession();
    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`;
    } else {
      console.warn("⚠️ Requisição feita sem accessToken na sessão local!");
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 [${config.method?.toUpperCase()}] ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Erro no interceptor de request:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    if (error.response) {
      const { status, data, config } = error.response;
      
      console.error(`❌ [API Error ${status}]: na rota ${config?.url}`);
      console.error('Detalhes do backend:', data);

      switch (status) {
        case 401:
          console.warn('🔒 Backend retornou 401 Unauthorized.');
          console.warn('⚠️ O signOut automático foi desativado para debug. A tela não vai deslogar.');
          //A linha abaixo é a causadora do Loop. Vamos mantê-la comentada por agora.
          if (typeof window !== 'undefined' && window.location.pathname !== '/') {
            signOut({ callbackUrl: '/' });
          }
          break;
        case 403:
          console.error('🚫 Acesso negado. O backend diz que você não tem a Role necessária.');
          break;
        case 404:
          console.error('🔍 Recurso não encontrado no backend.');
          break;
        case 500:
          console.error('🔥 Erro interno do servidor (Spring Boot estourou Exception).');
          break;
      }
    } else if (error.request) {
      console.error("❌ [Network Error] Sem resposta do servidor. O Gateway pode estar offline ou bloqueando por CORS.");
    }

    return Promise.reject(error);
  }
);

export default api;