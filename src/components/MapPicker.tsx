import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix para os ícones do Leaflet que por vezes não carregam corretamente com bundlers como o Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface MapPickerProps {
  initialPosition?: [number, number]; // [lat, lng]
  onLocationSelect: (lat: number, lng: number) => void;
}

const LocationMarker = ({ position, onSelect }: { position: L.LatLng | null, onSelect: (pos: L.LatLng) => void }) => {
  useMapEvents({
    click(e) {
      onSelect(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
};

export const MapPicker: React.FC<MapPickerProps> = ({ initialPosition, onLocationSelect }) => {
  const [position, setPosition] = useState<L.LatLng | null>(
    initialPosition ? L.latLng(initialPosition[0], initialPosition[1]) : null
  );

  // Coordenadas padrão centradas em Portugal
  const defaultCenter: [number, number] = [39.3999, -8.2245];
  const center = position ? [position.lat, position.lng] as [number, number] : defaultCenter;
  const zoom = position ? 15 : 6;

  const handleSelect = (pos: L.LatLng) => {
    setPosition(pos);
    onLocationSelect(pos.lat, pos.lng);
  };

  return (
    <div style={{ width: '100%', height: '300px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', zIndex: 1 }}>
      <MapContainer 
        center={center} 
        zoom={zoom} 
        scrollWheelZoom={true} 
        style={{ width: '100%', height: '100%', zIndex: 1 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker position={position} onSelect={handleSelect} />
      </MapContainer>
    </div>
  );
};
