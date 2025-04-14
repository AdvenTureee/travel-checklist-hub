import React, { useState } from 'react';
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
import { AnimatePresence, motion } from 'framer-motion';

// Import refactored components
import ChecklistViewToggle from '@/components/checklists/ChecklistViewToggle';
import ChecklistListView from '@/components/checklists/ChecklistListView';
import BulkItemsDialog from '@/components/checklists/BulkItemsDialog';
import ChecklistCard from '@/components/checklists/ChecklistCard';
import ChecklistDialog from '@/components/checklists/ChecklistDialog';
import ChecklistViewDialog from '@/components/checklists/ChecklistViewDialog';
import ChecklistEmptyState from '@/components/checklists/ChecklistEmptyState';
import AddItemDialog from '@/components/checklists/AddItemDialog';
const Checklists = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const {
    user
  } = useAuth();
  const queryClient = useQueryClient();

  // Fetch points for association with checklists
  const {
    data: points = []
  } = useQuery({
    queryKey: ['points'],
    queryFn: async () => {
      const {
        data: userData
      } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error("User not authenticated");
      }
      const {
        data,
        error
      } = await supabase.from('points').select('*').order('created_at', {
        ascending: false
      });
      if (error) throw error;
      return data as Point[];
    }
  });

  // Fetch checklists
  const {
    data: checklists = [],
    isLoading: isLoadingChecklists
  } = useQuery({
    queryKey: ['checklists'],
    queryFn: async () => {
      const {
        data: userData
      } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error("User not authenticated");
      }
      const {
        data,
        error
      } = await supabase.from('checklists').select('*').order('created_at', {
        ascending: false
      });
      if (error) throw error;
      return data.map((checklist: any) => ({
        ...checklist,
        pointId: checklist.point_id,
        isComplete: checklist.is_complete,
        createdAt: checklist.created_at
      })) as Checklist[];
    }
  });

  // Fetch checklist items
  const {
    data: checklistItems = []
  } = useQuery({
    queryKey: ['checklist-items'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('checklist_items').select('*').order('created_at', {
        ascending: true
      });
      if (error) throw error;
      return data as ChecklistItem[];
    },
    enabled: checklists.length > 0
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
        user_id: userData.user.id
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
        point_id: checklist.pointId
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
        checklist_id: checklistId
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
        checklist_id: checklistId
      }));
      const {
        data,
        error
      } = await supabase.from('checklist_items').insert(itemsToInsert).select();
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

  // Find the associated point for a checklist
  const getAssociatedPoint = (pointId: string | null | undefined) => {
    if (!pointId) return null;
    return points.find(p => p.id === pointId);
  };
  if (isLoadingChecklists) {
    return <PageContainer>
        <div className="flex justify-center items-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-travel-blue" />
          <span className="ml-2">Carregando checklists...</span>
        </div>
      </PageContainer>;
  }
  return <PageContainer>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-travel-dark">Checklists</h1>
          <p className="text-travel-dark/70">Gerencie suas listas de viagem e tarefas</p>
        </div>
        <div className="flex gap-4 items-center">
          <ChecklistViewToggle currentView={viewMode} onViewChange={setViewMode} />
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-travel-mustard hover:bg-travel-mustard/80 text-travel-dark">
                <PlusCircle className="mr-2 h-4 w-4" />
                Nova Checklist
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {checklists.length === 0 ? <ChecklistEmptyState onCreateClick={() => setIsAddDialogOpen(true)} /> : <AnimatePresence mode="wait">
          {viewMode === 'grid' ? <motion.div key="grid-view" initial={{
        opacity: 0,
        x: -20
      }} animate={{
        opacity: 1,
        x: 0
      }} exit={{
        opacity: 0,
        x: -20
      }} transition={{
        duration: 0.3
      }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 divide-y divide-travel-dark/10 py-0">
              {checklists.map((checklist, index) => {
          const completionPercentage = calculateCompletion(checklist.id);
          const associatedPoint = getAssociatedPoint(checklist.pointId || checklist.point_id);
          const items = checklistItems.filter(item => item.checklist_id === checklist.id);

          // Determine row start for clear visual separation
          const rowIndex = Math.floor(index / (window.innerWidth >= 1024 ? 3 : window.innerWidth >= 768 ? 2 : 1));
          return <div key={checklist.id} className={`${rowIndex > 0 ? 'pt-6' : ''}`}>
                    <ChecklistCard checklist={checklist} items={items} completionPercentage={completionPercentage} associatedPoint={associatedPoint} onEdit={handleEditChecklist} onDelete={id => deleteChecklistMutation.mutate(id)} onView={handleViewChecklist} onToggleItem={(id, completed) => toggleChecklistItemMutation.mutate({
              id,
              completed
            })} onUpdateItemText={handleUpdateItemText} onDeleteItem={id => deleteChecklistItemMutation.mutate(id)} onAddItem={handleAddItem} onBulkAddItems={handleBulkAddItems} />
                  </div>;
        })}
            </motion.div> : <motion.div key="list-view" initial={{
        opacity: 0,
        x: 20
      }} animate={{
        opacity: 1,
        x: 0
      }} exit={{
        opacity: 0,
        x: 20
      }} transition={{
        duration: 0.3
      }}>
              <ChecklistListView checklists={checklists} checklistItems={checklistItems} onEdit={handleEditChecklist} onDelete={id => deleteChecklistMutation.mutate(id)} onChecklistView={handleViewChecklist} onToggleItem={(id, completed) => toggleChecklistItemMutation.mutate({
          id,
          completed
        })} onDeleteItem={id => deleteChecklistItemMutation.mutate(id)} onAddItem={handleAddItem} onBulkAddItems={handleBulkAddItems} onUpdateItemText={handleUpdateItemText} />
            </motion.div>}
        </AnimatePresence>}

      {/* Add/Edit Dialogs */}
      <ChecklistDialog isOpen={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} title="Criar nova Checklist" description="Adicione uma nova checklist para organizar suas tarefas." checklist={newChecklist} points={points} isSubmitting={createChecklistMutation.isPending} onSubmit={handleCreateChecklist} onCancel={() => setIsAddDialogOpen(false)} onChecklistChange={setNewChecklist} submitButtonText="Criar Checklist" loadingText="Criando..." />

      <ChecklistDialog isOpen={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} title="Editar Checklist" checklist={newChecklist} points={points} isSubmitting={updateChecklistMutation.isPending} onSubmit={handleUpdateChecklist} onCancel={() => {
      setIsEditDialogOpen(false);
      setCurrentChecklist(null);
      resetChecklistForm();
    }} onChecklistChange={setNewChecklist} submitButtonText="Salvar alterações" loadingText="Salvando..." />

      {/* View Checklist Dialog */}
      {currentChecklist && <ChecklistViewDialog isOpen={isViewDialogOpen} onOpenChange={setIsViewDialogOpen} checklist={currentChecklist} items={checklistItems.filter(item => item.checklist_id === currentChecklist.id)} associatedPoint={getAssociatedPoint(currentChecklist.pointId || currentChecklist.point_id)} completionPercentage={calculateCompletion(currentChecklist.id)} onToggleItem={(id, completed) => toggleChecklistItemMutation.mutate({
      id,
      completed
    })} onDeleteItem={id => deleteChecklistItemMutation.mutate(id)} onUpdateItemText={handleUpdateItemText} onAddNewItem={handleCreateItem} newItemText={newItemText} onNewItemTextChange={setNewItemText} />}

      {/* Add Item Dialog */}
      <AddItemDialog isOpen={isAddItemDialogOpen} onOpenChange={setIsAddItemDialogOpen} checklistName={currentChecklist?.name || ''} itemText={newItemText} onItemTextChange={setNewItemText} onSubmit={handleCreateItem} isSubmitting={createChecklistItemMutation.isPending} />

      {/* Bulk Add Items Dialog */}
      {currentChecklist && <BulkItemsDialog checklistId={currentChecklist.id} checklistName={currentChecklist.name} open={isBulkAddDialogOpen} onOpenChange={setIsBulkAddDialogOpen} onAddItems={handleCreateMultipleItems} isAdding={createMultipleChecklistItemsMutation.isPending} />}
    </PageContainer>;
};
export default Checklists;