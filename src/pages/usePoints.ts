import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Point } from '@/lib/types';

export function usePoints() {
  const { user } = useAuth();
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [hasTripAccess, setHasTripAccess] = useState<boolean | null>(null);
  const [sharePointId, setSharePointId] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editPointId, setEditPointId] = useState<string | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<Point | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [newPoint, setNewPoint] = useState<Partial<Point>>({
    name: '',
    description: '',
    address: '',
    type: 'tourist',
    googleMapsUrl: '',
    openingHours: '',
    plannedVisitDate: null
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Utilitário: obtém tripId da URL
  const getTripId = () => {
    const params = new URLSearchParams(location.search);
    return params.get('tripId');
  };
  const tripId = getTripId();

  // Verificação de acesso à viagem
  useEffect(() => {
    async function checkAccess() {
      if (!tripId || !user) {
        setHasTripAccess(false);
        return;
      }
      localStorage.removeItem('selectedTripId');
      const { data: trip } = await supabase.from('trip').select('user_id').eq('id', tripId).maybeSingle();
      if (trip && trip.user_id === user.id) {
        setHasTripAccess(true);
        return;
      }
      const { data: share } = await supabase.from('trip_shares')
        .select('id')
        .eq('trip_id', tripId)
        .eq('status', 'accepted')
        .or(`invitee_id.eq.${user.id},inviter_id.eq.${user.id}`)
        .maybeSingle();
      setHasTripAccess(!!share);
    }
    checkAccess();
  }, [tripId, user]);

  // Redireciona se não houver tripId ou acesso negado
  useEffect(() => {
    if (hasTripAccess === false) navigate('/trips');
  }, [hasTripAccess, navigate]);

  // Fetch points from Supabase
  const {
    data: points = [],
    isLoading,
    error: fetchError
  } = useQuery({
    queryKey: ['points', tripId],
    queryFn: async () => {
      if (!tripId) return [];
      const { data, error } = await supabase
        .from('points')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Point[];
    },
    enabled: !!tripId
  });

  // Add point mutation
  const addPointMutation = useMutation({
    mutationFn: async (point: Omit<Point, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('points').insert([
        {
          name: point.name,
          description: point.description,
          address: point.address,
          type: point.type,
          image_url: point.imageUrl,
          google_maps_url: point.googleMapsUrl,
          opening_hours: point.openingHours,
          planned_visit_date: point.plannedVisitDate,
          user_id: user?.id,
          trip_id: tripId
        }
      ]).select();
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['points', tripId] });
      setIsAddDialogOpen(false);
      toast({
        title: 'Ponto adicionado',
        description: `${newPoint.name} foi adicionado aos seus pontos.`
      });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao adicionar ponto',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Update point mutation
  const updatePointMutation = useMutation({
    mutationFn: async ({ id, point }: { id: string; point: Partial<Point> }) => {
      const { data, error } = await supabase.from('points').update({
        name: point.name,
        description: point.description,
        address: point.address,
        type: point.type,
        image_url: point.imageUrl,
        google_maps_url: point.googleMapsUrl,
        opening_hours: point.openingHours,
        planned_visit_date: point.plannedVisitDate
      }).eq('id', id).select();
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['points'] });
      setIsEditDialogOpen(false);
      setEditPointId(null);
      toast({
        title: 'Ponto atualizado',
        description: `${newPoint.name} foi atualizado.`
      });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar ponto',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Delete point mutation
  const deletePointMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('points').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['points'] });
      const pointToDelete = points.find(p => p.id === id);
      toast({
        title: 'Ponto excluído',
        description: `${pointToDelete?.name} foi removido.`
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao excluir ponto',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Handlers agrupados para manipulação de pontos
  const handleAddPoint = () => {
    if (!newPoint.name || !newPoint.address) {
      toast({
        title: 'Informações faltantes',
        description: 'Por favor, preencha pelo menos o nome e o endereço.',
        variant: 'destructive'
      });
      return;
    }
    addPointMutation.mutate({
      ...newPoint,
      plannedVisitDate: date ? format(date, 'yyyy-MM-dd') : null,
      user_id: user!.id
    } as any);
  };

  const handleDeletePoint = (id: string) => {
    deletePointMutation.mutate(id);
  };

  const handleEditPoint = (id: string) => {
    const pointToEdit = points.find(p => p.id === id);
    if (!pointToEdit) return;
    setNewPoint({
      name: pointToEdit.name,
      description: pointToEdit.description,
      address: pointToEdit.address,
      type: pointToEdit.type,
      imageUrl: pointToEdit.image_url,
      googleMapsUrl: pointToEdit.google_maps_url,
      openingHours: pointToEdit.opening_hours,
      plannedVisitDate: pointToEdit.planned_visit_date
    });
    setDate(pointToEdit.planned_visit_date ? new Date(pointToEdit.planned_visit_date) : undefined);
    setEditPointId(id);
    setIsEditDialogOpen(true);
  };

  const handleOpenDetails = (point: Point) => {
    setSelectedPoint(point);
    setIsDetailsModalOpen(true);
  };

  const handleUpdatePoint = () => {
    if (!newPoint.name || !newPoint.address || !editPointId) {
      toast({
        title: 'Informações faltantes',
        description: 'Por favor, preencha pelo menos o nome e o endereço.',
        variant: 'destructive'
      });
      return;
    }
    updatePointMutation.mutate({
      id: editPointId,
      point: {
        ...newPoint,
        plannedVisitDate: date ? format(date, 'yyyy-MM-dd') : null
      }
    });
  };

  // Utilitário: reseta o formulário de ponto
  const resetForm = () => {
    setNewPoint({
      name: '',
      description: '',
      address: '',
      type: 'tourist',
      googleMapsUrl: '',
      openingHours: '',
      plannedVisitDate: null
    });
    setDate(undefined);
  };

  // Utilitário: nome amigável do tipo de ponto
  const getPointTypeName = (type: string | undefined): string => {
    if (!type) return 'Outro';
    const typeMap: Record<string, string> = {
      tourist: 'Atração Turística',
      shopping: 'Compras',
      restaurant: 'Restaurante',
      accommodation: 'Hospedagem',
      other: 'Outro'
    };
    return typeMap[type] || 'Outro';
  };

  // Show error if fetch failed
  useEffect(() => {
    if (fetchError) {
      toast({
        title: 'Erro ao buscar pontos',
        description: (fetchError as any).message,
        variant: 'destructive'
      });
    }
  }, [fetchError, toast]);

  return {
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
    isAddingPoint: addPointMutation.isPending,
    isUpdatingPoint: updatePointMutation.isPending,
    getPointTypeName,
    handleAddPoint,
    handleDeletePoint,
    handleEditPoint,
    handleOpenDetails,
    handleUpdatePoint,
    resetForm,
    navigate
  };
}
