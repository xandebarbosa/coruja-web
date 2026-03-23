import React, { useState } from 'react';
import { 
    Table, TableBody, TableCell, TableContainer, 
    TableHead, TableRow, Collapse, IconButton, 
    Box, Typography, Paper 
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { VeiculoSuspeitoDTO } from '../../../types/types';

// 🔹 Função auxiliar para converter Segundos em "Xm Ys"
function formatarTempo(segundosTotal: number) {
    const minutos = Math.floor(segundosTotal / 60);
    const segundos = segundosTotal % 60;

    if (minutos > 0) {
        return `${minutos}m ${segundos}s`;
    }
    return `${segundos}s`;
}

// 🔹 Formata data de forma robusta — aceita string, Date ou undefined
// Mesmo padrão do valueGetter usado no SelectivePassagesTable
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

function Row({ row }: { row: VeiculoSuspeitoDTO }) {
    const [open, setOpen] = useState(false);

    return (
        <React.Fragment>
            <TableRow sx={{ '& > *': { borderBottom: 'unset' } }} className="hover:bg-gray-50">
                <TableCell>
                    <IconButton size="small" onClick={() => setOpen(!open)}>
                        {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                </TableCell>
                <TableCell component="th" scope="row" className="font-bold text-lg">
                    {row.placa}
                </TableCell>
                <TableCell align="center">
                    <span className="bg-blue-100 text-blue-800 font-semibold px-3 py-1 rounded-full">
                        {row.quantidadeEncontros} encontros
                    </span>
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={3}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 2 }} className="bg-gray-50 p-4 rounded-md border border-gray-200">
                            <Typography variant="h6" gutterBottom component="div" className="text-gray-700">
                                📍 Detalhes dos Encontros
                            </Typography>
                            <Table size="small" aria-label="purchases">
                                <TableHead>
                                    <TableRow>
                                        <TableCell className="font-semibold">Data</TableCell>
                                        <TableCell className="font-semibold">Concessionária</TableCell>
                                        <TableCell className="font-semibold">Local (Rodovia / KM)</TableCell>
                                        <TableCell className="font-semibold">Sentido</TableCell>
                                        <TableCell className="font-semibold">Hora do Alvo</TableCell>
                                        <TableCell className="font-semibold">Hora do Suspeito</TableCell>
                                        <TableCell align="right" className="font-semibold">Diferença</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {row.locaisDeEncontro.map((encontro, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell className="font-mono text-sm">
                                                {formatarData(encontro.data)}
                                            </TableCell>
                                            <TableCell>{encontro.concessionaria}</TableCell>
                                            <TableCell>{encontro.rodovia} - {encontro.km}</TableCell>
                                            <TableCell>{encontro.sentido}</TableCell>
                                            <TableCell>{encontro.horaAlvo}</TableCell>
                                            <TableCell>{encontro.horaSuspeito}</TableCell>
                                            {/* 🔹 Aqui aplicamos a função de conversão */}
                                            <TableCell align="right" className="font-medium text-red-600">
                                                {formatarTempo(encontro.diferencaSegundos)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </React.Fragment>
    );
}

interface ConvoyResultsTableProps {
    resultados: VeiculoSuspeitoDTO[];
}

export default function ConvoyResultsTable({ resultados }: ConvoyResultsTableProps) {
    if (!resultados || resultados.length === 0) return null;

    return (
        <TableContainer component={Paper} className="shadow-sm">
            <Table aria-label="tabela de veículos suspeitos">
                <TableHead className="bg-gray-100">
                    <TableRow>
                        <TableCell width="50" />
                        <TableCell className="font-bold text-gray-700">Placa do Veículo Acompanhante</TableCell>
                        <TableCell align="center" className="font-bold text-gray-700">Coincidências de Local/Hora</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {resultados.map((row) => (
                        <Row key={row.placa} row={row} />
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
