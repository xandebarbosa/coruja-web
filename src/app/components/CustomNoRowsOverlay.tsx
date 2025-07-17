import { Box, Typography } from '@mui/material';
import React from 'react'

export default function CustomNoRowsOverlay() {
  return (
     <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100%' 
      }}
    >
      <Typography variant="h6" paragraph>
        Nenhum Veículo Encontrado
      </Typography>
      <Typography variant="body2">
        Nenhum veículo está sendo monitorado no momento. Clique em "Adicionar Monitoramento" para começar.
      </Typography>
    </Box>
  );  
}
