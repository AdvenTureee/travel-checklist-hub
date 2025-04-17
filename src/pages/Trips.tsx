import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus, MapPin, Calendar } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

interface Trip {
  id: string;
  nome: string;
  local: string;
  datain: string;
  dataout: string;
  created_at: string;
}

const Trips: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newTrip, setNewTrip] = useState({ nome: '', local: '', datain: '', dataout: '' });
  const [showNewTripFields, setShowNewTripFields] = useState(false);

  // Fetch trips
  const { data: trips = [], isLoading } = useQuery<Database['public']['Tables']['trip']['Row'][]>({
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

  const handleCreateTrip = () => {
    if (!newTrip.nome || !newTrip.local || !newTrip.datain || !newTrip.dataout) return;
    createTripMutation.mutate(newTrip);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-travel-blue" />
      <span className="ml-2">Carregando viagens...</span>
    </div>;
  }

  return (
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
            <CardHeader>
              <CardTitle>{trip.nome}</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Trips;
