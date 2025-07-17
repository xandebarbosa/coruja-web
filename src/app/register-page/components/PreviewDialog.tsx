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
  Chip
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

// Define a interface para os dados que o Dialog espera receber
interface PlateData {
  placa: string;
  marcaModelo: string;
  cor: string;
  motivo: string;
  statusAtivo: boolean;
  observacao: string;
  interessado: string;
}

interface PreviewDialogProps {
  open: boolean;
  onClose: () => void;
  data: PlateData | null; // Pode ser nulo quando não há nada para mostrar
}

export default function PreviewDialog({ open, onClose, data }: PreviewDialogProps) {
  if (!data) {
    return null; // Não renderiza nada se não houver dados
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle fontWeight="bold">Detalhes do Veículo Monitorado</DialogTitle>
      <DialogContent dividers> {/* 'dividers' adiciona linhas separadoras */}
        <List dense>
          <ListItem>
            <ListItemIcon><Fingerprint color="primary" /></ListItemIcon>
            <ListItemText primary="Placa" secondary={<Typography variant="body1" color="text.primary" fontWeight="bold">{data.placa}</Typography>} />
          </ListItem>
          <ListItem>
            <ListItemIcon><DriveEta color="action" /></ListItemIcon>
            <ListItemText primary="Marca/Modelo" secondary={data.marcaModelo} />
          </ListItem>
          <ListItem>
            <ListItemIcon><ColorLens color="action" /></ListItemIcon>
            <ListItemText primary="Cor" secondary={data.cor} />
          </ListItem>
           <ListItem>
            <ListItemIcon><HelpOutline color="action" /></ListItemIcon>
            <ListItemText primary="Motivo do Monitoramento" secondary={data.motivo} />
          </ListItem>
           <ListItem>
            <ListItemIcon><Person color="action" /></ListItemIcon>
            <ListItemText primary="Interessado" secondary={data.interessado} />
          </ListItem>
          <ListItem>
            <ListItemIcon><Comment color="action" /></ListItemIcon>
            <ListItemText primary="Observação" secondary={data.observacao || "Nenhuma observação."} />
          </ListItem>
          <ListItem>
             <ListItemIcon>{data.statusAtivo ? <CheckCircle color="success" /> : <Cancel color="error" />}</ListItemIcon>
             <ListItemText 
              primary="Status"
              secondaryTypographyProps={{ component: 'div' }} 
              secondary={<Chip label={data.statusAtivo ? 'Ativo' : 'Inativo'} 
                color={data.statusAtivo ? 'success' : 'error'} size="small" 
              />} 
            />
          </ListItem>
        </List>
      </DialogContent>
      <DialogActions className="p-4">
        <Button onClick={onClose} variant="outlined">Fechar</Button>
      </DialogActions>
    </Dialog>
  );
}