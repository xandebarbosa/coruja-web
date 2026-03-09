'use client';

import { useState } from 'react';
import { TextField, Button, Paper, Typography, Box, CircularProgress, Card, CardContent, TableContainer, Table, TableHead, TableCell, TableRow, TableBody } from '@mui/material';
import ReactMarkdown from 'react-markdown'; // Para renderizar a resposta da IA
import { VeiculoSuspeitoDTO } from '@/app/types/types';
import { analysisService } from '@/app/services';
import ConvoyResultsTable from './componentes/ConvoyResultsTable';

export default function AnalisePage() {
    const [placa, setPlaca] = useState('');

    // Inicia com a data de hoje formatada em YYYY-MM-DD para o input nativo
    const [dataBusca, setDataBusca] = useState(new Date().toISOString().split('T')[0]);
    const [tempoMinutos, setTempoMinutos] = useState<number>(30); // Tempo padrão de 30 minutos

    const [loading, setLoading] = useState(false);
    const [resultados, setResultados] = useState<VeiculoSuspeitoDTO[] | null>(null);

    const handleAnalisar = async () => {
        if (!placa || !dataBusca || !tempoMinutos) {
            alert("Por favor, preencha todos os campos.");
            return;
        }
        setLoading(true);
        setResultados(null);
        try {
            // O input type="date" devolve YYYY-MM-DD. O nosso back-end já está preparado para aceitar isto perfeitamente!
            const dados = await analysisService.analyzeConvoy(placa, dataBusca, tempoMinutos);
            setResultados(dados);
        } catch (error) {
            console.error(error);
            alert("Ocorreu um erro ao realizar a análise.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='p-4 max-w-7xl mx-auto'>
            <Card className='mb-6 shadow-sm border-t-4 border-t-blue-600'>
                <CardContent>
                    <Typography variant="h4" className="text-3xl font-bold text-gray-800"> 
                        Análise de Comboio
                    </Typography>
                    <Typography className="text-gray-500 mt-2">
                        Cruze dados de múltiplas concessionárias para descobrir quais veículos acompanharam um alvo específico.
                    </Typography>
                </CardContent>
            </Card>
            

            <Paper className="p-6 mb-6 shadow-sm">                
                <Box className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <TextField
                        label="Placa Alvo"
                        variant="outlined"
                        size="small"
                        fullWidth
                        placeholder="ABC1I23"
                        value={placa}
                        onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                    />
                    <TextField
                        label="Data de Busca"
                        type="date"
                        variant="outlined"
                        size="small"
                        fullWidth                        
                        value={dataBusca}
                        onChange={(e) => setDataBusca(e.target.value)}
                    />
                    <TextField
                        label="Janela de Tempo (minutos)"
                        type="number"
                        variant="outlined"
                        size="small"
                        fullWidth
                        value={tempoMinutos}
                        onChange={(e) => setTempoMinutos(Number(e.target.value))}
                    />
                    <Button 
                        variant="contained" 
                        color="primary"
                        onClick={handleAnalisar} 
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Analisar'}
                    </Button>
                </Box>
            </Paper>

            {loading && (
                 <Typography className="text-center text-gray-500 my-8">Varrendo bases de dados das concessionárias... Isso pode levar alguns segundos.</Typography>
            )}

            {/* Aqui nós injetamos o novo componente, passando os dados via 'props' */}
            {!loading && resultados && resultados.length > 0 && (
                <ConvoyResultsTable resultados={resultados} />
            )}

            {!loading && resultados && resultados.length === 0 && (
                <Paper className="p-8 text-center bg-gray-50 border border-gray-200 shadow-sm">
                    <Typography variant="h6" className="text-gray-600">
                        Nenhum veículo suspeito encontrado.
                    </Typography>
                    <Typography variant="body2" className="text-gray-500">
                        Não foram encontrados veículos que tenham passado junto com a placa {placa} num intervalo de {tempoMinutos} minutos na data informada.
                    </Typography>
                </Paper>
            )}
        </div>
    );
}