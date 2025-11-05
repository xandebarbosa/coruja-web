'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Box,
  Divider,
} from '@mui/material';
import { 
    Info,
    VpnKey,
    DriveEta, 
    ColorLens, 
    HelpOutline, 
    Person,
    CalendarToday,
    AccessTime,
    Signpost
} from '@mui/icons-material';
import { AlertHistoryRow } from "@/app/services/api";

// Define as props que o componente do Dialog receberá
interface PreviewDialogProps {
  open: boolean;
  onClose: () => void;
  data: AlertHistoryRow | null; // Pode ser nulo quando não há nada para mostrar
}

// Função auxiliar para formatar a data/hora
const formatDateTime = (dateTimeString: string) => {
    if (!dateTimeString) return "N/A";
    return new Date(dateTimeString).toLocaleString('pt-BR');
};

export default function AlertPreviewDialog({ open, onClose, data }: PreviewDialogProps) {
  if (!data) {
    return null; // Não renderiza nada se não houver dados
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle fontWeight="bold">
        <Box display="flex" alignItems="center">
          <Info color="primary" className="mr-2" />
          Detalhes da Passagem Monitorada
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={3}>
            {/* Coluna da Esquerda: Detalhes do Evento */}
            <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="h6" gutterBottom>Dados da Passagem</Typography>
                <Box display="flex" alignItems="center" mb={2}>
                    <VpnKey color="action" sx={{ mr: 1.5 }} />
                    <Typography variant="body2" color="text.secondary">Placa: <strong className="text-lg text-black">{data.placa}</strong></Typography>
                </Box>
                <Box display="flex" alignItems="center" mb={2}>
                    <CalendarToday color="action" sx={{ mr: 1.5 }} />
                    <Typography variant="body2" color="text.secondary">Data/Hora: <strong className="text-black">{(data.timestampAlerta)}</strong></Typography>
                </Box>
                <Box display="flex" alignItems="center" mb={2}>
                    <Signpost color="action" sx={{ mr: 1.5 }} />
                    <Typography variant="body2" color="text.secondary">Local: <strong className="text-black">{data.praca} - {data.rodovia} KM {data.km} ({data.sentido})</strong></Typography>
                </Box>
            </Grid>

            {/* Linha Divisória Vertical */}
            <Divider orientation="vertical" flexItem sx={{ mr: "-1px" }} />

            {/* Coluna da Direita: Detalhes do Cadastro */}
            <Grid size={{ xs: 12, md: 6 }}>
                 <Typography variant="h6" gutterBottom>Dados do Monitoramento</Typography>
                 <Box display="flex" alignItems="center" mb={2}>
                    <DriveEta color="action" sx={{ mr: 1.5 }} />
                    <Typography variant="body2" color="text.secondary">Marca/Modelo: <strong className="text-black">{data.placaMonitorada.marcaModelo}</strong></Typography>
                </Box>
                <Box display="flex" alignItems="center" mb={2}>
                    <ColorLens color="action" sx={{ mr: 1.5 }} />
                    <Typography variant="body2" color="text.secondary">Cor: <strong className="text-black">{data.placaMonitorada.cor}</strong></Typography>
                </Box>
                 <Box display="flex" alignItems="center" mb={2}>
                    <HelpOutline color="action" sx={{ mr: 1.5 }} />
                    <Typography variant="body2" color="text.secondary">Motivo: <strong className="text-black">{data.placaMonitorada.motivo}</strong></Typography>
                </Box>
                 <Box display="flex" alignItems="center" mb={2}>
                    <Person color="action" sx={{ mr: 1.5 }} />
                    <Typography variant="body2" color="text.secondary">Interessado: <strong className="text-black">{data.placaMonitorada.interessado}</strong></Typography>
                </Box>
            </Grid>
        </Grid>
      </DialogContent>
      <DialogActions className="p-3 bg-gray-50">
        <Button onClick={onClose} variant="contained">Fechar</Button>
      </DialogActions>
    </Dialog>
  );
}