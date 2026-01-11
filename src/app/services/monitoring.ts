import { MonitoredPlate, MonitoredPlateFormData, PaginatedAlertHistory, PaginatedMonitoredPlates, TelegramUser } from "../types/types";
import api from "./client";

export interface PaginationParams {
  page?: number;
  size?: number;
}

export interface AlertHistoryParams extends PaginationParams {  
  sort?: string;
}

class MonitoringService {
  /**
   * Busca placas monitoradas com paginação
   */
  async getMonitoredPlates(page: number, pageSize: number, p0: string, params: PaginationParams = {}): Promise<PaginatedMonitoredPlates> {
    try {
      console.log('👁️ Buscando placas monitoradas');
      const { data } = await api.get<PaginatedMonitoredPlates>('/monitoramento', { params });
      console.log('✅ Placas recebidas');
      return data;
    } catch (error: any) {
      console.error('❌ Erro ao buscar placas monitoradas:', error.message);
      throw error;
    }
  }

  /**
   * Cria uma nova placa monitorada
   */
  async createMonitoredPlate(plateData: MonitoredPlateFormData): Promise<MonitoredPlate> {
    try {
      console.log('➕ Criando placa monitorada');
      const { data } = await api.post<MonitoredPlate>('/monitoramento', plateData);
      console.log('✅ Placa criada');
      return data;
    } catch (error: any) {
      console.error('❌ Erro ao criar placa:', error.message);
      throw error;
    }
  }

  /**
   * Atualiza uma placa monitorada
   */
  async updateMonitoredPlate(id: number, plateData: Partial<MonitoredPlateFormData>): Promise<MonitoredPlate> {
    try {
      console.log(`📝 Atualizando placa ${id}`);
      const { data } = await api.put<MonitoredPlate>(`/monitoramento/${id}`, plateData);
      console.log('✅ Placa atualizada');
      return data;
    } catch (error: any) {
      console.error('❌ Erro ao atualizar placa:', error.message);
      throw error;
    }
  }

  /**
   * Deleta uma placa monitorada
   */
  async deleteMonitoredPlate(id: number): Promise<void> {
    try {
      console.log(`🗑️ Deletando placa ${id}`);
      await api.delete(`/monitoramento/${id}`);
      console.log('✅ Placa deletada');
    } catch (error: any) {
      console.error('❌ Erro ao deletar placa:', error.message);
      throw error;
    }
  }

  /**
   * Busca alertas de passagem
   */
  async getAlerts(params: PaginationParams = {}) {
    try {
      console.log('🚨 Buscando alertas');
      const { data } = await api.get('/monitoramento/alertas', { params });
      console.log('✅ Alertas recebidos');
      return data;
    } catch (error: any) {
      console.error('❌ Erro ao buscar alertas:', error.message);
      throw error;
    }
  }

  /**
   * Busca histórico de alertas com ordenação
   */
  async getAlertHistory(params: AlertHistoryParams): Promise<PaginatedAlertHistory> {
    const { page = 0, size = 20, sort = 'dataHora,desc' } = params;
    
    const { data } = await api.get<PaginatedAlertHistory>('/monitoramento/alertas', {
      params: { page, size, sort }
    });
    
    return data;
  }

  // Busca todos os usuários cadastrados no banco
  async getTelegramUsers(): Promise<TelegramUser[]> {
    try {
      console.log('🤖 Buscando usuários do Telegram');
      const response  = await api.get('/usuarios-telegram/users');
      console.log('✅ Usuários recebidos');
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao buscar usuários do Telegram:', error.message);
      throw error;
    }
  }

  // Força a sincronização com a API do Telegram
  async syncTelegramUsers(): Promise<void> {
    try {
      console.log('🔄 Sincronizando usuários do Telegram');
      await api.get('/usuarios-telegram/sincronizar');
      console.log('✅ Sincronização iniciada');
    } catch (error: any) {
      console.error('❌ Erro ao sincronizar usuários do Telegram:', error.message);
      throw error;
    }
  }
}

export const monitoringService = new MonitoringService();