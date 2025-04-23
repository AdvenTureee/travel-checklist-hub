import React from 'react';
import { usePoints } from './usePoints';
import { PageContainer } from '@/components/layout/PageContainer';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, MapPin, Edit, Trash, Loader2, ExternalLink, Globe, Clock, Calendar, Share2 } from 'lucide-react';
import { Point } from '@/lib/types';
import { toast, useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PointDetailsModal from '@/components/points/PointDetailsModal';
import { AddPointDialog } from '@/components/points/AddPointDialog';
import { SharePointDialog } from '@/components/points/SharePointDialog';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { format, parse } from 'date-fns';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import OpeningHoursInput from '@/components/points/OpeningHoursInput';
import { ptBR } from 'date-fns/locale';
import { useLocation, useNavigate } from 'react-router-dom';
import { ImageWithShimmer } from '../components/ImageWithShimmer';

const Points: React.FC = () => {
  const pointsHook = usePoints();
  // Estado do wizard de criação de ponto
  const [stepAddPoint, setStepAddPoint] = React.useState(1);
  // Toda a lógica de estado e handlers foi movida para o hook usePoints
  const {
    user,
    tripId,
    hasTripAccess,
    isShareDialogOpen,
    setIsShareDialogOpen,
    sharePointId,
    setSharePointId,
    isAddDialogOpen,
    setIsAddDialogOpen,
    isEditDialogOpen,
    setIsEditDialogOpen,
    editPointId,
    setEditPointId,
    selectedPoint,
    setSelectedPoint,
    isDetailsModalOpen,
    setIsDetailsModalOpen,
    date,
    setDate,
    points,
    isLoading,
    getPointTypeName,
    handleAddPoint,
    handleDeletePoint,
    handleEditPoint,
    handleOpenDetails,
    handleUpdatePoint,
    resetForm
  } = pointsHook;

  // Show loading state
  if (isLoading) {
    return <PageContainer>
        <div className="flex justify-center items-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-travel-blue" />
          <span className="ml-2">Carregando pontos...</span>
        </div>
      </PageContainer>
  }
  return (
    <PageContainer>
      {/* Modal de adicionar/editar ponto */}
      <AddPointDialog
        open={isAddDialogOpen || isEditDialogOpen}
        onOpenChange={open => {
          if (isAddDialogOpen) setIsAddDialogOpen(open);
          if (isEditDialogOpen) setIsEditDialogOpen(open);
        }}
        name={pointsHook.newPoint.name || ''}
        address={pointsHook.newPoint.address || ''}
        description={pointsHook.newPoint.description || ''}
        imageFile={pointsHook.newPoint.imageFile || null}
        setName={val => pointsHook.setNewPoint({ ...pointsHook.newPoint, name: val })}
        setAddress={val => pointsHook.setNewPoint({ ...pointsHook.newPoint, address: val })}
        setDescription={val => pointsHook.setNewPoint({ ...pointsHook.newPoint, description: val })}
        setImageFile={file => pointsHook.setNewPoint({ ...pointsHook.newPoint, imageFile: file })}
        type={pointsHook.newPoint.type || 'tourist'}
        setType={val => {
  const allowedTypes = ['tourist', 'shopping', 'restaurant', 'accommodation', 'other'] as const;
  if (allowedTypes.includes(val as typeof allowedTypes[number])) {
    pointsHook.setNewPoint({ ...pointsHook.newPoint, type: val as typeof allowedTypes[number] });
  }
}}
        imageUrl={pointsHook.newPoint.imageUrl || ''}
        setImageUrl={val => pointsHook.setNewPoint({ ...pointsHook.newPoint, imageUrl: val })}
        googleMapsUrl={pointsHook.newPoint.googleMapsUrl || ''}
        setGoogleMapsUrl={val => pointsHook.setNewPoint({ ...pointsHook.newPoint, googleMapsUrl: val })}
        openingHours={pointsHook.newPoint.openingHours || {}}
        setOpeningHours={val => pointsHook.setNewPoint({ ...pointsHook.newPoint, openingHours: val })}
        plannedVisitDate={pointsHook.newPoint.plannedVisitDate || ''}
        setPlannedVisitDate={val => pointsHook.setNewPoint({ ...pointsHook.newPoint, plannedVisitDate: val })}
        loading={pointsHook.isAddingPoint}
        error={pointsHook.addPointError}
        onSubmit={isEditDialogOpen ? pointsHook.handleUpdatePoint : pointsHook.handleAddPoint}
      />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-travel-blue">Meus Pontos</h1>
        <Button
          className="bg-travel-mustard text-travel-dark flex items-center gap-2"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <PlusCircle className="w-5 h-5" />
          Novo ponto
        </Button>
      </div>
      {points.length === 0 ? <div className="flex flex-col items-center justify-center h-[400px] bg-travel-beige/50 rounded-lg border border-travel-mustard/20">
          <MapPin className="h-16 w-16 text-travel-mustard/50 mb-4" />
          <h3 className="text-xl font-medium text-travel-dark">Nenhum ponto adicionado ainda</h3>
          <p className="text-travel-dark/70 mb-4">Comece a adicionar seus lugares e destinos favoritos</p>
          <Button className="bg-travel-mustard hover:bg-travel-mustard/80 text-travel-dark" onClick={() => setIsAddDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicione Seu Primeiro Ponto
          </Button>
        </div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {points.map(point => <Card key={point.id} className="overflow-hidden card-hover border border-travel-mustard transition-transform duration-150 active:scale-95 cursor-pointer">
              {point.image_url && (
  <div className="relative group cursor-pointer" onClick={() => handleOpenDetails(point)}>
    <ImageWithShimmer src={point.image_url} alt={point.name} />
    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center z-10">
      <MapPin className="h-8 w-8 text-travel-mustard mb-2 animate-bounce" />
      <span className="text-white font-semibold text-base drop-shadow">Ver no mapa</span>
    </div>
  </div>
)}

              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{point.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {new Date(point.created_at).toLocaleDateString('pt-BR')}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditPoint(point.id)}>
                      <Edit className="h-4 w-4 text-travel-blue" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeletePoint(point.id)}>
                      <Trash className="h-4 w-4 text-travel-red" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-travel-dark/80 mb-4">{point.description}</p>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-travel-blue mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-travel-dark/70">{point.address}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 ml-1 text-travel-mustard hover:bg-travel-mustard/10"
                    title="Copiar endereço"
                    onClick={() => {
                      navigator.clipboard.writeText(point.address);
                      toast({
                        title: 'Endereço copiado!',
                        description: point.address,
                        duration: 2000
                      });
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <rect x="9" y="9" width="13" height="13" rx="2" className="fill-current text-travel-mustard/20" />
                      <rect x="3" y="3" width="13" height="13" rx="2" className="stroke-current text-travel-mustard" />
                    </svg>
                  </Button>
                </div>
                
                {/* Opening Hours */}
                {(point.opening_hours || point.openingHours) && <div className="flex items-start gap-2 mt-2">
                    <Clock className="h-4 w-4 text-travel-blue mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-travel-dark/70 flex flex-col gap-1">
                      {formatOpeningHours(point.opening_hours || point.openingHours)}
                    </div>
                  </div>}
                
                {/* Google Maps link moved to the end, icon removed */}
                
                {/* Planned Visit Date */}
                {(point.planned_visit_date || point.plannedVisitDate) && <div className="flex items-start gap-2 mt-2">
                    <Calendar className="h-4 w-4 text-travel-blue mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-travel-dark/70">
                      Visita planejada: {format(
  parse(point.planned_visit_date || point.plannedVisitDate!, 'yyyy-MM-dd', new Date()),
  'PPP',
  { locale: ptBR }
)}
                    </span>
                  </div>}
                
                {/* Google Maps link at the end */}
                {point.google_maps_url && (
                  <div className="flex items-start gap-2 mt-6">
                    <a href={point.google_maps_url} target="_blank" rel="noopener noreferrer" className="caricature-date">
                      Google Maps
                    </a>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <div className="w-full flex justify-between items-center">
                  <span className="inline-block text-xs px-2 py-1 rounded-full bg-travel-light-blue text-travel-blue">
                    {getPointTypeName(point.type)}
                  </span>
                  
                </div>
              </CardFooter>
            </Card>)}
        </div>}

      {/* Dialog de Compartilhamento */}
      <SharePointDialog
        open={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
        pointId={sharePointId ?? ''}
      />
      {/* Details Modal */}
      <PointDetailsModal point={selectedPoint} isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} />
    </PageContainer>
  );
};

// Exibe horários de funcionamento em português, cada um em linha separada e com amarelo progressivo
function formatOpeningHours(hours: string = ""): JSX.Element[] {
  if (!hours) return [];
  const dayMap: Record<string, string> = {
    Mon: "Seg",
    Tue: "Ter",
    Wed: "Qua",
    Thu: "Qui",
    Fri: "Sex",
    Sat: "Sáb",
    Sun: "Dom"
  };
  const yellows = [
    "#FFF9DB", "#FFF3BF", "#FFEC99", "#FFE066", "#FFD43B", "#FCC419", "#FAB005"
  ];
  function traduzirHorario(h: string) {
    // Ex: 9am-5pm, 10:30am-8pm, 8:15-18:45
    return h.replace(/(\d{1,2})(?::(\d{2}))?\s*([ap]m)?-(\d{1,2})(?::(\d{2}))?\s*([ap]m)?/gi, (_, h1, m1, ampm1, h2, m2, ampm2) => {
      let hora1 = parseInt(h1, 10);
      let hora2 = parseInt(h2, 10);
      let min1 = m1 || "00";
      let min2 = m2 || "00";
      if (ampm1?.toLowerCase() === "pm" && hora1 < 12) hora1 += 12;
      if (ampm1?.toLowerCase() === "am" && hora1 === 12) hora1 = 0;
      if (ampm2?.toLowerCase() === "pm" && hora2 < 12) hora2 += 12;
      if (ampm2?.toLowerCase() === "am" && hora2 === 12) hora2 = 0;
      return `${hora1.toString().padStart(2, "0")}:${min1}–${hora2.toString().padStart(2, "0")}:${min2}`;
    }).replace(/Closed|closed/gi, "Fechado");
  }
  return hours.split(/, ?/).map((part, idx) => {
    const match = part.match(/^(\w{2,3})(-\w{2,3})?: (.+)$/);
    let dias = "";
    let horarios = "";
    if (match) {
      if (match[2]) {
        const diasIniciais = match[1];
        const diasFinais = match[2].substring(1);
        dias = `${dayMap[diasIniciais] || diasIniciais} - ${dayMap[diasFinais] || diasFinais}`;
      } else {
        dias = dayMap[match[1]] || match[1];
      }
      horarios = traduzirHorario(match[3]);
    } else {
      dias = part.replace(/Closed|closed/gi, "Fechado");
    }
    return (
      <span key={idx} style={{ background: yellows[Math.min(idx, yellows.length - 1)], color: "#7C5E00", borderRadius: 4, padding: "1px 6px", fontWeight: 500, marginBottom: 2, display: "block" }}>
        {dias}{horarios ? `: ${horarios}` : ""}
      </span>
    );
  });
}

export default Points;