import React, { useState } from 'react';
import {
    Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Collapse, IconButton,
    Box, Typography, Paper
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { VeiculoSuspeitoDTO } from '../../../types/types';

function formatarTempo(segundosTotal: number) {
    const minutos = Math.floor(segundosTotal / 60);
    const segundos = segundosTotal % 60;
    if (minutos > 0) return `${minutos}m ${segundos}s`;
    return `${segundos}s`;
}

// Aceita string ISO, Date object ou undefined
function formatarData(data: any): string {
    if (!data) return '—';
    if (typeof data === 'string') {
        const parsed = new Date(`${data}T00:00:00`);
        if (!isNaN(parsed.getTime())) return parsed.toLocaleDateString('pt-BR');
        return '—';
    }
    const dataObj = new Date(data);
    if (!isNaN(dataObj.getTime())) return dataObj.toLocaleDateString('pt-BR');
    return '—';
}

function Row({ row }: { row: VeiculoSuspeitoDTO }) {
    const [open, setOpen] = useState(false);

    return (
        <React.Fragment>
            <TableRow sx={{ '& > *': { borderBottom: 'unset' } }} className="hover:bg-gray-50">
                <TableCell sx={{ width: 50, px: 1 }}>
                    <IconButton size="small" onClick={() => setOpen(!open)}>
                        {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                </TableCell>
                <TableCell component="th" scope="row" className="font-bold text-base">
                    {row.placa} 
                </TableCell>
                <TableCell>
                    {row.marcaModelo}
                </TableCell>
                <TableCell>
                    {row.cor}
                </TableCell>
                <TableCell>
                    {row.municipio}
                </TableCell>
                <TableCell align="center">
                    <span className="bg-blue-100 text-blue-800 font-semibold px-3 py-1 rounded-full text-sm whitespace-nowrap">
                        {row.quantidadeEncontros} encontros
                    </span>
                </TableCell>
            </TableRow>

            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={3}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ my: 2, mx: { xs: 0, sm: 2 } }} className="bg-gray-50 p-3 rounded-md border border-gray-200">
                            <Typography
                                variant="subtitle1"
                                gutterBottom
                                component="div"
                                className="text-gray-700 font-semibold mb-2"
                            >
                                📍 Detalhes dos Encontros
                            </Typography>

                            {/* Wrapper com scroll horizontal no mobile */}
                            <Box sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                                <Table
                                    size="small"
                                    aria-label="detalhes dos encontros"
                                    sx={{ minWidth: 600 }}
                                >
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Data</TableCell>
                                            <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Concessionária</TableCell>
                                            <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Rodovia / KM</TableCell>
                                            <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Sentido</TableCell>
                                            <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Hora Alvo</TableCell>
                                            <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Hora Suspeito</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Diferença</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {row.locaisDeEncontro.map((encontro, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                                                    {formatarData(encontro.data)}
                                                </TableCell>
                                                <TableCell sx={{ whiteSpace: 'nowrap' }}>{encontro.concessionaria}</TableCell>
                                                <TableCell sx={{ whiteSpace: 'nowrap' }}>{encontro.rodovia} - {encontro.km}</TableCell>
                                                <TableCell sx={{ whiteSpace: 'nowrap' }}>{encontro.sentido}</TableCell>
                                                <TableCell sx={{ whiteSpace: 'nowrap' }}>{encontro.horaAlvo}</TableCell>
                                                <TableCell sx={{ whiteSpace: 'nowrap' }}>{encontro.horaSuspeito}</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 500, color: '#dc2626', whiteSpace: 'nowrap' }}>
                                                    {formatarTempo(encontro.diferencaSegundos)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Box>
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
                <TableHead sx={{ bgcolor: '#f3f4f6' }}>
                    <TableRow>
                        <TableCell width="50" />
                        <TableCell sx={{ fontWeight: 700, color: '#374151' }}>
                            Placa do Veículo Acompanhante
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, color: '#374151' }}>
                            Coincidências de Local/Hora
                        </TableCell>
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
