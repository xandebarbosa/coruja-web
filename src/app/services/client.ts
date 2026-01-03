import axios, { AxiosError, AxiosInstance } from "axios";
import { getSession, signOut } from "next-auth/react";

// ✅ CORREÇÃO: Aponta sempre para o proxy do Next.js (mesmo domínio)
// O Next.js se encarrega de redirecionar para o backend via next.config.ts
const API_BASE_URL = "/api";

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // False pois usamos Bearer Token no header
});

// Interceptor de Request - Adiciona token automaticamente
api.interceptors.request.use(
  async (config) => {
    const session = await getSession();
    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`;
    }
    
    // Log limpo apenas em desenvolvimento
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

// Interceptor de Response - Tratamento de erros centralizado
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    if (error.response) {
      const { status, data, config } = error.response;
      
      console.error(`❌ [API Error ${status}]:`, {
        url: config?.url,
        message: data?.message || error.message,
      });

      switch (status) {
        case 401:
          console.warn('🔒 Token inválido/expirado.');
          // Só desloga se já não estivermos na página de login para evitar loop
          if (typeof window !== 'undefined' && window.location.pathname !== '/') {
            signOut({ callbackUrl: '/' });
          }
          break;
        case 403:
          console.error('🚫 Acesso negado. Verifique as permissões.');
          break;
        case 404:
          console.error('🔍 Recurso não encontrado.');
          break;
        case 500:
          console.error('🔥 Erro interno do servidor.');
          break;
      }
    } else if (error.request) {
      console.error("❌ [Network Error] Sem resposta do servidor (Backend offline ou CORS).");
    } else {
      console.error('⚙️ Erro de configuração Axios:', error.message);
    }

    return Promise.reject(error);
  }
);

export default api;