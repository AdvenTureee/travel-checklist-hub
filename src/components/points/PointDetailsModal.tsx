
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Point } from '@/lib/types';
import { MapPin, Calendar, Globe, ExternalLink, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import type { MarkerProps } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { LatLngExpression, Icon } from 'leaflet';
import { useGeocode } from './useGeocode';
import { useUserLocation } from './useUserLocation';
import FullMapModal from './FullMapModal';
import { useState } from 'react';
import { formatOpeningHours } from './formatOpeningHours';

// Corrige o ícone padrão do leaflet para funcionar com webpack
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
const DefaultIcon = L.icon({ iconUrl, shadowUrl: iconShadow });
L.Marker.prototype.options.icon = DefaultIcon;


interface PointDetailsModalProps {
  point: Point | null;
  isOpen: boolean;
  onClose: () => void;
}

function MapFocus({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  React.useEffect(() => {
    map.setView([lat, lon], 16, { animate: true });
  }, [lat, lon, map]);
  return null;
}

const PointDetailsModal: React.FC<PointDetailsModalProps> = ({ point, isOpen, onClose }) => {
  const { coords, loading, error } = useGeocode(point?.address);
  const { location: userLocation, error: userLocationError } = useUserLocation();
  const [openFullMap, setOpenFullMap] = useState(false);
  if (!point) return null;

  // Centraliza entre ponto e usuário se ambos existirem
  let mapCenter: LatLngExpression = coords ? [coords.lat, coords.lon] : [0, 0];
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
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="md:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{point.name}</DialogTitle>
          </DialogHeader>

          {/* Mapa em destaque */}
          <div className="w-full h-[250px] sm:h-[300px] md:h-[350px] lg:h-[400px] rounded-lg overflow-hidden mb-3">
            {loading && (
              <div className="flex items-center justify-center h-full">Carregando mapa...</div>
            )}
            {error && (
              <div className="flex items-center justify-center h-full text-red-500">{error}</div>
            )}
            {coords && (
              <MapContainer
                center={mapCenter}
                zoom={16}
                scrollWheelZoom={false}
                style={{ width: '100%', height: '100%' }}
              >
                <MapFocus lat={coords.lat} lon={coords.lon} />
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
          {/* Botão para abrir mapa maior */}
          <div className="flex justify-end mb-6">
            <Button variant="secondary" onClick={() => setOpenFullMap(true)} disabled={!coords}>
              Abrir mapa maior
            </Button>
          </div>

        {/* Painel de informações do ponto */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium text-travel-dark">Descrição</h3>
            <p className="text-travel-dark/80 mt-1">{point.description || "Nenhuma descrição disponível"}</p>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <MapPin className="h-5 w-5 text-travel-blue mt-0.5 flex-shrink-0" />
              <span className="text-travel-dark/70">{point.address}</span>
            </div>
            {(point.opening_hours || point.openingHours) && (
              <div className="flex items-start gap-2">
                <Clock className="h-5 w-5 text-travel-blue mt-0.5 flex-shrink-0" />
                <span className="text-travel-dark/70">
                  {formatOpeningHours(point.opening_hours || point.openingHours)}
                </span>
              </div>
            )}
            {(point.planned_visit_date || point.plannedVisitDate) && (
              <div className="flex items-start gap-2">
                <Calendar className="h-5 w-5 text-travel-blue mt-0.5 flex-shrink-0" />
                <span className="text-travel-dark/70">
                  Visita planejada: {format(new Date(point.planned_visit_date || point.plannedVisitDate!), 'PPP', { locale: ptBR })}
                </span>
              </div>
            )}
            <div className="flex items-start gap-2">
              <Calendar className="h-5 w-5 text-travel-blue mt-0.5 flex-shrink-0" />
              <span className="text-travel-dark/70">
                Adicionado em {new Date(point.created_at).toLocaleDateString('pt-BR')}
              </span>
            </div>
            {(point.googleMapsUrl || point.google_maps_url) && (
              <div className="flex items-start gap-2">
                <Globe className="h-5 w-5 text-travel-blue mt-0.5 flex-shrink-0" />
                <a
                  href={point.googleMapsUrl || point.google_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-travel-blue hover:underline flex items-center"
                >
                  Ver no Google Maps
                  <ExternalLink className="h-4 w-4 ml-1" />
                </a>
              </div>
            )}
          </div>
          <div className="pt-2">
            <span className="inline-block text-sm px-3 py-1 rounded-full bg-travel-light-blue text-travel-blue">
              {point.type ?
                (point.type === 'tourist' ? 'Atração Turística' :
                  point.type === 'shopping' ? 'Compras' :
                  point.type === 'restaurant' ? 'Restaurante' :
                  point.type === 'accommodation' ? 'Hospedagem' : 'Outro')
                : 'Outro'}
            </span>
          </div>
        </div>
        
        <div className="flex justify-end mt-6">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="text-travel-dark"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    {/* Modal de mapa grande */}
    {coords && (
      <FullMapModal
        isOpen={openFullMap}
        onClose={() => setOpenFullMap(false)}
        coords={coords}
        point={point}
      />
    )}
    </>
  );
};

export default PointDetailsModal;
