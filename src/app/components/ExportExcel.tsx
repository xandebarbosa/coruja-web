import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export const ExportExcel = (dados: any[], nomeArquivo = "radares.xlsx") => {
  const planilha = XLSX.utils.json_to_sheet(dados);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, planilha, "Radares");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
  saveAs(blob, nomeArquivo);
};
