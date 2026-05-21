import { VeiculoSuspeitoDTO } from "../types/types";
import api from "./client";
import { AxiosError } from "axios"; // Assumindo o uso de Axios baseado no 'api.get' e 'api.post'

// 💡 Sugestão: Crie e importe a interface correta no seu arquivo types.ts
export interface PassagemDTO {
  id: string; // Adapte para as propriedades reais da passagem do seu banco
  dataHora: string;
  radarId: string;
}

interface PassagemFormatada {
  placa: string;
  data: string; // YYYY-MM-DD
  hora: string; // HH:MM:SS
  rodovia: string;
  praca: string;
  km: string;
  sentido: string;
  concessionaria?: string;
}

/**
 * Interface da requisição para o backend
 */
interface AnaliseComboioRequest {
  placaAlvo: string;
  tempoMinutos: number;
  passagens: PassagemFormatada[];
}

interface PassagemExcel {
  DATA: string;
  HORA: string;
  PLACA: string;
  LOCAL: string;
  SENTIDO: string;
  SP: string;
  KM: string | number;
  CONCESSIONARIA?: string;
  REP?: number;
}

class AnalysisService {
  private readonly API_TIMEOUT = 30000;
  /**
   * Analisa veículos que andaram em comboio com uma placa alvo
   */
  async analyzeConvoy(
    placaAlvo: string,
    dataBusca: string,
    tempoMinutos: number,
  ): Promise<VeiculoSuspeitoDTO[]> {
    try {
      const params = { placaAlvo, data: dataBusca, tempoMinutos };

      console.log("========================================");
      console.log("📤 [FRONTEND -> API] Iniciando Análise Padrão");
      console.log("📍 Rota: GET /analise/comboio");
      console.log("📦 Parâmetros enviados (Query):", params);
      console.log("========================================");

      const { data } = await api.get<VeiculoSuspeitoDTO[]>("/analise/comboio", {
        params,
      });

      console.log(
        "✅ [API -> FRONTEND] Sucesso na análise padrão. Resultados:",
        data.length,
      );
      return data;
    } catch (error) {
      this.handleError("Erro ao analisar placa", error);
      throw error;
    }
  }

  /**
   * Analisa comboio via passagens selecionadas
   */
  async analyzeSelectedPassages(
    placaAlvo: string,
    tempoMinutos: number,
    passagens: PassagemDTO[], // 🔹 Refatorado: Remoção do 'any[]' para maior segurança
  ): Promise<VeiculoSuspeitoDTO[]> {
    try {
      const payload = { placaAlvo, tempoMinutos, passagens };

      console.log("========================================");
      console.log(
        "📤 [FRONTEND -> API] Iniciando Análise Avançada (Passagens)",
      );
      console.log("📍 Rota: POST /analise/comboio/passagens");
      console.log(
        "📦 Payload enviado (Body):",
        JSON.stringify(payload, null, 2),
      );
      console.log("========================================");

      const { data } = await api.post<VeiculoSuspeitoDTO[]>(
        "/analise/comboio/passagens",
        payload,
      );

      console.log(
        "✅ [API -> FRONTEND] Sucesso na análise avançada. Resultados:",
        data.length,
      );
      return data;
    } catch (error) {
      this.handleError("Erro ao analisar passagens", error);
      throw error;
    }
  }

  /**
   * 🔹 Refatorado: Método utilitário para padronizar o log de erros
   */
  private handleError(contextMessage: string, error: unknown): void {
    if (error instanceof Error) {
      // Se for um erro do Axios, você pode extrair a mensagem de resposta da API
      const axiosError = error as AxiosError<{ message?: string }>;
      const serverMessage = axiosError.response?.data?.message;

      console.error(`❌ ${contextMessage}:`, serverMessage || error.message);
    } else {
      console.error(`❌ ${contextMessage}: Erro desconhecido`, error);
    }
  }
}

export const analysisService = new AnalysisService();
