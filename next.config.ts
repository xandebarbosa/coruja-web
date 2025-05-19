import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/:path*', // Proxy para o backend
      },
    ];
  },
  reactStrictMode: true,
  
  // Configuração de compilação (substitui swcMinify)
  compiler: {
    styledComponents: true, // Se estiver usando styled-components
  },
  
  // Configuração de CORS para rotas da API (opcional)
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { 
            key: 'Access-Control-Allow-Headers', 
            value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' 
          },
        ],
      },
    ];
  },
  
  // Configuração para tratar corretamente o ambiente local
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NODE_ENV === 'development' 
      ? '/api' 
      : 'https://seu-servidor-producao.com/api',
  },
  
  // Configurações adicionais recomendadas para Next.js 15+
  experimental: {
    // Adicione aqui quaisquer recursos experimentais que deseja usar
  },
  
  // Otimizações de imagens (se aplicável)
  images: {
    domains: ['localhost'], // Adicione os domínios das suas imagens
  },
};

export default nextConfig;