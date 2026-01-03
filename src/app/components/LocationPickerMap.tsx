'use client';

import { MapContainer, TileLayer, Marker, useMapEvents, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useState } from 'react';
import { RadarLocationDTO } from '../types/types';

// Ícone do Radar (azul)
const radarIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Ícone de Seleção do Usuário (vermelho)
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
}

function LocationMarker({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  const map = useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
      // Opcional: Centralizar ao clicar
      // map.flyTo(e.latlng, map.getZoom());
    },
  });
  return null;
}

export default function LocationPickerMap({ onLocationSelect, radarPoints = [] }: LocationPickerMapProps) {
  // Centro aproximado (interior de SP baseado nos dados: Assis/Presidente Prudente)
  const defaultCenter = { lat: -22.12345, lng: -51.38 }; 

  return (
    <MapContainer center={defaultCenter} zoom={8} style={{ height: '320px', width: '100%', zIndex: 0 }}>
      <TileLayer 
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
      />
      
      <LocationMarker onSelect={onLocationSelect} />

      {radarPoints.map((radar) => (
        <Marker 
          key={radar.id} 
          position={[radar.latitude, radar.longitude]}
          icon={radarIcon}
        >
          <Popup>
            <div className="text-sm">
              <strong className="text-[#14213d] block mb-1">{radar.praca}</strong>
              <span className="block">🛣️ {radar.rodovia} - KM {radar.km}</span>
              <span className="block text-gray-500 text-xs mt-1">{radar.concessionaria}</span>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}