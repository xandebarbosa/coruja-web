
const BASE_URL = 'http://localhost:8080/radares'; // A URL do seu BFF
const API_BASE_URL = 'http://localhost:8080';

// Função para buscar por placa
export async function searchByPlaca(placa: string, page: number, pageSize: number) {
  const url = `${BASE_URL}/placa/${placa}?page=${page}&size=${pageSize}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Falha na busca por placa');
  }
  return response.json();
}

// Interface para os parâmetros da busca por local
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

// Função para buscar por local/concessionária
export async function searchByLocal(params: LocalSearchParams) {
  const query = new URLSearchParams({
    page: params.page.toString(),
    size: params.pageSize.toString(),
  });

  if (params.rodovia) query.append('rodovia', params.rodovia);
  if (params.praca) query.append('praca', params.praca);
  if (params.km) query.append('km', params.km);
  if (params.sentido) query.append('sentido', params.sentido);
  if (params.data) query.append('data', params.data);
  if (params.horaInicial) query.append('horaInicial', params.horaInicial);
  if (params.horaFinal) query.append('horaFinal', params.horaFinal);

  const url = `${BASE_URL}/concessionaria/${params.concessionaria}/filtros?${query.toString()}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Falha na busca por local');
  }
  return response.json();
}

export async function getFilterOptions(concessionaria: string) {
  if (!concessionaria) return { rodovias: [], praca: [], kms: [], sentindos: []};

  const url = `${BASE_URL}/concessionaria/${concessionaria}/opcoes-filtro`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Falha ao buscar opções de filtro');
  }
  return response.json();

}

export async function getKmsByRodovia(concessionaria: string, rodovia: string) {
    if (!concessionaria || !rodovia) {
        return [];
    }
    // O BFF precisa saber qual microserviço de dados chamar
    const url = `http://localhost:8080/radares/concessionaria/${concessionaria}/kms-por-rodovia?rodovia=${encodeURIComponent(rodovia)}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Falha ao buscar KMs para a rodovia');
    }
    return response.json();
}

export async function searchLogs(query: string, page: number, pageSize: number) {
    const params = new URLSearchParams({
        query: query,
        page: page.toString(),
        size: pageSize.toString(),
    });
    // O BFF agora tem a rota /api/logs/search
    const response = await fetch(`http://localhost:8080/api/logs/search?${params.toString()}`);
    if (!response.ok) {
        throw new Error('Falha ao buscar logs');
    }
    return response.json();
}

export async function getLatestRadars() {
  const url = `${BASE_URL}/ultimos-processados`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Falha ao buscar últimos radares');
  }
  return response.json();
}

// NOVA FUNÇÃO para buscar todos os dados para exportação
export async function searchAllByLocalForExport(params: Omit<LocalSearchParams, 'page' | 'pageSize'>) {
    const query = new URLSearchParams();

    // Adiciona todos os filtros, exceto paginação
    if (params.concessionaria) query.append('concessionaria', params.concessionaria);
    if (params.rodovia) query.append('rodovia', params.rodovia);
    if (params.praca) query.append('praca', params.praca);
    if (params.km) query.append('km', params.km);
    if (params.sentido) query.append('sentido', params.sentido);
    if (params.data) query.append('data', params.data);
    if (params.horaInicial) query.append('horaInicial', params.horaInicial);
    if (params.horaFinal) query.append('horaFinal', params.horaFinal);
    
    // Usa a rota /exportar do BFF, que não precisa de concessionária na URL
    const url = `http://localhost:8080/radares/exportar?${query.toString()}`;
    
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Falha ao buscar dados para exportação');
    }
    return response.json();
}

// Interface para um único item da lista (permanece a mesma)
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

// ATUALIZADO: Interface para a resposta paginada, agora com o objeto 'page'
export interface PaginatedMonitoredPlates {
  content: MonitoredPlate[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  sort: any;
}

// Sua função de API continua a mesma, mas agora o tipo de retorno está correto
export async function getMonitoredPlates(
  page: number, 
  pageSize: number, 
  sort: string = 'createdAt,asc'
): Promise<PaginatedMonitoredPlates> {
  const url = `http://localhost:8080/monitoramento?page=${page}&size=${pageSize}&sort=${sort}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Falha ao buscar placas monitoradas');
  }
  return response.json();
}

// Define o tipo para os dados do formulário (sem o ID, que é gerado no backend)
export type MonitoredPlateFormData = Omit<MonitoredPlate, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Cria um novo registro de placa monitorada.
 * @param data Os dados do formulário a serem enviados.
 */
export async function createMonitoredPlate(data: MonitoredPlateFormData): Promise<MonitoredPlate> {
  const response = await fetch(`${API_BASE_URL}/monitoramento`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Falha ao criar monitoramento');
  }
  return response.json();
}

/**
 * Atualiza um registro de placa monitorada existente.
 * @param id O ID do registro a ser atualizado.
 * @param data Os novos dados do formulário.
 */
export async function updateMonitoredPlate(id: number, data: MonitoredPlateFormData): Promise<MonitoredPlate> {
  const response = await fetch(`${API_BASE_URL}/monitoramento/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Falha ao atualizar monitoramento');
  }
  return response.json();
}

/**
 * Deleta um registro de placa monitorada pelo seu ID.
 * @param id O ID do registro a ser deletado.
 */
export async function deleteMonitoredPlate(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/monitoramento/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    // O status 204 (No Content) também é um sucesso, mas não tem corpo JSON
    if (response.status !== 204) {
      throw new Error('Falha ao deletar monitoramento');
    }
  }
}

export async function analisarPlacaComIA(placa: string): Promise<string> {
    const response = await fetch(`http://localhost:8080/api/analise/convoy`, { // Rota no BFF
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placa: placa }),
    });
    if (!response.ok) {
        throw new Error('Falha na análise de IA');
    }
    return response.text(); // A resposta da IA vem como texto puro (Markdown)
}

// Interface para uma única linha do histórico de alertas
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

// Interface para a resposta paginada completa
export interface PaginatedAlertHistory {
  content: AlertHistoryRow[];
  page: PageMetadata;
}

/**
 * Busca o histórico paginado de passagens que geraram alerta.
 * @param page O número da página a ser buscada (começando em 0).
 * @param pageSize A quantidade de itens por página.
 * @returns Uma promessa com a página de resultados.
 */
export async function getAlertHistory(
  page: number, 
  pageSize: number, 
  sort: string  
): Promise<PaginatedAlertHistory> {
  // Monta a URL com os parâmetros de paginação e ordenação
  // Ordenamos por 'timestampAlerta' em ordem decrescente para ver os mais recentes primeiro
  const url = `http://localhost:8080/monitoramento/alertas?page=${page}&size=${pageSize}&sort=${sort}`;
  console.log("Frontend chamando API de alertas:", url);

  const response = await fetch(url);

  if (!response.ok) {
    // Se a resposta não for bem-sucedida, lança erro
    console.error("API Error Response:", await response.text());
    throw new Error('Falha ao buscar o histórico de alertas');
  }

  //Retorna o corpo da resposta convertido para JSON
  return response.json();
}