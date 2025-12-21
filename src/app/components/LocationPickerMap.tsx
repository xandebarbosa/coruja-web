'use client';

import { MapContainer, TileLayer, Marker, useMapEvents, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useState } from 'react';

// Correção para ícones padrão do Leaflet no Next.js
import iconMarker from 'leaflet/dist/images/marker-icon.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconRetinaUrl: iconRetina.src,
    iconUrl: iconMarker.src,
    shadowUrl: iconShadow.src,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface LocationPickerMapProps {
    onLocationSelect: (lat: number, lng: number) => void;
    initialLat?: number;
    initialLng?: number;
}

function LocationMarker({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
    const [position, setPosition] = useState<L.LatLng | null>(null);

    // Hook para capturar cliques no mapa
    useMapEvents({
        click(e) {
            setPosition(e.latlng);
            onSelect(e.latlng.lat, e.latlng.lng);
        },
    });

    return position === null ? null : (
        <Marker position={position}>
            <Popup>Local Selecionado</Popup>
        </Marker>
    );
}

export default function LocationPickerMap({ onLocationSelect, initialLat = -22.12, initialLng = -49.56 }: LocationPickerMapProps) {
    return (
        <MapContainer 
            center={[initialLat, initialLng]} 
            zoom={8} 
            style={{ height: '400px', width: '100%', borderRadius: '0.5rem' }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker onSelect={onLocationSelect} />
        </MapContainer>
    );
}