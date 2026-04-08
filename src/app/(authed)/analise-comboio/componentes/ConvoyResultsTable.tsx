import React, { useState } from 'react';
import {
    Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Collapse, IconButton,
    Box, Typography, Paper, Chip
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { VeiculoSuspeitoDTO } from '../../../types/types';

function formatarTempo(segundosTotal: number) {
    const minutos = Math.floor(segundosTotal / 60);
    const segundos = segundosTotal % 60;
    if (minutos > 0) return `${minutos}m ${segundos}s`;
    return `${segundos}s`;
}

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

// Total de colunas da tabela principal
const TOTAL_COLS = 6;

function Row({ row }: { row: VeiculoSuspeitoDTO }) {
    const [open, setOpen] = useState(false);

    return (
        <React.Fragment>
            {/* ── Linha Principal ── */}
            <TableRow
                sx={{
                    '& > *': { borderBottom: 'unset' },
                    bgcolor: open ? 'rgba(252,163,17,0.04)' : 'transparent',
                    transition: 'background-color 0.2s',
                    '&:hover': { bgcolor: 'rgba(252,163,17,0.08)' },
                }}
            >
                {/* Expand */}
                <TableCell sx={{ width: 50, px: 1 }}>
                    <IconButton
                        size="small"
                        onClick={() => setOpen(!open)}
                        sx={{
                            color: open ? '#fca311' : '#6b7280',
                            bgcolor: open ? 'rgba(252,163,17,0.1)' : 'transparent',
                            '&:hover': { bgcolor: 'rgba(252,163,17,0.15)', color: '#fca311' },
                            transition: 'all 0.2s',
                        }}
                    >
                        {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                </TableCell>

                {/* Placa */}
                <TableCell component="th" scope="row">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DirectionsCarIcon sx={{ color: '#fca311', fontSize: 18 }} />
                        <Typography
                            sx={{
                                fontFamily: 'monospace',
                                fontWeight: 700,
                                fontSize: '1rem',
                                color: '#14213d',
                                letterSpacing: '1px',
                            }}
                        >
                            {row.placa}
                        </Typography>
                    </Box>
                </TableCell>

                {/* Marca/Modelo */}
                <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#374151' }}>
                        {row.marcaModelo || '—'}
                    </Typography>
                </TableCell>

                {/* Cor */}
                <TableCell>
                    <Chip
                        label={row.cor || '—'}
                        size="small"
                        variant="outlined"
                        sx={{ borderColor: '#d1d5db', color: '#374151', fontWeight: 500, fontSize: '12px' }}
                    />
                </TableCell>

                {/* Município */}
                <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <LocationOnIcon sx={{ color: '#6b7280', fontSize: 14 }} />
                        <Typography variant="body2" sx={{ color: '#6b7280' }}>
                            {row.municipio || '—'}
                        </Typography>
                    </Box>
                </TableCell>

                {/* Encontros */}
                <TableCell align="center">
                    <Chip
                        label={`${row.quantidadeEncontros} encontro${row.quantidadeEncontros !== 1 ? 's' : ''}`}
                        size="small"
                        sx={{
                            bgcolor: row.quantidadeEncontros >= 3
                                ? 'rgba(220,38,38,0.1)'
                                : row.quantidadeEncontros === 2
                                    ? 'rgba(245,158,11,0.1)'
                                    : 'rgba(59,130,246,0.1)',
                            color: row.quantidadeEncontros >= 3
                                ? '#dc2626'
                                : row.quantidadeEncontros === 2
                                    ? '#d97706'
                                    : '#2563eb',
                            fontWeight: 600,
                            border: '1px solid',
                            borderColor: row.quantidadeEncontros >= 3
                                ? 'rgba(220,38,38,0.3)'
                                : row.quantidadeEncontros === 2
                                    ? 'rgba(245,158,11,0.3)'
                                    : 'rgba(59,130,246,0.3)',
                        }}
                    />
                </TableCell>
            </TableRow>

            {/* ── Linha de Detalhes (Collapse) ── */}
            <TableRow>
                <TableCell
                    style={{ paddingBottom: 0, paddingTop: 0 }}
                    colSpan={TOTAL_COLS}   // ← CORRIGIDO: 6 colunas
                >
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box
                            sx={{
                                my: 1.5,
                                mx: { xs: 0, sm: 1 },
                                bgcolor: '#f9fafb',
                                borderRadius: '10px',
                                border: '1px solid #e5e7eb',
                                overflow: 'hidden',
                            }}
                        >
                            {/* Header da seção de detalhes */}
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    px: 2,
                                    py: 1.5,
                                    bgcolor: '#f3f4f6',
                                    borderBottom: '1px solid #e5e7eb',
                                }}
                            >
                                <LocationOnIcon sx={{ color: '#fca311', fontSize: 18 }} />
                                <Typography
                                    variant="subtitle2"
                                    sx={{ color: '#374151', fontWeight: 700 }}
                                >
                                    Detalhes dos Encontros — {row.quantidadeEncontros} ocorrência{row.quantidadeEncontros !== 1 ? 's' : ''}
                                </Typography>
                            </Box>

                            {/* Tabela com scroll horizontal */}
                            <Box sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                                <Table
                                    size="small"
                                    aria-label="detalhes dos encontros"
                                    sx={{ minWidth: 680 }}
                                >
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: '#f9fafb' }}>
                                            {[
                                                'Data',
                                                'Concessionária',
                                                'Rodovia / KM',
                                                'Sentido',
                                                'Hora Alvo',
                                                'Hora Suspeito',
                                                'Diferença',
                                            ].map((col) => (
                                                <TableCell
                                                    key={col}
                                                    align={col === 'Diferença' ? 'right' : 'left'}
                                                    sx={{
                                                        fontWeight: 700,
                                                        whiteSpace: 'nowrap',
                                                        fontSize: '12px',
                                                        color: '#6b7280',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.4px',
                                                        py: 1,
                                                    }}
                                                >
                                                    {col}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>

                                    <TableBody>
                                        {row.locaisDeEncontro.map((encontro, idx) => (
                                            <TableRow
                                                key={idx}
                                                sx={{
                                                    '&:last-child td': { border: 0 },
                                                    '&:hover': { bgcolor: 'rgba(252,163,17,0.04)' },
                                                }}
                                            >
                                                <TableCell
                                                    sx={{
                                                        fontFamily: 'monospace',
                                                        fontSize: '0.8rem',
                                                        whiteSpace: 'nowrap',
                                                        color: '#374151',
                                                    }}
                                                >
                                                    {formatarData(encontro.data)}
                                                </TableCell>

                                                <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '13px' }}>
                                                    {encontro.concessionaria}
                                                </TableCell>

                                                <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '13px', fontWeight: 500 }}>
                                                    {encontro.rodovia}
                                                    {encontro.km ? ` — KM ${encontro.km}` : ''}
                                                </TableCell>

                                                <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '13px' }}>
                                                    {encontro.sentido}
                                                </TableCell>

                                                <TableCell
                                                    sx={{
                                                        whiteSpace: 'nowrap',
                                                        fontFamily: 'monospace',
                                                        fontSize: '13px',
                                                        color: '#14213d',
                                                    }}
                                                >
                                                    {encontro.horaAlvo}
                                                </TableCell>

                                                <TableCell
                                                    sx={{
                                                        whiteSpace: 'nowrap',
                                                        fontFamily: 'monospace',
                                                        fontSize: '13px',
                                                        color: '#14213d',
                                                    }}
                                                >
                                                    {encontro.horaSuspeito}
                                                </TableCell>

                                                <TableCell
                                                    align="right"
                                                    sx={{ whiteSpace: 'nowrap' }}
                                                >
                                                    <Chip
                                                        label={formatarTempo(encontro.diferencaSegundos)}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: 'rgba(220,38,38,0.08)',
                                                            color: '#dc2626',
                                                            fontWeight: 600,
                                                            fontSize: '12px',
                                                            fontFamily: 'monospace',
                                                        }}
                                                    />
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
        <Box
            sx={{
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}
        >
            {/* Summary bar */}
            <Box
                sx={{
                    px: 3,
                    py: 1.5,
                    bgcolor: '#f9fafb',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                }}
            >
                <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600 }}>
                    {resultados.length} veículo{resultados.length !== 1 ? 's' : ''} suspeito{resultados.length !== 1 ? 's' : ''} identificado{resultados.length !== 1 ? 's' : ''}
                </Typography>
                <Typography variant="caption" sx={{ color: '#d1d5db' }}>•</Typography>
                <Typography variant="caption" sx={{ color: '#6b7280' }}>
                    Clique na seta para ver os detalhes dos encontros
                </Typography>
            </Box>

            {/* Tabela com scroll horizontal */}
            <Box sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <Table aria-label="tabela de veículos suspeitos" sx={{ minWidth: 680 }}>
                    <TableHead sx={{ bgcolor: '#14213d' }}>
                        <TableRow>
                            <TableCell width={50} />
                            <TableCell
                                sx={{
                                    fontWeight: 700,
                                    color: 'white',
                                    whiteSpace: 'nowrap',
                                    fontSize: '13px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                }}
                            >
                                Placa
                            </TableCell>
                            <TableCell
                                sx={{
                                    fontWeight: 700,
                                    color: 'white',
                                    whiteSpace: 'nowrap',
                                    fontSize: '13px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                }}
                            >
                                Marca / Modelo
                            </TableCell>
                            <TableCell
                                sx={{
                                    fontWeight: 700,
                                    color: 'white',
                                    whiteSpace: 'nowrap',
                                    fontSize: '13px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                }}
                            >
                                Cor
                            </TableCell>
                            <TableCell
                                sx={{
                                    fontWeight: 700,
                                    color: 'white',
                                    whiteSpace: 'nowrap',
                                    fontSize: '13px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                }}
                            >
                                Município
                            </TableCell>
                            <TableCell
                                align="center"
                                sx={{
                                    fontWeight: 700,
                                    color: '#fca311',
                                    whiteSpace: 'nowrap',
                                    fontSize: '13px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                }}
                            >
                                Coincidências
                            </TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {resultados.map((row) => (
                            <Row key={row.placa} row={row} />
                        ))}
                    </TableBody>
                </Table>
            </Box>
        </Box>
    );
}
