"use client";

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { RadarLocationDTO } from "../../types/types";
import { radarsService } from "../../services/radars";
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  Tooltip,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

// ─── Importamos a config de cores/labels do mapa para reutilizar ─────────────
// (Duplicamos as chaves necessárias aqui para não importar o módulo inteiro do Leaflet no Server)
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

// Sentinela: representa "nenhuma concessionária selecionada" sem ambiguidade
// (Set vazio = mostrar tudo; Set com NONE_SENTINEL = mostrar nada)
const NONE_SENTINEL = "__none__";

function getMeta(key: string) {
  return CONCESSIONARIA_META[key.toLowerCase().trim()] ?? DEFAULT_META;
}

// ─── Importação dinâmica do mapa (evita erro SSR do Leaflet) ─────────────────
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

// ─── Componente de botão de filtro por concessionária ────────────────────────
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
        {/* Lado esquerdo: ponto colorido + label */}
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

        {/* Lado direito: contagem + check */}
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
          {active && (
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M2.5 7L5.5 10L11.5 4"
                stroke={color}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
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

  // Set vazio = mostrar todas (comportamento padrão do RadarMapComponent)
  // Set com chaves = mostrar apenas as selecionadas
  const [filtrosAtivos, setFiltrosAtivos] = useState<Set<string>>(new Set());

  // ── Carrega pontos ──────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchLocalizacoes = async () => {
      try {
        setIsLoading(true);
        const data = await radarsService.getRadarLocations();
        setRadares(data || []);
      } catch (error) {
        console.error("❌ Erro ao renderizar a página do mapa:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLocalizacoes();
  }, []);

  // ── Calcula contagem por concessionária ────────────────────────────────────
  const contagemPorConc = useMemo(() => {
    const map: Record<string, number> = {};
    radares.forEach((r) => {
      const key = (r.concessionaria ?? "").toLowerCase().trim();
      if (!key) return;
      map[key] = (map[key] ?? 0) + 1;
    });
    return map;
  }, [radares]);

  // Chaves únicas de concessionárias encontradas nos dados
  const concessionariasDisponiveis = useMemo(
    () => Object.keys(contagemPorConc).sort(),
    [contagemPorConc],
  );

  // ── Total de radares visíveis ──────────────────────────────────────────────
  const totalVisiveis = useMemo(() => {
    if (filtrosAtivos.size === 0) return radares.length;
    return radares.filter((r) =>
      filtrosAtivos.has((r.concessionaria ?? "").toLowerCase().trim()),
    ).length;
  }, [radares, filtrosAtivos]);

  // ── Handlers de filtro ────────────────────────────────────────────────────
  const handleToggle = (key: string) => {
    setFiltrosAtivos((prev) => {
      const next = new Set(prev);

      // Se o set estava vazio (= "todas ativas"), inicializamos com todas
      // EXCETO a que foi clicada (toggle intuitivo)
      if (next.size === 0) {
        concessionariasDisponiveis.forEach((k) => {
          if (k !== key) next.add(k);
        });
        return next;
      }

      if (next.has(key)) {
        next.delete(key);
        // Se ficou vazio, volta para "todas visíveis"
        if (next.size === 0) return new Set();
      } else {
        next.add(key);
        // Se todas estão selecionadas manualmente, volta para o estado "todas" (set vazio)
        if (next.size === concessionariasDisponiveis.length) return new Set();
      }

      return next;
    });
  };

  const handleSelecionarTodas = () => setFiltrosAtivos(new Set());

  const handleDeselecionarTodas = () => {
    // Deixa apenas a primeira, para nunca ficar com mapa vazio
    //const first = concessionariasDisponiveis[0];
    //setFiltrosAtivos(first ? new Set([first]) : new Set());
    setFiltrosAtivos(new Set([NONE_SENTINEL]));
  };

  // Verifica se uma concessionária está "ativa" considerando o estado do set
  const isActive = (key: string) =>
    filtrosAtivos.size === 0 || filtrosAtivos.has(key);

  const todasSelecionadas = filtrosAtivos.size === 0;
  const quantidadeVisiveis =
    filtrosAtivos.size === 0
      ? concessionariasDisponiveis.length
      : filtrosAtivos.size;

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
            {/* Título */}
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
                    ? "Sincronizando localizações com as concessionárias..."
                    : `${totalVisiveis} de ${radares.length} equipamentos exibidos`}
                </Typography>
              </div>
            </div>

            {/* Badge de resumo */}
            {!isLoading && (
              <Chip
                label={
                  todasSelecionadas
                    ? "Todas as concessionárias"
                    : `${quantidadeVisiveis} concessionária${quantidadeVisiveis !== 1 ? "s" : ""} visível${quantidadeVisiveis !== 1 ? "is" : ""}`
                }
                sx={{
                  bgcolor: alpha("#fca311", 0.15),
                  color: "#fca311",
                  border: "1px solid rgba(252,163,17,0.35)",
                  fontWeight: 600,
                  fontSize: 13,
                }}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── PAINEL DE FILTROS ─────────────────────────────────────────────── */}
      {!isLoading && concessionariasDisponiveis.length > 0 && (
        <Card
          className="shrink-0 overflow-hidden"
          sx={{
            background: "linear-gradient(135deg, #1a2b4a 0%, #14213d 100%)",
            borderRadius: "14px",
            boxShadow: "0 4px 24px rgba(20,33,61,0.2)",
          }}
        >
          <CardContent sx={{ py: 1.5, px: 3, "&:last-child": { pb: 1.5 } }}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {/* Label + ações rápidas */}
              <div className="flex shrink-0 items-center gap-3">
                <div className="flex items-center gap-2">
                  {/* Ícone de filtro SVG inline */}
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 15 15"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M1 3h13M3.5 7.5h8M6 12h3"
                      stroke="#fca311"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
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
                </div>

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
                      whiteSpace: "nowrap",
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
                      cursor: filtrosAtivos.size === 1 ? "default" : "pointer",
                      padding: "2px 10px",
                      border: "0.5px solid",
                      borderColor:
                        filtrosAtivos.size === 1
                          ? "rgba(255,255,255,0.1)"
                          : "rgba(255,255,255,0.25)",
                      borderRadius: 20,
                      background: "none",
                      transition: "all 0.2s",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Nenhuma
                  </button>
                </div>
              </div>

              {/* Grid de chips de concessionárias */}
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

              {/* Status: radares visíveis */}
              <div
                style={{
                  //shrink: 0,
                  textAlign: "right",
                  borderLeft: "0.5px solid rgba(255,255,255,0.1)",
                  paddingLeft: 16,
                  minWidth: 90,
                }}
              >
                <Typography
                  sx={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.4)",
                    display: "block",
                  }}
                >
                  Visíveis
                </Typography>
                <Typography
                  sx={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#fca311",
                    lineHeight: 1.2,
                  }}
                >
                  {totalVisiveis}
                </Typography>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── MAPA ─────────────────────────────────────────────────────────── */}
      <div className="relative z-0 min-h-[400px] flex-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <RadarMapDinâmico
          points={radares}
          activeFilters={filtrosAtivos}
          selectedPoint={selectedPoint}
          onSelectPoint={setSelectedPoint}
        />
      </div>
    </div>
  );
}
