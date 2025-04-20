import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PageContainer } from '@/components/layout/PageContainer';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, MapPin, Calendar, Edit, Trash, Share2 } from 'lucide-react';
import { ShareTripDialog } from '@/components/trips/ShareTripDialog';
import TripChatButton from '@/components/chat/TripChatButton';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface Trip {
  id: string;
  nome: string;
  local: string;
  datain: string;
  dataout: string;
  created_at: string;
}

import type { Database } from '@/integrations/supabase/types';

// Formata uma data ISO (yyyy-mm-dd) para o formato brasileiro (dd/mm/yyyy)
function formatDateBR(dateStr?: string) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return dateStr;
  return `${day}/${month}/${year}`;
}

// Formata para dd/mm/aa
function formatDateShort(dateStr?: string) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return dateStr;
  return `${day}/${month}/${year.slice(2)}`;
}

interface TripsProps {
  compact?: boolean;
}

import { WorldClock } from '@/components/WorldClock';

const Trips: React.FC<TripsProps> = ({ compact = false }) => {
  const { user } = useAuth();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [otherUserIdForSelectedTrip, setOtherUserIdForSelectedTrip] = useState<string | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchOtherUserId = async () => {
      if (!selectedTripId || !user?.id) {
        setOtherUserIdForSelectedTrip(null);
        return;
      }
      const { data, error } = await supabase
        .from('trip_shares')
        .select('inviter_id, invitee_id, status')
        .eq('trip_id', selectedTripId)
        .eq('status', 'accepted');
      if (error || !data || data.length === 0) {
        setOtherUserIdForSelectedTrip(null);
        return;
      }
      const share = data.find(
        (row: Database['public']['Tables']['trip_shares']['Row']) =>
          row.inviter_id === user.id || row.invitee_id === user.id
      );
      if (!share) {
        setOtherUserIdForSelectedTrip(null);
        return;
      }
      const otherId = share.inviter_id === user.id ? share.invitee_id : share.inviter_id;
      setOtherUserIdForSelectedTrip(otherId);
    };
    fetchOtherUserId();
  }, [selectedTripId, user]);

  const [newTrip, setNewTrip] = useState({ nome: '', local: '', datain: '', dataout: '' });
  const [showNewTripFields, setShowNewTripFields] = useState(false);
  const [deleteDialogId, setDeleteDialogId] = useState<string|null>(null);
  const [editTripId, setEditTripId] = useState<string|null>(null);
  const [editTrip, setEditTrip] = useState({ nome: '', local: '', datain: '', dataout: '' });

  const handleDeleteTrip = async (tripId: string) => {
    await supabase.from('trip').delete().eq('id', tripId);
    setDeleteDialogId(null);
    queryClient.invalidateQueries({ queryKey: ['trips'] });
    localStorage.removeItem('selectedTripId');
    navigate('/trips');
  };

  const handleEditTrip = async () => {
    if (!editTripId) return;
    await supabase.from('trip').update(editTrip).eq('id', editTripId);
    setEditTripId(null);
    queryClient.invalidateQueries({ queryKey: ['trips'] });
  };

  const { data: trips = [], isLoading } = useQuery({
    queryKey: ['trips', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data: ownTrips, error: ownErr } = await supabase.from('trip').select('*').eq('user_id', user.id);
      if (ownErr) throw ownErr;
      const { data: sharedRows, error: sharedErr } = await supabase
        .from('trip_shares')
        .select('trip(*)')
        .or(`inviter_id.eq.${user.id},invitee_id.eq.${user.id}`)
        .eq('status', 'accepted');
      if (sharedErr) throw sharedErr;
      const sharedTrips = (sharedRows || []).map((row: any) => row.trip).filter(Boolean);
      const allTrips = [...(ownTrips || []), ...sharedTrips];
      const uniqueTrips = allTrips.filter((trip, idx, arr) => arr.findIndex(t => t.id === trip.id) === idx);
      uniqueTrips.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return uniqueTrips;
    },
    enabled: !!user?.id,
  });

  const createTripMutation = useMutation({
    mutationFn: async (trip: typeof newTrip) => {
      const { data, error } = await supabase.from('trip').insert([
        { ...trip, user_id: user?.id }
      ]).select();
      if (error) throw error;
      return data ? data[0] : null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      setNewTrip({ nome: '', local: '', datain: '', dataout: '' });
    }
  });

  const handleSelectTrip = (tripId: string) => {
    navigate(`/points?tripId=${tripId}`);
  };

  const handleCreateTrip = async () => {
    if (!newTrip.nome || !newTrip.local || !newTrip.datain || !newTrip.dataout) return;
    await createTripMutation.mutateAsync(newTrip);
    setNewTrip({ nome: '', local: '', datain: '', dataout: '' });
    setShowNewTripFields(false);
    setShowConfetti(true);
    import('canvas-confetti').then(confetti => {
      confetti.default({
        particleCount: 200,
        spread: 90,
        origin: { y: 0.7 }
      });
    });
    setTimeout(() => setShowConfetti(false), 2500);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-[400px]">
      <span className="ml-2">Carregando viagens...</span>
    </div>;
  }

  return (
    <PageContainer>
      <WorldClock />
      <div>
        <div className={`${compact ? 'py-4 px-2 mt-6' : 'py-8 px-4 mt-16'} w-full`}>
          <h1 className="text-xl md:text-2xl mb-4 font-bold text-travel-blue font-['Lexend']">Minhas Viagens</h1>


          {showNewTripFields && (
            <form
              className="mb-8 max-w-3xl w-full mx-auto bg-white rounded-lg border border-travel-mustard p-4 flex flex-col gap-2 shadow-lg"
              onSubmit={async e => { e.preventDefault(); await handleCreateTrip(); }}
              style={{ gridColumn: '1/-1' }}
            >
              <Input placeholder="Nome da viagem" value={newTrip.nome} onChange={e => setNewTrip({ ...newTrip, nome: e.target.value })} required />
              <Input placeholder="Local" value={newTrip.local} onChange={e => setNewTrip({ ...newTrip, local: e.target.value })} required />
              <div className="flex gap-2">
                <Input type="date" value={newTrip.datain} onChange={e => setNewTrip({ ...newTrip, datain: e.target.value })} required />
                <Input type="date" value={newTrip.dataout} onChange={e => setNewTrip({ ...newTrip, dataout: e.target.value })} required />
              </div>
              <div className="flex gap-2 mt-2 justify-end">
                <Button type="submit" className="bg-travel-mustard text-travel-dark">Salvar</Button>
                <Button type="button" variant="outline" onClick={() => setShowNewTripFields(false)}>Cancelar</Button>
              </div>
            </form>
          )}
          <div className={`grid ${compact ? 'gap-2' : 'gap-6'} grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4`}>
            {trips.map(trip => (
              <Card
                key={trip.id}
                className={`hover:shadow-lg cursor-pointer transition ${compact ? 'p-2' : 'p-4'} bg-white rounded-lg border border-travel-beige flex flex-col max-w-4xl w-full min-w-[320px] md:w-[480px] lg:w-[520px] xl:w-[600px] mx-auto`}
                style={{ minWidth: 0 }}
                onClick={() => handleSelectTrip(trip.id)}
              >
                <CardHeader
                  className={`flex flex-col items-center justify-center text-center py-1 px-2 gap-1 mb-0 pb-0`}
                  style={{ minWidth: 0 }}
                >
                  <span className={`text-base md:text-lg font-bold text-travel-blue font-['Lexend'] truncate w-full`} title={trip.nome}>{trip.nome}</span>
                  {trip.user_id && user?.id && trip.user_id !== user.id && (
                    <span className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 font-semibold rounded mb-1">Viagem compartilhada</span>
                  )}
                  <span className="flex items-center gap-2 text-travel-dark/80 text-base justify-center w-full">
                    <MapPin className="text-pink-500 w-5 h-5" />
                    {trip.local}
                  </span>
                  <span className="flex flex-wrap items-center gap-1 text-xs sm:text-sm text-travel-dark/80 min-w-0 max-w-2xl overflow-visible justify-center w-full">
  <span className="whitespace-nowrap max-w-xl overflow-visible flex items-center gap-2">De: <span className="caricature-date font-bold text-travel-green text-base sm:text-lg px-2 py-1">{formatDateShort(trip.datain)}</span> até <span className="caricature-date font-bold text-travel-red text-base sm:text-lg px-2 py-1">{formatDateShort(trip.dataout)}</span></span>
</span>
                  <div className="flex gap-2 mt-2 justify-center w-full">
                    <Button
                      variant="ghost"
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap h-10 w-10 md:h-12 md:w-12 hover:bg-accent hover:text-accent-foreground"
                      onClick={e => {
                        e.stopPropagation();
                        setEditTripId(trip.id);
                        setEditTrip({ nome: trip.nome, local: trip.local, datain: trip.datain, dataout: trip.dataout });
                      }}
                      title="Editar"
                    >
                      <Edit className="w-5 h-5 md:w-6 md:h-6 text-travel-blue" />
                    </Button>

                    <Dialog open={deleteDialogId === trip.id} onOpenChange={open => { if (!open) setDeleteDialogId(null); }}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          className="inline-flex items-center justify-center gap-2 whitespace-nowrap h-10 w-10 md:h-12 md:w-12 hover:bg-accent hover:text-accent-foreground"
                          onClick={e => {
                            e.stopPropagation();
                            setDeleteDialogId(trip.id);
                          }}
                          title="Excluir"
                        >
                          <Trash className="w-6 h-6 text-travel-red" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Confirmar exclusão</DialogTitle>
                        </DialogHeader>
                        <p>Tem certeza que deseja excluir a viagem "{trip.nome}"?</p>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setDeleteDialogId(null)}>Cancelar</Button>
                          <Button className="bg-travel-red text-white hover:bg-travel-red/80" onClick={() => handleDeleteTrip(trip.id)}>Excluir</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                {editTripId === trip.id ? (
                    <form className="flex flex-col gap-3 bg-white/80 p-4 rounded-xl border-2 border-travel-mustard" onClick={e => e.stopPropagation()} onSubmit={e => { e.preventDefault(); handleEditTrip(); }}>
                      <Input placeholder="Nome da viagem" value={editTrip.nome} onChange={e => setEditTrip({ ...editTrip, nome: e.target.value })} />
                      <Input placeholder="Local" value={editTrip.local} onChange={e => setEditTrip({ ...editTrip, local: e.target.value })} />
                      <div className="flex gap-2">
                        <Input type="date" value={editTrip.datain} onChange={e => setEditTrip({ ...editTrip, datain: e.target.value })} />
                        <Input type="date" value={editTrip.dataout} onChange={e => setEditTrip({ ...editTrip, dataout: e.target.value })} />
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Button type="submit" className="bg-travel-mustard text-travel-dark">Salvar</Button>
                        <Button type="button" variant="outline" onClick={e => { e.stopPropagation(); setEditTripId(null); localStorage.removeItem('selectedTripId'); navigate('/trips'); }}>Cancelar</Button>
                      </div>
                    </form>
                  ) : null}
              </Card>
            ))}
          </div>
        </div>
        {/* Botão flutuante FAB para adicionar viagem */}
        <Button
          onClick={() => setShowNewTripFields(true)}
          className="fixed bottom-6 right-6 z-50 bg-travel-mustard hover:bg-travel-mustard/80 text-travel-dark p-2 h-12 w-12 flex items-center justify-center rounded-full shadow-md"
          aria-label="Adicionar viagem"
        >
          <Plus className="h-6 w-6" />
        </Button>
        <ShareTripDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          tripId={selectedTripId}
        />
        {selectedTripId && user && otherUserIdForSelectedTrip && (
          <TripChatButton 
            tripId={selectedTripId} 
            otherUserId={otherUserIdForSelectedTrip} 
          />
        )}
      </div>
    </PageContainer>
  );
};

export default Trips;
