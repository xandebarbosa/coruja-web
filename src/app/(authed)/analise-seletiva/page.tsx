'use client';

import React, { useState } from 'react';
import { 
    TextField, Button, Paper, Typography, Box, CircularProgress, Card, CardContent 
} from '@mui/material';
import { GridRowSelectionModel } from '@mui/x-data-grid';

import api from '../../services/client';
import { analysisService } from '../../services/analysis';
import { VeiculoSuspeitoDTO, RadarsDTO } from '../../types/types';

import ConvoyResultsTable from '../analise-comboio/componentes/ConvoyResultsTable';
import SelectivePassagesTable from '../analise-seletiva/componentes/SelectivePassagesTable';

export default function AnaliseSeletivaPage() {
    const [placa, setPlaca] = useState('');
    const [tempoMinutos, setTempoMinutos] = useState<number>(30);
    
    const [loadingBusca, setLoadingBusca] = useState(false);
    const [loadingAnalise, setLoadingAnalise] = useState(false);
    
    // Estado para a tabela de seleção
    const [passagens, setPassagens] = useState<(RadarsDTO & { uid?: string })[]>([]);
    const [rowSelectionModel, setRowSelectionModel] = useState<any[]>([]);
    
    // Estado para os resultados finais da IA
    const [resultadosIA, setResultadosIA] = useState<VeiculoSuspeitoDTO[] | null>(null);

    // Passo 1: Busca o histórico
    const handleBuscarPassagens = async () => {
        if (!placa) {
            alert("Por favor, informe a placa.");
            return;
        }
        setLoadingBusca(true);
        setResultadosIA(null);
        setPassagens([]);
        setRowSelectionModel([]); // Limpa as seleções anteriores
        
        try {
            const { data } = await api.get(`/radares/busca-placa?placa=${placa}&size=100`);
            
            // Injeta um 'uid' em cada registro para garantir que o DataGrid tenha IDs únicos
            const listWithId = data.content.map((item: any, index: number) => ({
                ...item,
                uid: item.id ? String(item.id) : `temp-id-${index}`
            }));
            
            setPassagens(listWithId);
        } catch (error) {
            console.error("Erro ao buscar passagens:", error);
            alert("Erro ao buscar histórico da placa.");
        } finally {
            setLoadingBusca(false);
        }
    };

    // Passo 2: Envia para IA
    const handleAnalisarSelecionados = async () => {
        if (rowSelectionModel.length === 0) {
            alert("Selecione pelo menos um local na tabela antes de analisar.");
            return;
        }

        // Filtra os objetos completos usando os UIDs selecionados
        const passagensSelecionadas = passagens.filter(p => rowSelectionModel.includes(p.uid as string));

        setLoadingAnalise(true);
        setResultadosIA(null);
        
        try {
            const dados = await analysisService.analyzeSelectedPassages(placa, tempoMinutos, passagensSelecionadas);
            setResultadosIA(dados);
        } catch (error) {
            console.error(error);
            alert("Ocorreu um erro ao processar a IA.");
        } finally {
            setLoadingAnalise(false);
        }
    };

    return (
        <div className='p-4 max-w-7xl mx-auto'>
            <Card className='mb-6 shadow-sm border-t-4 border-t-purple-600'>
                <CardContent>
                    <Typography variant="h4" className="text-2xl font-bold text-gray-800">
                        Análise de Comboio (Seletiva)
                    </Typography>
                    <Typography className="text-gray-500 mt-2">
                        Busque o histórico de um veículo alvo, selecione passagens específicas e a IA encontrará quem viajou com ele.
                    </Typography>
                </CardContent>
            </Card>

            {/* Painel 1: Pesquisa da Placa */}
            <Paper className="p-6 mb-6 shadow-sm">
                <Box className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <TextField
                        label="Placa Alvo"
                        variant="outlined"
                        size="small"
                        value={placa}
                        onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                    />
                    <Button 
                        variant="contained" 
                        color="secondary"
                        className="h-10"
                        onClick={handleBuscarPassagens} 
                        disabled={loadingBusca}
                    >
                        {loadingBusca ? <CircularProgress size={24} color="inherit" /> : '1. Buscar Passagens'}
                    </Button>
                </Box>
            </Paper>

            {/* Painel 2: Tabela de Seleção (Aparece após a busca) */}
            {passagens.length > 0 && (
                <Paper className="p-6 mb-6 shadow-sm border border-gray-200">
                    <Typography variant="h6" className="mb-4">
                        Selecione os locais para a varredura:
                    </Typography>
                    
                    {/* Nosso novo componente sendo usado de forma limpa */}
                    <SelectivePassagesTable 
                        passagens={passagens}
                        rowSelectionModel={rowSelectionModel}
                        onSelectionChange={setRowSelectionModel}
                    />

                    {/* Controles de execução da IA */}
                    <Box className="mt-4 p-4 bg-gray-50 rounded-md flex flex-wrap items-center gap-4 border border-gray-200">
                        <TextField
                            label="Tolerância de Tempo (Minutos)"
                            type="number"
                            variant="outlined"
                            size="small"
                            value={tempoMinutos}
                            onChange={(e) => setTempoMinutos(Number(e.target.value))}
                        />
                        <Typography className="text-gray-600 font-medium">
                            {rowSelectionModel.length} local(is) selecionado(s)
                        </Typography>
                        <Box flexGrow={1} />
                        <Button 
                            variant="contained" 
                            color="success"
                            className="h-10 px-8"
                            onClick={handleAnalisarSelecionados} 
                            disabled={loadingAnalise || rowSelectionModel.length === 0}
                        >
                            {loadingAnalise ? <CircularProgress size={24} color="inherit" /> : '2. Executar IA'}
                        </Button>
                    </Box>
                </Paper>
            )}

            {/* Painel 3: Tabela de Resultados (Aparece após o processamento da IA) */}
            {!loadingAnalise && resultadosIA && (
                <Box className="mt-8">
                    <Typography variant="h5" className="mb-4 font-bold text-gray-800">
                        Resultados da Investigação
                    </Typography>
                    {resultadosIA.length > 0 ? (
                        <ConvoyResultsTable resultados={resultadosIA} />
                    ) : (
                        <Paper className="p-8 text-center bg-gray-50 border border-gray-200">
                            <Typography variant="h6" className="text-gray-600">Nenhum veículo suspeito.</Typography>
                            <Typography className="text-gray-500">A IA não encontrou padrões de comboio nos locais selecionados.</Typography>
                        </Paper>
                    )}
                </Box>
            )}
        </div>
    );
}