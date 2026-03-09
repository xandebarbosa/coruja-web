import { VeiculoSuspeitoDTO } from "../types/types";
import api from "./client";

class AnalysisService {
 /**
   * Analisa veículos que andaram em comboio com uma placa alvo
   */
  async analyzeConvoy(placaAlvo: string, dataBusca: string, tempoMinuots: number): Promise<VeiculoSuspeitoDTO[]> {
    try {
      console.log(`🤖 Analisando comboio para a placa: ${placaAlvo} no dia ${dataBusca}`);

      const { data } = await api.get<VeiculoSuspeitoDTO[]>('/analise/comboio', { 
        params:{
          placaAlvo: placaAlvo,
          data: dataBusca,
          tempoMinutos: tempoMinuots
        }});

      console.log('✅ Análise concluída', data);
      return data;
    } catch (error: any) {
      console.error('❌ Erro ao analisar placa:', error.message);
      throw error;
    }
  }
  
  async analyzeSelectedPassages(placaAlvo: string, tempoMinutos: number, passagensSelecionadas: any[]): Promise<VeiculoSuspeitoDTO[]> {
    try {
      console.log(`🤖 Analisando comboio via passagens selecionadas para a placa: ${placaAlvo}`);
      const { data } = await api.post<VeiculoSuspeitoDTO[]>('/analise/comboio/passagens', {
        placaAlvo,
        tempoMinutos,
        passagensSelecionadas
      });
      return data;
    } catch (error: any) {
      console.error('❌ Erro ao analisar passagens:', error.message);
      throw error;
    }
  }
}

export const analysisService = new AnalysisService();