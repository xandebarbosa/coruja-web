import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// Interface para garantir que os objetos tenham chaves do tipo string
interface DataObject {
  [key: string]: any;
}

export const exportToExcel = (data: any, fileName: string = "relatorio_radares.xlsx") => {
  // 1. Proteção contra dados inválidos ou formato incorreto (Page vs Array)
  let safeData: DataObject[] = [];
  
  if (Array.isArray(data)) {
    safeData = data;
  } else if (data && Array.isArray(data.content)) {
    // Se por acaso passar um objeto de página, extraímos o conteúdo automaticamente
    console.warn("ExportExcel recebeu um objeto de Página. Extraindo .content automaticamente.");
    safeData = data.content;
  }

  // 2. Validação se está vazio
  if (!safeData || safeData.length === 0) {
    console.error("Nenhum dado para exportar.");
    alert("Nenhum dado encontrado para exportar com os filtros selecionados.");
    return;
  }

  // Prepara os dados para a primeira planilha
  const mainSheetData = safeData.map(item => ({
    'Data': item.data ? new Date(`${item.data}T00:00:00`).toLocaleDateString('pt-BR') : '',
    'Hora': item.hora || '',
    'Placa': item.placa || '',
    'Praça/Local': item.praca || '',
    'Rodovia': item.rodovia || '',
    'KM': item.km || '',
    'Sentido': item.sentido || '',
  }));

  const mainWorksheet = XLSX.utils.json_to_sheet(mainSheetData);
  // Adiciona o autofiltro à planilha principal
  if (mainWorksheet['!ref']) {
    const range = XLSX.utils.decode_range(mainWorksheet['!ref']);
    mainWorksheet['!autofilter'] = { ref: XLSX.utils.encode_range(range) };
  }


  // ===================================================================
  // ##        PLANILHA 2: Dados para Comparar (com Fórmulas)         ##
  // ===================================================================
  // Cria uma segunda planilha que virá pré-preenchida com os dados da busca,
  // mas com a coluna de contagem pronta para se auto-calcular.
  const comparisonSheetData = safeData.map((item, index) => {
    const excelRowIndex = index + 2;
    const formula = `=COUNTIF(C:C, C${excelRowIndex})`;

    return {
      'Data': item.data ? new Date(`${item.data}T00:00:00`).toLocaleDateString('pt-BR') : '',
      'Hora': item.hora,
      'Placa': item.placa,
      'Praça/Local': item.praca,
      'Rodovia': item.rodovia,
      'KM': item.km,
      'Sentido': item.sentido,
      'Repetidos': { f: formula },
    };
  });

  const comparisonSheet = XLSX.utils.json_to_sheet(comparisonSheetData);
  if (comparisonSheet['!ref']) {
    const range = XLSX.utils.decode_range(comparisonSheet['!ref']);
    comparisonSheet['!autofilter'] = { ref: XLSX.utils.encode_range(range) };
  }
  

  // ===================================================================
  // ##                MONTAGEM FINAL DO ARQUIVO EXCEL                ##
  // ===================================================================
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, mainWorksheet, "Relatório Principal");
  XLSX.utils.book_append_sheet(workbook, comparisonSheet, "Dados para Comparar");
  
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
  
  // Sanitiza nome do arquivo
  const safeFileName = fileName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const date = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
  
  saveAs(blob, `${safeFileName}_${date}.xlsx`);
};
