'use client'

import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Grid, InputAdornment, Switch, TextField } from '@mui/material';
import { useEffect } from 'react';
import { MonitoredPlate, MonitoredPlateFormData } from '@/app/types/types';
import { WhatsApp } from '@mui/icons-material';

//Schema de validação com Yup
const validationSchema = yup.object({
    placa: yup.string()
      .required("A placa é obrigatória")
      .min(7, "A placa deve ter 7 caracteres.")
      .max(7, 'A placa deve ter 7 caracteres'),
    marcaModelo: yup.string().required('A marca/modelo é obrigatória.'),
    cor: yup.string().required('A cor é obrigatória.'),
    motivo: yup.string().required('O motivo é obrigatório.'),
    interessado: yup.string().required('O interessado é obrigatório.'),
    telefone: yup.string()
        .required('O telefone para notificação é obrigatório.')
        .matches(/^\d+$/, 'Apenas números são permitidos.')
        .min(10, 'O número deve ter DDD + número (mínimo 10 dígitos).')
        .max(11, 'O número deve ter no máximo 11 dígitos.'),
    observacao: yup.string().required('A observação é obrigatória.'),
    statusAtivo: yup.boolean().required('Campo Status é obrigatório.'),
});

// Define os tipos para os dados do formulário
type FormData = yup.InferType<typeof validationSchema>;

// Define as props que o componente do Dialog receberá
interface RegisterFormDialogProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: MonitoredPlateFormData, id?: number) => void; // A função de submit agora pode receber um ID
    initialData?: MonitoredPlate | null; // Dados para pré-preenchimento
}

const DEFAULT_VALUES: FormData = {
  placa: '',
  marcaModelo: '',
  cor: '',
  motivo: '',
  interessado: '',
  telefone: '',
  observacao: '',
  statusAtivo: true,
};

export default function RegisterFormDialog({ open, onClose, onSubmit, initialData }: RegisterFormDialogProps) {
    
  const { 
    control, 
    handleSubmit, 
    reset,
    formState: { errors, isSubmitting } 
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: DEFAULT_VALUES,
  });

  // Effect para preencher ou limpar o formulário ao abrir/fechar ou mudar dados
  useEffect(() => {
    if (open) {
      if (initialData) {
        // ✅ CORREÇÃO CRÍTICA: Mapeia explicitamente para evitar erro de tipo (undefined -> string vazia)
        reset({
          placa: initialData.placa,
          marcaModelo: initialData.marcaModelo || '',
          cor: initialData.cor || '',
          motivo: initialData.motivo || '',
          interessado: initialData.interessado || '',
          telefone: initialData.telefone || '',
          observacao: initialData.observacao || '',
          statusAtivo: initialData.statusAtivo ?? true, // Nullish coalescing para boolean
        });
      } else {
        // Reseta para os valores padrão se for novo cadastro
        reset(DEFAULT_VALUES);
      }
    }
  }, [initialData, open, reset]);

  const onFormSubmit = (data: FormData) => {
    // Passa os dados e o ID (se existir) para o pai
    onSubmit(data, initialData?.id);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      fullWidth 
      maxWidth="sm"
      // Evita fechar clicando fora se estiver salvando
      disableEscapeKeyDown={isSubmitting}
      >
      <form onSubmit={handleSubmit(onFormSubmit)}>
        <DialogTitle fontWeight="bold">
          {initialData ? 'Editar Veículo' : 'Adicionar Novo Veículo'}
        </DialogTitle>
        
        <DialogContent dividers>
          <Grid container spacing={2}>
            
            {/* Placa */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="placa"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    autoFocus
                    label="Placa"
                    fullWidth
                    variant="outlined"
                    error={!!errors.placa}
                    helperText={errors.placa?.message}
                    // Desabilita edição da placa se for atualização (opcional)
                    // disabled={!!initialData}
                    inputProps={{ style: { textTransform: 'uppercase' } }}
                  />
                )}
              />
            </Grid>

            {/* Status Switch */}
            <Grid size={{ xs: 12, sm: 6 }} display="flex" alignItems="center">
              <Controller
                name="statusAtivo"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={field.value} 
                        onChange={(e) => field.onChange(e.target.checked)} 
                        color="success" 
                      />
                    }
                    label="Monitoramento Ativo"
                  />
                )}
              />
            </Grid>

            {/* Marca/Modelo */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="marcaModelo"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Marca/Modelo"
                    fullWidth
                    variant="outlined"
                    error={!!errors.marcaModelo}
                    helperText={errors.marcaModelo?.message}
                  />
                )}
              />
            </Grid>

            {/* Cor */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="cor"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Cor"
                    fullWidth
                    variant="outlined"
                    error={!!errors.cor}
                    helperText={errors.cor?.message}
                  />
                )}
              />
            </Grid>

            {/* Interessado */}
            <Grid size={{ xs: 12 }}>
              <Controller
                name="interessado"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Interessado / Solicitante"
                    fullWidth
                    variant="outlined"
                    error={!!errors.interessado}
                    helperText={errors.interessado?.message}
                  />
                )}
              />
            </Grid>

            {/* Telefone */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="telefone"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="WhatsApp (com DDD)"
                    placeholder="14989999999"
                    fullWidth
                    variant="outlined"
                    error={!!errors.telefone}
                    helperText={errors.telefone?.message || "Apenas números (DDD + telefone)"}                    
                    // slotProps={{
                    //   inputLabel: (
                    //     <InputAdornment position='start'>
                    //       <WhatsApp color={errors.telefone ? "error" : "action"} fontSize="small" />
                    //     </InputAdornment>
                    //   )
                    // }}
                  />
                )}
              />
            </Grid>

            {/* Motivo */}
            <Grid size={{ xs: 12 }}>
              <Controller
                name="motivo"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Motivo do Monitoramento"
                    fullWidth
                    multiline
                    rows={2}
                    variant="outlined"
                    error={!!errors.motivo}
                    helperText={errors.motivo?.message}
                  />
                )}
              />
            </Grid>

            {/* Observação */}
            <Grid size={{ xs: 12 }}>
              <Controller
                name="observacao"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Observação"
                    fullWidth
                    multiline
                    rows={3}
                    variant="outlined"
                    error={!!errors.observacao}
                    helperText={errors.observacao?.message}
                  />
                )}
              />
            </Grid>

          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={onClose} variant="outlined" color="inherit">
            Cancelar
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            disabled={isSubmitting} // Desabilita botão enquanto envia
            className="bg-orange-500 hover:bg-orange-600"
          >
            {initialData ? 'Salvar Alterações' : 'Adicionar'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}


