import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Point } from '@/lib/types';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import type { MarkerProps } from 'react-leaflet';
import { useUserLocation } from './useUserLocation';
import 'leaflet/dist/leaflet.css';
import L, { LatLngTuple, Icon } from 'leaflet';

import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
const DefaultIcon = L.icon({ iconUrl, shadowUrl: iconShadow });
L.Marker.prototype.options.icon = DefaultIcon;

interface FullMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  coords: { lat: number; lon: number } | null;
  point: Point;
}

import { useMap } from 'react-leaflet';

function MapFocus({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  React.useEffect(() => {
    map.setView([lat, lon], 16, { animate: true });
  }, [lat, lon, map]);
  return null;
}

const FullMapModal: React.FC<FullMapModalProps> = ({ isOpen, onClose, coords, point }) => {
  const { location: userLocation, error: userLocationError } = useUserLocation();

  // Calcula centro entre ponto e usuário, se ambos existirem
  let mapCenter: LatLngTuple = coords ? [coords.lat, coords.lon] : [0, 0];
  if (coords && userLocation) {
    mapCenter = [
      (coords.lat + userLocation.lat) / 2,
      (coords.lon + userLocation.lon) / 2
    ];
  }

  // Ícone customizado responsivo do ponto
  function getPointIcon() {
    const isMobile = window.innerWidth < 640;
    return new L.Icon({
      iconUrl: '/custom-marker.svg',
      iconSize: isMobile ? [28, 36] : [36, 48],
      iconAnchor: isMobile ? [14, 36] : [18, 48],
      popupAnchor: [0, -36],
      shadowUrl: undefined,
    });
  }

  // Ícone azul customizado para o usuário (SVG inline)
  function getUserIcon() {
    const isMobile = window.innerWidth < 640;
    const svg = `<svg width="${isMobile ? 28 : 36}" height="${isMobile ? 36 : 48}" viewBox="0 0 36 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g filter=\"url(#shadow)\">
        <path d=\"M18 47C18 47 34 29.5 34 18C34 8.61116 26.3888 1 18 1C9.61116 1 2 8.61116 2 18C2 29.5 18 47 18 47Z\" fill=\"#2563eb\" stroke=\"#1C1B1F\" stroke-width=\"2\"/>
        <circle cx=\"18\" cy=\"18\" r=\"7\" fill=\"#fff\" stroke=\"#1C1B1F\" stroke-width=\"2\"/>
      </g>
      <defs>
        <filter id=\"shadow\" x=\"0\" y=\"0\" width=\"36\" height=\"48\" filterUnits=\"userSpaceOnUse\" color-interpolation-filters=\"sRGB\">
          <feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"2\" flood-color=\"#000\" flood-opacity=\"0.16\"/>
        </filter>
      </defs>
    </svg>`;
    return new L.Icon({
      iconUrl: 'data:image/svg+xml;base64,' + window.btoa(svg),
      iconSize: isMobile ? [28, 36] : [36, 48],
      iconAnchor: isMobile ? [14, 36] : [18, 48],
      popupAnchor: [0, -36],
      shadowUrl: undefined,
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] p-0">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold px-6 pt-6">Mapa completo - {point.name}</DialogTitle>
        </DialogHeader>
        <div className="w-full h-[50vh] sm:h-[60vh] md:h-[70vh] lg:h-[80vh] rounded-lg overflow-hidden px-2 sm:px-4 md:px-6 pb-4 md:pb-6">
          {coords && (
            <MapContainer
              center={mapCenter}
              zoom={16}
              scrollWheelZoom={true}
              style={{ width: '100%', height: '100%' }}
            >
              <MapFocus lat={coords.lat} lon={coords.lon} />
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {/* Marcador do ponto */}
              <Marker position={[coords.lat, coords.lon]} icon={getPointIcon()}>
                <Popup>{point.name}</Popup>
              </Marker>
              {/* Marcador do usuário (azul) */}
              {userLocation && (
                <Marker position={[userLocation.lat, userLocation.lon]} icon={getUserIcon()}>
                  <Popup>Você está aqui</Popup>
                </Marker>
              )}
            </MapContainer>
          )}
          {userLocationError && (
            <div className="text-red-500 text-xs mt-2">{userLocationError}</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FullMapModal;
