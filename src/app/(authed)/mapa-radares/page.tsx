"use client";

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { RadarLocationDTO } from "../../types/types";
import { radarsService, RodoviaDTO } from "../../services/radars";
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  Tooltip,
  Autocomplete,
  TextField,
  Button,
  Divider,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Search, X } from "lucide-react";
import { toast } from "react-toastify";

// ─── Config de cores/labels do mapa ──────────────────────────────────────────
const CONCESSIONARIA_META: Record<
  string,
  { label: string; color: string; abbr: string }
> = {
  cart: { label: "Cart", color: "#f59e0b", abbr: "CT" },
  eixo: { label: "Eixo", color: "#3b82f6", abbr: "EX" },
  entrevias: { label: "Entrevias", color: "#22c55e", abbr: "ET" },
  rondon: { label: "Rondon", color: "#ef4444", abbr: "RN" },
  monitorasp: { label: "MonitoraSP", color: "#ffea00", abbr: "MSP" },
};

const DEFAULT_META = { label: "Outro", color: "#6b7280", abbr: "OT" };
const NONE_SENTINEL = "__none__";

function getMeta(key: string) {
  return CONCESSIONARIA_META[key.toLowerCase().trim()] ?? DEFAULT_META;
}

// ─── Importação dinâmica do mapa ─────────────────────────────────────────────
const RadarMapDinâmico = dynamic(
  () => import("./componentes/RadarMapComponent"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center rounded-lg bg-gray-100">
        <p className="animate-pulse text-lg font-semibold text-gray-500">
          Iniciando mapa e carregando radares...
        </p>
      </div>
    ),
  },
);

// ─── Componente de Chip (Concessionária) ─────────────────────────────────────
interface FilterChipProps {
  concKey: string;
  label: string;
  color: string;
  count: number;
  active: boolean;
  onToggle: (key: string) => void;
}

function ConcessionariaFilterChip({
  concKey,
  label,
  color,
  count,
  active,
  onToggle,
}: FilterChipProps) {
  return (
    <Tooltip
      title={active ? `Ocultar ${label}` : `Exibir ${label}`}
      placement="top"
      arrow
    >
      <button
        onClick={() => onToggle(concKey)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          borderRadius: "10px",
          cursor: "pointer",
          border: active
            ? `1.5px solid ${color}`
            : "1.5px solid rgba(255,255,255,0.12)",
          background: active ? `${color}28` : "rgba(255,255,255,0.04)",
          transition: "all 0.2s ease",
          width: "100%",
          minWidth: 0,
        }}
      >
        <div
          style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: active ? color : `${color}55`,
              flexShrink: 0,
              transition: "background 0.2s",
            }}
          />
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: active ? color : "rgba(255,255,255,0.35)",
              transition: "color 0.2s",
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: 11,
              color: active ? `${color}bb` : "rgba(255,255,255,0.2)",
              fontFamily: "monospace",
            }}
          >
            {count}
          </span>
        </div>
      </button>
    </Tooltip>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function MapaRadaresPage() {
  const [radares, setRadares] = useState<RadarLocationDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState<RadarLocationDTO | null>(
    null,
  );

  // Estados de Filtro de Concessionária
  const [filtrosAtivos, setFiltrosAtivos] = useState<Set<string>>(new Set());

  // Estados de Filtro de Rodovia
  const [rodoviasList, setRodoviasList] = useState<RodoviaDTO[]>([]);
  const [rodoviaSelecionada, setRodoviaSelecionada] =
    useState<RodoviaDTO | null>(null);
  const [rodoviaAtiva, setRodoviaAtiva] = useState<string | null>(null); // O filtro real aplicado no mapa

  // ── 1. Carrega pontos do Mapa e Lista de Rodovias ──────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Dispara as duas requisições em paralelo
        const [locaisData, rodoviasData] = await Promise.all([
          radarsService.getRadarLocations(),
          radarsService.getRodovias(),
        ]);

        setRadares(locaisData || []);

        // Remove rodovias duplicadas pelo nome para o Autocomplete ficar limpo
        const unicas = Array.from(
          new Map(
            (rodoviasData || []).map((item) => [item.nome, item]),
          ).values(),
        );
        setRodoviasList(unicas);
      } catch (error) {
        console.error("❌ Erro ao renderizar a página do mapa:", error);
        toast.error("Erro ao carregar os dados do mapa.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // ── 2. Aplica o filtro de Rodovia sobre os Radares ─────────────────────────
  const radaresParaMapa = useMemo(() => {
    if (!rodoviaAtiva) return radares;
    // Pega apenas os radares que têm a mesma rodovia filtrada
    return radares.filter(
      (r) =>
        (r.rodovia || r.praca || "").toUpperCase() ===
        rodoviaAtiva.toUpperCase(),
    );
  }, [radares, rodoviaAtiva]);

  // ── 3. Handlers do Botão Procurar/Limpar Rodovia ───────────────────────────
  const handleProcurarRodovia = () => {
    if (rodoviaSelecionada) {
      setRodoviaAtiva(rodoviaSelecionada.nome);
      // Opcional: Se quiser limpar os filtros de concessionária ao buscar uma rodovia
      // setFiltrosAtivos(new Set());
    } else {
      setRodoviaAtiva(null);
    }
  };

  const handleLimparRodovia = () => {
    setRodoviaSelecionada(null);
    setRodoviaAtiva(null);
  };

  // ── 4. Lógicas de Concessionária (Baseadas na lista já filtrada por Rodovia)
  const contagemPorConc = useMemo(() => {
    const map: Record<string, number> = {};
    radaresParaMapa.forEach((r) => {
      const key = (r.concessionaria ?? "").toLowerCase().trim();
      if (!key) return;
      map[key] = (map[key] ?? 0) + 1;
    });
    return map;
  }, [radaresParaMapa]);

  const concessionariasDisponiveis = useMemo(
    () => Object.keys(contagemPorConc).sort(),
    [contagemPorConc],
  );

  const totalVisiveis = useMemo(() => {
    if (filtrosAtivos.size === 0) return radaresParaMapa.length;
    return radaresParaMapa.filter((r) =>
      filtrosAtivos.has((r.concessionaria ?? "").toLowerCase().trim()),
    ).length;
  }, [radaresParaMapa, filtrosAtivos]);

  // Handlers Concessionária
  const handleToggle = (key: string) => {
    setFiltrosAtivos((prev) => {
      const next = new Set(prev);
      if (next.size === 0) {
        concessionariasDisponiveis.forEach((k) => {
          if (k !== key) next.add(k);
        });
        return next;
      }
      if (next.has(key)) {
        next.delete(key);
        if (next.size === 0) return new Set();
      } else {
        next.add(key);
        if (next.size === concessionariasDisponiveis.length) return new Set();
      }
      return next;
    });
  };

  const handleSelecionarTodas = () => setFiltrosAtivos(new Set());
  const handleDeselecionarTodas = () =>
    setFiltrosAtivos(new Set([NONE_SENTINEL]));
  const isActive = (key: string) =>
    filtrosAtivos.size === 0 || filtrosAtivos.has(key);
  const todasSelecionadas = filtrosAtivos.size === 0;

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col gap-4 bg-gradient-to-br from-gray-50 via-[#fef9f3] to-gray-50 p-6">
      {/* ── HERO HEADER ─────────────────────────────────────────────────── */}
      <Card
        className="shrink-0 overflow-hidden"
        sx={{
          background: "linear-gradient(135deg, #14213d 0%, #1a2b4a 100%)",
          boxShadow: "0 20px 60px rgba(20,33,61,0.3)",
          borderRadius: "16px",
          position: "relative",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "linear-gradient(90deg, #fca311 0%, #ff8800 100%)",
          },
        }}
      >
        <CardContent className="px-8 py-5">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-5">
              <Box
                sx={{
                  background: "rgba(252,163,17,0.15)",
                  border: "1px solid rgba(252,163,17,0.3)",
                  borderRadius: "16px",
                  p: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="36" height="36" viewBox="0 0 24 24" fill="#fca311">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
              </Box>
              <div>
                <Typography
                  variant="h4"
                  className="font-bold text-white"
                  sx={{
                    letterSpacing: "-0.5px",
                    textShadow: "0 2px 10px rgba(0,0,0,0.2)",
                  }}
                >
                  Mapa Operacional de Radares
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "rgba(255,255,255,0.7)", mt: 0.5 }}
                >
                  {isLoading
                    ? "Sincronizando localizações..."
                    : rodoviaAtiva
                      ? `${totalVisiveis} radares na ${rodoviaAtiva}`
                      : `${totalVisiveis} de ${radares.length} equipamentos exibidos`}
                </Typography>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── PAINEL DE FILTROS (RODOVIA + CONCESSIONÁRIAS) ───────────────── */}
      {!isLoading && (
        <Card
          className="shrink-0 overflow-hidden"
          sx={{
            background: "linear-gradient(135deg, #1a2b4a 0%, #14213d 100%)",
            borderRadius: "14px",
            boxShadow: "0 4px 24px rgba(20,33,61,0.2)",
          }}
        >
          <CardContent
            sx={{
              py: 2,
              px: 3,
              "&:last-child": { pb: 2 },
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {/* LINHA 1: Busca de Rodovia */}
            <div className="flex w-full items-center gap-3">
              <Autocomplete
                options={rodoviasList}
                getOptionLabel={(option) => option.nome || ""}
                value={rodoviaSelecionada}
                onChange={(_, newValue) => setRodoviaSelecionada(newValue)}
                isOptionEqualToValue={(option, value) =>
                  option.nome === value.nome
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Buscar Rodovia (Ex: SP-294)"
                    variant="outlined"
                    size="small"
                    sx={{
                      backgroundColor: "rgba(255,255,255,0.05)",
                      borderRadius: 2,
                      input: { color: "white" },
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "rgba(255,255,255,0.2)",
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#fca311",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#fca311",
                      },
                      "& .MuiSvgIcon-root": { color: "rgba(255,255,255,0.7)" },
                    }}
                  />
                )}
                sx={{ flexGrow: 1, maxWidth: 400 }}
              />
              <Button
                variant="contained"
                onClick={handleProcurarRodovia}
                startIcon={<Search size={16} />}
                sx={{
                  bgcolor: "#fca311",
                  color: "#14213d",
                  fontWeight: "bold",
                  "&:hover": { bgcolor: "#ff8800" },
                  textTransform: "none",
                  borderRadius: 2,
                }}
              >
                Localizar
              </Button>
              {rodoviaAtiva && (
                <Button
                  variant="outlined"
                  onClick={handleLimparRodovia}
                  startIcon={<X size={16} />}
                  sx={{
                    color: "#fca311",
                    borderColor: "rgba(252,163,17,0.5)",
                    textTransform: "none",
                    borderRadius: 2,
                    "&:hover": {
                      borderColor: "#fca311",
                      bgcolor: "rgba(252,163,17,0.1)",
                    },
                  }}
                >
                  Limpar
                </Button>
              )}
            </div>

            {concessionariasDisponiveis.length > 0 && (
              <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />
            )}

            {/* LINHA 2: Chips de Concessionária */}
            {concessionariasDisponiveis.length > 0 && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex shrink-0 items-center gap-3">
                  <Typography
                    variant="body2"
                    sx={{
                      color: "rgba(255,255,255,0.85)",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Concessionárias
                  </Typography>
                  <div className="flex gap-1.5">
                    <button
                      onClick={handleSelecionarTodas}
                      disabled={todasSelecionadas}
                      style={{
                        fontSize: 11,
                        color: todasSelecionadas
                          ? "rgba(255,255,255,0.25)"
                          : "rgba(255,255,255,0.6)",
                        cursor: todasSelecionadas ? "default" : "pointer",
                        padding: "2px 10px",
                        border: "0.5px solid",
                        borderColor: todasSelecionadas
                          ? "rgba(255,255,255,0.1)"
                          : "rgba(255,255,255,0.25)",
                        borderRadius: 20,
                        background: "none",
                        transition: "all 0.2s",
                      }}
                    >
                      Todas
                    </button>
                    <button
                      onClick={handleDeselecionarTodas}
                      disabled={filtrosAtivos.size === 1}
                      style={{
                        fontSize: 11,
                        color:
                          filtrosAtivos.size === 1
                            ? "rgba(255,255,255,0.25)"
                            : "rgba(255,255,255,0.6)",
                        cursor:
                          filtrosAtivos.size === 1 ? "default" : "pointer",
                        padding: "2px 10px",
                        border: "0.5px solid",
                        borderColor:
                          filtrosAtivos.size === 1
                            ? "rgba(255,255,255,0.1)"
                            : "rgba(255,255,255,0.25)",
                        borderRadius: 20,
                        background: "none",
                        transition: "all 0.2s",
                      }}
                    >
                      Nenhuma
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${Math.min(concessionariasDisponiveis.length, 5)}, minmax(100px, 1fr))`,
                    gap: 8,
                    flex: 1,
                  }}
                >
                  {concessionariasDisponiveis.map((key) => {
                    const meta = getMeta(key);
                    return (
                      <ConcessionariaFilterChip
                        key={key}
                        concKey={key}
                        label={meta.label}
                        color={meta.color}
                        count={contagemPorConc[key] ?? 0}
                        active={isActive(key)}
                        onToggle={handleToggle}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── MAPA ─────────────────────────────────────────────────────────── */}
      <div className="relative z-0 min-h-[400px] flex-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <RadarMapDinâmico
          // 💡 Passamos os radares já filtrados pela Rodovia (se existir)
          points={radaresParaMapa}
          activeFilters={filtrosAtivos}
          selectedPoint={selectedPoint}
          onSelectPoint={setSelectedPoint}
        />
      </div>
    </div>
  );
}