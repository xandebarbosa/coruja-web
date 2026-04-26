'use client';

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { RadarLocationDTO } from '../../../types/types';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const TOKENS = {
  fontMono: "'JetBrains Mono', 'Fira Code', monospace",
  fontSans: "'Space Grotesk', 'DM Sans', sans-serif",
  bg: '#ffffff',
  bgCard: 'rgba(255, 255, 255, 0.95)',
  bgCardHover: 'rgba(245, 247, 250, 0.98)',
  border: 'rgba(0,0,0,0.08)',
  borderAccent: 'rgba(0,0,0,0.18)',
  text: '#1a1f2e',
  textMuted: '#4b5563',
  textSubtle: '#9ca3af',
  radius: '10px',
  radiusSm: '6px',
  shadow: '0 8px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)',
  shadowSm: '0 4px 16px rgba(0,0,0,0.5)',
};

// ─── Tipagem e Configurações ──────────────────────────────────────────────────
export type ConcessionariaConfig = {
  color: string;
  colorDim: string;
  glow: string;
  label: string;
  abbr: string;
  logo?: string;
};

export const CONCESSIONARIA_CONFIG: Record<string, ConcessionariaConfig> = {
  cart: {
    color: '#f59e0b',
    colorDim: 'rgba(245,158,11,0.15)',
    glow: 'rgba(245,158,11,0.4)',
    label: 'Cart',
    abbr: 'CT',
    logo: '/image/logo-cart.png',
  },
  eixo: {
    color: '#3b82f6',
    colorDim: 'rgba(59,130,246,0.15)',
    glow: 'rgba(59,130,246,0.4)',
    label: 'Eixo',
    abbr: 'EX',
    logo: '/image/logo-eixo.png',
  },
  entrevias: {
    color: '#22c55e',
    colorDim: 'rgba(34,197,94,0.15)',
    glow: 'rgba(34,197,94,0.4)',
    label: 'Entrevias',
    abbr: 'ET',
    logo: '/image/logo-entrevias.png',
  },
  rondon: {
    color: '#ef4444',
    colorDim: 'rgba(239,68,68,0.15)',
    glow: 'rgba(239,68,68,0.4)',
    label: 'Rondon',
    abbr: 'RN',
    logo: '/image/logo-rondon.png',
  },
  // monitorasp: {
  //   color: '#a855f7',
  //   colorDim: 'rgba(168,85,247,0.15)',
  //   glow: 'rgba(168,85,247,0.4)',
  //   label: 'MonitoraSP',
  //   abbr: 'MS',
  // },
};

const DEFAULT_CONFIG: ConcessionariaConfig = {
  color: '#6b7280',
  colorDim: 'rgba(107,114,128,0.15)',
  glow: 'rgba(107,114,128,0.3)',
  label: 'Outro',
  abbr: 'OT',
};

function getConfig(concessionaria?: string): ConcessionariaConfig {
  if (!concessionaria) return DEFAULT_CONFIG;
  return CONCESSIONARIA_CONFIG[concessionaria.toLowerCase().trim()] ?? DEFAULT_CONFIG;
}

// ─── Ícone SVG customizado (Reduzido) ─────────────────────────────────────────
function createCustomIcon(color: string, abbr: string, selected = false, logo?: string) {
  const size = selected ? 30 : 24; 
  const h = Math.round(size * 1.3);
  const cx = size / 2;
  const cy = Math.round(size * 0.46);
  const r = Math.round(size * 0.3); 
  const fontSize = selected ? 8 : 7;

  const innerContent = logo
    ? `<image href="${logo}" x="${cx - r}" y="${cy - r}" width="${r * 2}" height="${r * 2}" preserveAspectRatio="xMidYMid slice" clip-path="url(#clip-circle-${abbr})" />`
    : `<circle cx="${cx}" cy="${cy}" r="${r}" fill="rgba(255,255,255,0.12)"/>
       <text x="${cx}" y="${cy + fontSize * 0.38}" text-anchor="middle"
         font-family="'JetBrains Mono', monospace"
         font-weight="700" font-size="${fontSize}" fill="white" letter-spacing="0.5">${abbr}</text>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${h}" viewBox="0 0 ${size} ${h}">
    <defs>
      <filter id="glow-${abbr}" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="${selected ? 3 : 1.5}" result="blur"/>
        <feComposite in="SourceGraphic" in2="blur" operator="over"/>
      </filter>
      <filter id="drop-${abbr}">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="${color}" flood-opacity="${selected ? 0.5 : 0.3}"/>
      </filter>
      <clipPath id="clip-circle-${abbr}">
        <circle cx="${cx}" cy="${cy}" r="${r}"/>
      </clipPath>
    </defs>
    ${selected ? `<circle cx="${cx}" cy="${cy}" r="${r + 5}" fill="${color}" fill-opacity="0.15" filter="url(#glow-${abbr})"/>` : ''}
    <path filter="url(#drop-${abbr})"
      d="M${cx} 0.5 C${Math.round(size * 0.22)} 0.5 0.5 ${Math.round(size * 0.22)} 0.5 ${cx + 0.5} C0.5 ${Math.round(size * 0.87)} ${cx} ${h - 0.5} ${cx} ${h - 0.5} C${cx} ${h - 0.5} ${size - 0.5} ${Math.round(size * 0.87)} ${size - 0.5} ${cx + 0.5} C${size - 0.5} ${Math.round(size * 0.22)} ${Math.round(size * 0.78)} 0.5 ${cx} 0.5Z"
      fill="white" stroke="${color}" stroke-width="${selected ? 1.5 : 1}"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="white"/>
    ${innerContent}
  </svg>`;

  return L.divIcon({
    html: svg,
    iconSize: [size, h],
    iconAnchor: [size / 2, h],
    popupAnchor: [0, -(h + 2)],
    className: '',
  });
}

// ─── Controladores auxiliares ──────────────────────────────────────────────────
function FitBoundsController({ points }: { points: RadarLocationDTO[] }) {
  const map = useMap();
  const prevLengthRef = useRef(-1);

  useEffect(() => {
    if (!points || points.length === 0) return;
    if (points.length === prevLengthRef.current) return;
    prevLengthRef.current = points.length;

    const bounds = L.latLngBounds(points.map((p) => [p.latitude!, p.longitude!]));
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 13, animate: true });
    }
  }, [points, map]);

  return null;
}

function MapEventHandler({
  onZoom,
  onMapClick,
}: {
  onZoom: (z: number) => void;
  onMapClick: () => void;
}) {
  useMapEvents({
    zoom: (e) => onZoom(e.target.getZoom()),
    click: () => onMapClick(),
  });
  return null;
}

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 150);
    const container = map.getContainer();
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [map]);
  return null;
}

// ─── Estilos Globais ──────────────────────────────────────────────────────────
const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap');

  .radar-map-wrapper {
    position: relative;
    height: 100%;
    width: 100%;
    border-radius: 12px;
    overflow: hidden;
    background: ${TOKENS.bg};
  }

  .radar-map-wrapper .leaflet-tile { filter: none; }
  .radar-map-wrapper .leaflet-container { background: #ffffff; font-family: ${TOKENS.fontSans}; }

  .radar-popup .leaflet-popup-content-wrapper {
    background: ${TOKENS.bgCard} !important;
    border: 1px solid ${TOKENS.border} !important;
    border-radius: ${TOKENS.radius} !important;
    box-shadow: ${TOKENS.shadow} !important;
    padding: 0 !important;
    overflow: hidden;
    backdrop-filter: blur(12px);
  }
  .radar-popup .leaflet-popup-content { margin: 0 !important; width: 240px !important; }
  .radar-popup .leaflet-popup-tip-container { display: none; }
  .radar-popup .leaflet-popup-close-button {
    color: ${TOKENS.textMuted} !important;
    font-size: 16px !important;
    top: 8px !important;
    right: 10px !important;
    z-index: 10;
  }
  .radar-popup .leaflet-popup-close-button:hover { color: ${TOKENS.text} !important; }

  .radar-map-wrapper .leaflet-control-attribution {
    background: rgba(255,255,255,0.85) !important;
    color: ${TOKENS.textSubtle} !important;
    font-size: 10px !important;
    border-radius: 4px 0 0 0 !important;
    backdrop-filter: blur(4px);
  }
`;

function injectStyles() {
  if (typeof document === 'undefined' || document.getElementById('radar-map-styles')) return;
  const style = document.createElement('style');
  style.id = 'radar-map-styles';
  style.textContent = GLOBAL_STYLES;
  document.head.appendChild(style);
}

// ─── Componente Principal ─────────────────────────────────────────────────────
interface Props {
  points?: RadarLocationDTO[];
  activeFilters?: Set<string>;
  selectedPoint?: RadarLocationDTO | null;
  onSelectPoint: (p: RadarLocationDTO | null) => void;
}

export default function RadarMapComponent({
  points = [],
  activeFilters,
  selectedPoint,
  onSelectPoint,
}: Props) {
  const [zoom, setZoom] = useState(8);
  const iconCache = useRef<Map<string, L.DivIcon>>(new Map());

  useEffect(() => { injectStyles(); }, []);

  const prevSelectedId = useRef<string | number | undefined>(undefined);
  useEffect(() => {
    const newId = selectedPoint?.id;
    if (newId !== prevSelectedId.current) {
      [newId, prevSelectedId.current].forEach((id) => {
        if (id == null) return;
        iconCache.current.forEach((_, k) => {
          if (k.startsWith(`${id}:`)) iconCache.current.delete(k);
        });
      });
      prevSelectedId.current = newId;
    }
  }, [selectedPoint]);

  const getCachedIcon = useCallback(
    (point: RadarLocationDTO) => {
      if (typeof window === 'undefined') return undefined;
      const isSelected = selectedPoint?.id === point.id;
      const key = `${point.id}:${point.concessionaria}:${isSelected ? 'sel' : 'nor'}`;

      if (!iconCache.current.has(key)) {
        const cfg = getConfig(point.concessionaria);
        iconCache.current.set(key, createCustomIcon(cfg.color, cfg.abbr, isSelected, cfg.logo));
      }
      return iconCache.current.get(key);
    },
    [selectedPoint]
  );

  const filteredPoints = useMemo(() => {
    const safePoints = Array.isArray(points) ? points : [];
    if (safePoints.length === 0) return [];

    return safePoints.filter(p => {
      if (!p) return false;
      const lat = Number(p.latitude);
      const lng = Number(p.longitude);
      if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return false;
      p.latitude = lat;
      p.longitude = lng;
      const key = (p.concessionaria ?? '').toLowerCase().trim();
      return !activeFilters || activeFilters.size === 0 || activeFilters.has(key);
    });
  }, [points, activeFilters]);

  const stats = useMemo(() => {
    const map = new Map<string, number>();
    filteredPoints.forEach((p) => {
      const k = (p.concessionaria ?? '').toLowerCase().trim();
      map.set(k, (map.get(k) ?? 0) + 1);
    });
    return map;
  }, [filteredPoints]);

  return (
    <div className="radar-map-wrapper">
      <MapContainer
        center={[-22.5, -49.5]}
        zoom={8}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapResizer />
        <FitBoundsController points={filteredPoints} />
        <MapEventHandler onZoom={setZoom} onMapClick={() => onSelectPoint(null)} />

        {filteredPoints.map((point, idx) => {
          const cfg = getConfig(point.concessionaria);
          const icon = getCachedIcon(point);
          const isSelected = selectedPoint?.id === point.id;

          return (
            <Marker
              key={`${point.id ?? idx}-${point.concessionaria}-${isSelected}`}
              position={[point.latitude!, point.longitude!]}
              icon={icon}
              zIndexOffset={isSelected ? 2000 : 0}
              eventHandlers={{ click: () => onSelectPoint(point) }}
            >
              <Popup maxWidth={240} className="radar-popup">
                <PopupContent point={point} cfg={cfg} />
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <MapHUD count={filteredPoints.length} stats={stats} />
    </div>
  );
}

// ─── Popup Content ────────────────────────────────────────────────────────────
function PopupContent({ point, cfg }: { point: RadarLocationDTO; cfg: ConcessionariaConfig }) {
  return (
    <div style={{ fontFamily: TOKENS.fontSans, color: TOKENS.text }}>
      <div
        style={{
          background: `linear-gradient(135deg, ${cfg.color}22, ${cfg.color}11)`,
          borderBottom: `1px solid ${cfg.color}33`,
          padding: '12px 14px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {cfg.logo ? (
          <img 
            src={cfg.logo} 
            alt={cfg.label} 
            style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover', background: 'white', border: `1px solid ${cfg.color}44`, flexShrink: 0 }}
          />
        ) : (
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, borderRadius: '50%', background: cfg.color, fontFamily: TOKENS.fontMono, fontWeight: 700, fontSize: 8, color: 'white', flexShrink: 0 }}>
            {cfg.abbr}
          </span>
        )}
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, color: TOKENS.text }}>{cfg.label}</div>
          {point.rodovia && (
            <div style={{ fontFamily: TOKENS.fontMono, fontSize: 10, color: cfg.color, marginTop: 1 }}>
              {point.rodovia}{point.km ? ` · km ${point.km}` : ''}
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: '10px 14px 12px', display: 'grid', gap: 6 }}>
        {point.praca && <DataRow icon="🏢" label="Praça" value={point.praca} valueColor={TOKENS.text} />}
        <DataRow
          icon="📍"
          label="Coordenadas"
          value={`${point.latitude!.toFixed(5)}, ${point.longitude!.toFixed(5)}`}
          valueColor={TOKENS.textMuted}
          mono
        />        
      </div>
    </div>
  );
}

function DataRow({ icon, label, value, valueColor, mono }: { icon: string; label: string; value: string; valueColor: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
      <span style={{ fontSize: 11, flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 9, color: TOKENS.textSubtle, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 1 }}>{label}</div>
        <div style={{ fontSize: 11, color: valueColor, fontFamily: mono ? TOKENS.fontMono : TOKENS.fontSans, fontWeight: mono ? 400 : 500, lineHeight: 1.4 }}>{value}</div>
      </div>
    </div>
  );
}

// ─── HUD Overlay ─────────────────────────────────────────────────────────────
function MapHUD({ count, stats }: { count: number; stats: Map<string, number> }) {
  return (
    <>
      <div style={{ position: 'absolute', top: 14, left: 14, zIndex: 1000, background: TOKENS.bgCard, border: `1px solid ${TOKENS.border}`, borderRadius: TOKENS.radius, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: TOKENS.shadowSm, backdropFilter: 'blur(12px)', fontFamily: TOKENS.fontSans }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 0 3px rgba(34,197,94,0.2)', animation: 'radar-pulse 2s ease-in-out infinite', flexShrink: 0 }} />
        <span style={{ color: TOKENS.textMuted, fontSize: 11, fontWeight: 500 }}>RADARES</span>
        <span style={{ color: TOKENS.text, fontFamily: TOKENS.fontMono, fontWeight: 700, fontSize: 15 }}>{count.toLocaleString('pt-BR')}</span>
      </div>
      {stats.size > 0 && (
        <div style={{ position: 'absolute', bottom: 24, right: 14, zIndex: 1000, background: TOKENS.bgCard, border: `1px solid ${TOKENS.border}`, borderRadius: TOKENS.radius, padding: '10px 14px', boxShadow: TOKENS.shadowSm, backdropFilter: 'blur(12px)', fontFamily: TOKENS.fontSans, minWidth: 150 }}>
          <div style={{ fontSize: 9, color: TOKENS.textSubtle, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 }}>Concessionárias</div>
          <div style={{ display: 'grid', gap: 5 }}>
            {Array.from(stats.entries()).map(([key, cnt]) => {
              const cfg = getConfig(key);
              return (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {cfg.logo ? (
                    <img src={cfg.logo} alt={cfg.label} style={{ width: 14, height: 14, borderRadius: '3px', objectFit: 'cover', background: 'white', border: `1px solid ${cfg.color}33`, flexShrink: 0 }} />
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 14, height: 14, borderRadius: 3, background: `${cfg.color}22`, border: `1px solid ${cfg.color}55`, fontFamily: TOKENS.fontMono, fontWeight: 700, fontSize: 7, color: cfg.color, flexShrink: 0 }}>{cfg.abbr}</span>
                  )}
                  <span style={{ fontSize: 11, color: TOKENS.textMuted, flex: 1 }}>{cfg.label}</span>
                  <span style={{ fontSize: 11, color: TOKENS.text, fontFamily: TOKENS.fontMono, fontWeight: 600 }}>{cnt}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <style>{`
        @keyframes radar-pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 3px rgba(34,197,94,0.2); }
          50% { opacity: 0.7; box-shadow: 0 0 0 5px rgba(34,197,94,0.08); }
        }
      `}</style>
    </>
  );
}