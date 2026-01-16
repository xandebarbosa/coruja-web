import { api } from './client';
import { UsuarioTelegram } from '../../app/types/types';

const BASE_URL = '/usuarios-telegram';

export const TelegramService = {
  /**
   * Lista todos os usuários já cadastrados no banco.
   */
 getAll: async (): Promise<UsuarioTelegram[]> => {
    try {
      console.log(`[FRONT] Buscando usuários em: ${BASE_URL}`);
      const { data } = await api.get<UsuarioTelegram[]>(BASE_URL);
      console.log('[FRONT] Usuários recebidos:', data);
      return data;
    } catch (error) {
      console.error('[FRONT] Erro ao buscar usuários:', error);
      // Retorna array vazio para não quebrar a tela, mas loga o erro
      return []; 
    }
  },

  /**
   * Força a sincronização com o Bot para capturar novos usuários.
   */
  sync: async (): Promise<UsuarioTelegram[]> => {
    try {
      console.log(`[FRONT] Solicitando sincronização em: ${BASE_URL}/sincronizar`);
      const { data } = await api.get<UsuarioTelegram[]>(`${BASE_URL}/sincronizar`);
      console.log('[FRONT] Resultado da sincronização:', data);
      return data;
    } catch (error) {
      console.error('[FRONT] Erro na sincronização:', error);
      throw error;
    }
  }
};