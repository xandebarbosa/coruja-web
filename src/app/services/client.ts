import axios, { AxiosError, AxiosInstance } from "axios";
// Importamos apenas o signOut do lado do cliente
import { getSession, signOut } from "next-auth/react"; 

const serverUrl = process.env.NEXT_PUBLIC_API_URL || "http://192.168.0.251:8081";
// 1. Ajuste do Invalid URL: 
// Se estiver no navegador, usa rota relativa "/api". 
// Se estiver no servidor (Node.js/SSR), usa a URL absoluta do arquivo .env.local
const API_BASE_URL = typeof window !== 'undefined' 
  ? "/api" 
  : (serverUrl.endsWith('/api') ? serverUrl : `${serverUrl}/api`);// <-- Fallback de segurança

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
    let accessToken;

    // 2. Verificação de Ambiente (Garante a Auth no SSR e no CSR)
    if (typeof window !== "undefined") {
      // Estamos no Navegador (Client-Side)
      const session = await getSession();
      accessToken = session?.accessToken;
    } else {
      // Estamos no Servidor (Server-Side)
      // Importamos getServerSession de forma dinâmica para não quebrar a build do Next.js
      try {
        const { getServerSession } = await import("next-auth");
        // Ajuste este caminho se o authOptions não estiver exportado no route.ts
        const { authOptions } = await import("@/app/lib/auth");

        // Pega a sessão diretamente dos cookies no Node.js
        const session: any = await getServerSession(authOptions);
        accessToken = session?.accessToken;
      } catch (err) {
        console.warn("⚠️ Não foi possível obter a sessão no SSR.", err);
      }
    }

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
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
          console.warn("🔒 Backend retornou 401 Unauthorized.");
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
      console.error(
        "❌ [Network Error] Sem resposta do servidor. O Gateway pode estar offline.",
      );
    }

    return Promise.reject(error);
  }
);

export default api;