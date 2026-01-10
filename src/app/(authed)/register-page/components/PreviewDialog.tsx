'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Grid,
  IconButton,
  Divider,
  alpha,
  Paper,
  Box
} from '@mui/material';
import { 
    Fingerprint, 
    DriveEta, 
    ColorLens, 
    HelpOutline, 
    Person, 
    Comment,
    CheckCircle,
    Cancel,
    Warning,
    CalendarMonth,
    Phone,
    Palette,
    NotificationsActive,
    Close
} from '@mui/icons-material';
import { Close as CloseIcon } from '@mui/icons-material';

import { MonitoredPlate } from '@/app/types/types';

interface PreviewDialogProps {
  open: boolean;
  onClose: () => void;
  data: MonitoredPlate | null; // Pode ser nulo quando não há nada para mostrar
}

export default function PreviewDialog({ open, onClose, data }: PreviewDialogProps) {
  if (!data) {
    return null; // Não renderiza nada se não houver dados
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      fullWidth 
      maxWidth="md"
      PaperProps={{
        sx: { 
          borderRadius: 3,
          boxShadow: '0 12px 40px rgba(20, 33, 61, 0.15)',
        }
      }}
    >
      {/* Header animado */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #14213d 0%, #1a2b4d 100%)',
          color: 'white',
          px: 4,
          py: 4,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 20% 50%, rgba(252, 163, 17, 0.1) 0%, transparent 50%)',
            animation: 'pulse 3s ease-in-out infinite'
          },
          '@keyframes pulse': {
            '0%, 100%': { opacity: 0.5 },
            '50%': { opacity: 1 }
          }
        }}
      >
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 16,
            top: 16,
            color: 'white',
            zIndex: 1,
            '&:hover': {
              backgroundColor: alpha('#fca311', 0.2),
              transform: 'rotate(90deg)',
              transition: 'all 0.3s ease'
            }
          }}
        >
          <Close />
        </IconButton>

        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <Box
              sx={{
                backgroundColor: alpha('#fca311', 0.2),
                borderRadius: '50%',
                p: 1.5,
                display: 'flex',
                animation: 'ring 2s ease-in-out infinite'
              }}
            >
              <NotificationsActive sx={{ fontSize: 32, color: '#fca311' }} />
            </Box>
            <Box>
              <Typography variant="body2" sx={{ opacity: 0.8, mb: 0.5 }}>
                Alerta de Passagem Monitorada
              </Typography>
              <Typography 
                variant="h4" 
                fontWeight="800" 
                sx={{ 
                  letterSpacing: '2px',
                  fontFamily: 'monospace'
                }}
              >
                {data.placa}
              </Typography>
            </Box>
          </Box>

          <Chip 
            icon={data.statusAtivo ? <CheckCircle /> : <Cancel />}
            label={data.statusAtivo ? "Ativo" : "Inativo"} 
            sx={{
              backgroundColor: data.statusAtivo ? '#10b981' : '#ef4444',
              color: 'white',
              fontWeight: 700,
              px: 2,
              py: 2.5,
              fontSize: '0.9rem',
              '& .MuiChip-icon': {
                color: 'white'
              }
            }}
          />
        </Box>
      </Box>

      <DialogContent sx={{ px: 4, py: 4, backgroundColor: '#fafbfc' }}>
        <Grid container spacing={3}>
          
          {/* Seção: Dados do Veículo */}
          <Grid size={{ xs: 12 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <DriveEta sx={{ color: '#fca311', mr: 1.5, fontSize: 28 }} />
              <Typography variant="h6" fontWeight="600" sx={{ color: '#14213d' }}>
                Dados do Veículo
              </Typography>
            </Box>
            <Divider sx={{ mb: 3, borderColor: alpha('#fca311', 0.2) }} />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 2.5, 
                backgroundColor: 'white',
                borderLeft: '4px solid #fca311',
                borderRadius: 2
              }}
            >
              <Box display="flex" alignItems="center" mb={1}>
                <DriveEta sx={{ color: '#fca311', mr: 1, fontSize: 20 }} />
                <Typography variant="caption" color="text.secondary" fontWeight="600">
                  MARCA/MODELO
                </Typography>
              </Box>
              <Typography variant="body1" fontWeight="600" sx={{ color: '#14213d' }}>
                {data.marcaModelo || "—"}
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 2.5, 
                backgroundColor: 'white',
                borderLeft: '4px solid #fca311',
                borderRadius: 2
              }}
            >
              <Box display="flex" alignItems="center" mb={1}>
                <Palette sx={{ color: '#fca311', mr: 1, fontSize: 20 }} />
                <Typography variant="caption" color="text.secondary" fontWeight="600">
                  COR
                </Typography>
              </Box>
              <Typography variant="body1" fontWeight="600" sx={{ color: '#14213d' }}>
                {data.cor || "—"}
              </Typography>
            </Paper>
          </Grid>

          {/* Seção: Dados do Solicitante */}
          <Grid size={{ xs: 12 }}>
            <Box display="flex" alignItems="center" mb={2} mt={2}>
              <Person sx={{ color: '#fca311', mr: 1.5, fontSize: 28 }} />
              <Typography variant="h6" fontWeight="600" sx={{ color: '#14213d' }}>
                Dados do Solicitante
              </Typography>
            </Box>
            <Divider sx={{ mb: 3, borderColor: alpha('#fca311', 0.2) }} />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 2.5, 
                backgroundColor: 'white',
                borderLeft: '4px solid #14213d',
                borderRadius: 2
              }}
            >
              <Box display="flex" alignItems="center" mb={1}>
                <Person sx={{ color: '#14213d', mr: 1, fontSize: 20 }} />
                <Typography variant="caption" color="text.secondary" fontWeight="600">
                  INTERESSADO
                </Typography>
              </Box>
              <Typography variant="body1" fontWeight="600" sx={{ color: '#14213d' }}>
                {data.interessado || "—"}
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 2.5, 
                backgroundColor: 'white',
                borderLeft: '4px solid #14213d',
                borderRadius: 2
              }}
            >
              <Box display="flex" alignItems="center" mb={1}>
                <Phone sx={{ color: '#14213d', mr: 1, fontSize: 20 }} />
                <Typography variant="caption" color="text.secondary" fontWeight="600">
                  TELEFONE/WHATSAPP
                </Typography>
              </Box>
              <Typography variant="body1" fontWeight="600" sx={{ color: '#14213d' }}>
                {data.telefone || "—"}
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 2.5, 
                backgroundColor: 'white',
                borderLeft: '4px solid #14213d',
                borderRadius: 2
              }}
            >
              <Box display="flex" alignItems="center" mb={1}>
                <CalendarMonth sx={{ color: '#14213d', mr: 1, fontSize: 20 }} />
                <Typography variant="caption" color="text.secondary" fontWeight="600">
                  DATA DE CADASTRO
                </Typography>
              </Box>
              <Typography variant="body1" fontWeight="600" sx={{ color: '#14213d' }}>
                {data.createdAt ? new Date(data.createdAt).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                }) : "—"}
              </Typography>
            </Paper>
          </Grid>

          {/* Seção: Motivo */}
          <Grid size={{ xs: 12 }}>
            <Box display="flex" alignItems="center" mb={2} mt={2}>
              <Warning sx={{ color: '#fca311', mr: 1.5, fontSize: 28 }} />
              <Typography variant="h6" fontWeight="600" sx={{ color: '#14213d' }}>
                Motivo do Monitoramento
              </Typography>
            </Box>
            <Divider sx={{ mb: 3, borderColor: alpha('#fca311', 0.2) }} />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, 
                backgroundColor: alpha('#fef3e2', 0.5),
                borderRadius: 2,
                border: `2px solid ${alpha('#fca311', 0.2)}`
              }}
            >
              <Typography variant="body1" sx={{ color: '#14213d', lineHeight: 1.7 }}>
                {data.motivo || "—"}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions 
        sx={{ 
          p: 3, 
          backgroundColor: 'white',
          borderTop: '1px solid',
          borderColor: alpha('#14213d', 0.1)
        }}
      >
        <Button 
          onClick={onClose} 
          variant="contained"
          sx={{
            backgroundColor: '#fca311',
            color: 'white',
            fontWeight: 600,
            px: 5,
            py: 1.5,
            boxShadow: '0 4px 14px rgba(252, 163, 17, 0.4)',
            '&:hover': {
              backgroundColor: '#e89200',
              boxShadow: '0 6px 20px rgba(252, 163, 17, 0.5)',
              transform: 'translateY(-1px)'
            },
            transition: 'all 0.3s ease'
          }}
        >
          Fechar
        </Button>
      </DialogActions>
    </Dialog>    
  );
}