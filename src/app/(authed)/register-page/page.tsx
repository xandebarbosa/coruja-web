'use client';

import { Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControlLabel, FormGroup, InputAdornment, Paper, Switch, TextareaAutosize, TextField, Typography } from '@mui/material'
import { DataGrid, GridActionsCellItem, GridColDef, GridRenderCellParams, GridRowId, GridRowParams } from '@mui/x-data-grid'
import  { ReactNode, useCallback, useEffect, useState } from 'react'
import CustomPagination from '../../components/CustomPagination'
import {SearchOutlined, AddOutlined, Delete, DeleteOutlined, EditOffOutlined, EditDocument, EditNoteOutlined, VisibilityOffRounded} from '@mui/icons-material';
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
    const [open, setOpen] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);

    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [selectedPlate, setSelectedPlate] = useState<MonitoredPlate | null>(null);
    const [editingPlate, setEditingPlate] = useState<MonitoredPlate | null>(null);    

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
                await createMonitoredPlate(formData);
                console.log("FormData ==> ", formData);
                toast.success(`Placa ${formData.placa} adicionada ao monitoramento!`);
            }
            handleCloseDialog();
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

    const columns: GridColDef[] = [
      { field: 'createdAt', headerName: 'Data', width: 180, 
        // A função agora espera um array de números (number[]) em vez de uma string.
        valueFormatter: (value: number[]) => {
          if (!value || !Array.isArray(value) || value.length < 6) {
            return ''; // Retorna vazio se o dado não for um array válido
          }        
          // Extrai as partes do array
          const [year, month, day, hour, minute, second] = value;
        
          // IMPORTANTE: O construtor de Date em JavaScript usa meses baseados em zero (0=Janeiro, 1=Fevereiro...)
          // Por isso, subtraímos 1 do mês que vem do backend (que é 1-based).
          const date = new Date(year, month - 1, day, hour, minute, second);
        
          // Formata a data e a hora para o padrão brasileiro
          return date.toLocaleString('pt-BR');
        },
      },
      { field: 'placa', 
        headerName: 'Placa', 
        width: 120, 
        align: 'center', 
        headerAlign: 'center',
         renderCell: (params) => (          
            <strong className="font-bold text-red-600">
                {params.value}
            </strong>
        ),
       },
      { field: 'marcaModelo', headerName: 'Marca/Modelo', width: 150 },
      { field: 'cor', headerName: 'Cor', width: 100 },      
      { field: 'motivo', 
        headerName: 'Motivo', 
        width: 350,
         renderCell: (params) => (
            // Usamos a tag <strong> para dar peso semântico de importância
            // e aplicamos classes do Tailwind para o estilo visual.
            <strong className="font-bold text-blue-700">
                {params.value}
            </strong>
        ),
      },  
      { 
         field: 'telefone', 
         headerName: 'WhatsApp', 
         width: 140,
         renderCell: (params) => (
             params.value ? <span className="text-gray-600 text-sm">{params.value}</span> : '-'
         )
      },      
      { 
            field: 'statusAtivo', 
            headerName: 'Status', 
            width: 120,
            renderCell: (params: GridRenderCellParams): ReactNode => {
                const isAtivo = params.value === true;
                return (
                    <Chip 
                        label={isAtivo ? 'Ativo' : 'Inativo'}
                        color={isAtivo ? 'success' : 'error'}
                        size="small"
                        variant="outlined"
                    />
                );
            }
        },   
        {
            field: 'actions',
            type: 'actions',
            headerName: 'Ações',
            width: 120, // Aumenta um pouco a largura para caber 3 ícones
            cellClassName: 'actions',
            getActions: (params: { id: GridRowId, row: MonitoredPlate }) => [ // Passamos 'row' para o preview
                // NOVO: Botão de Ação para Visualizar
                <GridActionsCellItem
                    key={`preview-${params.id}`}
                    icon={<VisibilityOffRounded />}
                    label="Visualizar"
                    onClick={handlePreviewClick(params.row)}
                />,
                <GridActionsCellItem
                    key={`edit-${params.id}`}
                    icon={<EditNoteOutlined sx={{ color: '#778da9' }} />}
                    label="Editar"
                    onClick={() => handleEditClick(params.row)}
                    color="inherit"
                />,
                <GridActionsCellItem
                    key={`delete-${params.id}`}
                    icon={<Delete sx={{ color: '#e63946' }}/>}
                    label="Deletar"
                    onClick={handleDeleteClick(params.id)}
                    color="default"
                />,
            ],
        },
        { field: 'interessado', headerName: 'Interessado', width: 150 },
    ];

   

  return (
    // 1. Container principal: é um flex container vertical que ocupa 100% da altura
        <div className='h-full flex flex-col gap-4 p-6'>
            
            {/* --- TÍTULO DA PÁGINA --- */}
            {/* Este é o primeiro item do flex. Ele terá sua altura natural. */}
            <Card className='flex-shrink-0 shadow-md'>
                <CardContent>
                    <Typography variant="h4" className="font-bold text-[#778da9]">
                        Cadastro de Veículo / Monitoramento
                    </Typography>
                </CardContent>
            </Card>

            <Paper elevation={3} className="flex-1 flex flex-col overflow-hidden rounded-lg">
                
              {/* Cabeçalho de Ações (dentro do Paper) */}
              <Box className="p-4 flex justify-between items-center border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-2">
                        <Typography variant="body2" className="text-gray-600">Classificado por:</Typography>
                        <Typography variant="body2" className="font-semibold text-gray-800">Data</Typography>
                    </div>
                    <div className="flex items-center gap-4">
                        <TextField
                            placeholder="Buscar placa..."
                            variant="outlined"
                            size="small"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchOutlined color="action" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <Button 
                          variant="contained" 
                          startIcon={<AddOutlined />} 
                          onClick={handleOpenDialog}
                          className="bg-orange-500 hover:bg-orange-600">
                            Inserir Novo
                        </Button>
                        
                    </div>
              </Box>

              {/* Área do DataGrid (ocupa o espaço restante dentro do Paper) */}
              <Box className="flex-1 min-h-0">
                <DataGrid
                  // Removemos a borda padrão para que ele se integre melhor ao Paper
                  rows={rows}
                  columns={columns}
                  rowCount={rowCount}
                  loading={loading}
                  pageSizeOptions={[10, 20, 50, 100]}
                  paginationModel={paginationModel}
                  onPaginationModelChange={setPaginationModel}
                  paginationMode='server'
                  slots={{
                      pagination: CustomPagination,
                      noRowsOverlay: CustomNoRowsOverlay
                  }}
                  sx={{
                    // Remove a borda padrão do DataGrid para um visual mais limpo e integrado ao Paper
                    border: 'none',

                    // Estiliza o container principal do cabeçalho
            

                    // Garante que os ÍCONES do cabeçalho (setas de ordenação, menu) também fiquem brancos
                  '& .MuiDataGrid-iconButtonContainer .MuiButtonBase-root': {
                      color: '#FFFFFF',
                  },
                  '& .MuiDataGrid-menuIcon .MuiButtonBase-root': {
                      color: '#FFFFFF',
                  },

                  // Estilos para as linhas que já estavam funcionando
                  '& .MuiDataGrid-row:nth-of-type(odd)': {
                      backgroundColor: '#F8FAFC', // Cinza bem claro para efeito zebra
                  },
            
                  '& .MuiDataGrid-row:hover': {
                      backgroundColor: '#FFF7ED', // Laranja bem claro no hover
                  },

                  // Garante que as células não tenham bordas verticais, para um visual mais limpo
                  '& .MuiDataGrid-cell': {
                      borderBottom: '1px solid #E0E0E0',
                  },
                  }}
                />
              </Box>

              <PreviewDialog
                open={isPreviewOpen}
                onClose={handleClosePreview}
                data={selectedPlate}
              />

              <RegisterFormDialog
                open={isFormOpen}
                onClose={handleCloseDialog}
                onSubmit={handleFormSubmit}
                initialData={editingPlate}
              />
              
            </Paper>
        </div>
  )
}
