'use client';

import { useState, useEffect } from 'react';
import { DataGrid, GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import { searchByPlaca } from '../services/api';
import CustomPagination from '../components/CustomPagination';
import { Button, Card, CardContent, TextField, Typography } from '@mui/material';

interface RadarPlaca {
  id: number;
  data: string;
  hora: string;
  placa: string;
  rodovia: string;
  praca: string;
  km: string;
  sentido: string;  
}

// Define as colunas do DataGrid
const columns: GridColDef[] = [
  { field: 'data', 
    headerName: 'Data', 
    width: 150, 
    valueFormatter: (value: string) => {
      if (!value) {
        return '';
      }
      // Adiciona T00:00:00 para garantir que o navegador interprete como data local,
    // evitando um bug comum de fuso horário que poderia mostrar o dia anterior.
      const date = new Date(`${value}T00:00:00`);
      return date.toLocaleDateString('pt-BR');
    } 
  },
  { field: 'hora', headerName: 'Hora', width: 150 },
  { field: 'placa', headerName: 'Placa', width: 150 },
  { field: 'praca', headerName: 'Praça', width: 200 },
  { field: 'sentido', headerName: 'Sentido', width: 150 },
  { field: 'rodovia', headerName: 'Rodovia', width: 150 },
  { field: 'km', headerName: 'KM', width: 100 },
];

export default function ConsultaPlaca() {
  const [placaInput, setPlacaInput] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rowCount, setRowCount] = useState(0);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [latestRowId, setLatestRowId] = useState<number | null>(null);

  const handleSearch = async (page = 0, pageSize = paginationModel.pageSize) => {
    if (!placaInput) {
      alert('Por favor, insira uma placa.');
      return;
    }
    setLoading(true);
    try {
      const data = await searchByPlaca(placaInput, page, pageSize);

      // LÓGICA PARA ENCONTRAR O REGISTRO MAIS RECENTE
      if (data.content && data.content.length > 0) {
        // Usamos 'reduce' para encontrar o objeto com a data/hora mais recente
        const maisRecente = data.content.reduce((latest: RadarPlaca, current: RadarPlaca) => {
            const latestDateTime = new Date(`${latest.data}T${latest.hora}`);
            const currentDateTime = new Date(`${current.data}T${current.hora}`);
            return currentDateTime > latestDateTime ? current : latest;
        });
        setLatestRowId(maisRecente.id); // Guarda o ID do mais recente
      }

      setRows(data.content);
      setRowCount(data.page.totalElements);
    } catch (error) {
      console.error(error);
      alert('Erro ao buscar dados.');
    } finally {
      setLoading(false);
    }
  };
  
  // Efeito para buscar dados quando a paginação muda
  useEffect(() => {
    // Só busca se já houver uma busca inicial (placaInput não está vazio)
    if(placaInput) {
      handleSearch(paginationModel.page, paginationModel.pageSize);
    }
  }, [paginationModel]);


  return (
    <div className='p-6'>      
      <Card className='mb-4'>
        <CardContent>
          <Typography variant="h4" className="text-3xl font-bold text-gray-800">Consulta por Placa</Typography>
        </CardContent>
      </Card>
      
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <div className="flex items-center space-x-4 gap-4">
          <TextField
            id="place-input"
            label="Placa"
            placeholder="Digite a placa"
            variant="outlined"
            value={placaInput}
            onChange={(e) => setPlacaInput(e.target.value.toUpperCase())}
          />          
          <Button
            variant='contained'
            onClick={() => handleSearch()}
            disabled={loading} 
            size="large"           
          >
            {loading ? 'Buscando...' : 'Buscar'}
          </Button>          
        </div>
      </div>
      
      <div style={{ height: 600, width: '100%' }} className="bg-white rounded-lg shadow-sm">
        <DataGrid
          rows={rows}
          columns={columns}
          rowCount={rowCount}
          loading={loading}
          pageSizeOptions={[10, 25, 50]}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          paginationMode="server" // MUITO IMPORTANTE: para paginação no servidor
          getRowClassName={(params) => {
            // params.id aqui é o ID da linha que está sendo renderizada
            // Comparamos com o ID que guardamos no nosso estado
            return params.id === latestRowId 
                ? 'bg-orange-100 font-semibold' // Classe do Tailwind para a linha mais recente
                : '';                           // Nenhuma classe extra para as outras
          }}
          slots={{
                    pagination: CustomPagination
                }}
          sx={{
            // ... (seus outros estilos para o header, etc.)

            // Garante que a nossa classe de destaque tenha prioridade sobre a cor do hover
            '& .MuiDataGrid-row.bg-orange-100:hover': {
                backgroundColor: '#FFF7ED !important', // Mantém a cor do hover, mas podemos torná-la mais forte
            },

            // Garante que a nossa classe de destaque tenha prioridade sobre a cor da linha ímpar (zebra)
            '& .MuiDataGrid-row:nth-of-type(odd).bg-orange-100': {
                backgroundColor: '#FFEAD5', // Um tom de laranja um pouco diferente para manter o contraste
            },
          }}
          
        />
      </div>
    </div>
  );
}

// 'use client';

// import { useState } from "react";
// import { buscarPorPlaca } from "../services/RadarService";
// import DetailsTable from "../components/DetailsTable";
// import { Card, CardContent, Typography, TextField, Button } from "@mui/material";
// import QueriesCard from "../components/QueriesCard";
// import Head from "next/head";
// import Sidebar from "../components/Sidebar";
// import Header from "../components/Header";

// const PesquisaPlacaPage = () => {
//     return (
//         <>        
//           <Header title="Pequisa por placa" />
//           <QueriesCard />
//         </>
//       );
// }
 
// export default PesquisaPlacaPage;