
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Point } from '@/lib/types';
import { MapPin, Calendar, Globe, ExternalLink, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PointDetailsModalProps {
  point: Point | null;
  isOpen: boolean;
  onClose: () => void;
}

const PointDetailsModal: React.FC<PointDetailsModalProps> = ({ point, isOpen, onClose }) => {
  if (!point) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="md:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{point.name}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* Image Section */}
          <div className="overflow-hidden rounded-lg">
            {point.image_url ? (
              <img 
                src={point.image_url} 
                alt={point.name} 
                className="w-full h-[300px] object-cover"
              />
            ) : (
              <div className="w-full h-[300px] bg-travel-beige/50 flex items-center justify-center">
                <span className="text-travel-dark/50">Nenhuma imagem disponível</span>
              </div>
            )}
          </div>
          
          {/* Details Section */}
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
                    {point.opening_hours || point.openingHours}
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
  );
};

export default PointDetailsModal;
