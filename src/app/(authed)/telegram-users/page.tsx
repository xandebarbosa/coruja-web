'use client';

import { monitoringService } from '@/app/services';
import { TelegramUser } from '@/app/types/types';
import { Person, Sync, Telegram } from '@mui/icons-material';
import { Avatar, Box, Button, Card, CardContent, Chip, LinearProgress, Typography } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify';

export default function TelegramUsersPage() {
    const [users, setUsers] = useState<TelegramUser[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [syncing, setSyncing] = useState<boolean>(false);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await monitoringService.getTelegramUsers();
            console.log("TelegramUsers ==> ",data);            
            setUsers(data);
        } catch (error) {
            console.error('Erro ao buscar usuários do Telegram:', error);
            toast.error('Erro ao buscar usuários do Telegram');
        } finally {
            setLoading(false);
        }        
    };

    useEffect(() => {
        fetchUsers();
    },[]);

    const handleSync = async () => {
        setSyncing(true);
        try {
            await monitoringService.syncTelegramUsers();
            toast.success('Sincronização solicitada! Atualizando lista...');
            // Aguarda 2 segundos para dar tempo do backend processar e recarrega
            setTimeout(fetchUsers, 2000);
        } catch (error) {
            console.error('Erro ao sincronizar usuários do Telegram:', error);
            toast.error('Erro ao sincronizar usuários do Telegram');
        } finally {
            setSyncing(false);
        }
    }

    const columns: GridColDef[] = [
        {
            field: 'avatar',
            headerName: '',
            width: 60,
            renderCell: (params) => (
                <Avatar sx={{ bgcolor: '#0088cc' }}>
                    {params.row.primeiroNome.charAt(0).toUpperCase() || <Person />}
                </Avatar>
            )
        },
        { field: 'telegramId', headerName: 'Telegram ID', width: 130 },
        { 
            field: 'nomeCompleto',
            headerName: 'Nome',
            width: 250,
            valueGetter: (params, row) => `${row.primeiroNome || ''} ${row.sobrenome || ''}`.trim()
        },
        { 
            field: 'username', 
            headerName: 'Username', 
            width: 150,
            renderCell: (params) => params.value ? (
                <Chip
                    label={`@${params.value}`}
                    size="small"
                    variant="outlined"
                    color="primary"
                    icon={<Telegram fontSize="small" />}
                />
            ) : '-'
        },
        { 
            field: 'dataCadastro', 
            headerName: 'Cadastrado em', 
            width: 180,
            valueFormatter: (value) => new Date(value).toLocaleString('pt-BR')
        },
        { 
            field: 'ultimoAcesso', 
            headerName: 'Último Acesso', 
            width: 180,
            valueFormatter: (value) => value ? new Date(value).toLocaleString('pt-BR') : '-'
        },
    ];

  return (
    <div className='min-h-screen bg-gray-50 p-6'>
        <Card sx={{ mb: 4, borderRadius: 3, boxShadow: 3 }}>
            <Box
                sx={{
                    p: 3,
                    background: 'linear-gradient(135deg, #0088cc 0%, #005f8f 100%)',
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center', 
                }}
            >
             <Box display="flex" alignItems="center" gap={2}>
                        <Telegram sx={{ fontSize: 40 }} />
                        <div>
                            <Typography variant="h5" fontWeight="bold">
                                Usuários do Telegram
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                Lista de pessoas que iniciaram o seu Bot
                            </Typography>
                        </div>
                    </Box>
                    <Button 
                        variant="contained" 
                        color="secondary"
                        startIcon={<Sync className={syncing ? "animate-spin" : ""} />}
                        onClick={handleSync}
                        disabled={syncing}
                        sx={{ bgcolor: 'white', color: '#0088cc', '&:hover': { bgcolor: '#f0f9ff' } }}
                    >
                        {syncing ? 'Sincronizando...' : 'Sincronizar Agora'}
                    </Button>   
            </Box>

            <CardContent>
                {(loading || syncing) && <LinearProgress sx={{ mb: 2 }}/>}

                <div style={{ height: 600, width: '100%'}}>
                    <DataGrid
                        rows={users}
                        columns={columns}
                        getRowId={(row) => row.id}
                        loading={loading}
                        disableRowSelectionOnClick
                        sx={{ border: 'none' }}                        
                    />
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
