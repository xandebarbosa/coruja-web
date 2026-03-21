import React from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { RadarsDTO } from '../../../types/types';

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
            valueGetter: (params) => {
                if (!params) return '';
                if (typeof params === 'string') return params;
                const dataObj = new Date(params);
                return dataObj.toLocaleDateString('pt-BR');
            },
        },
        { field: 'hora', headerName: 'Hora', width: 130 },
        { field: 'concessionaria', headerName: 'Concessionária', width: 150 },
        { field: 'rodovia', headerName: 'Rodovia', width: 120 },
        { field: 'km', headerName: 'KM', width: 100 },
        { field: 'sentido', headerName: 'Sentido', width: 120 },
    ];

    if (!passagens || passagens.length === 0) return null;

    return (
        <div style={{ height: 400, width: '100%', backgroundColor: 'white' }}>
            <DataGrid
                rows={passagens}
                columns={columns}
                getRowId={(row) => row.uid || row.id}
                checkboxSelection
                disableRowSelectionOnClick
                // MUI X v8 requires { type: 'include'|'exclude', ids: Set<GridRowId> }
                rowSelectionModel={{ type: 'include', ids: new Set(rowSelectionModel) } as any}
                onRowSelectionModelChange={(newSelection) => {
                    // Extract the Set<GridRowId> from the v8 model shape
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
                    pagination: {
                        paginationModel: { page: 0, pageSize: 10 },
                    },
                }}
                pageSizeOptions={[5, 10, 20, 50]}
            />
        </div>
    );
}