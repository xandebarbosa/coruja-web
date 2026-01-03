// src/components/CustomNoRowsOverlay.tsx
import React from 'react';
import { Box, Typography } from '@mui/material';
import { MapPin, Search } from 'lucide-react';

interface CustomNoRowsOverlayProps {
  hasSearched: boolean;
}

export default function CustomNoRowsOverlay({ hasSearched }: CustomNoRowsOverlayProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        p: 3,
        textAlign: 'center'
      }}
    >
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
        <div className="bg-[#fef3e2] p-6 rounded-full">
          {hasSearched ? (
            // Ícone para "Nenhum resultado encontrado"
            <MapPin size={64} className="text-gray-400" strokeWidth={1.5} />
          ) : (
            // Ícone para "Aguardando filtros"
            <Search size={64} className="text-[#fca311]" strokeWidth={1.5} />
          )}
        </div>
      </Box>
      
      <Typography variant="h5" sx={{ color: '#14213d', fontWeight: 700, mb: 1 }}>
        {hasSearched ? 'Nenhum veículo encontrado' : 'Aguardando Pesquisa'}
      </Typography>
      
      <Typography variant="body1" sx={{ color: '#6b7280', maxWidth: '400px', mx: 'auto' }}>
        {hasSearched
          ? 'Tente aumentar o raio de busca ou ajustar os filtros de data e hora.'
          : 'Adicione os filtros no formulário acima e clique em buscar para visualizar os resultados na tabela.'}
      </Typography>
    </Box>
  );
}