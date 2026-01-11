import { monitoringService } from "@/app/services";
import { TelegramUser } from "@/app/types/types";
import { Autocomplete, CircularProgress, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

interface Props {
    value: string | null; //O telegramChatId selecionado
    onChange: (newValue: string | null) => void;
}

export default function TelegramUserSelect({ value, onChange }: Props) {
    const [open, setOpen] = useState(false);
    const [options, setOptions] = useState<TelegramUser[]>([]);
    const [loading, setLoading] = useState(false);

    //Carrega os usuários quando o dropdown abre
    useEffect(() => {
        if (!open) return;

        // Evita recarregar se já tem opcões
        if (options.length > 0) return;
        setLoading(true);

        monitoringService.getTelegramUsers()
            .then(users => {
                setOptions(users);
                toast.success("Usuários do Telegram carregados com sucesso!");
            })
            .catch(error => {
                console.error("Erro ao carregar usuários do Telegram:", error);
                toast.error("Erro ao carregar usuários do Telegram");
            })
            .finally(() => {
                setLoading(false);
            });
    }, [open, options.length]);

    // Encontra o objeto usuário correspondente ao ID selecionado (para exibir corretamente)
    const selectedUser = options.find(user => user.telegramId === value) || null;

  return (
    <Autocomplete
            open={open}
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}
            isOptionEqualToValue={(option, value) => option.telegramId === value.telegramId}
            getOptionLabel={(option) => `${option.primeiroNome} ${option.sobreNome || ''} (@${option.username || 'sem_user'})`}
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
