import React from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { RadarsDTO } from '../../../types/types';
import ResponsiveDataGrid from '../../../components/ResponsiveDataGrid';

interface SelectivePassagesTableProps {
    passagens: (RadarsDTO & { uid?: string })[];
    rowSelectionModel: any[];
    onSelectionChange: (newSelection: any[]) => void;
}

export default function SelectivePassagesTable({
    passagens,
    rowSelectionModel,
    onSelectionChange,
}: SelectivePassagesTableProps) {

    const columns: GridColDef[] = [
        {
            field: 'data',
            headerName: 'Data',
            width: 130,
            headerAlign: 'center',
            align: 'center',
            valueFormatter: (value: string) => {
                if (!value) return '';
                const date = new Date(`${value}T00:00:00`);
                return date.toLocaleDateString('pt-BR');
            }
        },
        { field: 'hora', headerName: 'Hora', width: 130 },
        { field: 'concessionaria', headerName: 'Concessionária', width: 150 },
        { field: 'rodovia', headerName: 'Rodovia', width: 120 },
        { field: 'km', headerName: 'KM', width: 100 },
        { field: 'sentido', headerName: 'Sentido', width: 120 },
    ];

    if (!passagens || passagens.length === 0) return null;

    return (
        <ResponsiveDataGrid height={400} minWidth={640}>
            <DataGrid
                rows={passagens}
                columns={columns}
                getRowId={(row) => row.uid || row.id}
                checkboxSelection
                disableRowSelectionOnClick
                rowSelectionModel={{ type: 'include', ids: new Set(rowSelectionModel) } as any}
                onRowSelectionModelChange={(newSelection) => {
                    const raw = newSelection as unknown as any;
                    if (raw && typeof raw === 'object' && raw.ids instanceof Set) {
                        onSelectionChange(Array.from(raw.ids));
                    } else if (Array.isArray(raw)) {
                        onSelectionChange(raw);
                    } else {
                        onSelectionChange([]);
                    }
                }}
                initialState={{
                    pagination: { paginationModel: { page: 0, pageSize: 10 } },
                }}
                pageSizeOptions={[5, 10, 20, 50]}
                sx={{
                    border: 'none',
                    '& .MuiDataGrid-columnHeaders': {
                        bgcolor: '#f8f9fa',
                        borderBottom: '2px solid #e9ecef',
                    },
                    '& .MuiDataGrid-row:hover': { bgcolor: '#fef3e2' },
                }}
            />
        </ResponsiveDataGrid>
    );
}