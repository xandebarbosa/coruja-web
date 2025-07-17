'use client'

import { useEffect, useState } from "react";
import { searchLogs } from "../services/api";
import { Box, Button, Chip, CircularProgress, Paper, TextField, Typography } from "@mui/material";

interface LogEntry {
    '@timestamp': string;
    log_message: string;
    application_name: string;
    level: string;
    // Outros campos que podem vir do log...
}

export default function LogsPage() {

    const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('*'); // Busca inicial por tudo

  const handleSearch = async () => {
    setLoading(true);
    try {
      const results = await searchLogs(query, 0, 50); // Busca os 50 mais recentes
      setLogs(results);
    } catch (error) {
      console.error(error);
      alert('Erro ao buscar logs.');
    } finally {
      setLoading(false);
    }
  };
  
  // Busca os logs na primeira vez que a página carrega
  useEffect(() => {
    handleSearch();
  }, []);

  const getChipColor = (level: string) => {
    if (level === 'ERROR') return 'error';
    if (level === 'WARN') return 'warning';
    return 'info';
  }
  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Logs do Sistema</h1>
      
      <Paper className="p-4 mb-6 flex items-center gap-4">
        <TextField 
          label="Buscar nos Logs"
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

      <div className="space-y-3">
        {logs.map((log, index) => (
          <Paper key={index} className="p-4 font-mono text-sm rounded-lg bg-gray-800 text-white overflow-x-auto">
            <Box className="flex items-center gap-4 mb-2">
              <Typography variant="caption" className="text-yellow-400">
                {new Date(log['@timestamp']).toLocaleString('pt-BR')}
              </Typography>
              <Chip label={log.level} size="small" color={getChipColor(log.level)} className="font-bold" />
              <Chip label={log.application_name} size="small" variant="outlined" className="text-cyan-400 border-cyan-400" />
            </Box>
            <pre className="whitespace-pre-wrap">{log.log_message}</pre>
          </Paper>
        ))}
      </div>
    </div>
  );
}
