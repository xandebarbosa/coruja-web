import { monitoringService } from "@/app/services";
import { TelegramService } from "@/app/services/telegram";
import { UsuarioTelegram } from "@/app/types/types";
import { Autocomplete, CircularProgress, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

interface Props {
    value: string | null; //O telegramChatId selecionado
    onChange: (newValue: string | null) => void;
}

export default function TelegramUserSelect({ value, onChange }: Props) {
    const [open, setOpen] = useState(false);
    const [options, setOptions] = useState<UsuarioTelegram[]>([]);
    const [loading, setLoading] = useState(false);

    // Carrega os usuários quando o dropdown abre
  useEffect(() => {
    let active = true; // Flag para evitar setar estado se o componente desmontar

    if (!open) return;
    
    // Evita recarregar se já tem opções populadas
    if (options.length > 0) return;

    const fetchUsers = async () => {
      setLoading(true);
      try {
        // CORREÇÃO AQUI: Adicionado () para executar a função
        const users = await TelegramService.getAll();

        if (active) {
          setOptions(users);
        }
      } catch (error) {
        console.error("Erro ao carregar usuários do Telegram:", error);
        toast.error("Erro ao buscar usuários do Telegram.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchUsers();

    return () => {
      active = false;
    };
  }, [open, options.length]);

    // Encontra o objeto usuário correspondente ao ID selecionado (para exibir corretamente)
    const selectedUser = options.find(user => user.telegramId === value) || null;

  return (
    <Autocomplete
            open={open}
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}
            isOptionEqualToValue={(option, value) => option.telegramId === value.telegramId}
            getOptionLabel={(option) => `${option.primeiroNome} ${option.sobrenome || ''} (@${option.username || 'sem_user'})`}
            options={options}
            loading={loading}
            // O valor do Autocomplete espera o OBJETO inteiro, mas controlamos pelo ID
            value={selectedUser} 
            onChange={(_, newValue) => {
                // Passa para o pai apenas o ID (telegramId) ou null
                onChange(newValue ? newValue.telegramId : null);
            }}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label="Notificar Usuário (Telegram)"
                    placeholder="Selecione quem receberá o alerta"
                    InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                            <>
                                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                            </>
                        ),
                    }}
                />
            )}
        />
  )
}
