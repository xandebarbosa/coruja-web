'use client'

import { Box, Button, Card, CircularProgress, FormControl, Grid, InputLabel, MenuItem, Select, SelectChangeEvent, TextField } from "@mui/material";
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import axios from "axios";
import Head from "next/head";
import { SetStateAction, useCallback, useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { buscarPorLocal } from "../services/RadarService";
import DetailsTable from "../components/DetailsTable";
import RadarServices from "../services/RadarServices";
import type { RadarDTO } from "../types/types";
import { ExportExcel } from "../components/ExportExcel";
import { format } from 'date-fns';

interface Radar {
    id: number;
    data: Date | string;
    hora: Date | string;
    rodovia: string;
    km: string;
    sentido: string;
}

interface Filtros {
    rodovia: string;
    km: string;
    sentido: string;
    data: Date;
    horaInicial: string;
    horaFinal: string;
  }

interface PagedResponse<T> {
  content: T[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}  

export default function PesquisaLocalPage() {
    const [rodovias, setRodovias] = useState<string[]>([]);
    const [kmsUnicos, setKmsUnicos] = useState<string[]>([]);
    const [sentidoUnico, setSentidoUnico] = useState<string[]>([]);

    const [rodoviaSelecionada, setRodoviaSelecionada] = useState<string>('');
    const [kmSelecionado, setKmSelecionado] = useState('');
    const [sentidoSelecionado, setSentidoSelecionado] = useState('');
    
    const [data, setData] = useState<Date | null>(null);
    const [horaInicial, setHoraInicial] = useState<Date | null>(null);
    const [horaFinal, setHoraFinal] = useState<Date | null>(null);
    
    const [paginaAtual, setPaginaAtual] = useState(0);
    const [itensPorPagina, setItensPorPagina] = useState(10);
    
    const [totalElementos, setTotalElementos] = useState(0);
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
    
    const [resultados, setResultados] = useState<Radar[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSearching, setIsSearching] = useState<boolean>(false);
    
    const [rows, setRows] = useState<Radar[]>([]);
    const [rowCount, setRowCount] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(0);
    
    //const formatDate = (date: Date | null) => date ? date.toISOString().split("T")[0] : "";    
    //const formatTime = (date: Date | null) => date ? date.toTimeString().slice(0, 5) : "";

    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
      const carregarFiltros = useCallback(async () => {
      setIsLoading(true);
        try {
          const res = await axios.get("http://localhost:8000/radares");
          const lista: Radar[] = res.data.content;

          console.log("Lista", lista);
          
          setRodovias([...new Set(lista.map(item => item.rodovia))]);
          setKmsUnicos([...new Set(lista.map(item => item.km))]);
          setSentidoUnico([...new Set(lista.map(item => item.sentido))]);
          
        } catch (error) {
          console.error('Erro ao carregar filtros:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);
    
      useEffect(() => {
        carregarFiltros();
      }, [carregarFiltros]);

    // const getPequisaLocal = useCallback(async () => {
    //   setIsLoading(true);
    //   try {
    //     const resquest = await RadarServices.getPaged(paginationModel.page, paginationModel.pageSize);
    //   } catch (error) {}
    // },[])
      
    const formatDate = (date: Date | null): string =>
        date ? date.toISOString().split("T")[0] : "";

    const formatTime = (date: Date | null): string =>
        date ? date.toTimeString().slice(0, 5) : "";

    const handleFiltrar = async (pagina = 0, tamanhoPagina = itensPorPagina) => {
      try {
        if (!data || !horaInicial || !horaFinal) {
          console.error("Preencha todos os campos obrigatórios");
          return;
        }

        setIsLoading(true);
      
        const dataFormatada = data.toISOString().split('T')[0];
        const horaInicialFormatada = horaInicial.toTimeString().slice(0, 5);
        const horaFinalFormatada = horaFinal.toTimeString().slice(0, 5);

        const filtros: Filtros = {
            rodovia: rodoviaSelecionada,
            km: kmSelecionado,
            sentido: sentidoSelecionado,
            data: data,
            horaInicial: formatTime(horaInicial),
            horaFinal: formatTime(horaFinal),
          };
        console.log("📊 Filtros usados:", filtros);
        

    const response = await buscarPorLocal(filtros, pagina, tamanhoPagina); // page=0, size=100

    console.log("📄 Resposta da API:", response);

    if (!response.dados || response.dados.length === 0) {
      console.warn("⚠️ Nenhum dado encontrado.");
      setResultados([]);
      setTotalElementos(0);
      return;
    }

    const resultadosConvertidos: Radar[] = response.dados.map((item: RadarDTO) => ({
      ...item,
      data: item.data ?? '',
    }));

    setResultados(resultadosConvertidos);
    setPaginaAtual(response.paginaAtual);
    setTotalElementos(response.totalElementos);

        console.log("📄 Info página  atual===>", response.paginaAtual);
      } catch (err) {
        console.error("❌ Erro ao filtrar:", err);
      } finally {
        setIsLoading(false);
      }
    };

    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
      carregarFiltros();
    },[paginaAtual, itensPorPagina])

    const columns: GridColDef[] = [
    { field: 'data', 
      headerName: 'Data', 
      width: 110,              
    },
    { field: 'hora', headerName: 'Hora', width: 100 },
    { field: 'placa', headerName: 'Placa', width: 90 },
    { field: 'rodovia', headerName: 'Rodovia', width: 200 },
    { field: 'km', headerName: 'KM', width: 100 },
    { field: 'sentido', headerName: 'Sentido', width: 120 },
  ];  
  const baixarTodosOsDados = async () => {
  try {

    if (!data) {
  // Tratar o erro, por exemplo:
  console.error("Data é obrigatória");
  return;
}


     const filtros: Filtros = {
            rodovia: rodoviaSelecionada,
            km: kmSelecionado,
            sentido: sentidoSelecionado,
            data,
            horaInicial: formatTime(horaInicial),
            horaFinal: formatTime(horaFinal),
          };
    const response = await buscarPorLocal(filtros, 0, 10000); // tamanho grande
    ExportExcel(response.dados, "radares_filtrados.xlsx");
  } catch (error) {
    console.error("Erro ao exportar dados:", error);
  }
};

    return (
        <>
        <Header title="Pequisa por local" />
            <Card className="p-4">            
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 2 }}>
                        <FormControl fullWidth>
                            <InputLabel>Rodovia</InputLabel>
                            <Select
                            value={rodoviaSelecionada}
                            onChange={e => setRodoviaSelecionada(e.target.value)}
                            label="Rodovia"
                            >
                            {rodovias.map((rodovia, index) => (
                            // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                            <MenuItem key={index} value={rodovia}>
                              {rodovia}
                            </MenuItem>
                            ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid size={{ xs: 6, sm: 1 }}>
                        <FormControl fullWidth>
                            <InputLabel>Km</InputLabel>
                            <Select
                                value={kmSelecionado}
                                onChange={e => setKmSelecionado(e.target.value)}
                                label="KM"
                            >
                                {kmsUnicos.map((km, index) => (
                                    // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                                    <MenuItem key={index} value={km}>
                                        {km}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>                        
                    </Grid>

                    <Grid size={{ xs: 6, sm: 2 }}>
                        <FormControl fullWidth>
                            <InputLabel>Sentido</InputLabel>
                            <Select
                                value={sentidoSelecionado}
                                onChange={e => setSentidoSelecionado(e.target.value)}
                                label="Sentido"
                            >
                                {sentidoUnico.map((sentido, index) => (
                                    // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                                    <MenuItem key={index} value={sentido}>
                                        {sentido}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>                        
                    </Grid>

                    <Grid size={{ xs: 12, sm: 2 }}>
                    <TextField
                        label="Data"
                        type="date"
                        value={data ? formatDate(data) : ""}
                        onChange={e => {
                            const target = e.target as HTMLInputElement;
                            setData(target.valueAsDate);
                          }}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                        />
                    </Grid>

                    <Grid size={{ xs: 6, sm: 1.5 }}>
                    <TextField
                        label="Hora Inicial"
                        type="time"
                        value={horaInicial ? formatTime(horaInicial) : ""}
                        onChange={e => {
                            const value = e.target.value;
                            const [hours, minutes] = value.split(":").map(Number);
                            // biome-ignore lint/suspicious/noGlobalIsNan: <explanation>
                            if (!isNaN(hours) && !isNaN(minutes)) {
                            const newDate = new Date();
                            newDate.setHours(hours, minutes);
                            setHoraInicial(newDate);
                            }
                        }}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
            />
                    </Grid>

                    <Grid size={{ xs: 6, sm: 1.52 }}>
                    <TextField
                        label="Hora Final"
                        type="time"
                        value={horaFinal ? formatTime(horaFinal) : ""}
                        onChange={e => {
                            const value = e.target.value;
                            const [hours, minutes] = value.split(":").map(Number);
                            // biome-ignore lint/suspicious/noGlobalIsNan: <explanation>
                            if (!isNaN(hours) && !isNaN(minutes)) {
                            const newDate = new Date();
                            newDate.setHours(hours, minutes);
                            setHoraFinal(newDate);
                            }
                        }}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
            />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => handleFiltrar(0, itensPorPagina)} // ← CHAMA corretamente
                        >
                          Buscar
                        </Button>
                        <Button variant="contained" color="success" onClick={baixarTodosOsDados}>
                          Exportar Excel
                        </Button>
                    </Grid>
                </Grid>
            </Card>    
            <Box className="mt-4">
            <DataGrid
              rows={resultados}
              columns={columns}
              rowCount={totalElementos}
              paginationMode="server"
              paginationModel={{
                page: paginaAtual,
                pageSize: itensPorPagina
              }}
              onPaginationModelChange={(model) => {
                setPaginaAtual(model.page);
                setItensPorPagina(model.pageSize);
                handleFiltrar(model.page, model.pageSize);
              }}
              loading={isSearching}
              pageSizeOptions={[10, 25, 50, 100, 500]}
              getRowId={(row) => row.id}
            />           
            </Box>
      </>
      );
}