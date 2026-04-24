'use client';

import { alpha, Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControlLabel, FormGroup, InputAdornment, Paper, Switch, TextareaAutosize, TextField, Tooltip, Typography } from '@mui/material'
import { DataGrid, GridActionsCellItem, GridColDef, GridRenderCellParams, GridRowId, GridRowParams } from '@mui/x-data-grid'
import  { ReactNode, useCallback, useEffect, useState } from 'react'
import CustomPagination from '../../components/CustomPagination'
import {SearchOutlined, AddOutlined, Delete, DeleteOutlined, EditOffOutlined, EditDocument, EditNoteOutlined, VisibilityOffRounded, Visibility, TrendingUp, DirectionsCar} from '@mui/icons-material';
import RegisterFormDialog from './components/RegisterFormDialog';
import { toast } from 'react-toastify';
import { createMonitoredPlate, deleteMonitoredPlate, updateMonitoredPlate } from '../../services';
import { monitoringService } from '../../services'
import PreviewDialog from './components/PreviewDialog';
import CustomNoRowsOverlay from '../../components/CustomNoRowsOverlay';
import { MonitoredPlate, MonitoredPlateFormData } from '@/app/types/types';

export default function RegisterPage() {
    const [rows, setRows] = useState<MonitoredPlate[]>([]);
    const [loading, setLoading] = useState(false);
    const [rowCount, setRowCount] = useState(0);
    const [paginationModel, setPaginationModel] = useState({
      page: 0,
      pageSize: 10,
    });
    
    const [isFormOpen, setIsFormOpen] = useState(false);

    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [selectedPlate, setSelectedPlate] = useState<MonitoredPlate | null>(null);
    const [editingPlate, setEditingPlate] = useState<MonitoredPlate | null>(null); 
    const [searchTerm, setSearchTerm] = useState('');      

     // Função para buscar e atualizar os dados da tabela
    const fetchAndSetData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await monitoringService.getMonitoredPlates(
                paginationModel.page, 
                paginationModel.pageSize,                
                'createdAt,desc' 
            );
            setRows(data.content || []); // Garante que rows seja sempre um array
            setRowCount(data?.totalElements || 0);
        } catch (error) {
            toast.warn("Não foi possível carregar os dados. O serviço pode estar offline.");
            console.error("Erro ao buscar dados de monitoramento:", error);
            setRows([]);
            setRowCount(0);
        } finally {
            setLoading(false);
        }
    }, [paginationModel]);

    // Busca os dados quando a página carrega ou a paginação muda
    useEffect(() => {
        fetchAndSetData();
    }, [fetchAndSetData]);
    
    // Função de submit agora lida com CRIAR e ATUALIZAR
    const handleFormSubmit = async (formData: MonitoredPlateFormData, id?: number) => {
        try {
            if (id) {
                // Se existe um ID, estamos editando
                await updateMonitoredPlate(id, formData);
                toast.success(`Monitoramento - Placa ${formData.placa} atualizada com sucesso!`);
            } else {
                // Se não há ID, estamos criando                
                await monitoringService.createMonitoredPlate(formData);
                console.log("FormData ==> ", formData);
                toast.success(`Placa ${formData.placa} adicionada ao monitoramento!`);
            }
            setIsFormOpen(false);
            fetchAndSetData(); // Recarrega a tabela para mostrar as mudanças
        } catch (error) {
            toast.error("Erro ao salvar os dados.");
            console.error("Erro no formulário de submissão:", error);
        }
    };

    const handleOpenAddDialog = () => {
        setEditingPlate(null); // Garante que não há dados de edição
        setIsFormOpen(true);
    };

    const handleEditClick = (plateData: MonitoredPlate) => {
        setEditingPlate(plateData); // Guarda os dados da placa selecionada
        setIsFormOpen(true);
    };

    const handleDeleteClick = (id: GridRowId) => async () => {
        if (window.confirm("Tem certeza que deseja remover esta placa do monitoramento?")) {
            try {
                await deleteMonitoredPlate(Number(id));
                toast.success("Placa removida do monitoramento.");
                fetchAndSetData(); // Recarrega a tabela para remover a linha
            } catch (error) {
                toast.error("Erro ao remover a placa.");
                console.error("Erro ao deletar monitoramento:", error);
            }
        }
    };

     const handleOpenDialog = () => {
      setIsFormOpen(true);
    };

    const handleCloseDialog = () => {
      setIsFormOpen(false);
    };

    const handlePreviewClick = (row: MonitoredPlate) => () => {
        setSelectedPlate(row); // Guarda os dados da linha selecionada
        setIsPreviewOpen(true); // Abre o dialog
    };

    // NOVO: Função para fechar o dialog
    const handleClosePreview = () => {
        setIsPreviewOpen(false);
    };

    const columns: GridColDef[] = [
      { 
        field: 'createdAt', 
        headerName: 'Data Cadastro', 
        width: 130,
        headerAlign: 'center',
        align: 'center', 
        // A função agora espera um array de números (number[]) em vez de uma string.
        valueFormatter: (value: number[]) => {
          if (!value || !Array.isArray(value) || value.length < 3) {
            return ''; // Retorna vazio se o dado não for um array válido
          }        
          // Extraímos os valores garantindo fallbacks seguros para horas caso não existam
          const [year, month, day, hour = 0, minute = 0, second = 0] = value;        
          
          // Criamos a data tratando os valores do backend como UTC
          // Lembrando que em JavaScript o mês começa em 0 (Janeiro = 0)
          const dataUtc = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
          
          // Formata no padrão brasileiro forçando o timezone local
          return dataUtc.toLocaleDateString('pt-BR', {
            timeZone: 'America/Sao_Paulo'
          });
        },
      },
      { 
        field: 'createdAt_time', // Usamos um field virtual ou o mesmo field
        headerName: 'Hora', 
        width: 100,
        headerAlign: 'center',
        align: 'center',
        // Mapeamos para o valor de 'createdAt' da linha
        valueGetter: (value, row) => row.createdAt,
        // Formata apenas a Hora
        valueFormatter: (value: number[]) => {
          if (!value || !Array.isArray(value) || value.length < 5) return '';
          
          const [year, month, day, hour, minute, second = 0] = value;
          
          const dataUtc = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
          
          return dataUtc.toLocaleTimeString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });
        },
      },
      { 
        field: 'placa', 
        headerName: 'Placa', 
        width: 140,
        headerAlign: 'center',
        align: 'center',
        renderCell: (params) => (
          <Chip
            label={params.value}
            size="medium"
            sx={{
              fontWeight: 700,
              bgcolor: '#fca311',
              color: '#14213d',
              fontSize: '15px',
              fontFamily: 'Roboto Mono, monospace',
              letterSpacing: '1px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(252, 163, 17, 0.3)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(252, 163, 17, 0.4)',
              }
            }}
          />
        ),
      },
      { 
        field: 'marcaModelo', 
        headerName: 'Marca/Modelo', 
        width: 200,
        renderCell: (params) => (
          <Typography variant="body2" sx={{ fontWeight: 500, color: '#14213d', marginTop: '14px' }}>
            {params.value}
          </Typography>
        )
      },
      { 
        field: 'cor', 
        headerName: 'Cor', 
        width: 120,
        renderCell: (params) => (
          <Chip
            label={params.value}
            size="small"
            variant="outlined"
            sx={{
              borderColor: '#14213d',
              color: '#14213d',
              fontWeight: 500
            }}
          />
        )
      },      
      { 
        field: 'motivo', 
        headerName: 'Motivo', 
        flex: 1,
        minWidth: 300,
        renderCell: (params) => (
          <Tooltip title={params.value || ''} placement="top" arrow>
            <Box
            sx={{
              bgcolor: alpha('#fca311', 0.08),
              px: 2,
              py: 1,
              borderRadius: 1,
              borderLeft: '3px solid #fca311',
              width: '100%',
              my: 0.5,
              overflow: 'hidden',
            }}
          >
            <Typography 
              variant="body2" 
              noWrap // Esta propriedade nativa do MUI adiciona os "..." (text-overflow: ellipsis)
              sx={{ 
                fontWeight: 600, 
                color: '#14213d',
                fontSize: '13px'
              }}
            >
              {params.value}
            </Typography>
          </Box>
          </Tooltip>
        ),
      },      
      { 
        field: 'statusAtivo', 
        headerName: 'Status', 
        width: 120,
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams): ReactNode => {
          const isAtivo = params.value === true;
          return (
            <Chip 
              label={isAtivo ? 'Ativo' : 'Inativo'}
              size="small"
              sx={{
                bgcolor: isAtivo ? '#d4edda' : '#f8d7da',
                color: isAtivo ? '#155724' : '#721c24',
                fontWeight: 600,
                fontSize: '12px',
                borderRadius: '6px',
                px: 1
              }}
            />
          );
        }
      },   
      {
        field: 'actions',
        type: 'actions',
        headerName: 'Ações',
        width: 130,
        headerAlign: 'center',
        getActions: (params: { id: GridRowId, row: MonitoredPlate }) => [
          <GridActionsCellItem
            key={`preview-${params.id}`}
            icon={<Visibility sx={{ color: '#6c757d' }} />}
            label="Visualizar"
            onClick={() => handlePreviewClick(params.row)}
            showInMenu={false}
          />,
          <GridActionsCellItem
            key={`edit-${params.id}`}
            icon={<EditNoteOutlined sx={{ color: '#fca311' }} />}
            label="Editar"
            onClick={() => handleEditClick(params.row)}
            showInMenu={false}
          />,
          <GridActionsCellItem
            key={`delete-${params.id}`}
            icon={<Delete sx={{ color: '#dc3545' }}/>}
            label="Deletar"
            onClick={handleDeleteClick(params.id)}
            showInMenu={false}
          />,
        ],
      },
      { 
        field: 'interessado', 
        headerName: 'Interessado', 
        width: 180,
        renderCell: (params) => (
          <Typography variant="body2" sx={{ color: '#495057', fontWeight: 500, marginTop: '14px' }}>
            {params.value}
          </Typography>
        )
      },
    ];

   

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 via-[#fef9f3] to-gray-50 p-6'>
      {/* Hero Header Card */}
      <Card 
        className='mb-6 overflow-hidden'
        sx={{
          background: 'linear-gradient(135deg, #14213d 0%, #1a2b4a 100%)',
          boxShadow: '0 20px 60px rgba(20, 33, 61, 0.3)',
          borderRadius: '16px',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #fca311 0%, #ff8800 100%)',
          }
        }}
      >
        <CardContent className='py-10 px-8'>
          <div className='flex flex-col md:flex-row items-center justify-between gap-6'>
            <div className='flex items-center gap-5'>
              {/* Icon Container com efeito glass */}
              <Box
                sx={{
                  background: 'rgba(252, 163, 17, 0.15)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(252, 163, 17, 0.3)',
                  borderRadius: '16px',
                  p: 2.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 32px rgba(252, 163, 17, 0.2)',
                }}
              >
                <DirectionsCar sx={{ fontSize: 48, color: '#fca311' }} />
              </Box>
              
              <div>
                <Typography 
                  variant="h3" 
                  className="font-bold text-white mb-2"
                  sx={{ 
                    letterSpacing: '-0.5px',
                    textShadow: '0 2px 10px rgba(0,0,0,0.2)'
                  }}
                >
                  Cadastro de Veículos
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: 'rgba(255,255,255,0.8)',
                    fontSize: '15px',
                    fontWeight: 500
                  }}
                >
                  Gerenciamento completo de placas monitoradas
                </Typography>
              </div>
            </div>

            {/* CTA Button com animação */}
            <Button 
              variant="contained" 
              startIcon={<AddOutlined />} 
              onClick={handleOpenAddDialog}
              size="large"
              sx={{
                minWidth: '200px',
                height: '56px',
                background: 'linear-gradient(135deg, #fca311 0%, #ff8800 100%)',
                color: '#14213d',
                fontWeight: 700,
                fontSize: '16px',
                textTransform: 'none',
                borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(252, 163, 17, 0.4)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #ff8800 0%, #fca311 100%)',
                  boxShadow: '0 12px 32px rgba(252, 163, 17, 0.5)',
                  transform: 'translateY(-2px)',
                },
                '&:active': {
                  transform: 'translateY(0)',
                }
              }}
            >
              Adicionar Veículo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Grid Card */}
      <Card 
        className="overflow-hidden"
        sx={{
          boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
          borderRadius: '16px',
          border: '1px solid rgba(0,0,0,0.06)'
        }}
      >
        {/* Search & Stats Header */}
        <Box 
          sx={{ 
            background: 'linear-gradient(135deg, #14213d 0%, #1a2b4a 100%)',
            padding: '24px 28px',
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            {/* Search Box */}
            <TextField
              placeholder="Buscar por placa..."
              variant="outlined"
              size="medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlined sx={{ color: 'rgba(255,255,255,0.6)' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                width: { xs: '100%', md: '320px' },
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'rgba(255,255,255,0.08)',
                  color: 'white',
                  borderRadius: '12px',
                  transition: 'all 0.3s ease',
                  '& fieldset': {
                    borderColor: 'rgba(255,255,255,0.15)',
                  },
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.12)',
                    '& fieldset': {
                      borderColor: 'rgba(252, 163, 17, 0.5)',
                    },
                  },
                  '&.Mui-focused': {
                    bgcolor: 'rgba(255,255,255,0.15)',
                    boxShadow: '0 0 0 3px rgba(252, 163, 17, 0.2)',
                    '& fieldset': {
                      borderColor: '#fca311',
                    },
                  },
                },
                '& .MuiInputBase-input': {
                  '&::placeholder': {
                    color: 'rgba(255,255,255,0.5)',
                  },
                },
              }}
            />

            {/* Stats Badge */}
            {rowCount > 0 && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  bgcolor: 'rgba(252, 163, 17, 0.15)',
                  border: '1px solid rgba(252, 163, 17, 0.3)',
                  borderRadius: '12px',
                  px: 3,
                  py: 1.5,
                  backdropFilter: 'blur(10px)',
                }}
              >
                <TrendingUp sx={{ color: '#fca311', fontSize: 22 }} />
                <div>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: 'rgba(255,255,255,0.7)',
                      fontSize: '11px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}
                  >
                    Total Cadastrado
                  </Typography>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: 'white',
                      fontWeight: 700,
                      lineHeight: 1,
                      mt: 0.5
                    }}
                  >
                    {rowCount} {rowCount === 1 ? 'veículo' : 'veículos'}
                  </Typography>
                </div>
              </Box>
            )}
          </div>
        </Box>

        {/* DataGrid */}
        <CardContent className="p-0">
          <Box sx={{ height: 700, width: '100%' }}>
            <DataGrid
              rows={rows}
              columns={columns}
              rowCount={rowCount}
              loading={loading}
              pageSizeOptions={[10, 25, 50, 100]}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              paginationMode='server'              
              slots={{
                pagination: CustomPagination,
                noRowsOverlay: CustomNoRowsOverlay
              }}
              initialState={{
                sorting: {
                  sortModel: [{ field: 'createdAt', sort: 'desc'}],
                }
              }}
              sx={{
                border: 'none',
                '& .MuiDataGrid-columnHeaders': {
                  bgcolor: '#f8f9fa',
                  borderBottom: '2px solid #e9ecef',
                  minHeight: '56px !important',
                  maxHeight: '56px !important',
                },
                '& .MuiDataGrid-columnHeader': {
                  outline: 'none !important',
                  '&:focus': {
                    outline: 'none !important',
                  },
                },
                '& .MuiDataGrid-columnHeaderTitle': {
                  fontWeight: 700,
                  fontSize: '13px',
                  color: '#14213d',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                },
                '& .MuiDataGrid-columnSeparator': {
                  color: '#dee2e6',
                },
                '& .MuiDataGrid-row': {
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: '#fef3e2',
                    transform: 'scale(1.001)',
                  },
                  '&.Mui-selected': {
                    bgcolor: alpha('#fca311', 0.08),
                    '&:hover': {
                      bgcolor: alpha('#fca311', 0.12),
                    },
                  },
                },
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid #f1f3f5',
                  fontSize: '14px',
                  color: '#495057',
                  '&:focus': {
                    outline: 'none',
                  },
                },
                '& .MuiDataGrid-footerContainer': {
                  borderTop: '2px solid #e9ecef',
                  bgcolor: '#f8f9fa',
                  minHeight: '56px',
                },
                '& .MuiTablePagination-root': {
                  color: '#14213d',
                },
                '& .MuiDataGrid-virtualScroller': {
                  bgcolor: 'white',
                },
                '& .MuiDataGrid-overlayWrapper': {
                  minHeight: '400px',
                },
              }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <PreviewDialog
        open={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        data={selectedPlate}
      />

      <RegisterFormDialog
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingPlate}
      />
    </div>
  )
}
