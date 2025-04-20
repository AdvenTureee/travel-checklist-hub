import React, { useState, useEffect } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Checklist, ChecklistItem, Point } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { PlusCircle, Loader2 } from 'lucide-react';

// Import refactored components
import BulkItemsDialog from '@/components/checklists/BulkItemsDialog';
import ChecklistDialog from '@/components/checklists/ChecklistDialog';
import ChecklistEmptyState from '@/components/checklists/ChecklistEmptyState';
import AddItemDialog from '@/components/checklists/AddItemDialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import EditableCell from '@/components/ui/EditableCell';
import { ListChecks, Edit, Trash, Plus, ListPlus } from 'lucide-react';

// Utilitário para cor dinâmica da barra de progresso
function getProgressColor(percent: number) {
  if (percent <= 0) return '#ef4444'; // vermelho
  if (percent >= 100) return '#22c55e'; // verde
  if (percent < 50) {
    // 0% vermelho (#ef4444) para 50% amarelo (#facc15)
    const ratio = percent / 50;
    return interpolateColor('#ef4444', '#facc15', ratio);
  } else {
    // 50% amarelo (#facc15) para 100% verde (#22c55e)
    const ratio = (percent - 50) / 50;
    return interpolateColor('#facc15', '#22c55e', ratio);
  }
}
// Função para interpolar entre duas cores hex
function interpolateColor(a: string, b: string, t: number) {
  const ah = a.replace('#','');
  const bh = b.replace('#','');
  const ar = parseInt(ah.substring(0,2),16), ag = parseInt(ah.substring(2,4),16), ab = parseInt(ah.substring(4,6),16);
  const br = parseInt(bh.substring(0,2),16), bg = parseInt(bh.substring(2,4),16), bb = parseInt(bh.substring(4,6),16);
  const rr = Math.round(ar + (br-ar)*t);
  const rg = Math.round(ag + (bg-ag)*t);
  const rb = Math.round(ab + (bb-ab)*t);
  return `rgb(${rr},${rg},${rb})`;
}


import { useLocation } from 'react-router-dom';
import Confetti from '@/components/ui/Confetti';

const Checklists = () => {
  // Novo estado para controlar modal de checklist
  const [checklistModalId, setChecklistModalId] = useState<string | null>(null);
  const { user } = useAuth();
  const [showConfetti, setShowConfetti] = useState(false);
  const [lastCelebratedIds, setLastCelebratedIds] = useState<string[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  // Função para obter tripId da query ou localStorage
  function getTripId() {
    const params = new URLSearchParams(location.search);
    return params.get('tripId'); // Nunca use localStorage para garantir filtro correto
  }
  const tripId = getTripId();

  // Função para verificar se o usuário tem acesso à viagem (dono ou compartilhada)
  const [hasTripAccess, setHasTripAccess] = useState<boolean | null>(null);
  useEffect(() => {
    async function checkAccess() {
      if (!tripId || !user) {
        setHasTripAccess(false);
        return;
      }
      // Limpar selectedTripId do localStorage para evitar confusão
      localStorage.removeItem('selectedTripId');
      // Checar se é dono
      const { data: trip } = await supabase.from('trip').select('user_id').eq('id', tripId).maybeSingle();
      if (trip && trip.user_id === user.id) {
        setHasTripAccess(true);
        return;
      }
      // Checar se é compartilhada
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

  // Se não houver tripId ou não tiver acesso, redireciona
  useEffect(() => {
    if (hasTripAccess === false) {
      navigate('/trips');
    }
  }, [hasTripAccess, navigate]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [isBulkAddDialogOpen, setIsBulkAddDialogOpen] = useState(false);
  const [currentChecklist, setCurrentChecklist] = useState<Checklist | null>(null);
  const [newItemText, setNewItemText] = useState('');
  const [newChecklist, setNewChecklist] = useState<Partial<Checklist>>({
    name: '',
    description: '',
    pointId: null,
    isComplete: false
  });
  const [viewMode, setViewMode] = useState<'grid'>('grid');
  const {
    toast
  } = useToast();

  const queryClient = useQueryClient();

  // Fetch points for association with checklists
  const {
    data: points = []
  } = useQuery({
    queryKey: ['points', tripId],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error("User not authenticated");
      }
      let query = supabase.from('points').select('*').order('created_at', { ascending: false });
      if (tripId) {
        query = query.eq('trip_id', tripId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as Point[];
    },
    enabled: !!tripId
  });

  // Fetch checklists
  const {
    data: checklists = [],
    isLoading: isLoadingChecklists
  } = useQuery({
    queryKey: ['checklists', tripId],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error("User not authenticated");
      }
      let checklistsQuery = supabase.from('checklists').select('*').order('created_at', { ascending: false });
      if (tripId) {
        checklistsQuery = checklistsQuery.eq('trip_id', tripId);
      }
      const { data, error } = await checklistsQuery;
      if (error) throw error;
      return data.map((checklist: any) => ({
        ...checklist,
        pointId: checklist.point_id,
        isComplete: checklist.is_complete,
        createdAt: checklist.created_at
      })) as Checklist[];
    },
    enabled: !!tripId
  });

  // Fetch checklist items
  const {
    data: checklistItems = []
  } = useQuery({
    queryKey: ['checklist-items', tripId],
    queryFn: async () => {
      if (!tripId) return [];
      const { data, error } = await supabase
        .from('checklist_items')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as ChecklistItem[];
    },
    enabled: !!tripId && checklists.length > 0
  });

  // Create checklist mutation
  const createChecklistMutation = useMutation({
    mutationFn: async (checklist: {
      name: string;
      description: string;
      pointId: string | null;
    }) => {
      const {
        data: userData
      } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error("User not authenticated");
      }
      const {
        data,
        error
      } = await supabase.from('checklists').insert([{
        name: checklist.name,
        description: checklist.description,
        point_id: checklist.pointId,
        is_complete: false,
        user_id: userData.user.id,
        trip_id: tripId
      }]).select();
      if (error) {
        console.error("Error creating checklist:", error);
        throw error;
      }
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['checklists']
      });
      setIsAddDialogOpen(false);
      toast({
        title: "Checklist criada",
        description: "Sua nova checklist foi criada com sucesso."
      });
      resetChecklistForm();
    },
    onError: error => {
      toast({
        title: "Erro",
        description: `Falha ao criar checklist: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Update checklist mutation
  const updateChecklistMutation = useMutation({
    mutationFn: async ({
      id,
      checklist
    }: {
      id: string;
      checklist: Partial<Checklist>;
    }) => {
      const {
        data,
        error
      } = await supabase.from('checklists').update({
        name: checklist.name,
        description: checklist.description,
        point_id: checklist.pointId,
        trip_id: tripId
      }).eq('id', id).select();
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['checklists']
      });
      setIsEditDialogOpen(false);
      toast({
        title: "Checklist atualizada",
        description: "Sua checklist foi atualizada com sucesso."
      });
      setCurrentChecklist(null);
      resetChecklistForm();
    },
    onError: error => {
      toast({
        title: "Erro",
        description: `Falha ao atualizar checklist: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Delete checklist mutation
  const deleteChecklistMutation = useMutation({
    mutationFn: async (id: string) => {
      // First delete all items in the checklist
      const {
        error: itemsError
      } = await supabase.from('checklist_items').delete().eq('checklist_id', id);
      if (itemsError) throw itemsError;

      // Then delete the checklist
      const {
        error
      } = await supabase.from('checklists').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: id => {
      queryClient.invalidateQueries({
        queryKey: ['checklists']
      });
      queryClient.invalidateQueries({
        queryKey: ['checklist-items']
      });
      toast({
        title: "Checklist excluída",
        description: "A checklist foi excluída com sucesso."
      });
    },
    onError: error => {
      toast({
        title: "Erro",
        description: `Falha ao excluir checklist: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Create checklist item mutation
  const createChecklistItemMutation = useMutation({
    mutationFn: async ({
      checklistId,
      text
    }: {
      checklistId: string;
      text: string;
    }) => {
      const {
        data,
        error
      } = await supabase.from('checklist_items').insert([{
        text,
        completed: false,
        checklist_id: checklistId,
        trip_id: tripId
      }]).select();
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['checklist-items']
      });
      setIsAddItemDialogOpen(false);
      setNewItemText('');
      toast({
        title: "Item adicionado",
        description: "O item foi adicionado à sua checklist."
      });
    },
    onError: error => {
      toast({
        title: "Erro",
        description: `Falha ao adicionar item: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Toggle checklist item completion
  const toggleChecklistItemMutation = useMutation({
    mutationFn: async ({
      id,
      completed
    }: {
      id: string;
      completed: boolean;
    }) => {
      const {
        data,
        error
      } = await supabase.from('checklist_items').update({
        completed
      }).eq('id', id).select();
      if (error) throw error;

      // Get the checklist_id to update its completion status
      const checklist_id = data[0].checklist_id;

      // Check if all items in this checklist are completed
      const {
        data: items
      } = await supabase.from('checklist_items').select('*').eq('checklist_id', checklist_id);
      if (items && items.length > 0) {
        const allCompleted = items.every(item => item.completed);

        // Update checklist completion status
        await supabase.from('checklists').update({
          is_complete: allCompleted
        }).eq('id', checklist_id);
      }
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['checklist-items']
      });
      queryClient.invalidateQueries({
        queryKey: ['checklists']
      });
    },
    onError: error => {
      toast({
        title: "Error",
        description: `Failed to update item: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Create multiple checklist items mutation
  const createMultipleChecklistItemsMutation = useMutation({
    mutationFn: async ({
      checklistId,
      items
    }: {
      checklistId: string;
      items: string[];
    }) => {
      const itemsToInsert = items.map(text => ({
        text,
        completed: false,
        checklist_id: checklistId,
        trip_id: tripId
      }));
      const { data, error } = await supabase.from('checklist_items').insert(itemsToInsert).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['checklist-items']
      });
      setIsBulkAddDialogOpen(false);
      toast({
        title: "Itens adicionados",
        description: "Os itens foram adicionados à sua checklist."
      });
    },
    onError: error => {
      toast({
        title: "Erro",
        description: `Falha ao adicionar itens: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Delete checklist item
  const deleteChecklistItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const {
        data,
        error
      } = await supabase.from('checklist_items').delete().eq('id', id).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['checklist-items']
      });
      toast({
        title: "Item excluído",
        description: "O item foi removido da sua checklist."
      });
    },
    onError: error => {
      toast({
        title: "Erro",
        description: `Falha ao excluir item: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Add new mutation for updating checklist item text
  const updateChecklistItemTextMutation = useMutation({
    mutationFn: async ({
      id,
      text
    }: {
      id: string;
      text: string;
    }) => {
      const {
        data,
        error
      } = await supabase.from('checklist_items').update({
        text
      }).eq('id', id).select();
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['checklist-items']
      });
      toast({
        title: "Item atualizado",
        description: "O item foi atualizado com sucesso."
      });
    },
    onError: error => {
      toast({
        title: "Error",
        description: `Failed to update item: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  const handleCreateChecklist = () => {
    if (!newChecklist.name) {
      toast({
        title: "Missing information",
        description: "Please provide a name for your checklist.",
        variant: "destructive"
      });
      return;
    }
    createChecklistMutation.mutate({
      name: newChecklist.name,
      description: newChecklist.description || '',
      pointId: newChecklist.pointId
    });
  };
  const handleEditChecklist = (id: string) => {
    const checklistToEdit = checklists.find(c => c.id === id);
    if (checklistToEdit) {
      setCurrentChecklist(checklistToEdit);
      setNewChecklist({
        name: checklistToEdit.name,
        description: checklistToEdit.description || '',
        pointId: checklistToEdit.pointId
      });
      setIsEditDialogOpen(true);
    }
  };
  const handleUpdateChecklist = () => {
    if (!currentChecklist || !newChecklist.name) {
      toast({
        title: "Missing information",
        description: "Please provide a name for your checklist.",
        variant: "destructive"
      });
      return;
    }
    updateChecklistMutation.mutate({
      id: currentChecklist.id,
      checklist: newChecklist
    });
  };
  const handleViewChecklist = (id: string) => {
    const checklistToView = checklists.find(c => c.id === id);
    if (checklistToView) {
      setCurrentChecklist(checklistToView);
      setIsViewDialogOpen(true);
    }
  };
  const handleAddItem = (checklistId: string) => {
    const checklist = checklists.find(c => c.id === checklistId);
    if (checklist) {
      setCurrentChecklist(checklist);
      setIsAddItemDialogOpen(true);
    }
  };
  const handleBulkAddItems = (checklistId: string) => {
    const checklist = checklists.find(c => c.id === checklistId);
    if (checklist) {
      setCurrentChecklist(checklist);
      setIsBulkAddDialogOpen(true);
    }
  };
  const handleCreateItem = () => {
    if (!currentChecklist || !newItemText.trim()) {
      toast({
        title: "Informação obrigatória",
        description: "Por favor, insira um texto para o item.",
        variant: "destructive"
      });
      return;
    }
    createChecklistItemMutation.mutate({
      checklistId: currentChecklist.id,
      text: newItemText.trim()
    });
  };
  const handleCreateMultipleItems = (items: string[]) => {
    if (!currentChecklist || items.length === 0) return;
    createMultipleChecklistItemsMutation.mutate({
      checklistId: currentChecklist.id,
      items
    });
  };

  // Handler for updating a checklist item's text
  const handleUpdateItemText = (id: string, text: string) => {
    if (!text.trim()) {
      toast({
        title: "Informação obrigatória",
        description: "O texto do item não pode estar vazio.",
        variant: "destructive"
      });
      return;
    }
    updateChecklistItemTextMutation.mutate({
      id,
      text: text.trim()
    });
  };
  const resetChecklistForm = () => {
    setNewChecklist({
      name: '',
      description: '',
      pointId: null,
      isComplete: false
    });
  };

  // Calculate completion percentage for a checklist
  const calculateCompletion = (checklistId: string) => {
    const items = checklistItems.filter(item => item.checklist_id === checklistId);
    if (items.length === 0) return 0;
    const completedItems = items.filter(item => item.completed).length;
    return Math.round(completedItems / items.length * 100);
  };

  // Confetti effect when any checklist reaches 100% (and wasn't celebrated before)
  React.useEffect(() => {
    if (!checklists.length || !checklistItems.length) return;
    const completedChecklists = checklists.filter(cl => {
      const items = checklistItems.filter(item => item.checklist_id === cl.id);
      if (items.length === 0) return false;
      const completedItems = items.filter(item => item.completed).length;
      return completedItems === items.length;
    });
    const newCelebrated = completedChecklists.filter(cl => !lastCelebratedIds.includes(cl.id));
    if (newCelebrated.length > 0) {
      setShowConfetti(true);
      setLastCelebratedIds(ids => [...ids, ...newCelebrated.map(cl => cl.id)]);
    }
  }, [checklists, checklistItems, lastCelebratedIds]);

  // Função utilitária para buscar o ponto associado
  const getAssociatedPoint = (pointId: string | null | undefined) => {
    if (!pointId) return null;
    return points.find(p => p.id === pointId);
  };

if (isLoadingChecklists) {
  return (
    <PageContainer>
      <h1 className="text-xl md:text-2xl mb-1 font-bold text-travel-blue font-['Lexend']">Minhas Checklists</h1>
      <div className="text-sm sm:text-base text-travel-dark/80 mb-6">Gerencie suas listas de viagem e marque itens conforme for completando.</div>
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/trips')}
          className="mr-2 text-travel-blue hover:text-travel-dark flex items-center"
          title="Voltar para viagens"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left w-6 h-6"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        </button>
  
      </div>
      <div className="flex justify-center items-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-travel-blue" />
        <span className="ml-2">Carregando checklists...</span>
      </div>
    </PageContainer>
  );
}

return (
  <PageContainer>
    <div className="flex items-center mb-6">
      <button
        onClick={() => navigate('/trips')}
        className="mr-2 text-travel-blue hover:text-travel-dark flex items-center"
        title="Voltar para viagens"
      >
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left w-6 h-6"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
      </button>

    </div>
    <h1 className="text-xl md:text-2xl mb-1 font-bold text-travel-blue font-['Lexend']">Minhas Checklists</h1>
    <div className="text-sm sm:text-base text-travel-dark/80 mb-6">Gerencie suas listas de viagem e marque itens conforme for completando.</div>
    {showConfetti && (
      <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />
    )}
    <div className="mb-4 flex flex-row items-center gap-6 sm:mb-6 sm:gap-6 sm:flex-row flex-col sm:items-center sm:justify-start w-full">
      {/* Floating action button for global actions (e.g., add checklist) */}
      <div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="fixed bottom-6 right-6 z-50 bg-travel-mustard hover:bg-travel-mustard/80 text-travel-dark p-2 h-12 w-12 flex items-center justify-center rounded-full shadow-md"
              aria-label="Adicionar Checklist"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>
      {/* Header and description */}
      <div className="flex flex-col flex-1 w-full">

      </div>
    </div>
    {checklists.length === 0 ? (
      <ChecklistEmptyState onCreateClick={() => setIsAddDialogOpen(true)} />
    ) : (
      <div className="overflow-x-auto w-full md:w-full lg:w-full xl:w-full 2xl:w-full">
        {/* Modal de Checklist - Novo */}
        {checklistModalId && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/40 p-2 overflow-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full min-w-[280px] max-w-[95vw] sm:max-w-[500px] mx-auto px-2 sm:px-6 py-4 flex flex-col gap-4 border-2 border-travel-mustard animate-fade-in" style={{ maxHeight: '90vh', boxSizing: 'border-box', justifyContent: 'center', alignItems: 'center', display: 'flex', overflow: 'auto' }}>
              <h2 className="text-xl font-bold text-center text-travel-dark mb-2">Checklist</h2>
              <div className="flex flex-col gap-3 w-full max-h-[60vh] overflow-y-auto px-1 sm:px-2">
                {(checklistItems.filter(item => item.checklist_id === checklistModalId).length === 0) ? (
                  <span className="text-xs text-travel-dark/50">Nenhum item</span>
                ) : (
                  checklistItems.filter(item => item.checklist_id === checklistModalId).map(item => (
                    <label key={item.id} className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-travel-beige/60 transition">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => toggleChecklistItemMutation.mutate({ id: item.id, completed: !item.completed })}
                        className="form-checkbox h-5 w-5 text-travel-mustard border-gray-300 rounded focus:ring-travel-mustard"
                      />
                      <span className={item.completed ? 'line-through text-travel-dark/40 text-base' : 'text-travel-dark/80 text-base'}>{item.text}</span>
                    </label>
                  ))
                )}
              </div>
              <button className="mt-4 w-full bg-travel-mustard text-travel-dark font-bold py-3 rounded-lg shadow hover:bg-travel-mustard/90 transition" onClick={() => setChecklistModalId(null)}>
                Fechar
              </button>
            </div>
          </div>
        )}

        <div className="border border-travel-mustard rounded-2xl overflow-hidden">
          <Table className="min-w-full sm:min-w-full md:min-w-full bg-white text-xs sm:text-sm md:text-base rounded-2xl overflow-hidden">
          <TableHeader className="rounded-t-2xl overflow-hidden">
            <TableRow className="rounded-t-2xl overflow-hidden">
              <TableHead className="text-xs sm:text-sm md:text-base w-1/5">Nome</TableHead>
              <TableHead className="text-xs sm:text-sm md:text-base w-1/5">Descrição</TableHead>
              <TableHead className="text-xs sm:text-sm md:text-base w-1/5">Ponto Associado</TableHead>
              <TableHead className="text-xs sm:text-sm md:text-base w-1/5">Conclusão</TableHead>
              <TableHead className="text-xs sm:text-sm md:text-base w-1/5 text-center">Ações</TableHead>

            </TableRow>
          </TableHeader>
          <TableBody className="overflow-hidden">
            {checklists.map((checklist) => {
              const completionPercentage = calculateCompletion(checklist.id);
              const associatedPoint = getAssociatedPoint(checklist.pointId || checklist.point_id);
              const items = checklistItems.filter(item => item.checklist_id === checklist.id);
              return (
                <TableRow key={checklist.id} className="last:rounded-b-2xl overflow-hidden">
                  <TableCell className="font-semibold text-travel-dark">
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 bg-travel-mustard text-travel-dark hover:bg-yellow-400 border-2 border-travel-mustard flex items-center justify-center rounded-full transition-all duration-200"
                        onClick={() => setChecklistModalId(checklist.id)}
                        title="Abrir checklist"
                        aria-label="Abrir checklist"
                      >
                        <ListChecks className="h-5 w-5" />
                      </Button>
                      <EditableCell
                        value={checklist.name}
                        placeholder="Nome"
                        onSave={newValue => updateChecklistMutation.mutate({
                          id: checklist.id,
                          checklist: { ...checklist, name: newValue }
                        })}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <EditableCell
                      value={checklist.description || ''}
                      placeholder="Sem descrição"
                      onSave={newValue => updateChecklistMutation.mutate({
                        id: checklist.id,
                        checklist: { ...checklist, description: newValue }
                      })}
                    />
                  </TableCell>
                  <TableCell>
                    <EditableCell
                      value={associatedPoint ? associatedPoint.name : ''}
                      inputType="select"
                      options={[{ value: '', label: 'Nenhum' }, ...points.map(p => ({ value: p.id, label: p.name }))]}
                      onSave={newValue => updateChecklistMutation.mutate({
                        id: checklist.id,
                        checklist: { ...checklist, pointId: newValue || null }
                      })}
                      displayValue={associatedPoint ? associatedPoint.name : 'Nenhum'}
                      placeholder="Nenhum"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 min-w-[120px]">
                      <div className="relative w-full h-6 caricature-progress-bar bg-travel-beige border border-travel-mustard rounded-full overflow-hidden transition-all">
                        <div
                          className="h-6 rounded-full transition-all duration-700 ease-in-out flex items-center justify-end pr-2"
                          style={{
                            width: `${completionPercentage}%`,
                            minWidth: completionPercentage > 0 ? '2.5rem' : '0',
                            background: `linear-gradient(90deg, ${getProgressColor(completionPercentage)} 0%, ${getProgressColor(completionPercentage)} 100%)`,
                            transition: 'width 0.7s cubic-bezier(0.4, 2, 0.6, 1)'
                          }}
                        >
                          <span className="text-[10px] font-bold text-travel-dark select-none">
                            {completionPercentage}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2 justify-center">
                      <Button size="icon" variant="ghost" className="h-12 w-12 hover:bg-travel-light-blue/20" onClick={() => handleEditChecklist(checklist.id)} title="Editar">
                        <Edit className="h-6 w-6 text-travel-blue" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-12 w-12 hover:bg-travel-light-red/20" onClick={() => deleteChecklistMutation.mutate(checklist.id)} title="Excluir">
                        <Trash className="h-6 w-6 text-travel-red" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-12 w-12 hover:bg-travel-light-blue/20" onClick={() => handleAddItem(checklist.id)} title="Adicionar Item">
                        <Plus className="h-6 w-6 text-travel-blue" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-12 w-12 hover:bg-travel-light-blue/20" onClick={() => handleBulkAddItems(checklist.id)} title="Adicionar em Massa">
                        <ListPlus className="h-6 w-6 text-travel-blue" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        </div>
      </div>
    )}
    <Button
      onClick={() => setIsAddDialogOpen(true)}
      className="fixed bottom-6 right-6 z-50 bg-travel-mustard hover:bg-travel-mustard/80 text-travel-dark p-2 h-12 w-12 flex items-center justify-center rounded-full shadow-md"
      aria-label="Adicionar Checklist"
    >
      <Plus className="h-6 w-6" />
    </Button>
    {/* Add/Edit Dialogs */}
    <ChecklistDialog isOpen={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} title="Criar nova Checklist" description="Adicione uma nova checklist para organizar suas tarefas." checklist={newChecklist} points={points} isSubmitting={createChecklistMutation.isPending} onSubmit={handleCreateChecklist} onCancel={() => setIsAddDialogOpen(false)} onChecklistChange={setNewChecklist} submitButtonText="Criar Checklist" loadingText="Criando..." />
    <ChecklistDialog isOpen={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} title="Editar Checklist" checklist={newChecklist} points={points} isSubmitting={updateChecklistMutation.isPending} onSubmit={handleUpdateChecklist} onCancel={() => {
      setIsEditDialogOpen(false);
      setCurrentChecklist(null);
      resetChecklistForm();
    }} onChecklistChange={setNewChecklist} submitButtonText="Salvar alterações" loadingText="Salvando..." />
    {/* View Checklist Dialog */}
    {/* Add Item Dialog */}
    <AddItemDialog isOpen={isAddItemDialogOpen} onOpenChange={setIsAddItemDialogOpen} checklistName={currentChecklist?.name || ''} itemText={newItemText} onItemTextChange={setNewItemText} onSubmit={handleCreateItem} isSubmitting={createChecklistItemMutation.isPending} />
    {/* Bulk Add Items Dialog */}
    {currentChecklist && <BulkItemsDialog checklistId={currentChecklist.id} checklistName={currentChecklist.name} open={isBulkAddDialogOpen} onOpenChange={setIsBulkAddDialogOpen} onAddItems={handleCreateMultipleItems} isAdding={createMultipleChecklistItemsMutation.isPending} />}
  </PageContainer>
);
}
export default Checklists;