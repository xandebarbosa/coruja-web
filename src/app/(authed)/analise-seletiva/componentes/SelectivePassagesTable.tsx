import React from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Box, Chip, Typography } from '@mui/material';
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
            width: 120,
            headerAlign: 'center',
            align: 'center',
            valueFormatter: (value: string) => {
                if (!value) return '';
                const date = new Date(`${value}T00:00:00`);
                return date.toLocaleDateString('pt-BR');
            },
        },
        {
            field: 'hora',
            headerName: 'Hora',
            width: 110,
            headerAlign: 'center',
            align: 'center',
        },
        {
            field: 'concessionaria',
            headerName: 'Concessionária',
            width: 160,
            headerAlign: 'center',
            align: 'center',
        },
        {
            field: 'rodovia',
            headerName: 'Rodovia',
            width: 250,
            headerAlign: 'center',
            align: 'center',
            renderCell: (params) => (
                <Typography sx={{ fontWeight: 600, color: '#14213d', fontSize: '13px', marginTop: '14px' }}>
                    {params.value}
                </Typography>
            ),
        },
        {
            field: 'praca',
            headerName: 'Praça',
            width: 240,
            headerAlign: 'center',
            align: 'center',
        },
        {
            field: 'km',
            headerName: 'KM',
            width: 90,
            headerAlign: 'center',
            align: 'center',
            renderCell: (params) => (
                <Chip
                    label={params.value}
                    size="small"
                    variant="outlined"
                    sx={{ borderColor: '#14213d', color: '#14213d', fontWeight: 600, fontSize: '12px' }}
                />
            ),
        },
        {
            field: 'sentido',
            headerName: 'Sentido',
            width: 130,
            headerAlign: 'center',
            align: 'center',
        },
    ];

    if (!passagens || passagens.length === 0) return null;

    return (
        <Box
            sx={{
                border: '1px solid #e5e7eb',
                borderRadius: '10px',
                overflow: 'hidden',
                // Scroll horizontal para mobile
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch',
                '&::-webkit-scrollbar': { height: 6 },
                '&::-webkit-scrollbar-thumb': {
                    background: 'rgba(0,0,0,0.15)',
                    borderRadius: 3,
                },
            }}
        >
            <Box sx={{ minWidth: 640, height: 380 }}>
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
                            minHeight: '48px !important',
                            maxHeight: '48px !important',
                        },
                        '& .MuiDataGrid-columnHeaderTitle': {
                            fontWeight: 700,
                            fontSize: '12px',
                            color: '#6b7280',
                            textTransform: 'uppercase',
                            letterSpacing: '0.4px',
                        },
                        '& .MuiDataGrid-row': {
                            '&:hover': { bgcolor: '#fef3e2' },
                            '&.Mui-selected': {
                                bgcolor: 'rgba(252,163,17,0.08) !important',
                                '&:hover': { bgcolor: 'rgba(252,163,17,0.12) !important' },
                            },
                        },
                        '& .MuiCheckbox-root.Mui-checked': {
                            color: '#fca311',
                        },
                        '& .MuiDataGrid-cell': {
                            borderBottom: '1px solid #f3f4f6',
                            fontSize: '13px',
                        },
                        '& .MuiDataGrid-footerContainer': {
                            borderTop: '1px solid #e9ecef',
                            bgcolor: '#f9fafb',
                        },
                    }}
                />
            </Box>
        </Box>
    );
}