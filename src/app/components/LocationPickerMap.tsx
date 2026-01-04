'use client';

import { MapContainer, TileLayer, Marker, useMapEvents, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';
import { RadarLocationDTO } from '../types/types';

// Definição dos Ícones
const radarIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const selectedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface LocationPickerMapProps {
  onLocationSelect: (lat: number, lng: number) => void;
  radarPoints?: RadarLocationDTO[];
  searchLocation?: { lat: number; lng: number } | null;
  searchRadius?: number; // em metros
}

// Componente para recentralizar o mapa suavemente
function MapRecenter({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    if (center && center.lat && center.lng) {
      map.setView(center, 13, { animate: true });
    }
  }, [center, map]);
  return null;
}

// Captura cliques no mapa
function LocationMarker({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPickerMap({ 
  onLocationSelect, 
  radarPoints = [], 
  searchLocation,
  searchRadius 
}: LocationPickerMapProps) {
  
  // Centro padrão (Região de Assis/Prudente conforme seu código anterior)
  const defaultCenter = { lat: -22.12345, lng: -51.38 }; 

  // Garante que radarPoints é um array antes de tentar fazer map
  const safePoints = Array.isArray(radarPoints) ? radarPoints : [];

  return (
    <MapContainer 
      center={defaultCenter} // O MapContainer não atualiza center dinamicamente, usamos MapRecenter para isso
      zoom={8} 
      style={{ height: '320px', width: '100%', zIndex: 0 }}
    >
      <TileLayer 
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
      />
      
      <LocationMarker onSelect={onLocationSelect} />

      {/* Recentaliza o mapa se houver busca */}
      {searchLocation && <MapRecenter center={searchLocation} />}

      {/* 1. Raio de Busca */}
      {searchLocation && searchRadius && (
        <Circle 
          center={searchLocation}
          radius={searchRadius}
          pathOptions={{ color: '#fca311', fillColor: '#fca311', fillOpacity: 0.2 }}
        />
      )}

      {/* 2. Marcador da Busca (Vermelho) */}
      {searchLocation && (
        <Marker position={searchLocation} icon={selectedIcon}>
          <Popup>📍 Local Selecionado</Popup>
        </Marker>
      )}

      {/* 3. Marcadores dos Radares (Azuis) */}
      {safePoints.map((radar, index) => {
        // Validação estrita de coordenadas para evitar erros no Leaflet
        if (!radar || typeof radar.latitude !== 'number' || typeof radar.longitude !== 'number') {
            return null;
        }

        return (
          <Marker 
            key={radar.id || `radar-${index}`} // Fallback de key se id for nulo
            position={[radar.latitude, radar.longitude]}
            icon={radarIcon}
          >
            <Popup>
              <div className="text-sm">
                <strong className="text-[#14213d] block mb-1">{radar.praca || 'Sem praça'}</strong>
                <span className="block">🛣️ {radar.rodovia || '-'} - KM {radar.km || '-'}</span>
                <span className="block text-gray-500 text-xs mt-1">{radar.concessionaria || '-'}</span>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}