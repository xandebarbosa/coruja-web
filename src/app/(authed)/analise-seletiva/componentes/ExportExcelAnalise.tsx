import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export async function exportToExcelAnalise(dados: any[], nomeArquivo: string, placaAlvo: string) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Plan1');

    if (!dados || dados.length === 0) return;

    // 1. Ordenação Automática (Suspeitos no topo, agrupados por placa)
    const dadosOrdenados = [...dados].sort((a, b) => {
        if (a.REP > 1 && b.REP <= 1) return -1;
        if (a.REP <= 1 && b.REP > 1) return 1;
        return a.PLACA.localeCompare(b.PLACA);
    });

    // 2. Define apenas as chaves de mapeamento e as larguras (SEM o header automático)
    worksheet.columns = [
        { key: 'DATA', width: 12 },
        { key: 'HORA ALVO', width: 14 },
        { key: 'HORA SUSPEITO', width: 16 },
        { key: 'PLACA', width: 12 },
        { key: 'MARCA/MODELO', width: 40 },
        { key: 'COR', width: 20 },
        { key: 'MUNICÍPIO', width: 25 },        
        { key: 'LOCAL', width: 15 },
        { key: 'SENTIDO', width: 12 },
        { key: 'SP', width: 10 },
        { key: 'KM', width: 10 },
        { key: 'REP', width: 8 }
    ];

    // 3. ⭐️ LINHA 1: TÍTULO COM A PLACA ALVO ⭐️
    const tituloRow = worksheet.addRow([`ANÁLISE DE COMBOIO - VEÍCULO ALVO: ${placaAlvo.toUpperCase()}`]);
    worksheet.mergeCells('A1:L1'); // Mescla da coluna A até a H
    
    // Estiliza a linha de título (Fundo escuro, letra branca e maior)
    const tituloCell = worksheet.getCell('A1');
    tituloCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    tituloCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF14213D' } // Azul escuro padrão do seu layout
    };
    tituloCell.alignment = { horizontal: 'center', vertical: 'middle' };
    tituloRow.height = 30; // Deixa a linha do título mais alta

    // 4. LINHA 2: CABEÇALHOS DA TABELA
    const headerRow = worksheet.addRow(['DATA', 'HORA ALVO', 'HORA SUSPEITO', 'PLACA', 'MARCA/MODELO', 'COR', 'MUNICÍPIO', 'LOCAL', 'SENTIDO', 'SP', 'KM', 'REP']);
    headerRow.eachCell(cell => {
        cell.font = { bold: true };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD3D3D3' } // Cinza claro
        };
        cell.alignment = { horizontal: 'center' };
    });

    // 5. Paleta de cores para os veículos suspeitos
    const paletaCores = [
        'FFFFB3BA', 'FFBAE1FF', 'FFBAFFC9', 'FFFFDFBA', 
        'FFE8BAFF', 'FFFDFD96', 'FFAEC6CF', 'FFC1E1C1', 'FFFFD1DC'
    ];

    let indiceCor = 0;
    const controleCoresPorPlaca: Record<string, string> = {};

    // 6. Adiciona os dados (o exceljs entende que deve continuar a partir da linha 3)
    dadosOrdenados.forEach((dado) => {
        const row = worksheet.addRow(dado);
        
        if (dado['REP'] > 1) {
            const placa = dado['PLACA'];

            if (!controleCoresPorPlaca[placa]) {
                controleCoresPorPlaca[placa] = paletaCores[indiceCor % paletaCores.length];
                indiceCor++;
            }

            const corDaLinha = controleCoresPorPlaca[placa];

            row.eachCell((cell) => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: corDaLinha }
                };
                cell.font = { bold: true, color: { argb: 'FF000000' } };
            });
        }
        
        row.eachCell(cell => {
            cell.alignment = { horizontal: 'center' };
        });
    });

    // 7. Gera e baixa o arquivo
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${nomeArquivo}.xlsx`);
}