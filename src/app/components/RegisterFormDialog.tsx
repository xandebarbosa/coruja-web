'use client'

import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Switch, TextField } from '@mui/material';
import { useEffect } from 'react';

//Schema de validação com Yup
const validationSchema = yup.object({
    placa: yup.string().required("A placa é obrigatória").min(7, "A placa deve ter 7 caracteres.").max(7, 'A placa deve ter 7 caracteres'),
    marcaModelo: yup.string().required('A marca/modelo é obrigatória.'),
    cor: yup.string().required('A cor é obrigatória.'),
    motivo: yup.string().required('O motivo é obrigatório.'),
    interessado: yup.string().required('O interessado é obrigatório.'),
    observacao: yup.string().required('A observação é obrigatória.'),
    statusAtivo: yup.boolean().required('Campo Status é obrigatório.'),
});

// Define os tipos para os dados do formulário
type FormData = yup.InferType<typeof validationSchema>;

// Define as props que o componente do Dialog receberá
interface RegisterFormDialogProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: FormData, id?: number) => void; // A função de submit agora pode receber um ID
    initialData?: FormData & { id?: number } | null; // Dados para pré-preenchimento
}

export default function RegisterFormDialog({ open, onClose, onSubmit, initialData }: RegisterFormDialogProps) {
    const { control, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      placa: '',
      marcaModelo: '',
      cor: '',
      motivo: '',
      interessado: '',
      observacao: '',
      statusAtivo: true,
    },
  });

  // NOVO: useEffect para preencher o formulário quando estiver em modo de edição
  useEffect(() => {
    if (initialData) {
      // 'reset' preenche o formulário com os dados iniciais
      reset(initialData);
    } else {
      // Se não há dados iniciais, garante que o formulário esteja limpo (modo de criação)
      reset({
        placa: '', marcaModelo: '', cor: '', motivo: '', interessado: '', observacao: '', statusAtivo: true
      });
    }
  }, [initialData, open, reset]); // Roda sempre que o dialog abre ou os dados iniciais mudam

  const handleFormSubmit = (data: FormData) => {
    onSubmit(data, initialData?.id);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle fontWeight="bold">Adicionar Novo Veículo para Monitoramento</DialogTitle>
      
      {/* O formulário agora envolve o conteúdo e usa o 'handleSubmit' do React Hook Form */}
      <Box component="form" onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogContent>
          <Box className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            
            {/* Cada campo agora usa o componente 'Controller' para se integrar com o React Hook Form */}
            <Controller
              name="placa"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  autoFocus
                  margin="dense"
                  label="Placa"
                  fullWidth
                  variant="outlined"
                  error={!!errors.placa}
                  helperText={errors.placa?.message}
                />
              )}
            />
            <Controller
              name="cor"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  margin="dense"
                  label="Cor"
                  fullWidth
                  variant="outlined"
                  error={!!errors.cor}
                  helperText={errors.cor?.message}
                />
              )}
            />
            <Controller
              name="marcaModelo"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  margin="dense"
                  label="Marca/Modelo"
                  fullWidth
                  variant="outlined"
                  className="md:col-span-2"
                  error={!!errors.marcaModelo}
                  helperText={errors.marcaModelo?.message}
                />
              )}
            />
             <Controller
              name="motivo"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  margin="dense"
                  label="Motivo do Monitoramento"
                  fullWidth                  
                  variant="outlined"
                  className="md:col-span-2"
                  error={!!errors.motivo}
                  helperText={errors.motivo?.message}
                />
              )}
            />
            <Controller
                name="observacao"
                control={control}
                render={({ field }) => (
                    <TextField
                        {...field}
                        margin="dense"
                        label="Observação"
                        fullWidth
                        multiline
                        rows={4}
                        variant="outlined"
                        className="md:col-span-2"
                        error={!!errors.observacao}
                        helperText={errors.motivo?.message}
                    />
                )}
            />
            <Controller
              name="statusAtivo"
              control={control}
              render={({ field }) => (
                <FormControlLabel 
                  control={<Switch {...field} checked={field.value} color="warning" />} 
                  label="Ativar Monitoramento" 
                />
              )}
            />
            <Controller
              name="interessado"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  margin="dense"
                  label="Interessado"
                  fullWidth
                  variant="outlined"
                  className="md:col-span-2"
                  error={!!errors.interessado}
                  helperText={errors.interessado?.message}
                />
              )}
            />
            
          </Box>
        </DialogContent>
        <DialogActions className="p-4">
          <Button variant='outlined' onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant='contained' className="bg-orange-500 hover:bg-orange-600">
            {initialData ? 'Salvar Alterações' : 'Adicionar'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}


