import CustomPagination from "@/app/components/CustomPagination";
import { RadarsDTO } from "@/app/types/types";
import { Box, Button, Card, CardContent, Chip, CircularProgress, IconButton, Tooltip, Typography } from "@mui/material";
import { DataGrid, GridColDef, GridPaginationModel, GridToolbarContainer } from "@mui/x-data-grid";
import { Download, FileSpreadsheet } from "lucide-react";
import { useMemo } from "react";
import CustomNoRowsOverlay from "./CustomNoRowsOverlay";
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

interface GeoResultsGridProps {
    rows: RadarsDTO[];
    rowCount: number;
    loading: boolean;
    paginationModel: GridPaginationModel;
    onPaginationModelChange: (model: GridPaginationModel) => void;
    onExportCSV: () => Promise<void>;
    isExporting: boolean;   
    hasSearched: boolean;
}

export default function GeoResultsGrid({
    rows,
    rowCount,
    loading,
    paginationModel,
    onPaginationModelChange,
    onExportCSV,
    isExporting,
    hasSearched
}: GeoResultsGridProps) {

    // Definição das colunas da DataGrid
    const columns = useMemo<GridColDef[]>(() => [
        {
            field: 'data',
            headerName: 'Data',
            width: 150,
            headerAlign: 'center',
            align: 'center',
            valueFormatter: (value: string) => {
                if (!value) return '';
                const date = new Date(`${value}T00:00:00`);
                return date.toLocaleDateString('pt-BR');
            }
        },
        {
            field: 'hora', 
            headerName: 'Hora', 
            width: 130, 
            headerAlign: 'center', 
            align: 'center' 
        },
        { 
            field: 'placa', 
            headerName: 'Placa', 
            width: 150, 
            headerAlign: 'center', 
            align: 'center',
            renderCell: (params) => (
                <Chip 
                    label={params.value} 
                    size="small"
                    sx={{ 
                        fontWeight: 600,
                        bgcolor: '#14213d',
                        color: 'white',
                        fontFamily: 'monospace',
                        letterSpacing: '0.5px'
                    }}
                />
            ) 
        },
        {
            field: 'praca', 
            headerName: 'Praça', 
            width: 220, 
            headerAlign: 'left'
        },  
        { 
            field: 'rodovia', 
            headerName: 'Rodovia', 
            width: 250, 
            headerAlign: 'center', 
            align: 'center',
            renderCell: (params) => (
                <span style={{ fontWeight: 600, color: '#14213d' }}>
                    {params.value}
                </span>
            )
        },
        {
            field: 'km', 
            headerName: 'KM', 
            width: 100, 
            headerAlign: 'center', 
            align: 'center'
        },
        { 
            field: 'sentido', 
            headerName: 'Sentido', 
            width: 140,
            headerAlign: 'center',
            align: 'center',
        },
    ], []);

    return (
        <Card className="shadow-lg overflow-hidden">
            {/* Header Section */}
            <Box sx={{ background: 'linear-gradient(135deg, #14213d 0%, #1a2b4a 100%)', padding: '20px 24px' }}>
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <div>
                        <Typography variant="h6" className="font-bold text-white mb-1">
                            Resultados da Pesquisa
                        </Typography>
                        
                        {/* Correção da Lógica de Exibição do Contador */}
                        <div className="flex items-center gap-2 h-6">
                            {hasSearched ? (
                                <>
                                    <TrendingUpIcon sx={{ color: '#fca311', fontSize: 18 }} />
                                    <Typography variant="body2" className="text-gray-300">
                                        <strong className="text-white">{rowCount}</strong> registros encontrados
                                    </Typography>
                                </>
                            ) : (
                                <Typography variant="body2" className="text-gray-400">
                                    Aguardando busca...
                                </Typography>
                            )}
                        </div>
                    </div>

                    <Button
                        variant="contained"
                        onClick={onExportCSV}
                        disabled={!hasSearched || isExporting || rowCount === 0}
                        startIcon={isExporting ? <CircularProgress size={18} sx={{ color: 'white' }} /> : <FileDownloadIcon />}
                        sx={{ bgcolor: '#059669', color: 'white', fontWeight: 600, textTransform: 'none' }}
                    >
                        {isExporting ? 'Gerando Excel...' : 'Exportar Excel'}
                    </Button>
                </div>
            </Box>

            {/* DataGrid Section */}
            <CardContent className="p-0">
                <Box sx={{ height: 600, width: '100%' }}>
                    <DataGrid 
                        paginationMode="server" // ESSENCIAL: Corrige o erro do MUI
                        rowCount={rowCount || 0} // Garante que nunca seja undefined
                        loading={loading}
                        rows={rows}
                        // -----------------------------

                        pageSizeOptions={[5, 10, 20, 50]}
                        paginationModel={paginationModel}
                        onPaginationModelChange={onPaginationModelChange}
                        columns={columns}
                        getRowId={(row) => row.id || `${row.placa}-${row.data}-${row.hora}-${Math.random()}`}
                        slots={{
                            pagination: CustomPagination,
                            noRowsOverlay: () => <CustomNoRowsOverlay hasSearched={hasSearched} />
                        }}
                        sx={{
                            border: 'none',
                            '& .MuiDataGrid-columnHeaders': {
                                bgcolor: '#14213d',
                                color: 'white',
                                fontSize: '14px',
                                fontWeight: 600,
                                borderRadius: 0,
                                minHeight: '56px !important',
                                maxHeight: '56px !important',
                            },
                            '& .MuiDataGrid-columnHeader': {
                                outline: 'none !important',
                            },
                            '& .MuiDataGrid-columnHeaderTitle': {
                                fontWeight: 600,
                                color: '#134074',
                            },
                            '& .MuiDataGrid-columnSeparator': {
                                color: 'rgba(255,255,255,0.2)',
                            },
                            '& .MuiDataGrid-row': {
                                '&:hover': {
                                    bgcolor: '#fef3e2',
                                },
                                '&.Mui-selected': {
                                    bgcolor: '#fef9f0 !important',
                                },
                            },
                            '& .MuiDataGrid-cell': {
                                borderColor: '#f3f4f6',
                                fontSize: '14px',
                            },
                            '& .MuiDataGrid-footerContainer': {
                                borderTop: '2px solid #f3f4f6',
                                bgcolor: '#fafafa',
                            },
                            '& .MuiTablePagination-root': {
                                color: '#14213d',
                            },
                            '& .MuiDataGrid-virtualScroller': {
                                bgcolor: 'white',
                            },
                        }}
                    />
                </Box>
            </CardContent>
        </Card>
    );
}
