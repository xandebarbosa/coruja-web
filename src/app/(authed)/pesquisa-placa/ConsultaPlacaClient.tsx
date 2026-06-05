"use client";

import React, { useMemo, useState, useTransition } from "react";

import { RadarsDTO } from "@/app/types/types";
import { Box, Button, Card, CardContent, Chip, Grid, InputAdornment, TextField, Tooltip, Typography } from "@mui/material";
import { DataGrid, GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { radarsService } from "@/app/services";
import { exportToExcel } from "@/app/components/ExportExcel";
import { InfoIcon, SearchIcon, TrendingUpIcon } from "lucide-react";
import { ContentCopy, DirectionsCar, DirectionsCarOutlined, LocationCityOutlined, PaletteOutlined } from "@mui/icons-material";
//import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
//import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CustomPagination from "@/app/components/CustomPagination";

// Define as colunas do DataGrid
const columns: GridColDef[] = [
  {
    field: "data",
    headerName: "Data",
    width: 150,
    headerAlign: "center",
    align: "center",
    valueFormatter: (value: string) => {
      if (!value) return "";
      // Adiciona T00:00:00 para garantir que o navegador interprete como data local,
      // evitando um bug comum de fuso horário que poderia mostrar o dia anterior.
      const date = new Date(`${value}T00:00:00`);
      return date.toLocaleDateString("pt-BR");
    },
  },
  {
    field: "hora",
    headerName: "Hora",
    width: 110,
    headerAlign: "center",
    align: "center",
  },
  {
    field: "placa",
    headerName: "Placa",
    width: 180,
    headerAlign: "center",
    align: "center",
    renderCell: (params) => (
      <Chip
        label={params.value}
        size="medium"
        sx={{
          fontWeight: 600,
          bgcolor: "#3f51b5",
          color: "white",
          fontSize: "14px",
          fontFamily: "Roboto",
          letterSpacing: "0.5px",
        }}
      />
    ),
  },
  { 
    field: 'concessionaria', 
    headerName: 'Concessionária', 
    width: 150,
    headerAlign: 'center',
    align: 'center',
    renderCell: (params) => (
      <Chip
        label={params.value || 'Não informada'}
        size="small"
        sx={{
          fontWeight: 600,
          bgcolor: params.value === 'Rondon' ? '#e8f5e9' : '#f3f4f6', // Cor dinâmica se quiser
          color: params.value === 'Rondon' ? '#2e7d32' : '#4b5563',
          border: '1px solid',
          borderColor: params.value === 'Rondon' ? '#a5d6a7' : '#d1d5db'
        }}
      />
    )
  },
  {
    field: "praca",
    headerName: "Praça",
    width: 300,
    headerAlign: "left",
  },   
  {
    field: "rodovia",
    headerName: "Rodovia",
    width: 300,
    headerAlign: "center",
    align: "center",
    renderCell: (params) => (
      <span style={{ fontWeight: "600", color: "#14213d" }}>
        {params.value}
      </span>
    ),
  },
  {
    field: "km",
    headerName: "KM",
    width: 100,
    headerAlign: "center",
    align: "center",
  },
  {
    field: "sentido",
    headerName: "Sentido",
    width: 150,
    headerAlign: "center",
    align: "center",
  },
];

interface PageProps {
  initialData: { content: RadarsDTO[]; page: { totalElements: number } } | null; //{} | ?: '';
  searchParams: { placa?: string; page?: string; pageSize?: string };
}

export default function ConsultaPlacaClient({ initialData, searchParams }: PageProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParamsHook = useSearchParams();
    const [isPending, startTransition] = useTransition(); //Controla o loading de transição de rota

    const currentPlaca = searchParams.placa || '';
    const [placaInput, setPlacaInput] = useState(currentPlaca);
    const [exporting, setExporting] = useState(false);
    const [copying, setCopying] = useState(false);

    const rows = initialData?.content || [];
    const rowCount = initialData?.page?.totalElements || 0;
    const hasSearched = !!currentPlaca;
    const loading = isPending; // Fica true enquanto o Next.JS busca a nova página no servidor

    const paginationModel = {
      page: Number(searchParams.page) || 0,
      pageSize: Number(searchParams.pageSize) || 10,
    };    

    // 💡 Refatoração: Uso de useMemo ao invés de useEffect/useState para dados derivados
    const latestRowId = useMemo(() => {
      if (!rows.length) return null;
      const maisRecente = rows.reduce((latest, current) => {
        const latestDateTime = new Date(`${latest.data}T${latest.hora}`);
        const currentDateTime = new Date(`${current.data}T${current.hora}`);
        return currentDateTime > latestDateTime ? current : latest;
      });

      // 🚨 CORREÇÃO: Agora ele retorna a mesma chave que o DataGrid espera
      return `${maisRecente.placa}_${maisRecente.data}_${maisRecente.hora}_${maisRecente.concessionaria}_${maisRecente.id}`;
    }, [rows]);

    const veiculoInfo = useMemo(() => {
        if (!rows.length) return null;
        const detranInfo = rows.find(item => item.marcaModelo || item.cor || item.municipio || item.anoModelo || item.cpfProprietario || item.uf );
        return detranInfo ? {
          marcaModelo: detranInfo.marcaModelo,
          cor: detranInfo.cor,
          municipio: detranInfo.municipio,
          uf: detranInfo.uf,
          anoModelo: detranInfo.anoModelo,
          cpfProprietario: detranInfo.cpfProprietario
        } : null;
    }, [rows]);

    // Atualiza a URL para disparar a busca no servidor (SSR)
    const handleSearch = () => {
      if (!placaInput.trim()) {
        toast.info("Por favor, insira uma placa.");      
        return;
      }
      const params = new URLSearchParams(searchParamsHook.toString());
      params.set('placa', placaInput.toUpperCase());
      params.set('page', '0'); // Reseta a paginação
    
     startTransition(() => {
       router.push(`${pathname}?${params.toString()}`);
     });
    };

    // Atualiza a URL quando muda a página da tabela
    const handlePaginationChange = (model: GridPaginationModel) => {
      const params = new URLSearchParams(searchParamsHook.toString());
      params.set('page', model.page.toString());
      params.set('pageSize', model.pageSize.toString());
    
     startTransition(() => {
       router.push(`${pathname}?${params.toString()}`);
     });
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSearch();
    };

    //Função de exportação
      const handleExport = async () => {
        if (!placaInput) {
          toast.warn("Realize uma busca antes de exportar.");
          return;
        }
    
        setExporting(true);
    
        try {
          // 1. Cria o objeto de parâmetros usando diretamente o input do usuário
          // Isso garante consistência entre o que ele vê e o que ele exporta
          const paramsToExport = {
            placa: placaInput,
            // Adicione outros filtros aqui se futuramente esta tela tiver mais campos
            // rodovia: undefined,
            // data: undefined
          };
    
          // 2. Chama o serviço
          const allData =
            await radarsService.searchAllByLocalForExport(paramsToExport);
    
          // 3. Validações
          if (!allData || allData.length === 0) {
            toast.warn(
              "Nenhum dado encontrado para exportar com a placa informada.",
            );
            return;
          }
    
          // 4. Gera o Excel
          // Sanitiza o nome do arquivo removendo caracteres especiais da placa se houver
          const safePlacaName = placaInput.replace(/[^a-zA-Z0-9]/g, "");
          exportToExcel(allData, `Relatorio_Placa_${safePlacaName}`);
    
          toast.success("Relatório gerado com sucesso!");
        } catch (error) {
          console.error("Erro ao exportar dados:", error);
          toast.error("Erro ao gerar relatório. Tente novamente.");
        } finally {
          setExporting(false);
        }
      };

      //Função para copiar para texto
        const handleCopy = async () => {
          if (!rows || rows.length === 0) {
            toast.warn("Não há dados na página atual para copiar.");
            return;
          }
      
          setCopying(true);
      
          try {
            // Usa diretamente o estado "rows" que contém os itens da página atual
            let textToCopy = `🚗 *Relatório da Placa: ${placaInput}*\n`;
            //textToCopy += `📅 Gerado em: ${new Date().toLocaleString('pt-BR')}\n\n`;
            //textToCopy += `📊 Registros copiados: ${rows.length}\n\n`;
      
            // Inclui informações do Detran no texto copiado, se disponíveis
            if (veiculoInfo) {
              textToCopy += `\n📋 *DADOS DO VEÍCULO*\n`;
              if (veiculoInfo.marcaModelo)
                textToCopy += `🔹 Marca/Modelo: ${veiculoInfo.marcaModelo}\n`;
              if (veiculoInfo.cor) textToCopy += `🎨 Cor: ${veiculoInfo.cor}\n`;
              if (veiculoInfo.municipio)
                textToCopy += `📍 Município: ${veiculoInfo.municipio} / ${veiculoInfo.uf}\n`;
              if (veiculoInfo.anoModelo)
                textToCopy += `🗓  Ano/Modelo: ${veiculoInfo.anoModelo}\n`;
              if (veiculoInfo.cpfProprietario)
                textToCopy += `🔢 CPF/Prop.: ${veiculoInfo.cpfProprietario}\n`;
            }
      
            textToCopy += `------------------------------------------\n`;
            textToCopy += `------------------------------------------\n`;
      
            textToCopy += `\n🔍 *ÚLTIMOS REGISTROS (Página Atual)*\n\n`;
      
            // Mapeamento de sentidos para ícones direcionais
            const getSentidoIcon = (sentido: string): string => {
              const s = sentido?.toLowerCase().trim();
      
              if (s?.includes("leste")) return "➡️"; // seta verde para direita
              if (s?.includes("oeste")) return "⬅️"; // seta azul para esquerda
              if (s?.includes("norte")) return "⬆️"; // seta cinza (sem cor nativa, usa emoji padrão)
              if (s?.includes("sul")) return "⬇️"; // seta laranja para baixo
      
              return "↔️"; // fallback genérico
            };
      
            rows.forEach((row, index) => {
              const dataFormatada = new Date(
                `${row.data}T00:00:00`,
              ).toLocaleDateString("pt-BR");
      
              textToCopy += `*${index + 1}. ${dataFormatada} às ${row.hora}*\n`;
              textToCopy += `🚘 Placa: ${row.placa}\n`;
              textToCopy += `🛣️ Local: ${row.rodovia || ""}\n`;
              // 2. Adiciona o KM na linha de baixo apenas se ele existir e não for nulo
              if (row.km !== null && row.km !== undefined && row.km !== "") {
                textToCopy += `🚩 KM: ${row.km}\n`;
              }
      
              if (row.praca !== null && row.praca !== undefined && row.praca !== "") {
                textToCopy += `📍 Praça: ${row.praca}\n`;
              }
              textToCopy += `${getSentidoIcon(row.sentido)} Sentido: ${row.sentido}\n`;
              textToCopy += `--------------------------------------\n`;
            });
      
            // Fallback para cópia em ambientes onde navigator.clipboard não é suportado (HTTP / IP local)
            if (navigator.clipboard && window.isSecureContext) {
              await navigator.clipboard.writeText(textToCopy);
            } else {
              const textArea = document.createElement("textarea");
              textArea.value = textToCopy;
      
              textArea.style.position = "fixed";
              textArea.style.left = "-999999px";
              textArea.style.top = "-999999px";
              document.body.appendChild(textArea);
      
              textArea.focus();
              textArea.select();
      
              try {
                const successful = document.execCommand("copy");
                if (!successful) {
                  throw new Error("Falha no fallback de cópia");
                }
              } catch (err) {
                console.error("Fallback: Erro ao copiar", err);
                throw new Error(
                  "Não foi possível copiar o texto automaticamente neste navegador/ambiente.",
                );
              } finally {
                document.body.removeChild(textArea);
              }
            }
      
            toast.success(
              `Copiados ${rows.length} registros da página atual para a área de transferência!`,
            );
          } catch (err) {
            console.error("Erro ao copiar:", err);
            toast.error("Erro ao copiar os dados para a área de transferência.");
          } finally {
            setCopying(false);
          }
        };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Header Card */}
      <Card
        className="mb-6 overflow-hidden"
        sx={{
          background: "linear-gradient(135deg, #14213d 0%, #1a2b4a 100%)",
          boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
        }}
      >
        <CardContent className="py-8">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-white/10 p-3 backdrop-blur-sm">
              <DirectionsCar sx={{ fontSize: 40, color: "#fca311" }} />
            </div>
            <div>
              <Typography
                variant="h4"
                className="mb-1 font-bold text-white"
                sx={{ letterSpacing: "-0.5px" }}
              >
                Consulta por Placa
              </Typography>
              <Typography variant="body2" className="text-gray-300">
                Sistema de rastreamento e monitoramento de veículos
              </Typography>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. BARRA DE BUSCA */}
      <Card className="mb-6 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <TextField
              fullWidth
              label="Placa do Veículo"
              placeholder="ABC-1234"
              variant="outlined"
              value={placaInput}
              onChange={(e) => setPlacaInput(e.target.value.toUpperCase())}
              onKeyPress={handleKeyPress}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <DirectionsCar sx={{ color: "#fca311" }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "&:hover fieldset": { borderColor: "#fca311" },
                  "&.Mui-focused fieldset": { borderColor: "#fca311" },
                },
                "& .MuiInputLabel-root.Mui-focused": { color: "#fca311" },
              }}
            />
            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={loading}
              size="large"
              startIcon={<SearchIcon />}
              sx={{
                minWidth: "160px",
                height: "56px",
                bgcolor: "#fca311",
                color: "#14213d",
                fontWeight: 600,
                fontSize: "16px",
                textTransform: "none",
                boxShadow: "0 4px 14px rgba(252, 163, 17, 0.4)",
                "&:hover": {
                  bgcolor: "#e09200",
                  boxShadow: "0 6px 20px rgba(252, 163, 17, 0.5)",
                  transform: "translateY(-2px)",
                },
                "&:disabled": { bgcolor: "#e5e7eb", color: "#9ca3af" },
                transition: "all 0.3s ease",
              }}
            >
              {loading ? "Buscando..." : "Buscar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 3. INFORMAÇÕES DO VEÍCULO (Componentizado) */}
      {hasSearched && veiculoInfo && (
        <Card className="mb-6 border-l-4 border-[#1976d2] shadow-md">
          <CardContent className="p-5">
            <Typography
              variant="h6"
              className="mb-4 flex items-center gap-2 font-bold text-gray-800"
            >
              <InfoIcon color="primary" /> Informações do Veículo
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Box display="flex" alignItems="center" gap={2}>
                  <div className="rounded-lg bg-blue-50 p-2">
                    <DirectionsCarOutlined sx={{ color: "#1976d2" }} />
                  </div>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Marca / Modelo
                    </Typography>
                    <Typography variant="body1" fontWeight="600">
                      {veiculoInfo.marcaModelo || "Não informado"}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Box display="flex" alignItems="center" gap={2}>
                  <div className="rounded-lg bg-purple-50 p-2">
                    <PaletteOutlined sx={{ color: "#9c27b0" }} />
                  </div>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Cor
                    </Typography>
                    <Typography variant="body1" fontWeight="600">
                      {veiculoInfo.cor || "Não informada"}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Box display="flex" alignItems="center" gap={2}>
                  <div className="rounded-lg bg-green-50 p-2">
                    <LocationCityOutlined sx={{ color: "#2e7d32" }} />
                  </div>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Município
                    </Typography>
                    <Typography variant="body1" fontWeight="600">
                      {veiculoInfo.municipio || "Não informado"}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Stats Row & Actions */}
      {hasSearched && (
        <div className="mb-4 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 shadow-sm">
            <TrendingUpIcon style={{ color: "#fca311", fontSize: 20 }} />
            <Typography variant="body2" className="text-gray-600">
              Total de passagens registradas:{" "}
              <strong className="text-gray-900">{rowCount}</strong>
            </Typography>
            {latestRowId && (
              <Chip
                label="Registro mais recente destacado"
                size="small"
                sx={{
                  bgcolor: "#fef3e2",
                  color: "#d97706",
                  fontWeight: 500,
                  fontSize: "12px",
                  ml: 2,
                }}
              />
            )}
          </div>

          {rowCount > 0 && (
            <Box display="flex" gap={2}>
              <Tooltip title="Copiar registros da PÁGINA ATUAL para WhatsApp/Telegram">
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={handleCopy}
                  disabled={loading || copying}
                  size="medium"
                  startIcon={<ContentCopy />}
                  sx={{ bgcolor: "white", "&:hover": { bgcolor: "#f3f4f6" } }}
                >
                  {copying ? "Copiando..." : "Copiar"}
                </Button>
              </Tooltip>

              <Button
                variant="contained"
                color="success"
                onClick={handleExport}
                disabled={exporting || loading}
                size="medium"
              >
                {exporting ? "Exportando..." : "Exportar Excel"}
              </Button>
            </Box>
          )}
        </div>
      )}

      {/* DataGrid Card */}
      <Card className="overflow-hidden shadow-lg">
        <CardContent className="p-0">
          <Box sx={{ height: 750, width: "100%" }}>
            <DataGrid
              rows={rows}
              columns={columns}
              rowCount={rowCount}
              getRowId={(row) =>
                `${row.placa}_${row.data}_${row.hora}_${row.concessionaria}_${row.id}`
              }
              loading={loading}
              pageSizeOptions={[10, 25, 50]}
              paginationModel={paginationModel}
              onPaginationModelChange={handlePaginationChange}
              paginationMode="server"
              hideFooter={!hasSearched}
              autoHeight={false}
              getRowClassName={(params) => {
                return params.id === latestRowId ? "highlighted-row" : "";
              }}
              slots={{
                pagination: CustomPagination,
                noRowsOverlay: () => {
                  if (!hasSearched) return null;
                  return (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100%",
                        gap: 2,
                      }}
                    >
                      <DirectionsCar sx={{ fontSize: 60, color: "#d1d5db" }} />
                      <Typography
                        variant="h6"
                        sx={{ color: "#6b7280", fontWeight: 500 }}
                      >
                        Nenhum registro de passagens localizado da placa{" "}
                        {placaInput}
                      </Typography>
                    </Box>
                  );
                },
              }}
              sx={{
                border: "none",
                "& .MuiDataGrid-columnHeaders": {
                  bgcolor: "#14213d",
                  color: "white",
                  fontSize: "14px",
                  fontWeight: 600,
                  borderRadius: 0,
                  minHeight: "56px !important",
                  maxHeight: "56px !important",
                },
                "& .MuiDataGrid-columnHeader": { outline: "none !important" },
                "& .MuiDataGrid-columnHeaderTitle": {
                  fontWeight: 600,
                  color: "#134074",
                },
                "& .MuiDataGrid-columnSeparator": {
                  color: "rgba(255,255,255,0.2)",
                },
                "& .MuiDataGrid-row": {
                  "&:hover": { bgcolor: "#fef3e2" },
                  "&.Mui-selected": { bgcolor: "#fef9f0 !important" },
                },
                "& .MuiDataGrid-row.highlighted-row": {
                  bgcolor: "#fef3e2",
                  borderLeft: "4px solid #fca311",
                  "&:hover": { bgcolor: "#fde8c0 !important" },
                },
                "& .MuiDataGrid-cell": {
                  borderColor: "#f3f4f6",
                  fontSize: "14px",
                },
                "& .MuiDataGrid-footerContainer": {
                  borderTop: "2px solid #f3f4f6",
                  bgcolor: "#fafafa",
                },
                "& .MuiTablePagination-root": { color: "#14213d" },
                "& .MuiDataGrid-virtualScroller": { bgcolor: "white" },
              }}
            />
          </Box>
        </CardContent>
      </Card>
    </div>
  );
}
