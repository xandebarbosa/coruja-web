import axios, { AxiosError, AxiosInstance } from "axios";
import { getSession, signOut } from "next-auth/react";

const ENV_HOST = process.env.NEXT_PUBLIC_API || "http://192.168.0.6:8081";
const API_BASE_URL = `${ENV_HOST}/api`;

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// Interceptor de Request - Adiciona token automaticamente
api.interceptors.request.use(
  async (config) => {
    const session = await getSession();
    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`;
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 [${config.method?.toUpperCase()}] ${config.url}`, config.params || '');
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Erro no interceptor de request:', error);
    return Promise.reject(error);
  }
);

// Interceptor de Response - Tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    if (error.response) {
      const { status, data } = error.response;
      
      console.error(`❌ [API Error ${status}]:`, {
        url: error.config?.url,
        message: data?.message || error.message,
      });

      switch (status) {
        case 401:
          console.warn('🔒 Token inválido/expirado. Deslogando...');
          if (typeof window !== 'undefined' && window.location.pathname !== '/') {
            signOut({ callbackUrl: '/' });
          }
          break;
        case 403:
          console.error('🚫 Acesso negado. Verifique as permissões do usuário.');
          break;
        case 404:
          console.error('🔍 Endpoint não encontrado. Verifique a URL.');
          break;
      }
    } else if (error.request) {
      console.error("❌ [Network Error] Sem resposta. Backend offline ou bloqueio de CORS.");
    } else {
      console.error('⚙️ Erro na configuração do Axios:', error.message);
    }

    return Promise.reject(error);
  }
);

export default api;