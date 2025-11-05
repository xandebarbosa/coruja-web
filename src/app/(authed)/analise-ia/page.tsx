'use client';

import { useState } from 'react';
import { TextField, Button, Paper, Typography, Box, CircularProgress, Card, CardContent } from '@mui/material';
import { analisarPlacaComIA } from '../services/api';
import ReactMarkdown from 'react-markdown'; // Para renderizar a resposta da IA

export default function AnalisePage() {
    const [placa, setPlaca] = useState('');
    const [loading, setLoading] = useState(false);
    const [resultado, setResultado] = useState('');

    const handleAnalisar = async () => {
        if (!placa) {
            alert("Por favor, insira uma placa.");
            return;
        }
        setLoading(true);
        setResultado('');
        try {
            const analise = await analisarPlacaComIA(placa);
            setResultado(analise);
        } catch (error) {
            console.error(error);
            setResultado("Ocorreu um erro ao realizar a análise.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='p-4'>
            <Card className='mb-4'>
                <CardContent>
                    <Typography variant="h4" className="text-3xl font-bold text-gray-800"> Análise de Comboio com IA (Gemini)</Typography>
                </CardContent>
            </Card>
            

            <Paper className="p-6 mb-6">
                <Typography className="mb-4">
                    Digite a placa de um veículo para verificar se outros veículos passaram consistentemente junto com ele nos mesmos locais e horários.
                </Typography>
                <Box className="flex items-center gap-4">
                    <TextField
                        label="Placa do Veículo Alvo"
                        variant="outlined"
                        size="small"
                        fullWidth
                        value={placa}
                        onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                    />
                    <Button variant="contained" onClick={handleAnalisar} disabled={loading}>
                        {loading ? <CircularProgress size={24} /> : 'Analisar'}
                    </Button>
                </Box>
            </Paper>

            {loading && (
                 <Typography className="text-center">Analisando dados... Isso pode levar um momento.</Typography>
            )}

            {resultado && (
                <Paper className="p-6">
                    <Typography variant="h6" className="mb-4">Resultado da Análise</Typography>
                    {/* Usamos ReactMarkdown para formatar a resposta da IA */}
                    <Box className="prose max-w-none">
                       <ReactMarkdown>{resultado}</ReactMarkdown>
                    </Box>
                </Paper>
            )}
        </div>
    );
}