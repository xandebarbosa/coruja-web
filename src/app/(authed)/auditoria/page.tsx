'use client'

import { useEffect, useState } from "react";
import { searchLogs } from  "../../services/api"; // Usamos a mesma API de logs
import { Box, Button, Card, CardContent, Chip, CircularProgress, Paper, TextField, Typography } from "@mui/material";
import { Person, Label, HistoryToggleOff } from '@mui/icons-material';

// Interface expandida para incluir os campos de auditoria
// Seu backend Java deve enviar os logs para o Elasticsearch com esta estrutura
interface AuditLogEntry {
    '@timestamp': string;
    log_message: string;      // A mensagem completa
    application_name: string; // "microservico-monitoramento", etc.
    level: string;            // "AUDIT", "INFO", "ERROR"
    
    // Campos específicos de AUDITORIA
    usuario?: string;         // "alexandre@email.com" (extraído do JWT)
    acao?: string;            // "CRIAR_PLACA", "DELETAR_PLACA", "GERAR_RELATORIO"
    mensagem?: string;        // "Usuário criou a placa XYZ-1234" (pode ser o mesmo que log_message)
}

export default function AuditoriaPage() {

    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(false);
    
    // MUDANÇA IMPORTANTE:
    // O valor inicial da busca agora é "level:AUDIT"
    // Esta é a query Lucene que o Elasticsearch usará para filtrar.
    const [query, setQuery] = useState('level:AUDIT');

    const handleSearch = async () => {
        setLoading(true);
        try {
            // A API é a mesma, só muda a query que enviamos
            const results = await searchLogs(query, 0, 50); // Busca os 50 mais recentes
            setLogs(results);
        } catch (error) {
            console.error(error);
            alert('Erro ao buscar logs de auditoria.');
        } finally {
            setLoading(false);
        }
    };
    
    // Busca os logs de auditoria na primeira vez que a página carrega
    useEffect(() => {
        handleSearch();
    }, []);

    // Função para dar cor ao Level (AUDIT, INFO, etc.)
    const getChipColor = (level: string) => {
        if (level === 'ERROR') return 'error';
        if (level === 'WARN') return 'warning';
        if (level === 'AUDIT') return 'success'; // Destaque para auditoria
        return 'info';
    }

    return (
        <div className="p-4 md:p-6">
            <Card className='mb-4 shadow-md'>
                <CardContent>
                    <Typography variant="h4" className="text-3xl font-bold text-gray-800">
                        Trilha de Auditoria
                    </Typography>
                    <Typography color="textSecondary" className="mt-1">
                        Logs de ações importantes realizadas pelos usuários no sistema.
                    </Typography>
                </CardContent>
            </Card>
        
            <Paper className="p-4 mb-6 flex items-center gap-4">
                <TextField 
                    label="Buscar na Auditoria (Ex: level:AUDIT AND acao:DELETAR_PLACA)"
                    variant="outlined"
                    size="small"
                    fullWidth
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button variant="contained" onClick={handleSearch} disabled={loading}>
                    {loading ? <CircularProgress size={24} /> : 'Buscar'}
                </Button>
            </Paper>

            {loading && (
                 <Typography className="text-center p-8">Buscando logs...</Typography>
            )}

            {!loading && logs.length === 0 && (
                 <Paper className="p-8 text-center text-gray-500">
                    Nenhum log de auditoria encontrado para a consulta: "{query}"
                 </Paper>
            )}

            {/* Lista de Logs de Auditoria */}
            <div className="space-y-3">
                {logs.map((log, index) => (
                    <Paper key={index} className="p-4 rounded-lg shadow-sm overflow-hidden">
                        
                        {/* Cabeçalho do Log: Quando, Nível, Serviço */}
                        <Box className="flex flex-wrap items-center gap-3 mb-3 pb-3 border-b border-gray-200">
                            <Typography variant="caption" className="font-mono text-blue-600 font-semibold">
                                {new Date(log['@timestamp']).toLocaleString('pt-BR')}
                            </Typography>
                            <Chip 
                                label={log.level} 
                                size="small" 
                                color={getChipColor(log.level)} 
                                className="font-bold" 
                            />
                            <Chip 
                                label={log.application_name} 
                                size="small" 
                                variant="outlined" 
                                className="text-cyan-700 border-cyan-700" 
                            />
                        </Box>

                        {/* Corpo de Auditoria: Quem e O Quê */}
                        <Box className="flex flex-col md:flex-row md:items-center gap-4 mb-3">
                            {log.usuario && (
                                <Chip 
                                    icon={<Person />}
                                    label={`Usuário: ${log.usuario}`}
                                    variant="filled"
                                    className="bg-gray-200 text-gray-800 font-medium"
                                />
                            )}
                            {log.acao && (
                                <Chip 
                                    icon={<HistoryToggleOff />}
                                    label={`Ação: ${log.acao}`}
                                    variant="filled"
                                    className="bg-orange-100 text-orange-800 font-medium"
                                />
                            )}
                        </Box>

                        {/* Mensagem de Log Detalhada */}
                        <pre className="whitespace-pre-wrap font-mono text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                            {log.mensagem || log.log_message}
                        </pre>
                    </Paper>
                ))}
            </div>
        </div>
    );
}