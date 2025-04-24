import { useState, useEffect } from 'react';
import OpeningHoursInput from '@/components/points/OpeningHoursInput';
const { formatScheduleToString } = OpeningHoursInput as any; // fallback if not exported directly
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
  const [newPoint, setNewPoint] = useState<Partial<Point> & { imageFile?: File | null }>({
    name: '',
    description: '',
    address: '',
    type: 'tourist',
    googleMapsUrl: '',
    openingHours: undefined,
    plannedVisitDate: null,
    imageFile: null
  });
  const [addPointError, setAddPointError] = useState<string | null>(null);
  const [isAddingPoint, setIsAddingPoint] = useState(false);
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
      // Parse opening_hours from string to OpeningHours
      return (data ?? []).map((point: any) => ({
        ...point,
        opening_hours: point.opening_hours ? JSON.parse(point.opening_hours) : undefined,
        openingHours: point.opening_hours ? JSON.parse(point.opening_hours) : undefined,
      })) as Point[];
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
          opening_hours: point.openingHours ? JSON.stringify(point.openingHours) : null,
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
      setAddPointError(null);
      setIsAddingPoint(false);
    },
    onError: (error: any) => {
      setAddPointError(error.message || 'Erro ao adicionar ponto.');
      toast({
        title: 'Erro ao adicionar ponto',
        description: error.message,
        variant: 'destructive'
      });
      setIsAddingPoint(false);
    }
  });

  // Handler para adicionar ponto, incluindo upload de imagem
  const handleAddPoint = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingPoint(true);
    setAddPointError(null);
    let imageUrl = '';
    try {
      if (newPoint.imageFile) {
        const fileExt = newPoint.imageFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        const { data, error: uploadError } = await supabase.storage.from('points-images').upload(fileName, newPoint.imageFile);
        if (uploadError) throw uploadError;
        const publicUrlResult = supabase.storage.from('points-images').getPublicUrl(data.path);
        imageUrl = publicUrlResult.data.publicUrl;
      }
      // Garante que openingHours seja string
      let openingHoursString = '';
      if (typeof newPoint.openingHours === 'string') {
        openingHoursString = newPoint.openingHours;
      } else if (typeof newPoint.openingHours === 'object' && newPoint.openingHours !== null) {
        // Sempre converte objeto para string amigável
        openingHoursString = formatScheduleToString(newPoint.openingHours);
      }
      await addPointMutation.mutateAsync({
        name: newPoint.name || '',
        description: newPoint.description || '',
        address: newPoint.address || '',
        type: newPoint.type || 'tourist',
        imageUrl,
        googleMapsUrl: newPoint.googleMapsUrl || '',
        openingHours: openingHoursString,
        plannedVisitDate: newPoint.plannedVisitDate || null,
        user_id: user?.id,
        trip_id: tripId
      } as any);
    } catch (err: any) {
      setAddPointError(err.message || 'Erro ao cadastrar ponto.');
      setIsAddingPoint(false);
    }
  };

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
        opening_hours: point.openingHours ? JSON.stringify(point.openingHours) : null,
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

  // Handler para atualizar ponto
  const handleUpdatePoint = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newPoint.name || !newPoint.address || !editPointId) {
      toast({
        title: 'Informações faltantes',
        description: 'Por favor, preencha pelo menos o nome e o endereço.',
        variant: 'destructive'
      });
      return;
    }
    let imageUrl = newPoint.imageUrl || '';
    try {
      if (newPoint.imageFile) {
        const fileExt = newPoint.imageFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        const { data, error: uploadError } = await supabase.storage.from('points-images').upload(fileName, newPoint.imageFile);
        if (uploadError) throw uploadError;
        const publicUrlResult = supabase.storage.from('points-images').getPublicUrl(data.path);
        imageUrl = publicUrlResult.data.publicUrl;
      }
      // Garante que openingHours seja string ao atualizar
      let openingHoursString = '';
      if (typeof newPoint.openingHours === 'string') {
        openingHoursString = newPoint.openingHours;
      } else if (typeof newPoint.openingHours === 'object' && newPoint.openingHours !== null) {
        if (typeof formatScheduleToString === 'function') {
          openingHoursString = formatScheduleToString(newPoint.openingHours);
        } else {
          openingHoursString = JSON.stringify(newPoint.openingHours);
        }
      }
      updatePointMutation.mutate({
        id: editPointId,
        point: {
          ...newPoint,
          imageUrl,
          // Do not assign string, keep as object for local state
          openingHours: typeof newPoint.openingHours === 'string' ? (newPoint.openingHours ? JSON.parse(newPoint.openingHours) : undefined) : newPoint.openingHours,
          plannedVisitDate: date ? format(date, 'yyyy-MM-dd') : null
        }
      });
    } catch (err: any) {
      toast({
        title: 'Erro ao atualizar ponto',
        description: err.message || 'Erro ao atualizar ponto.',
        variant: 'destructive'
      });
    }
  };

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

  // Utilitário: reseta o formulário de ponto
  const resetForm = () => {
    setNewPoint({
      name: '',
      description: '',
      address: '',
      type: 'tourist',
      googleMapsUrl: '',
      openingHours: {},
      plannedVisitDate: null,
      imageFile: null
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
    addPointError,
    isAddingPoint,
    points,
    isLoading,
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
