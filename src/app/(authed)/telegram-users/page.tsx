'use client';

import { TelegramService } from '@/app/services/telegram';
import { UsuarioTelegram } from '@/app/types/types';
import {
  CloudDownload,
  Sync,
} from '@mui/icons-material';
import {
  alpha,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  LinearProgress,
  Typography,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
  Eye,
  EyeOff,
  Search,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

/* ─────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────── */
const getActivityStatus = (ultimoAcesso: any) => {
  if (!ultimoAcesso) return 'dormant';
  const date = Array.isArray(ultimoAcesso)
    ? new Date(ultimoAcesso[0], ultimoAcesso[1] - 1, ultimoAcesso[2])
    : new Date(ultimoAcesso);
  const diffDias = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (diffDias <= 7) return 'active';
  if (diffDias <= 30) return 'inactive';
  return 'dormant';
};

const safeDateFormatter = (value: any): string => {
  if (!value) return '—';
  if (Array.isArray(value) && value.length >= 3)
    return new Date(value[0], value[1] - 1, value[2]).toLocaleDateString('pt-BR');
  const d = new Date(value);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR');
};

/* ─────────────────────────────────────────────────────────
   Page Component
───────────────────────────────────────────────────────── */
export default function TelegramUsersPage() {
  const [users, setUsers]         = useState<UsuarioTelegram[]>([]);
  const [loading, setLoading]     = useState(true);
  const [syncing, setSyncing]     = useState(false);
  const [searchTerm, setSearch]   = useState('');
  const [visibleIds, setVisible]  = useState<Set<string | number>>(new Set());

  /* ── Fetch ── */
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await TelegramService.getAll();
      setUsers(data);
    } catch {
      toast.error('Erro ao carregar usuários.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  /* ── Sync ── */
  const handleSync = async () => {
    setSyncing(true);
    try {
      const updated = await TelegramService.sync();
      setUsers(updated);
      const diff = updated.length - users.length;
      toast.success(
        diff > 0
          ? `${diff} novo(s) usuário(s) encontrado(s)!`
          : 'Base já está atualizada.',
      );
    } catch {
      toast.error('Erro ao sincronizar com o Telegram.');
    } finally {
      setSyncing(false);
    }
  };

  /* ── Toggle ID visibility ── */
  const toggleId = (id: string | number) =>
    setVisible(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  /* ── Filtered rows ── */
  const filteredRows = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return users.filter(u =>
      `${u.primeiroNome ?? ''} ${u.sobrenome ?? ''}`.toLowerCase().includes(term) ||
      (u.username ?? '').toLowerCase().includes(term) ||
      String(u.telegramId ?? '').includes(term),
    );
  }, [users, searchTerm]);

  /* ── Stats ── */
  const stats = useMemo(() => {
    const total  = users.length;
    const ativos = users.filter(u => getActivityStatus(u.ultimoAcesso) === 'active').length;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const novos  = users.filter(u => {
      if (!u.dataCadastro) return false;
      const d = Array.isArray(u.dataCadastro)
        ? new Date(u.dataCadastro[0], (u.dataCadastro as any)[1] - 1, (u.dataCadastro as any)[2])
        : new Date(u.dataCadastro);
      return d >= cutoff;
    }).length;
    return { total, ativos, novos };
  }, [users]);

  /* ─────────────────── Colunas DataGrid ─────────────────── */
  const columns: GridColDef[] = [
    {
      field: 'avatar',
      headerName: '',
      width: 64,
      sortable: false,
      renderCell: params => (
        <Avatar sx={{ bgcolor: '#fca311', width: 36, height: 36, fontWeight: 700, fontSize: 15 }}>
          {params.row.primeiroNome?.charAt(0)?.toUpperCase() ?? '?'}
        </Avatar>
      ),
    },
    {
      field: 'telegramId',
      headerName: 'Telegram ID',
      width: 210,
      headerAlign: 'center',
      align: 'center',
      renderCell: params => {
        const key = params.row.id ?? params.row.telegramId;
        const visible = visibleIds.has(key);
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', px: 1 }}>
            <Typography
              variant="caption"
              sx={{ fontFamily: 'monospace', color: visible ? '#374151' : '#9ca3af', letterSpacing: visible ? 0 : 2 }}
            >
              {visible ? params.value : '•••••••••'}
            </Typography>
            <Box
              component="button"
              onClick={e => { e.stopPropagation(); toggleId(key); }}
              sx={{
                background: 'none', border: 'none', cursor: 'pointer', p: 0.5, borderRadius: 1,
                color: '#9ca3af', display: 'flex', alignItems: 'center',
                '&:hover': { color: '#fca311', bgcolor: alpha('#fca311', 0.08) },
                transition: 'all 0.2s',
              }}
            >
              {visible ? <EyeOff size={14} /> : <Eye size={14} />}
            </Box>
          </Box>
        );
      },
    },
    {
      field: 'nomeCompleto',
      headerName: 'Nome',
      flex: 1,
      minWidth: 200,
      valueGetter: (_v, row) => `${row.primeiroNome ?? ''} ${row.sobrenome ?? ''}`.trim(),
      renderCell: params => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#14213d' }}>
          {params.value || '—'}
        </Typography>
      ),
    },
    {
      field: 'username',
      headerName: 'Username',
      width: 200,
      renderCell: params =>
        params.value ? (
          <Chip
            label={`@${params.value}`}
            size="small"
            sx={{ bgcolor: alpha('#fca311', 0.1), color: '#14213d', fontWeight: 600, border: `1px solid ${alpha('#fca311', 0.4)}` }}
          />
        ) : (
          <Typography variant="caption" sx={{ color: '#9ca3af' }}>—</Typography>
        ),
    },
    {
      field: 'statusAtividade',
      headerName: 'Atividade',
      width: 130,
      headerAlign: 'center',
      align: 'center',
      valueGetter: (_v, row) => getActivityStatus(row.ultimoAcesso),
      renderCell: params => {
        const map: Record<string, { label: string; bg: string; color: string }> = {
          active:  { label: 'Ativo',    bg: alpha('#059669', 0.1), color: '#059669' },
          inactive:{ label: 'Inativo',  bg: alpha('#d97706', 0.1), color: '#d97706' },
          dormant: { label: 'Dormindo', bg: alpha('#6b7280', 0.1), color: '#6b7280' },
        };
        const { label, bg, color } = map[params.value] ?? map.dormant;
        return (
          <Chip size="small" label={label}
            sx={{ bgcolor: bg, color, fontWeight: 600, fontSize: 12, border: `1px solid ${alpha(color, 0.3)}` }}
          />
        );
      },
    },
    {
      field: 'dataCadastro',
      headerName: 'Cadastrado em',
      width: 150,
      headerAlign: 'center',
      align: 'center',
      valueFormatter: (v: any) => safeDateFormatter(v),
    },
    {
      field: 'ultimoAcesso',
      headerName: 'Último Acesso',
      width: 150,
      headerAlign: 'center',
      align: 'center',
      valueFormatter: (v: any) => safeDateFormatter(v),
    },
  ];

  /* ─────────────────────────────────────────────────────────
     Render
  ───────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-[#fef9f3] to-gray-50 p-6">

      {/* ── HERO HEADER ─────────────────────────────────────── */}
      <Card
        className="mb-6 overflow-hidden"
        sx={{
          background: 'linear-gradient(135deg, #14213d 0%, #1a2b4a 100%)',
          boxShadow: '0 20px 60px rgba(20,33,61,0.3)',
          borderRadius: '16px',
          position: 'relative',
          '&::before': {
            content: '""', position: 'absolute',
            top: 0, left: 0, right: 0, height: '4px',
            background: 'linear-gradient(90deg, #fca311 0%, #ff8800 100%)',
          },
        }}
      >
        <CardContent className="py-10 px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">

            {/* Título */}
            <div className="flex items-center gap-5">
              <Box sx={{
                background: 'rgba(252,163,17,0.15)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(252,163,17,0.3)',
                borderRadius: '16px',
                p: 2.5,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(252,163,17,0.2)',
              }}>
                {/* Telegram icon via SVG inline */}
                <svg width="48" height="48" viewBox="0 0 24 24" fill="#fca311">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8-1.7 8.02c-.13.59-.47.73-.95.46l-2.62-1.93-1.27 1.22c-.14.14-.26.26-.53.26l.19-2.69 4.87-4.4c.21-.19-.05-.29-.33-.1L7.4 14.77l-2.57-.8c-.56-.17-.57-.56.12-.83l10.03-3.87c.47-.17.88.11.66.83z"/>
                </svg>
              </Box>
              <div>
                <Typography
                  variant="h3"
                  className="font-bold text-white mb-2"
                  sx={{ letterSpacing: '-0.5px', textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}
                >
                  Usuários Telegram
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '15px', fontWeight: 500 }}>
                  Gerencie e monitore os usuários cadastrados no bot.
                </Typography>
              </div>
            </div>

            {/* Botão Sincronizar */}
            <Button
              variant="contained"
              size="large"
              onClick={handleSync}
              disabled={loading || syncing}
              startIcon={syncing ? <CircularProgress size={20} color="inherit" /> : <CloudDownload />}
              sx={{
                minWidth: '200px', height: '52px',
                background: 'linear-gradient(135deg, #fca311 0%, #ff8800 100%)',
                color: '#14213d', fontWeight: 700, fontSize: '15px',
                textTransform: 'none', borderRadius: '12px',
                boxShadow: '0 4px 14px rgba(252,163,17,0.4)',
                '&:hover': { background: 'linear-gradient(135deg, #ff8800 0%, #fca311 100%)', transform: 'translateY(-1px)', boxShadow: '0 6px 20px rgba(252,163,17,0.5)' },
                '&:disabled': { bgcolor: '#e5e7eb', color: '#9ca3af' },
                transition: 'all 0.3s ease',
              }}
            >
              {syncing ? 'Sincronizando...' : 'Sincronizar Telegram'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── CARDS DE ESTATÍSTICAS ────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">

        {/* Total */}
        <Card sx={{ borderRadius: '14px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <Box sx={{ background: 'linear-gradient(135deg, #fca311 0%, #ff8800 100%)', px: 3, py: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', p: 1.5, borderRadius: '12px', display: 'flex' }}>
              <Users size={28} color="white" />
            </Box>
            <div>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: 11 }}>
                Total de Usuários
              </Typography>
              <Typography variant="h4" sx={{ color: 'white', fontWeight: 800, lineHeight: 1.2 }}>
                {loading ? '—' : stats.total}
              </Typography>
            </div>
          </Box>
        </Card>

        {/* Ativos */}
        <Card sx={{ borderRadius: '14px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <Box sx={{ background: 'linear-gradient(135deg, #14213d 0%, #1a2b4a 100%)', px: 3, py: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ bgcolor: alpha('#fca311', 0.2), p: 1.5, borderRadius: '12px', display: 'flex' }}>
              <UserCheck size={28} color="#fca311" />
            </Box>
            <div>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: 11 }}>
                Ativos (7 dias)
              </Typography>
              <Typography variant="h4" sx={{ color: 'white', fontWeight: 800, lineHeight: 1.2 }}>
                {loading ? '—' : stats.ativos}
              </Typography>
            </div>
          </Box>
        </Card>

        {/* Novos */}
        <Card sx={{ borderRadius: '14px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <Box sx={{ background: 'linear-gradient(135deg, #14213d 0%, #1a2b4a 100%)', px: 3, py: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ bgcolor: alpha('#059669', 0.2), p: 1.5, borderRadius: '12px', display: 'flex' }}>
              <UserPlus size={28} color="#34d399" />
            </Box>
            <div>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: 11 }}>
                Novos (30 dias)
              </Typography>
              <Typography variant="h4" sx={{ color: 'white', fontWeight: 800, lineHeight: 1.2 }}>
                {loading ? '—' : stats.novos}
              </Typography>
            </div>
          </Box>
        </Card>
      </div>

      {/* ── TABELA DE USUÁRIOS ──────────────────────────────── */}
      <Card
        className="overflow-hidden"
        sx={{ boxShadow: '0 10px 40px rgba(0,0,0,0.08)', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.06)' }}
      >
        {/* Sub-header escuro */}
        <Box sx={{ background: 'linear-gradient(135deg, #1a2b4a 0%, #14213d 100%)', px: 4, py: 2.5 }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">

            {/* Título + contador */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ bgcolor: alpha('#fca311', 0.2), borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={14} color="#fca311" />
              </Box>
              <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 600 }}>
                Lista de Usuários
              </Typography>
              {!loading && (
                <Chip
                  label={`${filteredRows.length} usuário${filteredRows.length !== 1 ? 's' : ''}`}
                  size="small"
                  sx={{ bgcolor: alpha('#fca311', 0.2), color: '#fca311', border: `1px solid ${alpha('#fca311', 0.4)}`, fontWeight: 600 }}
                />
              )}
            </Box>

            {/* Busca inline */}
            <Box sx={{
              display: 'flex', alignItems: 'center', gap: 1.5,
              bgcolor: 'rgba(255,255,255,0.08)', borderRadius: '10px',
              px: 2, py: 1, border: '1px solid rgba(255,255,255,0.15)',
              '&:focus-within': { border: `1px solid ${alpha('#fca311', 0.6)}`, bgcolor: 'rgba(255,255,255,0.12)' },
              transition: 'all 0.2s',
              width: { xs: '100%', sm: '280px' },
            }}>
              <Search size={16} color="rgba(255,255,255,0.5)" />
              <input
                value={searchTerm}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por nome, username ou ID…"
                style={{
                  background: 'none', border: 'none', outline: 'none',
                  color: 'white', fontSize: 14, width: '100%',
                }}
              />
            </Box>
          </div>

          {(loading || syncing) && (
            <LinearProgress sx={{ mt: 2, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.1)', '& .MuiLinearProgress-bar': { bgcolor: '#fca311' } }} />
          )}
        </Box>

        {/* DataGrid */}
        <CardContent className="p-0">
          <Box sx={{ height: 560, width: '100%' }}>
            <DataGrid
              rows={filteredRows}
              columns={columns}
              getRowId={row => row.id ?? row.telegramId}
              loading={loading}
              disableRowSelectionOnClick
              pageSizeOptions={[10, 25, 50, 100]}
              initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
              sx={{
                border: 'none',
                '& .MuiDataGrid-cell:focus': { outline: 'none' },
                '& .MuiDataGrid-columnHeaders': { bgcolor: '#f8f9fa', borderBottom: '2px solid #e9ecef', minHeight: '52px !important', maxHeight: '52px !important' },
                '& .MuiDataGrid-columnHeader': { outline: 'none !important' },
                '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700, fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.4px' },
                '& .MuiDataGrid-columnSeparator': { color: '#e5e7eb' },
                '& .MuiDataGrid-row': {
                  '&:hover': { bgcolor: '#fef3e2' },
                  '&.Mui-selected': { bgcolor: `${alpha('#fca311', 0.08)} !important`, '&:hover': { bgcolor: `${alpha('#fca311', 0.12)} !important` } },
                },
                '& .MuiDataGrid-cell': { borderBottom: '1px solid #f3f4f6', fontSize: 13 },
                '& .MuiDataGrid-footerContainer': { borderTop: '2px solid #e9ecef', bgcolor: '#f9fafb' },
                '& .MuiDataGrid-virtualScroller': { bgcolor: 'white' },
                '& .MuiCheckbox-root.Mui-checked': { color: '#fca311' },
              }}
              slots={{
                noRowsOverlay: () => (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2, color: '#9ca3af' }}>
                    <svg width="56" height="56" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.3 }}>
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8-1.7 8.02c-.13.59-.47.73-.95.46l-2.62-1.93-1.27 1.22c-.14.14-.26.26-.53.26l.19-2.69 4.87-4.4c.21-.19-.05-.29-.33-.1L7.4 14.77l-2.57-.8c-.56-.17-.57-.56.12-.83l10.03-3.87c.47-.17.88.11.66.83z"/>
                    </svg>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {searchTerm ? 'Nenhum usuário corresponde à busca.' : 'Nenhum usuário encontrado.'}
                    </Typography>
                    {searchTerm && (
                      <Typography variant="caption">Tente um nome, username ou ID diferente.</Typography>
                    )}
                  </Box>
                ),
              }}
            />
          </Box>
        </CardContent>
      </Card>
    </div>
  );
}