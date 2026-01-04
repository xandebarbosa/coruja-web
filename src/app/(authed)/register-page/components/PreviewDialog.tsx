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
  Divider
} from '@mui/material';
import { 
    Fingerprint, 
    DriveEta, 
    ColorLens, 
    HelpOutline, 
    Person, 
    Comment,
    CheckCircle,
    Cancel
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
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="div" fontWeight="bold">
          Detalhes do Veículo Monitorado
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ color: (theme) => theme.palette.grey[500] }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Cabeçalho com Placa e Status */}
          <Grid size={{ xs: 12 }} display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h4" color="primary" fontWeight="bold">
              {data.placa}
            </Typography>
            <Chip 
              label={data.statusAtivo ? "Monitoramento Ativo" : "Inativo"} 
              color={data.statusAtivo ? "success" : "error"} 
              variant="outlined" 
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Divider />
          </Grid>

          {/* Dados Principais */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" color="text.secondary">Marca/Modelo</Typography>
            {/* ✅ Adicionamos '??' ou '||' para tratar undefined */}
            <Typography variant="body1">{data.marcaModelo || "—"}</Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" color="text.secondary">Cor</Typography>
            <Typography variant="body1">{data.cor || "—"}</Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" color="text.secondary">Telefone</Typography>
            <Typography variant="body1">{data.telefone || "—"}</Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" color="text.secondary">Interessado</Typography>
            <Typography variant="body1">{data.interessado || "—"}</Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" color="text.secondary">Data de Cadastro</Typography>
            <Typography variant="body1">
              {/* Verifica se createdAt existe antes de tentar formatar */}
              {data.createdAt ? new Date(data.createdAt).toLocaleDateString('pt-BR') : "—"}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" color="text.secondary">Motivo do Monitoramento</Typography>
            <Typography variant="body1" sx={{ mt: 1, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              {data.motivo || "—"}
            </Typography>
          </Grid>

          {data.observacao && (
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" color="text.secondary">Observações</Typography>
              <Typography variant="body1">{data.observacao}</Typography>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="contained">Fechar</Button>
      </DialogActions>
    </Dialog>
  );
}