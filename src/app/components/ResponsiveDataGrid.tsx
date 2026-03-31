'use client';

import { Box } from '@mui/material';
import React from 'react';

interface ResponsiveDataGridProps {
  /** Altura do container em pixels ou string CSS — ex: 600 ou "70vh" */
  height?: number | string;
  children: React.ReactNode;
  /** Largura mínima do grid (evita colapso de colunas no mobile) */
  minWidth?: number;
}

/**
 * Wrapper responsivo para MUI DataGrid.
 *
 * No mobile adiciona overflow-x:auto para que o DataGrid
 * possa ser navegado com scroll horizontal, em vez de colapsar.
 * No desktop mantém o comportamento padrão.
 */
export default function ResponsiveDataGrid({
  height = 600,
  children,
  minWidth = 640,
}: ResponsiveDataGridProps) {
  return (
    <Box
      sx={{
        width: '100%',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        // Barra de scroll sutil
        '&::-webkit-scrollbar': { height: 6 },
        '&::-webkit-scrollbar-thumb': {
          background: 'rgba(0,0,0,0.15)',
          borderRadius: 3,
        },
      }}
    >
      <Box
        sx={{
          // No mobile, garante largura mínima para o grid não colapsar
          minWidth: { xs: minWidth, md: 'unset' },
          height,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}