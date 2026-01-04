import CustomPagination from "@/app/components/CustomPagination";
import { RadarsDTO } from "@/app/types/types";
import { Box, Button, Card, CardContent, Chip, CircularProgress, Typography } from "@mui/material";
import { DataGrid, GridColDef, GridPaginationModel } from "@mui/x-data-grid";
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
            width: 130,
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
            width: 110, 
            headerAlign: 'center', 
            align: 'center' 
        },
        { 
            field: 'placa', 
            headerName: 'Placa', 
            width: 130, 
            headerAlign: 'center', 
            align: 'center',
            renderCell: (params) => (
                <Chip 
                    label={params.value} 
                    size="medium"
                    variant="outlined"
                    sx={{ 
                      fontWeight: 600,
                      bgcolor: '#3f51b5',
                      color: 'white',
                      fontFamily: 'Roboto',
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
            width: 140, 
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
            <Box 
                sx={{ 
                    background: 'linear-gradient(135deg, #14213d 0%, #1a2b4a 100%)', 
                    padding: '20px 24px' 
                }}
            >
                <div className="flex justify-between items-center flex-wrap gap-4">
                    {/* Left Side: Title and Stats */}
                    <div>
                        <Typography 
                            variant="h6" 
                            className="font-bold text-white mb-1"
                            sx={{ letterSpacing: '-0.3px' }}
                        >
                            Resultados da Pesquisa
                        </Typography>
                        
                        {/* Contador de Registros */}
                        {hasSearched && (
                            <div className="flex items-center gap-2">
                                <TrendingUpIcon sx={{ color: '#fca311', fontSize: 18 }} />
                                <Typography variant="body2" className="text-gray-300">
                                    <strong className="text-white">{rowCount}</strong> {rowCount === 1 ? 'registro encontrado' : 'registros encontrados'}
                                </Typography>
                            </div>
                        )}
                        
                        {/* Mensagem inicial */}
                        {!hasSearched && (
                            <Typography variant="body2" className="text-gray-400">
                                Configure os filtros e clique em buscar
                            </Typography>
                        )}
                    </div>

                    {/* Right Side: Export Button */}
                    <Button
                        variant="contained"
                        onClick={onExportCSV}
                        disabled={!hasSearched || isExporting || rowCount === 0}
                        startIcon={
                            isExporting ? 
                            <CircularProgress size={18} sx={{ color: 'white' }} /> : 
                            <FileDownloadIcon />
                        }
                        sx={{
                            minWidth: '180px',
                            height: '42px',
                            bgcolor: '#059669',
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '15px',
                            textTransform: 'none',
                            boxShadow: '0 4px 14px rgba(5, 150, 105, 0.4)',
                            '&:hover': {
                                bgcolor: '#047857',
                                boxShadow: '0 6px 20px rgba(5, 150, 105, 0.5)',
                                transform: 'translateY(-2px)',
                            },
                            '&:disabled': {
                                bgcolor: 'rgba(255, 255, 255, 0.1)',
                                color: 'rgba(255, 255, 255, 0.3)',
                            },
                            transition: 'all 0.3s ease',
                        }}
                    >
                        {isExporting ? 'Gerando Excel...' : 'Exportar Excel'}
                    </Button>
                </div>
            </Box>

            {/* DataGrid Section */}
            <CardContent className="p-0">
                <Box sx={{ height: 650, width: '100%' }}>
                    <DataGrid 
                        rows={rows}
                        columns={columns}
                        rowCount={rowCount}
                        loading={loading}
                        pageSizeOptions={[5, 10, 20, 50]}
                        paginationMode="server"
                        paginationModel={paginationModel}
                        onPaginationModelChange={onPaginationModelChange}
                        hideFooter={!hasSearched}
                        autoHeight={false}
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
