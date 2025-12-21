import api from "./client";

class AnalysisService {
  /**
   * Analisa placa usando IA para detecção de comboio
   */
  async analyzeConvoy(placa: string): Promise<string> {
    try {
      console.log('🤖 Analisando placa com IA:', placa);
      const { data } = await api.post<string>('/api/analise/convoy', { placa });
      console.log('✅ Análise concluída');
      return data;
    } catch (error: any) {
      console.error('❌ Erro ao analisar placa:', error.message);
      throw error;
    }
  }
}

export const analysisService = new AnalysisService();