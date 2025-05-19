import axios, { type AxiosRequestConfig } from 'axios';
import type { RadarDTO } from '../types/types';

const API_BASE = "http://localhost:8000/radares";  //"http://localhost:8086/radares"

interface FiltrosRadar {
  rodovia?: string;
  km?: string;
  sentido?: string;
  data?: Date;
  horaInicial?: string;
  horaFinal?: string;
}

export interface PageMetadata {
  dados: RadarDTO[];
  paginaAtual: number;
  tamanhoPagina: number;
  totalPaginas: number;
  totalElementos: number;
}

export const buscarPorPlaca = async (placa: string) => {
  const response = await axios.get(`${API_BASE}/placa/${placa}`);
  return response.data;
};

export const buscarPorLocal = async (
  filtros: FiltrosRadar,
  page = 0,
  size = 100,
  options?: AxiosRequestConfig
): Promise<PageMetadata> => {

  const { rodovia, km, sentido, data, horaInicial, horaFinal } = filtros;

  const response = await axios.get(`${API_BASE}/rondon`, {
    params: {
      rodovia,
      km,
      sentido,
      data: data ? data.toISOString().split('T')[0] : undefined, // yyyy-mm-dd
      horaInicial: `${horaInicial}:00`,
      horaFinal: `${horaFinal}:00`,      
      page,
      size
    },
    ...options
  });  

  const dataResponse = response.data;

  console.log('📦 Resposta completa:', dataResponse);
  //console.log('📄 Página atual:', pagina.number, 'Total:', pagina.totalPages);

  return {
    dados: dataResponse?.content ?? [],
    paginaAtual: dataResponse?.page?.number ?? page,
    tamanhoPagina: dataResponse?.page?.size ?? size,
    totalPaginas: dataResponse?.page?.totalPages ?? 0,
    totalElementos: dataResponse?.page?.totalElements ?? 0,
  };

}
