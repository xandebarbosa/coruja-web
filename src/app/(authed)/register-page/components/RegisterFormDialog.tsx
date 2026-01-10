'use client'

import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { alpha, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControlLabel, Grid, IconButton, InputAdornment, Switch, TextField, Typography } from '@mui/material';
import { useEffect } from 'react';
import { MonitoredPlate, MonitoredPlateFormData } from '@/app/types/types';
import { Close, Description, DriveEta, Palette, PersonOutline, Warning, WhatsApp } from '@mui/icons-material';

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
      maxWidth="md"
      disableEscapeKeyDown={isSubmitting}
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 12px 40px rgba(20, 33, 61, 0.15)',
        }
      }}
    >
      <form onSubmit={handleSubmit(onFormSubmit)}>
        {/* Header com gradiente */}
        <DialogTitle 
          sx={{ 
            background: 'linear-gradient(135deg, #14213d 0%, #1a2b4d 100%)',
            color: 'white',
            py: 3,
            px: 3,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Box>
            <Typography variant="h5" fontWeight="700" sx={{ mb: 0.5 }}>
              {initialData ? 'Editar Veículo Monitorado' : 'Novo Veículo Monitorado'}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              {initialData ? 'Atualize as informações do veículo' : 'Preencha os dados para adicionar ao sistema'}
            </Typography>
          </Box>
          <IconButton 
            onClick={onClose} 
            sx={{ 
              color: 'white',
              '&:hover': { 
                backgroundColor: alpha('#fca311', 0.2),
                transform: 'rotate(90deg)',
                transition: 'all 0.3s ease'
              }
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ px: 4, py: 4, backgroundColor: '#fafbfc' }}>
          <Grid container spacing={3}>
            
            {/* Seção: Identificação do Veículo */}
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, mt: 2 }}>
                <DriveEta sx={{ color: '#fca311', mr: 1.5, fontSize: 28 }} />
                <Typography variant="h6" fontWeight="600" sx={{ color: '#14213d' }}>
                  Identificação do Veículo
                </Typography>
              </Box>
              <Divider sx={{ mb: 3, borderColor: alpha('#fca311', 0.2) }} />
            </Grid>

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
                    inputProps={{ 
                      style: { 
                        textTransform: 'uppercase',
                        fontWeight: 600,
                        fontSize: '1.1rem',
                        letterSpacing: '0.5px'
                      } 
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': { borderColor: '#fca311' },
                        '&.Mui-focused fieldset': { borderColor: '#fca311', borderWidth: 2 },
                        backgroundColor: 'white'
                      }
                    }}
                  />
                )}
              />
            </Grid>

            {/* Status Switch */}
            <Grid size={{ xs: 12, sm: 6 }} display="flex" alignItems="center" justifyContent="center">
              <Controller
                name="statusAtivo"
                control={control}
                render={({ field }) => (
                  <Box 
                    sx={{ 
                      backgroundColor: field.value ? alpha('#10b981', 0.1) : alpha('#ef4444', 0.1),
                      borderRadius: 2,
                      p: 2,
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'center'
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={field.value} 
                          onChange={(e) => field.onChange(e.target.checked)}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: '#10b981',
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: '#10b981',
                            },
                          }}
                        />
                      }
                      label={
                        <Typography fontWeight="600" sx={{ color: field.value ? '#10b981' : '#ef4444' }}>
                          {field.value ? "Monitoramento Ativo" : "Monitoramento Inativo"}
                        </Typography>
                      }
                    />
                  </Box>
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
                    placeholder="Ex: Volkswagen Gol"
                    fullWidth
                    variant="outlined"
                    error={!!errors.marcaModelo}
                    helperText={errors.marcaModelo?.message}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': { borderColor: '#fca311' },
                        '&.Mui-focused fieldset': { borderColor: '#fca311', borderWidth: 2 },
                        backgroundColor: 'white'
                      }
                    }}
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
                    placeholder="Ex: Branco"
                    fullWidth
                    variant="outlined"
                    error={!!errors.cor}
                    helperText={errors.cor?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Palette sx={{ color: errors.cor ? '#ef4444' : '#fca311' }} />
                        </InputAdornment>
                      )
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': { borderColor: '#fca311' },
                        '&.Mui-focused fieldset': { borderColor: '#fca311', borderWidth: 2 },
                        backgroundColor: 'white'
                      }
                    }}
                  />
                )}
              />
            </Grid>

            {/* Seção: Dados do Solicitante */}
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, mt: 2 }}>
                <PersonOutline sx={{ color: '#fca311', mr: 1.5, fontSize: 28 }} />
                <Typography variant="h6" fontWeight="600" sx={{ color: '#14213d' }}>
                  Dados do Solicitante
                </Typography>
              </Box>
              <Divider sx={{ mb: 3, borderColor: alpha('#fca311', 0.2) }} />
            </Grid>

            {/* Interessado */}
            <Grid size={{ xs: 12, sm: 7 }}>
              <Controller
                name="interessado"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Interessado / Solicitante"
                    placeholder="Nome completo"
                    fullWidth
                    variant="outlined"
                    error={!!errors.interessado}
                    helperText={errors.interessado?.message}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': { borderColor: '#fca311' },
                        '&.Mui-focused fieldset': { borderColor: '#fca311', borderWidth: 2 },
                        backgroundColor: 'white'
                      }
                    }}
                  />
                )}
              />
            </Grid>

            {/* Telefone */}
            <Grid size={{ xs: 12, sm: 5 }}>
              <Controller
                name="telefone"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="WhatsApp"
                    placeholder="14989999999"
                    fullWidth
                    variant="outlined"
                    error={!!errors.telefone}
                    helperText={errors.telefone?.message || "DDD + número (apenas números)"}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <WhatsApp sx={{ color: errors.telefone ? '#ef4444' : '#25D366' }} />
                        </InputAdornment>
                      )
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': { borderColor: '#fca311' },
                        '&.Mui-focused fieldset': { borderColor: '#fca311', borderWidth: 2 },
                        backgroundColor: 'white'
                      }
                    }}
                  />
                )}
              />
            </Grid>

            {/* Seção: Informações Adicionais */}
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, mt: 2 }}>
                <Description sx={{ color: '#fca311', mr: 1.5, fontSize: 28 }} />
                <Typography variant="h6" fontWeight="600" sx={{ color: '#14213d' }}>
                  Informações Adicionais
                </Typography>
              </Box>
              <Divider sx={{ mb: 3, borderColor: alpha('#fca311', 0.2) }} />
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
                    placeholder="Descreva o motivo..."
                    fullWidth
                    multiline
                    rows={3}
                    variant="outlined"
                    error={!!errors.motivo}
                    helperText={errors.motivo?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start" sx={{ alignSelf: 'flex-start' }}>
                          <Warning sx={{ color: errors.motivo ? '#ef4444' : '#fca311' }} />
                        </InputAdornment>
                      )
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': { borderColor: '#fca311' },
                        '&.Mui-focused fieldset': { borderColor: '#fca311', borderWidth: 2 },
                        backgroundColor: 'white'
                      }
                    }}
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
                    label="Observações Gerais"
                    placeholder="Informações complementares..."
                    fullWidth
                    multiline
                    rows={3}
                    variant="outlined"
                    error={!!errors.observacao}
                    helperText={errors.observacao?.message}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': { borderColor: '#fca311' },
                        '&.Mui-focused fieldset': { borderColor: '#fca311', borderWidth: 2 },
                        backgroundColor: 'white'
                      }
                    }}
                  />
                )}
              />
            </Grid>

          </Grid>
        </DialogContent>

        <DialogActions 
          sx={{ 
            p: 3, 
            backgroundColor: 'white',
            borderTop: '1px solid',
            borderColor: alpha('#14213d', 0.1),
            gap: 2
          }}
        >
          <Button 
            onClick={onClose} 
            variant="outlined"
            sx={{
              borderColor: '#14213d',
              color: '#14213d',
              fontWeight: 600,
              px: 4,
              py: 1.2,
              '&:hover': {
                borderColor: '#14213d',
                backgroundColor: alpha('#14213d', 0.05)
              }
            }}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            variant="contained"
            disabled={isSubmitting}
            sx={{
              backgroundColor: '#fca311',
              color: 'white',
              fontWeight: 600,
              px: 4,
              py: 1.2,
              boxShadow: '0 4px 14px rgba(252, 163, 17, 0.4)',
              '&:hover': {
                backgroundColor: '#e89200',
                boxShadow: '0 6px 20px rgba(252, 163, 17, 0.5)',
                transform: 'translateY(-1px)'
              },
              '&:disabled': {
                backgroundColor: alpha('#fca311', 0.4)
              },
              transition: 'all 0.3s ease'
            }}
          >
            {isSubmitting ? 'Salvando...' : (initialData ? 'Salvar Alterações' : 'Adicionar Veículo')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>    
  );
}


