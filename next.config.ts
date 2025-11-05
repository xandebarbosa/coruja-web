import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  // CORRIGINDO O AVISO DE "images.domains"
  images: {
    // Substitua 'images.domains' por 'remotePatterns'
    remotePatterns: [
      {
        protocol: 'https', // ou 'http'
        hostname: 'dominio-das-suas-imagens.com', // ex: s3.amazonaws.com
      },
    ],
  },

  async rewrites() {
    return [
      {
        source: '/api/:path((?!auth/.*).*)',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`, // Proxy para o backend
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

  experimental: {
    // Adicione aqui quaisquer recursos experimentais que deseja usar
  },
};

export default nextConfig;