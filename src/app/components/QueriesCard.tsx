import { Button, Card, CardContent, TextField, Typography } from '@mui/material'
import React, { useState } from 'react'
import { buscarPorPlaca } from '../services/RadarService';
import DetailsTable from './DetailsTable';

export default function QueriesCard() {

    const [placa, setPlaca] = useState('');
    const [resultados, setResultados] = useState([]);
  
    const handleBuscarPlaca = async () => {
      try {
          const data = await buscarPorPlaca(placa);
          console.log("Data ==>", data );
          
          setResultados(data);
      } catch (error) {
          console.log('Erro ao buscar dados:', error);
          
      }
    }
      return (
          <div className="p-8">
              <Card className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 px-4 sm:px-6 bg-white dark:bg-gray-900 dark:text-white border-b dark:border-gray-700 gap-4">
                  <CardContent>
                  <Typography variant="h5" gutterBottom>Buscar Radar por Placa</Typography>
                  <div className="flex flex-row items-center gap-4 mt-4">
                      <TextField
                      label="Placa"
                      variant="outlined"
                      value={placa}
                      onChange={(e) => setPlaca(e.target.value)}
                      />
                      <Button variant="contained" onClick={handleBuscarPlaca}>
                      Buscar
                      </Button>
                  </div>
                  </CardContent>
              </Card>
  
        {/* {resultados.length > 0 && <DetailsTable dados={resultados} />} */}
      </div>
        );
}
