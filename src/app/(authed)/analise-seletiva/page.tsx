'use client';

import React, { useState } from 'react';
import {
    TextField,
    Button,
    Typography,
    Box,
    CircularProgress,
    Card,
    CardContent,
    Chip,
    LinearProgress,
    alpha,
} from '@mui/material';

import {
    Search,
    DirectionsCar,
    Route,
    CheckCircle,
    RadioButtonUnchecked,
} from '@mui/icons-material';
import { toast } from 'react-toastify';

import api from '../../services/client';
import { analysisService } from '../../services/analysis';
import { VeiculoSuspeitoDTO, RadarsDTO } from '../../types/types';

import ConvoyResultsTable from '../analise-comboio/componentes/ConvoyResultsTable';
import SelectivePassagesTable from '../analise-seletiva/componentes/SelectivePassagesTable';
import { exportToExcel } from '@/app/components/ExportExcel';
import { radarsService } from '@/app/services';
import { exportToExcelAnalise } from './componentes/ExportExcelAnalise';

function formatarData(data: string | null | undefined): string {
    if (!data) return '—';

    // Se a data já chegar no padrão YYYY-MM-DD, nós fatiamos e invertemos
    if (typeof data === 'string' && data.includes('-')) {
        // Divide "2026-03-23" em ["2026", "03", "23"]
        const partes = data.split('T')[0].split('-'); 
        
        if (partes.length === 3) {
            // Retorna "23/03/2026"
            return `${partes[2]}/${partes[1]}/${partes[0]}`;
        }
    }

    // Fallback para outros formatos que possam vir
    const dataObj = new Date(data);
    if (!isNaN(dataObj.getTime())) {
        // Usa o UTC para evitar que a data volte 1 dia para trás dependendo do fuso do navegador
        return dataObj.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    }

    return '—';
}

export default function AnaliseSeletivaPage() {
    const [placa, setPlaca] = useState('');
    const [tempoMinutos, setTempoMinutos] = useState<number>(30);

    const [loadingBusca, setLoadingBusca] = useState(false);
    const [loadingAnalise, setLoadingAnalise] = useState(false);

    const [passagens, setPassagens] = useState<(RadarsDTO & { uid?: string })[]>([]);
    const [rowSelectionModel, setRowSelectionModel] = useState<any[]>([]);

    const [resultadosIA, setResultadosIA] = useState<VeiculoSuspeitoDTO[] | null>(null);
    const [exportFilters, setExportFilters] = useState<RadarsDTO | null>(null);

    // ── Passo 1: Busca o histórico da placa ──────────────────────────────────
    const handleBuscarPassagens = async () => {
        if (!placa.trim()) {
            toast.warn('⚠️ Por favor, informe a placa.');
            return;
        }
        setLoadingBusca(true);
        setResultadosIA(null);
        setPassagens([]);
        setRowSelectionModel([]);

        try {
            const { data } = await api.get(`/radares/busca-placa?placa=${placa.trim().toUpperCase()}&size=100`);

            const listWithId = (data.content ?? []).map((item: any, index: number) => ({
                ...item,
                uid: item.id ? String(item.id) : `temp-id-${index}`,
            }));

            setPassagens(listWithId);

            if (listWithId.length === 0) {
                toast.info('Nenhuma passagem encontrada para essa placa.');
            } else {
                toast.success(`✅ ${listWithId.length} passagens carregadas.`);
            }
        } catch (error) {
            console.error('Erro ao buscar passagens:', error);
            toast.error('Erro ao buscar histórico da placa.');
        } finally {
            setLoadingBusca(false);
        }
    };

    // ── Passo 2: Envia passagens selecionadas para análise ───────────────────
    const handleAnalisarSelecionados = async () => {
        if (rowSelectionModel.length === 0) {
            toast.warn('⚠️ Selecione pelo menos um local na tabela antes de analisar.');
            return;
        }

        const passagensSelecionadas = passagens.filter((p) =>
            rowSelectionModel.includes(p.uid as string)
        );

        setLoadingAnalise(true);
        setResultadosIA(null);

        try {
            const dados = await analysisService.analyzeSelectedPassages(
                placa,
                tempoMinutos,
                passagensSelecionadas
            );
            setResultadosIA(dados);
        } catch (error) {
            console.error(error);
            toast.error('Ocorreu um erro ao processar a análise.');
        } finally {
            setLoadingAnalise(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleBuscarPassagens();
    };

    // Função responsável pelo botão de exportação na Análise Seletiva
const handleExportarExcel = async () => {
    if (!resultadosIA || resultadosIA.length === 0) {
        toast.warn('⚠️ Não há resultados de análise para exportar.');
        return;
    }

    try {
        // Mapeia os dados para ficarem IDÊNTICOS ao modelo fornecido
        const dadosParaExportar = resultadosIA.flatMap((veiculo) => 
            veiculo.locaisDeEncontro.map((encontro) => ({
                'DATA': formatarData(encontro.data), // Formata a data se necessário
                'HORA ALVO': encontro.horaAlvo || '',
                'HORA SUSPEITO': encontro.horaSuspeito || '',
                'PLACA': veiculo.placa || '',
                'MARCA/MODELO': veiculo.marcaModelo || '—',  // ✅ Injetado do Detran
                'COR': veiculo.cor || '—',                   // ✅ Injetado do Detran
                'MUNICÍPIO': veiculo.municipio || '—',       // ✅ Injetado do Detran
                'LOCAL': encontro.praca || encontro.concessionaria || '', // Ajuste conforme seu conceito de "Local"
                'SENTIDO': encontro.sentido || '',
                'SP': encontro.rodovia || '',
                'KM': encontro.km || '',
                'REP': veiculo.quantidadeEncontros || 0
            }))
        );

        // Opcional: Ordenar por placa para agrupar os encontros do mesmo veículo
        dadosParaExportar.sort((a, b) => a.PLACA.localeCompare(b.PLACA));

        if (dadosParaExportar.length > 0) {
            exportToExcelAnalise(dadosParaExportar, `RESULTADO_ANALISE_${placa}`, placa);
            toast.success('✅ Resultados exportados com sucesso!');
        } else {
            toast.info('ℹ️ Os veículos encontrados não possuem detalhes para exportar.');
        }

    } catch (error) {
        console.error('Erro ao exportar para Excel:', error);
        toast.error('Ocorreu um erro ao gerar o arquivo.');
    }
};

    // ── Renderização ─────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-[#fef9f3] to-gray-50 p-6">

            {/* ── Header ───────────────────────────────────────────────────── */}
            <Card
                className="mb-6 overflow-hidden"
                sx={{
                    background: 'linear-gradient(135deg, #14213d 0%, #1a2b4a 100%)',
                    boxShadow: '0 20px 60px rgba(20, 33, 61, 0.3)',
                    borderRadius: '16px',
                    position: 'relative',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0, left: 0, right: 0,
                        height: '4px',
                        background: 'linear-gradient(90deg, #fca311 0%, #ff8800 100%)',
                    },
                }}
            >
                <CardContent className="py-10 px-8">
                    <div className="flex items-center gap-5">
                        <Box
                            sx={{
                                background: 'rgba(252, 163, 17, 0.15)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(252, 163, 17, 0.3)',
                                borderRadius: '16px',
                                p: 2.5,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 8px 32px rgba(252, 163, 17, 0.2)',
                            }}
                        >
                            <Route sx={{ fontSize: 48, color: '#fca311' }} />
                        </Box>
                        <div>
                            <Typography
                                variant="h3"
                                className="font-bold text-white mb-2"
                                sx={{ letterSpacing: '-0.5px', textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}
                            >
                                Análise de Comboio Seletiva
                            </Typography>
                            <Typography
                                variant="body1"
                                sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '15px', fontWeight: 500 }}
                            >
                                Busque o histórico de um veículo, selecione passagens específicas e descubra quem viajou junto.
                            </Typography>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ── Passo 1 — Buscar Passagens ───────────────────────────────── */}
            <Card
                className="mb-6 overflow-hidden"
                sx={{
                    boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
                    borderRadius: '16px',
                    border: '1px solid rgba(0,0,0,0.06)',
                }}
            >
                {/* Sub-header do card */}
                <Box
                    sx={{
                        background: 'linear-gradient(135deg, #1a2b4a 0%, #14213d 100%)',
                        px: 4, py: 2.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                    }}
                >
                    <Box
                        sx={{
                            bgcolor: alpha('#fca311', 0.2),
                            borderRadius: '50%',
                            width: 28, height: 28,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Typography sx={{ color: '#fca311', fontWeight: 800, fontSize: 13 }}>1</Typography>
                    </Box>
                    <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 600 }}>
                        Buscar Passagens da Placa
                    </Typography>
                </Box>

                <CardContent className="p-6">
                    <Box className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                        <TextField
                            label="Placa Alvo"
                            variant="outlined"
                            size="medium"
                            value={placa}
                            placeholder="ABC1D23"
                            onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                            onKeyPress={handleKeyPress}
                            InputProps={{
                                startAdornment: (
                                    <DirectionsCar sx={{ color: '#fca311', mr: 1 }} />
                                ),
                            }}
                            sx={{
                                width: { xs: '100%', sm: '320px' },
                                '& .MuiOutlinedInput-root': {
                                    '&:hover fieldset': { borderColor: '#fca311' },
                                    '&.Mui-focused fieldset': { borderColor: '#fca311', borderWidth: 2 },
                                },
                                '& .MuiInputLabel-root.Mui-focused': { color: '#fca311' },
                            }}
                        />

                        <Button
                            variant="contained"
                            size="large"
                            onClick={handleBuscarPassagens}
                            disabled={loadingBusca}
                            startIcon={
                                loadingBusca
                                    ? <CircularProgress size={20} color="inherit" />
                                    : <Search />
                            }
                            sx={{
                                minWidth: '180px',
                                height: '56px',
                                background: 'linear-gradient(135deg, #fca311 0%, #ff8800 100%)',
                                color: '#14213d',
                                fontWeight: 700,
                                fontSize: '15px',
                                textTransform: 'none',
                                borderRadius: '12px',
                                boxShadow: '0 4px 14px rgba(252, 163, 17, 0.4)',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #ff8800 0%, #fca311 100%)',
                                    boxShadow: '0 6px 20px rgba(252, 163, 17, 0.5)',
                                    transform: 'translateY(-1px)',
                                },
                                '&:disabled': { bgcolor: '#e5e7eb', color: '#9ca3af' },
                                transition: 'all 0.3s ease',
                            }}
                        >
                            {loadingBusca ? 'Buscando...' : 'Buscar Passagens'}
                        </Button>
                    </Box>

                    {loadingBusca && (
                        <LinearProgress
                            sx={{
                                mt: 3, borderRadius: 1,
                                bgcolor: '#fef3e2',
                                '& .MuiLinearProgress-bar': { bgcolor: '#fca311' },
                            }}
                        />
                    )}
                </CardContent>
            </Card>

            {/* ── Passo 2 — Selecionar Passagens ───────────────────────────── */}
            {passagens.length > 0 && (
                <Card
                    className="mb-6 overflow-hidden"
                    sx={{
                        boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
                        borderRadius: '16px',
                        border: '1px solid rgba(0,0,0,0.06)',
                    }}
                >
                    {/* Sub-header */}
                    <Box
                        sx={{
                            background: 'linear-gradient(135deg, #1a2b4a 0%, #14213d 100%)',
                            px: 4, py: 2.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box
                                sx={{
                                    bgcolor: alpha('#fca311', 0.2),
                                    borderRadius: '50%',
                                    width: 28, height: 28,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Typography sx={{ color: '#fca311', fontWeight: 800, fontSize: 13 }}>2</Typography>
                            </Box>
                            <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 600 }}>
                                Selecionar Passagens para Varredura
                            </Typography>
                        </Box>

                        {/* Contador de selecionados */}
                        <Chip
                            icon={
                                rowSelectionModel.length > 0
                                    ? <CheckCircle sx={{ color: '#fca311 !important', fontSize: 16 }} />
                                    : <RadioButtonUnchecked sx={{ color: 'rgba(255,255,255,0.5) !important', fontSize: 16 }} />
                            }
                            label={
                                rowSelectionModel.length > 0
                                    ? `${rowSelectionModel.length} selecionado(s)`
                                    : 'Nenhum selecionado'
                            }
                            sx={{
                                bgcolor: rowSelectionModel.length > 0
                                    ? alpha('#fca311', 0.2)
                                    : 'rgba(255,255,255,0.08)',
                                color: rowSelectionModel.length > 0 ? '#fca311' : 'rgba(255,255,255,0.6)',
                                border: `1px solid ${rowSelectionModel.length > 0 ? alpha('#fca311', 0.4) : 'rgba(255,255,255,0.15)'}`,
                                fontWeight: 600,
                            }}
                        />
                    </Box>

                    <CardContent className="p-6">
                        {/* Tabela de passagens */}
                        <SelectivePassagesTable
                            passagens={passagens}
                            rowSelectionModel={rowSelectionModel}
                            onSelectionChange={setRowSelectionModel}
                        />

                        {/* ── Painel de Execução ── */}
                        <Box
                            sx={{
                                mt: 4, p: 3,
                                bgcolor: alpha('#14213d', 0.04),
                                borderRadius: '12px',
                                border: `1px solid ${alpha('#14213d', 0.1)}`,
                                display: 'flex',
                                flexWrap: 'wrap',
                                alignItems: 'center',
                                gap: 3,
                            }}
                        >
                            <TextField
                                label="Tolerância de Tempo (minutos)"
                                type="number"
                                variant="outlined"
                                size="small"
                                value={tempoMinutos}
                                onChange={(e) => setTempoMinutos(Number(e.target.value))}
                                inputProps={{ min: 1, max: 120 }}
                                sx={{
                                    width: '240px',
                                    '& .MuiOutlinedInput-root': {
                                        '&:hover fieldset': { borderColor: '#fca311' },
                                        '&.Mui-focused fieldset': { borderColor: '#fca311' },
                                    },
                                    '& .MuiInputLabel-root.Mui-focused': { color: '#fca311' },
                                }}
                            />

                            <Typography
                                variant="body2"
                                sx={{ color: '#6b7280', fontWeight: 500 }}
                            >
                                {rowSelectionModel.length === 0
                                    ? 'Selecione os locais na tabela acima'
                                    : `${rowSelectionModel.length} local(is) selecionado(s) para varredura`}
                            </Typography>

                            <Box flexGrow={1} />

                            <Button
                                variant="contained"
                                size="large"
                                onClick={handleAnalisarSelecionados}
                                disabled={loadingAnalise || rowSelectionModel.length === 0}
                                startIcon={
                                    loadingAnalise
                                        ? <CircularProgress size={20} color="inherit" />
                                        : <Route />
                                }
                                sx={{
                                    minWidth: '180px',
                                    height: '48px',
                                    bgcolor: '#059669',
                                    color: 'white',
                                    fontWeight: 700,
                                    fontSize: '15px',
                                    textTransform: 'none',
                                    borderRadius: '12px',
                                    boxShadow: '0 4px 14px rgba(5, 150, 105, 0.4)',
                                    '&:hover': {
                                        bgcolor: '#047857',
                                        boxShadow: '0 6px 20px rgba(5, 150, 105, 0.5)',
                                        transform: 'translateY(-1px)',
                                    },
                                    '&:disabled': { bgcolor: '#e5e7eb', color: '#9ca3af', boxShadow: 'none' },
                                    transition: 'all 0.3s ease',
                                }}
                            >
                                {loadingAnalise ? 'Analisando...' : 'Executar Análise'}
                            </Button>
                        </Box>

                        {loadingAnalise && (
                            <LinearProgress
                                sx={{
                                    mt: 2, borderRadius: 1,
                                    bgcolor: '#d1fae5',
                                    '& .MuiLinearProgress-bar': { bgcolor: '#059669' },
                                }}
                            />
                        )}
                    </CardContent>
                </Card>
            )}

            {/* ── Passo 3 — Resultados ─────────────────────────────────────── */}
            {!loadingAnalise && resultadosIA && (
                <Card
                    className="overflow-hidden"
                    sx={{
                        boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
                        borderRadius: '16px',
                        border: '1px solid rgba(0,0,0,0.06)',
                    }}
                >
                    {/* Sub-header */}
                    <Box
                        sx={{
                            background: 'linear-gradient(135deg, #1a2b4a 0%, #14213d 100%)',
                            px: 4, py: 2.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box
                                sx={{
                                    bgcolor: alpha('#fca311', 0.2),
                                    borderRadius: '50%',
                                    width: 28, height: 28,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Typography sx={{ color: '#fca311', fontWeight: 800, fontSize: 13 }}>3</Typography>
                            </Box>
                            <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 600 }}>
                                Resultados da Investigação
                            </Typography>
                            {resultadosIA.length > 0 && (
                                <Button 
                                    variant="outlined" 
                                    color="primary" 
                                    onClick={handleExportarExcel}
                                    startIcon={<span>📊</span>} 
                                >
                                Exportar Excel
                                </Button>
                            )}
                        </Box>

                        <Chip
                            label={
                                resultadosIA.length > 0
                                    ? `${resultadosIA.length} veículo(s) suspeito(s)`
                                    : 'Nenhum suspeito encontrado'
                            }
                            sx={{
                                bgcolor: resultadosIA.length > 0
                                    ? alpha('#fca311', 0.2)
                                    : 'rgba(255,255,255,0.08)',
                                color: resultadosIA.length > 0 ? '#fca311' : 'rgba(255,255,255,0.6)',
                                border: `1px solid ${resultadosIA.length > 0 ? alpha('#fca311', 0.4) : 'rgba(255,255,255,0.15)'}`,
                                fontWeight: 600,
                            }}
                        />
                    </Box>

                    <CardContent className="p-6">
                        {resultadosIA.length > 0 ? (
                            <ConvoyResultsTable resultados={resultadosIA} />
                        ) : (
                            <Box
                                sx={{
                                    py: 8,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 2,
                                    bgcolor: alpha('#14213d', 0.03),
                                    borderRadius: '12px',
                                    border: `1px dashed ${alpha('#14213d', 0.15)}`,
                                }}
                            >
                                <Route sx={{ fontSize: 56, color: '#d1d5db' }} />
                                <Typography variant="h6" sx={{ color: '#6b7280', fontWeight: 600 }}>
                                    Nenhum veículo suspeito encontrado
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#9ca3af', textAlign: 'center', maxWidth: 420 }}>
                                    Não foram identificados padrões de comboio nos locais e janela de tempo selecionados.
                                    Tente aumentar a tolerância de tempo ou selecionar mais passagens.
                                </Typography>
                            </Box>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}