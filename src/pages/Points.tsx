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
    newPoint,
    setNewPoint,
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
      <div>
        <div className="flex items-center mb-2">
          <button
            onClick={() => pointsHook.navigate('/trips')}
            className="mr-2 text-travel-blue hover:text-travel-dark flex items-center"
            title="Sair da viagem"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left w-6 h-6"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          </button>
        </div>
        <h1 className="text-xl md:text-2xl mb-1 font-bold text-travel-blue font-['Lexend']">Meus Pontos</h1>
        <div className="text-sm sm:text-base text-travel-dark/80 mb-6">Gerencie seus pontos de interesse, locais visitados e experiências da sua viagem.</div>
        <div className="mb-6 flex flex-row gap-6 items-start">
        {/* Coluna esquerda com botões de ação global */}
        {/* Floating Action Button */}
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-travel-mustard hover:bg-travel-mustard/80 text-travel-dark p-2 h-12 w-12 flex items-center justify-center rounded-full shadow-md"
          aria-label="Adicionar Ponto"
        >
          <PlusCircle className="h-6 w-6" />
        </Button>
         <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
           <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
             <DialogHeader>
               <DialogTitle>Adicionar Novo Ponto de Interesse</DialogTitle>
             </DialogHeader>
             {/* Wizard de duas etapas */}
             <>
               <div className="grid gap-4 py-4">
                 {stepAddPoint === 1 && (
                   <>
                     <div className="grid gap-2">
                       <Label htmlFor="name">Nome</Label>
                       <Input id="name" value={newPoint.name} onChange={e => setNewPoint({
                         ...newPoint,
                         name: e.target.value
                       })} placeholder="ex., Torre Eiffel" className="w-full" />
                     </div>
                     <div className="grid gap-2">
                       <Label htmlFor="address">Endereço</Label>
                       <Input id="address" value={newPoint.address} onChange={e => setNewPoint({
                         ...newPoint,
                         address: e.target.value
                       })} placeholder="Endereço completo" className="w-full" />
                     </div>
                     <div className="grid gap-2">
                       <Label htmlFor="plannedVisitDate">Data da Visita Planejada (opcional)</Label>
                       <Popover>
                         <PopoverTrigger asChild>
                           <Button id="plannedVisitDate" variant="outline" className="w-full flex justify-start text-left font-normal h-10">
                             <Calendar className="mr-2 h-4 w-4" />
                             {date ? format(date, 'PPP', {
                               locale: ptBR
                             }) : <span className="text-muted-foreground">Escolha uma data</span>}
                           </Button>
                         </PopoverTrigger>
                         <PopoverContent className="w-auto p-0" align="start">
                           <CalendarComponent mode="single" selected={date} onSelect={setDate} initialFocus locale={ptBR} className="p-3 pointer-events-auto" />
                         </PopoverContent>
                       </Popover>
                     </div>
                     <div className="grid gap-2">
                       <Label htmlFor="type">Tipo</Label>
                       <Select value={newPoint.type} onValueChange={value => setNewPoint({
                         ...newPoint,
                         type: value as Point['type']
                       })}>
                         <SelectTrigger className="w-full">
                           <SelectValue placeholder="Selecione o tipo" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="tourist">Atração Turística</SelectItem>
                           <SelectItem value="shopping">Compras</SelectItem>
                           <SelectItem value="restaurant">Restaurante</SelectItem>
                           <SelectItem value="accommodation">Hospedagem</SelectItem>
                           <SelectItem value="other">Outro</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                   </>
                 )}
                 {stepAddPoint === 2 && (
                   <>
                     <div className="grid gap-2">
                       <Label htmlFor="description">Descrição</Label>
                       <Textarea id="description" value={newPoint.description} onChange={e => setNewPoint({
                         ...newPoint,
                         description: e.target.value
                       })} placeholder="Breve descrição deste lugar..." className="w-full" />
                     </div>
                     <div className="grid gap-2">
                       <Label htmlFor="googleMapsUrl">URL do Google Maps (opcional)</Label>
                       <Input id="googleMapsUrl" value={newPoint.googleMapsUrl || ''} onChange={e => setNewPoint({
                         ...newPoint,
                         googleMapsUrl: e.target.value
                       })} placeholder="https://maps.google.com/..." className="w-full" />
                     </div>
                     <OpeningHoursInput value={newPoint.openingHours || ''} onChange={value => setNewPoint({
                       ...newPoint,
                       openingHours: value
                     })} />
                     <div className="grid gap-2">
                       <Label htmlFor="imageUrl">URL da Imagem (opcional)</Label>
                       <Input id="imageUrl" value={newPoint.imageUrl || ''} onChange={e => setNewPoint({
                         ...newPoint,
                         imageUrl: e.target.value
                       })} placeholder="https://exemplo.com/imagem.jpg" className="w-full" />
                     </div>
                   </>
                 )}
               </div>
               <div className="flex justify-end gap-2">
                 <Button variant="outline" onClick={() => {
                   resetForm();
                   setIsAddDialogOpen(false);
                   setStepAddPoint(1);
                 }} className="w-24 sm:w-28">
                   Cancelar
                 </Button>
                 {stepAddPoint === 2 && (
                   <Button variant="secondary" onClick={() => setStepAddPoint(1)} className="w-24 sm:w-28">
                     Voltar
                   </Button>
                 )}
                 {stepAddPoint === 1 && (
                   <Button onClick={() => setStepAddPoint(2)} className="w-24 sm:w-28 bg-travel-mustard/80">
                     Próximo
                   </Button>
                 )}
                 {stepAddPoint === 2 && (
                   <Button className="bg-travel-mustard hover:bg-travel-mustard/80 text-travel-dark w-24 sm:w-28" onClick={handleAddPoint} disabled={pointsHook.isAddingPoint}>
                     {pointsHook.isAddingPoint ? <>
                         <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                         Adicionando...
                       </> : "Adicionar"}
                   </Button>
                 )}
               </div>
             </>
           </DialogContent>
         </Dialog>
        </div>
        <div className="flex-1 ml-6">

        </div>
        
        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Ponto de Interesse</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Nome</Label>
                <Input id="edit-name" value={newPoint.name} onChange={e => setNewPoint({
                ...newPoint,
                name: e.target.value
              })} placeholder="ex., Torre Eiffel" className="w-full" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Descrição</Label>
                <Textarea id="edit-description" value={newPoint.description} onChange={e => setNewPoint({
                ...newPoint,
                description: e.target.value
              })} placeholder="Breve descrição deste lugar..." className="w-full" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-address">Endereço</Label>
                <Input id="edit-address" value={newPoint.address} onChange={e => setNewPoint({
                ...newPoint,
                address: e.target.value
              })} placeholder="Endereço completo" className="w-full" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-googleMapsUrl">URL do Google Maps (opcional)</Label>
                <Input id="edit-googleMapsUrl" value={newPoint.googleMapsUrl || ''} onChange={e => setNewPoint({
                ...newPoint,
                googleMapsUrl: e.target.value
              })} placeholder="https://maps.google.com/..." className="w-full" />
              </div>
              
              <OpeningHoursInput value={newPoint.openingHours || ''} onChange={value => setNewPoint({
              ...newPoint,
              openingHours: value
            })} />
              
              <div className="grid gap-2">
                <Label htmlFor="edit-plannedVisitDate">Data da Visita Planejada (opcional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button id="edit-plannedVisitDate" variant="outline" className="w-full flex justify-start text-left font-normal h-10">
                      <Calendar className="mr-2 h-4 w-4" />
                      {date ? format(date, 'PPP', {
                      locale: ptBR
                    }) : <span className="text-muted-foreground">Escolha uma data</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent mode="single" selected={date} onSelect={setDate} initialFocus locale={ptBR} className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-type">Tipo</Label>
                <Select value={newPoint.type} onValueChange={value => setNewPoint({
                ...newPoint,
                type: value as Point['type']
              })}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tourist">Atração Turística</SelectItem>
                    <SelectItem value="shopping">Compras</SelectItem>
                    <SelectItem value="restaurant">Restaurante</SelectItem>
                    <SelectItem value="accommodation">Hospedagem</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-imageUrl">URL da Imagem (opcional)</Label>
                <Input id="edit-imageUrl" value={newPoint.imageUrl || ''} onChange={e => setNewPoint({
                ...newPoint,
                imageUrl: e.target.value
              })} placeholder="https://exemplo.com/imagem.jpg" className="w-full" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
              resetForm();
              setEditPointId(null);
              setIsEditDialogOpen(false);
            }} className="w-24 sm:w-28">
                Cancelar
              </Button>
              <Button className="bg-travel-mustard hover:bg-travel-mustard/80 text-travel-dark w-24 sm:w-28" onClick={handleUpdatePoint} disabled={pointsHook.isUpdatingPoint}>
                {pointsHook.isUpdatingPoint ? <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Atualizando...
                  </> : "Atualizar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
              {point.image_url && <ImageWithShimmer src={point.image_url} alt={point.name} onClick={() => handleOpenDetails(point)} />}

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
      horarios = match[3];
    } else {
      dias = part;
    }
    return (
      <span key={idx} style={{ background: yellows[Math.min(idx, yellows.length - 1)], color: "#7C5E00", borderRadius: 4, padding: "1px 6px", fontWeight: 500, marginBottom: 2, display: "block" }}>
        {dias}{horarios ? `: ${horarios}` : ""}
      </span>
    );
  });
}

export default Points;