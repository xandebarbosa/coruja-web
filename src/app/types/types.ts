export interface RadarDTO {
    id: number;
    rodovia: string;
    km: string;
    sentido: string;
    data?: Date;
    hora: Date;
    placa: string;
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
  };
}

// Define o tipo para os dados do formulário (sem o ID, que é gerado no backend)
export type MonitoredPlateFormData = Omit<MonitoredPlate, 'id' | 'createdAt' | 'updatedAt'>;

export interface PaginatedAlertHistory {
  content: AlertHistoryRow[];
  page: PageMetadata;
}