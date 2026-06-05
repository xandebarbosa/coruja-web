import { VeiculoSuspeitoDTO } from "../types/types";
import api from "./client";
import { AxiosError } from "axios";

// 💡 Flexibilizamos a interface de entrada para aceitar o que vem do DataGrid
export interface PassagemDTO {
  id?: string;
  radarId?: string;
  dataHora?: string;
  data?: string;
  hora?: string;
  placa?: string;
  rodovia?: string;
  praca?: string;
  km?: string | number;
  sentido?: string;
  concessionaria?: string;
  [key: string]: any; // Permite campos extras que a grid possa injetar
}

// 💡 O contrato estrito que o Backend (Quarkus/BFF) espera receber (RadarDTO)
interface PassagemFormatada {
  id: string;
  placa: string;
  data: string; // YYYY-MM-DD
  hora: string; // HH:MM:SS
  rodovia: string;
  praca: string;
  km: string;
  sentido: string;
  concessionaria: string;
}

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
    passagens: PassagemDTO[],
  ): Promise<VeiculoSuspeitoDTO[]> {
    try {
      // 💡 TRANSFORMAÇÃO BLINDADA: Lê chaves em MAIÚSCULO (do DataGrid) e minúsculo (do Banco)
      const passagensFormatadas: PassagemFormatada[] = passagens.map((p) => {
        let dataFinal = p.data || p.DATA || "";
        let horaFinal = p.hora || p.HORA || "";

        if (p.dataHora) {
          const partes = p.dataHora.split(/[T ]/);
          dataFinal = partes[0];
          horaFinal = partes[1] || "";
        }

        return {
          id: p.radarId || p.id || "",
          placa: p.placa || p.PLACA || placaAlvo,
          data: dataFinal,
          hora: horaFinal,

          // 🚨 A MÁGICA: Mapeia as colunas do Excel/Grid (maiúsculas) para o contrato Java
          // Se o Grid usa 'LOCAL', nós mapeamos para a 'praca' que a API do Java espera.
          rodovia: p.rodovia || p.RODOVIA || p.sp || p.SP || "N/I",
          praca: p.praca || p.PRACA || p.local || p.LOCAL || "N/I",
          km: String(p.km || p.KM || "N/I"),
          sentido: p.sentido || p.SENTIDO || "N/I",
          concessionaria: p.concessionaria || p.CONCESSIONARIA || "N/I",
        };
      });

      const payload = {
        placaAlvo,
        tempoMinutos,
        passagens: passagensFormatadas,
      };

      console.log(
        "📦 Payload Perfeito enviado para o Java:",
        JSON.stringify(payload, null, 2),
      );

      const { data } = await api.post<VeiculoSuspeitoDTO[]>(
        "/analise/comboio/passagens",
        payload,
      );

      return data;
    } catch (error) {
      this.handleError("Erro ao analisar passagens", error);
      throw error;
    }
  }

  private handleError(contextMessage: string, error: unknown): void {
    if (error instanceof Error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const serverMessage = axiosError.response?.data?.message;

      console.error(`❌ ${contextMessage}:`, serverMessage || error.message);
    } else {
      console.error(`❌ ${contextMessage}: Erro desconhecido`, error);
    }
  }
}

export const analysisService = new AnalysisService();