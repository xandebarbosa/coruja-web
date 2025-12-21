import api from "./client";

export interface LogSearchParams {
  query?: string;
  page?: number;
  size?: number;
}

class LogsService {
  /**
   * Busca logs no Elasticsearch
   */
  async searchLogs(params: LogSearchParams = {}) {
    try {
      console.log('📋 Buscando logs');
      const { data } = await api.get('/logs/search', { params });
      console.log('✅ Logs recebidos');
      return data;
    } catch (error: any) {
      console.error('❌ Erro ao buscar logs:', error.message);
      throw error;
    }
  }
}

export const logsService = new LogsService();