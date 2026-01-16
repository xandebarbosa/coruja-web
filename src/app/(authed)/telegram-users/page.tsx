'use client';

import { monitoringService } from '@/app/services';
import { TelegramService } from '@/app/services/telegram';
import { UsuarioTelegram } from '@/app/types/types';
import { Person, Sync, Telegram } from '@mui/icons-material';
import { Avatar, Box, Button, Card, CardContent, Chip, LinearProgress, Typography } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Activity, CloudDownload, Download, Eye, EyeOff, RefreshCw, Search, UserPlus, Users } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify';

export default function TelegramUsersPage() {
    const [users, setUsers] = useState<UsuarioTelegram[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [syncing, setSyncing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState('');    
    const [selectedPeriod, setSelectedPeriod] = useState('month');  
    const [visibleIds, setVisibleIds] = useState<Set<string | number>>(new Set());

    // Função para alternar visibilidade de um ID específico
    const toggleIdVisibility = (id: string | number) => {
    setVisibleIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id); // Se já está visível, remove (oculta)
      } else {
        newSet.add(id); // Se não está, adiciona (mostra)
      }
      return newSet;
    });
  };

    // Função para mostrar/ocultar todos os IDs
    // const toggleAllIds = () => {
    //   if (hiddenIds.size === users.length) {
    //     setHiddenIds(new Set());
    //     setAllIdsHidden(false);
    //   } else {
    //     setHiddenIds(new Set(users.map(u => String(u.telegramId))));
    //     setAllIdsHidden(true);
    //   }
    // };

    // Função para buscar usuários do banco de dados
    const fetchUsers = async () => {
       setLoading(true);
       setError(null);
       try {
         const data = await TelegramService.getAll();
         console.log("TelegramService.getAll ==>", data);         
         setUsers(data);
       } catch (error) {
         toast.error('Erro ao carregar usuários.');
       } finally {
         setLoading(false);
       }
    };

    useEffect(() => {
        fetchUsers();
    },[]);

    // Inicializar todos os IDs como ocultos quando os usuários são carregados
    // useEffect(() => {
    //   if (users.length > 0 && allIdsHidden) {
    //     setHiddenIds(new Set(users.map(u => String(u.telegramId))));
    //   }
    // }, [users, allIdsHidden]);

    // Sincroniza com a API do Telegram (Busca novos)
    const handleSync = async () => {
        setSyncing(true);
        try {
          const novosUsuarios = await TelegramService.sync();
          // Atualiza a lista com o retorno da sincronização
          setUsers(novosUsuarios); 
      
          const diferenca = novosUsuarios.length - users.length;
          if (diferenca > 0) {
            toast.success(`${diferenca} novos usuários encontrados!`);
          } else {
            toast.info('Sincronização concluída. Base já está atualizada.');
          }
        } catch (error) {
          toast.error('Erro ao sincronizar com o Telegram.');
        } finally {
          setSyncing(false);
        }
    };

    // Lógica de Filtro (Memoized para performance)
    const filteredRows = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return users.filter((user) => {
          const nomeCompleto = `${user.primeiroNome || ''} ${user.sobrenome || ''}`.toLowerCase();
          const username = user.username?.toLowerCase() || '';
          const telegramId = String(user.telegramId || '');

          return nomeCompleto.includes(term) || 
                 username.includes(term) || 
                 telegramId.includes(term);
        });
    }, [users, searchTerm]);

   
    // Função para determinar status baseado no último acesso
    const getStatus = (ultimoAcesso: string) => {
      const dataAcesso = new Date(ultimoAcesso);
      const agora = new Date();
      const diffDias = Math.floor((agora.getTime() - dataAcesso.getTime()) / (1000 * 60 * 60 * 24));
    
      if (diffDias <= 7) return 'active';
      if (diffDias <= 30) return 'inactive';
      return 'dormant';
    };

    // Cálculo de Estatísticas (Memoized)
    const stats = useMemo(() => {
      const total = users.length;
      // Exemplo: considerando ativos quem tem "active" (ajuste conforme sua lógica real de data)
      const ativos = users.filter(u => getStatus(u.ultimoAcesso) === 'active').length; 
    
      // Usuários cadastrados nos últimos 30 dias
      const trintaDiasAtras = new Date();
      trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
    
      // Tratamento seguro para data que pode vir como array [ano, mes, dia] ou string
      const novos = users.filter(u => {
        if (!u.dataCadastro) return false;
        const data = Array.isArray(u.dataCadastro) 
          ? new Date(u.dataCadastro[0], u.dataCadastro[1] - 1, u.dataCadastro[2])
          : new Date(u.dataCadastro);
        return data >= trintaDiasAtras;
      }).length;

      return { total, ativos, novos };
    }, [users]);    

    const statsCards = [
      { 
        label: 'Total de Usuários', 
        value: stats.total.toLocaleString('pt-BR'), 
        icon: Users,
        color: 'bg-gradient-to-br from-[#fca311] to-[#ffb84d]'
      },
      { 
        label: 'Novos (30 dias)', 
        value: stats.novos.toLocaleString('pt-BR'), 
        icon: UserPlus,
        color: 'bg-gradient-to-br from-[#14213d] to-[#1e3a5f]'
      },
      
  ];    

  // Formatter seguro de data (Aceita Array Java ou String ISO)
  const safeDateFormatter = (value: any) => {
    if (!value) return '-';
    // Se for array do Java [2024, 1, 30]
    if (Array.isArray(value) && value.length >= 3) {
      return new Date(value[0], value[1] - 1, value[2]).toLocaleDateString('pt-BR');
    }
    // Se for string
    const date = new Date(value);
    return isNaN(date.getTime()) ? '-' : date.toLocaleDateString('pt-BR');
  };  

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Erro ao Carregar</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchUsers}
            className="px-6 py-3 bg-[#fca311] hover:bg-[#ffb84d] text-white rounded-lg transition-all duration-200 font-semibold"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }
   
    // Configuração das colunas do DataGrid
  const columns: GridColDef[] = [
    {
      field: 'avatar',
      headerName: '',
      width: 70,
      sortable: false,
      renderCell: (params) => (
        <Avatar 
          sx={{ 
            bgcolor: '#fca311',
            width: 40,
            height: 40,
            fontWeight: 600
          }}
        >
          {params.row.primeiroNome?.charAt(0)?.toUpperCase() || '?'}
        </Avatar>
      )
    },
    {
        field: 'telegramId',
        headerName: 'Telegram ID',
        width: 200,
        headerAlign: 'center',
        align: 'center',
        renderCell: (params) => {
          // Verifica se este ID específico está no Set de visíveis
          const isVisible = visibleIds.has(params.row.id || params.row.telegramId);
          const displayValue = isVisible ? params.value : '•••••••••••••';
          
          return (
            <div className="flex items-center justify-between w-full pr-2 pl-2 pt-2">
              <span 
                className={`font-mono text-sm ${isVisible ? 'text-gray-600' : 'text-gray-400 tracking-widest'}`}
              >
                {displayValue}
              </span>
              
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Evita selecionar a linha do grid ao clicar
                  toggleIdVisibility(params.row.id || params.row.telegramId);
                }}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-[#fca311]"
                title={isVisible ? 'Ocultar ID' : 'Mostrar ID'}
              >
                {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          );
        }
      },
    { 
      field: 'nomeCompleto',
      headerName: 'Nome',
      width: 350,
      valueGetter: (value, row) => `${row.primeiroNome || ''} ${row.sobrenome || ''}`.trim(),
      renderCell: (params) => (
        <div>
          <div style={{ fontWeight: 600, color: '#111827' }}>
            {params.value}
          </div>
        </div>
      )
    },
    { 
      field: 'username', 
      headerName: 'Nome usuário', 
      width: 230,
      renderCell: (params) => params.value ? (
        <Chip
          label={`@${params.value}`}
          size="small"
          sx={{
            bgcolor: '#fef3e2',
            color: '#14213d',
            fontWeight: 500,
            border: '1px solid #fca311'
          }}
        />
      ) : (
        <span style={{ color: '#9ca3af' }}>-</span>
      )
    },
    { 
      field: 'dataCadastro', 
      headerName: 'Cadastrado em', 
      width: 180,
      headerAlign: 'center',
      align: 'center',
      valueFormatter: (value: number[]) => {
          if (!value || !Array.isArray(value) || value.length < 3) return '';
          return new Date(value[0], value[1] - 1, value[2]).toLocaleDateString('pt-BR');
      }
    },
    { 
      field: 'ultimoAcesso', 
      headerName: 'Último Acesso', 
      width: 180,
      headerAlign: 'center',
      align: 'center',
      valueFormatter: (value: number[]) => {
          if (!value || !Array.isArray(value) || value.length < 3) return '';
          return new Date(value[0], value[1] - 1, value[2]).toLocaleDateString('pt-BR');
      }
    }
  ];
  

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-[#14213d] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Telegram Users</h1>
              <p className="text-blue-200 mt-1">Gerencie e monitore seus usuários do Telegram</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={handleSync}
                disabled={loading || syncing}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200 flex items-center gap-2 backdrop-blur-sm border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CloudDownload size={20} className={syncing ? 'animate-bounce' : ''} />
                {syncing ? 'Sincronizando...' : 'Sincronizar Telegram'}
              </button>              
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat, idx) => (
            <div key={idx} className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
              <div className={`${stat.color} p-6 text-white`}>
                <div className="flex items-center justify-between mb-4">
                  <stat.icon size={32} className="opacity-90" />                  
                </div>
                <p className="text-white/80 text-sm font-medium mb-1">{stat.label}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por nome, username ou Telegram ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:border-[#fca311] focus:ring-2 focus:ring-[#fca311]/20 focus:outline-none transition-all"
              />
            </div>
            
            <div className="flex gap-3">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#fca311] focus:outline-none transition-colors bg-white cursor-pointer"
              >
                <option value="week">Última Semana</option>
                <option value="month">Último Mês</option>
                <option value="quarter">Último Trimestre</option>
                <option value="year">Último Ano</option>
              </select>
            </div>
          </div>
        </div>

        {/* DataGrid */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          {(loading || syncing) && (
            <LinearProgress 
              sx={{ 
                bgcolor: '#fef3e2',
                '& .MuiLinearProgress-bar': {
                  bgcolor: '#fca311'
                }
              }} 
            />
          )}
          
          <Box sx={{ height: 600, width: '100%', p: 2 }}>
            <DataGrid
              rows={filteredRows}
              columns={columns}
              getRowId={(row) => row.id || row.telegramId}
              loading={loading}
              disableRowSelectionOnClick
              pageSizeOptions={[10, 25, 50, 100]}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 25 }
                }
              }}
              sx={{
                border: 'none',
                // Tira a borda de foco das células
                '& .MuiDataGrid-cell:focus': {
                  outline: 'none'
                },
                // Cor de fundo ao passar o mouse na linha
                '& .MuiDataGrid-row:hover': {
                  bgcolor: '#fef3e2',
                  cursor: 'pointer'
                },
                '& .MuiDataGrid-columnHeaders': {
                    bgcolor: '#14213d !important',
                    //borderBottom: '2px solid #14213d',
                },
                '& .MuiDataGrid-columnHeader': {
                  bgcolor: '#14213d !important',
                },
                '& .MuiDataGrid-columnHeaderTitle': {
                  fontWeight: 700,
                  color: '#ffffff !important',
                  fontSize: '14px'
                },
                '& .MuiDataGrid-sortIcon': {
                  color: '#ffffff !important'
                },
                '& .MuiDataGrid-menuIconButton': {
                  color: '#ffffff !important'
                },
                '& .MuiDataGrid-columnSeparator': {
                  color: 'rgba(255, 255, 255, 0.3)'
                },
                '& .MuiDataGrid-footerContainer': {
                  borderTop: '2px solid #f3f4f6',
                  bgcolor: '#fafafa'
                }
              }}
            />
          </Box>
        </div>
      </main>
    </div>
  );
}
