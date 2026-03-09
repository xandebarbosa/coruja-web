import React from 'react';
import { DataGrid, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import { RadarsDTO } from '../../../types/types';

interface SelectivePassagesTableProps {
    passagens: (RadarsDTO & { uid?: string })[]; 
    rowSelectionModel: GridRowSelectionModel;
    onSelectionChange: (newSelection: GridRowSelectionModel) => void; 
}

export default function SelectivePassagesTable({ 
    passagens, 
    rowSelectionModel, 
    onSelectionChange 
}: SelectivePassagesTableProps) {
    
    // Definição das colunas baseadas na sua imagem e estrutura de dados
    const columns: GridColDef[] = [
        { 
            field: 'data', 
            headerName: 'Data', 
            width: 130,
            valueGetter: (params) => {
                // Formatação simples para garantir que a data fica bonita na tabela (opcional)
                if (!params) return '';
                if (typeof params === 'string') return params;
                const dataObj = new Date(params);
                return dataObj.toLocaleDateString('pt-BR');
            }
        },
        { field: 'hora', headerName: 'Hora', width: 130 },
        { field: 'concessionaria', headerName: 'Concessionária', width: 150 },
        { field: 'rodovia', headerName: 'Rodovia', width: 120 },
        { field: 'km', headerName: 'KM', width: 100 },
        { field: 'sentido', headerName: 'Sentido', width: 120 },
    ];

    if (!passagens || passagens.length === 0) {
        return null; // Não renderiza nada se não houver dados
    }

    return (
        <div style={{ height: 400, width: '100%', backgroundColor: 'white' }}>
            <DataGrid
                rows={passagens}
                columns={columns}
                // O DataGrid exige um ID único para funcionar corretamente com as checkboxes
                getRowId={(row) => row.uid || row.id} 
                checkboxSelection
                disableRowSelectionOnClick // Evita selecionar ao clicar no texto da linha, apenas na checkbox
                onRowSelectionModelChange={(newSelection) => {
                    onSelectionChange(newSelection);
                }}
                rowSelectionModel={rowSelectionModel}
                initialState={{
                    pagination: {
                        paginationModel: { page: 0, pageSize: 10 },
                    },
                }}
                pageSizeOptions={[5, 10, 20, 50]}
            />
        </div>
    );
}