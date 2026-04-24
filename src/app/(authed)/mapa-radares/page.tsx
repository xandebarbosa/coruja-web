'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { RadarLocationDTO } from '../../types/types'; // Ajuste o caminho se necessário
import { radarsService } from '../../services/radars'; // Importa o seu serviço recém-refatorado
import { Card, CardContent, Typography } from '@mui/material';
import { Box } from 'lucide-react';

// 1. IMPORTAÇÃO DINÂMICA: Impede erro do 'window is not defined' (Leaflet vs Next.js SSR)
const RadarMapDinâmico = dynamic(() => import('./componentes/RadarMapComponent'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-gray-100 rounded-lg">
      <p className="text-gray-500 animate-pulse font-semibold text-lg">
        Iniciando mapa e carregando radares...
      </p>
    </div>
  )
});

export default function MapaRadaresPage() {
  const [radares, setRadares] = useState<RadarLocationDTO[]>([]);
  const [filtrosAtivos, setFiltrosAtivos] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // 2. CONSUMO DO SERVIÇO: Busca as localizações assim que a página monta
  useEffect(() => {
    const fetchLocalizacoes = async () => {
      try {
        setIsLoading(true);
        
        // Chamada limpa e padronizada usando a classe RadarsService
        const data = await radarsService.getRadarLocations();
        
        setRadares(data || []);
      } catch (error) {
        console.error("❌ Erro ao renderizar a página do mapa:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocalizacoes();
  }, []);

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-gradient-to-br from-gray-50 via-[#fef9f3] to-gray-50 p-6 gap-6">
      
      {/* ── HERO HEADER (Seu Modelo) ─────────────────────────────────────── */}
      <Card
        className="shrink-0 overflow-hidden"
        sx={{
          background: 'linear-gradient(135deg, #14213d 0%, #1a2b4a 100%)',
          boxShadow: '0 20px 60px rgba(20,33,61,0.3)',
          borderRadius: '16px',
          position: 'relative',
          '&::before': {
            content: '""', position: 'absolute',
            top: 0, left: 0, right: 0, height: '4px',
            background: 'linear-gradient(90deg, #fca311 0%, #ff8800 100%)',
          },
        }}
      >
        <CardContent className="py-6 px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">

            {/* Título e Ícone */}
            <div className="flex items-center gap-5">
              <Box className="bg-amber-100 bg-opacity-15 backdrop-filter backdrop-blur-md border border-amber-300 rounded-xl p-2">
                {/* Ícone de Mapa/Localização em SVG */}
                <svg width="40" height="40" viewBox="0 0 24 24" fill="#fca311">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              </Box>
              <div>
                <Typography
                  variant="h3"
                  className="font-bold text-white mb-1"
                  sx={{ letterSpacing: '-0.5px', textShadow: '0 2px 10px rgba(0,0,0,0.2)', fontSize: { xs: '1.75rem', md: '2rem' } }}
                >
                  Mapa Operacional de Radares
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '15px', fontWeight: 500 }}>
                  {isLoading 
                    ? "Sincronizando localizações com as concessionárias..." 
                    : `Visualização geográfica de ${radares.length} equipamentos integrados ao Coruja Web.`}
                </Typography>
              </div>
            </div>
            
            
          </div>
        </CardContent>
      </Card>

      {/* 3. RENDERIZA O MAPA PASSANDO OS DADOS DO SERVIÇO */}
      <div className="flex-1 rounded-xl overflow-hidden border border-gray-200 shadow-sm relative z-0 bg-white min-h-[500px]">
        <RadarMapDinâmico 
          points={radares} 
          activeFilters={filtrosAtivos} 
          selectedPoint={null}
          onSelectPoint={(p) => console.log("Radar selecionado no mapa:", p)}
        />
      </div>
      
    </div>
  );
}