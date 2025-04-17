import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, MapPin, Calendar, Edit, Trash, Share2 } from 'lucide-react';
import { ShareTripDialog } from '@/components/trips/ShareTripDialog';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface Trip {
  id: string;
  nome: string;
  local: string;
  datain: string;
  dataout: string;
  created_at: string;
}

const Trips: React.FC = () => {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newTrip, setNewTrip] = useState({ nome: '', local: '', datain: '', dataout: '' });
  const [showNewTripFields, setShowNewTripFields] = useState(false);
  const [deleteDialogId, setDeleteDialogId] = useState<string|null>(null);
  const [editTripId, setEditTripId] = useState<string|null>(null);
  const [editTrip, setEditTrip] = useState({ nome: '', local: '', datain: '', dataout: '' });

  // Função para deletar viagem
  const handleDeleteTrip = async (tripId: string) => {
    await supabase.from('trip').delete().eq('id', tripId);
    setDeleteDialogId(null);
    queryClient.invalidateQueries({ queryKey: ['trips'] });
    localStorage.removeItem('selectedTripId');
    navigate('/trips');
  };

  // Função para editar viagem
  const handleEditTrip = async () => {
    if (!editTripId) return;
    await supabase.from('trip').update(editTrip).eq('id', editTripId);
    setEditTripId(null);
    queryClient.invalidateQueries({ queryKey: ['trips'] });
  };


  // Fetch trips
  const { data: trips = [], isLoading } = useQuery({
    queryKey: ['trips'],
    queryFn: async () => {
      const { data, error } = await supabase.from('trip').select('*').eq('user_id', user?.id).order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Create trip mutation
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

  // Select a trip and redirect
  const handleSelectTrip = (tripId: string) => {
    localStorage.setItem('selectedTripId', tripId);
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
    <>

      <div className="max-w-2xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-4">Minhas Viagens</h1>
      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Nova Viagem</CardTitle>
          </CardHeader>
          <CardContent>
            {showNewTripFields ? (
              <div className="flex flex-col gap-3">
                <Input placeholder="Nome da viagem" value={newTrip.nome} onChange={e => setNewTrip({ ...newTrip, nome: e.target.value })} />
                <Input placeholder="Local" value={newTrip.local} onChange={e => setNewTrip({ ...newTrip, local: e.target.value })} />
                <div className="flex gap-2">
                  <Input type="date" value={newTrip.datain} onChange={e => setNewTrip({ ...newTrip, datain: e.target.value })} />
                  <Input type="date" value={newTrip.dataout} onChange={e => setNewTrip({ ...newTrip, dataout: e.target.value })} />
                </div>
                <Button onClick={handleCreateTrip} disabled={createTripMutation.isPending}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar viagem
                </Button>
              </div>
            ) : (
              <Button onClick={() => setShowNewTripFields(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar viagem
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        {trips.map(trip => (
          <Card key={trip.id} className="hover:shadow-lg cursor-pointer transition" onClick={() => handleSelectTrip(trip.id)}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{trip.nome}</CardTitle>
              <div className="flex gap-2">
                <Button size="icon" variant="ghost" onClick={e => { e.stopPropagation(); setEditTripId(trip.id); setEditTrip({ nome: trip.nome, local: trip.local, datain: trip.datain, dataout: trip.dataout }); }}>
                  <Edit className="w-4 h-4 text-travel-blue" />
                </Button>
                <Button size="icon" variant="ghost" onClick={e => { e.stopPropagation(); setSelectedTripId(trip.id); setShareDialogOpen(true); }}>
                  <Share2 className="w-4 h-4 text-travel-blue" />
                </Button>
                <Dialog open={deleteDialogId === trip.id} onOpenChange={open => { if (!open) setDeleteDialogId(null); }}>
                  <DialogTrigger asChild>
                    <Button size="icon" variant="ghost" onClick={e => { e.stopPropagation(); setDeleteDialogId(trip.id); }}>
                      <Trash className="w-4 h-4 text-travel-red" />
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
            <CardContent>
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
              ) : (
                <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-2 bg-gradient-to-r from-yellow-100 via-pink-100 to-blue-100 rounded-xl p-4 shadow-md border-2 border-travel-mustard animate-pulse hover:animate-none transition">
                  <span className="flex items-center gap-2 text-lg font-semibold text-travel-blue drop-shadow-sm">
                    <MapPin className="text-pink-500 w-5 h-5 animate-bounce" />
                    {trip.local}
                  </span>
                  <span className="flex items-center gap-2 text-md text-travel-dark/80">
                    <Calendar className="text-yellow-600 w-5 h-5 animate-spin-slow" />
                    De: <span className="font-bold text-travel-green">{trip.datain}</span> até <span className="font-bold text-travel-red">{trip.dataout}</span>
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
    <ShareTripDialog
      open={shareDialogOpen}
      onOpenChange={setShareDialogOpen}
      tripId={selectedTripId}
    />
  </>);
};

export default Trips;
