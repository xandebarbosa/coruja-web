export interface RadarsDTO {
    id: number;
    rodovia: string;
    km: string;
    sentido: string;
    data?: Date;
    hora: Date;
    placa: string;
    praca?: string;
}

export interface LocalSearchParams {
  concessionaria: string;
  rodovia?: string;
  praca?: string;
  km?: string;
  sentido?: string;
  data?: string;
  horaInicial?: string;
  horaFinal?: string;
  page: number;
  pageSize: number;
}

export interface PaginatedMonitoredPlates {
  content: MonitoredPlate[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  sort: any;
}

export interface MonitoredPlate {
  id: number;
  placa: string;
  marcaModelo?: string;
  cor?: string;
  motivo?: string;
  statusAtivo?: boolean;
  observacao?: string;
  interessado?: string;
  telefone?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// NOVO: Interface para os metadados da página, espelhando o backend
export interface PageMetadata {
  size: number;
  number: number;
  totalElements: number;
  totalPages: number;
}

export interface AlertHistoryRow {
  id: number;
  placa: string;
  data: number[];
  hora: number[];
  concessionaria: string;  
  rodovia: string;
  km: string;
  sentido: string;
  praca: string;
  timestampAlerta: string; 
  placaMonitorada: {
    // Incluímos os detalhes da placa monitorada que podem ser úteis
    id: number;
    marcaModelo: string;
    cor: string;
    motivo: string;
    interessado: string;
    telefone: string;
  };
}
export interface RadarLocationDTO {
  id: number | string;
  concessionaria: string;    
  rodovia?: string;
  km?: string;
  praca?: string;
  latitude: number;
  longitude: number;
}

// Define o tipo para os dados do formulário (sem o ID, que é gerado no backend)
export type MonitoredPlateFormData = Omit<MonitoredPlate, 'id' | 'createdAt' | 'updatedAt'>;

export interface PaginatedAlertHistory {
  content: AlertHistoryRow[];
  page: PageMetadata;
}

export interface GeoSearchParams {
  latitude: number;
  longitude: number;
  raio: number;
  data: string;
  horaInicio: string;
  horaFim: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface GeoSearchResponse {
  content: RadarsDTO[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}

export interface GeoSearchFormData {
  data: string;
  horaInicio: string;
  horaFim: string;
  latitude: string;
  longitude: string;
  raio: string;
}

