
import React, { useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Checklist, ChecklistItem, Point } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Edit, Trash, ListChecks, ClipboardList, Loader2, MapPin, Plus } from 'lucide-react';
import ChecklistViewToggle from '@/components/checklists/ChecklistViewToggle';
import ChecklistListView from '@/components/checklists/ChecklistListView';
import ChecklistCardView from '@/components/checklists/ChecklistCardView';
import BulkItemsDialog from '@/components/checklists/BulkItemsDialog';
import { motion } from 'framer-motion';

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
    isComplete: false,
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch points for association with checklists
  const { data: points = [] } = useQuery({
    queryKey: ['points'],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error("Usuário não autenticado");
      }
      
      const { data, error } = await supabase
        .from('points')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Point[];
    },
  });

  // Fetch checklists
  const { data: checklists = [], isLoading: isLoadingChecklists } = useQuery({
    queryKey: ['checklists'],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error("Usuário não autenticado");
      }
      
      const { data, error } = await supabase
        .from('checklists')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map((checklist: any) => ({
        ...checklist,
        pointId: checklist.point_id,
        isComplete: checklist.is_complete,
        createdAt: checklist.created_at
      })) as Checklist[];
    },
  });

  // Fetch checklist items
  const { data: checklistItems = [] } = useQuery({
    queryKey: ['checklist-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checklist_items')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as ChecklistItem[];
    },
    enabled: checklists.length > 0,
  });

  // Create checklist mutation
  const createChecklistMutation = useMutation({
    mutationFn: async (checklist: { name: string; description: string; pointId: string | null }) => {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) {
        throw new Error("Usuário não autenticado");
      }
      
      const { data, error } = await supabase
        .from('checklists')
        .insert([
          {
            name: checklist.name,
            description: checklist.description,
            point_id: checklist.pointId,
            is_complete: false,
            user_id: userData.user.id
          }
        ])
        .select();
      
      if (error) {
        console.error("Erro ao criar checklist:", error);
        throw error;
      }
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
      setIsAddDialogOpen(false);
      toast({
        title: "Checklist criada",
        description: "Sua nova checklist foi criada com sucesso.",
      });
      resetChecklistForm();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao criar checklist: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update checklist mutation
  const updateChecklistMutation = useMutation({
    mutationFn: async ({ id, checklist }: { id: string, checklist: Partial<Checklist> }) => {
      const { data, error } = await supabase
        .from('checklists')
        .update({
          name: checklist.name,
          description: checklist.description,
          point_id: checklist.pointId,
        })
        .eq('id', id)
        .select();

      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
      setIsEditDialogOpen(false);
      toast({
        title: "Checklist atualizada",
        description: "Sua checklist foi atualizada com sucesso.",
      });
      setCurrentChecklist(null);
      resetChecklistForm();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao atualizar checklist: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete checklist mutation
  const deleteChecklistMutation = useMutation({
    mutationFn: async (id: string) => {
      // First delete all items in the checklist
      const { error: itemsError } = await supabase
        .from('checklist_items')
        .delete()
        .eq('checklist_id', id);

      if (itemsError) throw itemsError;

      // Then delete the checklist
      const { error } = await supabase
        .from('checklists')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
      queryClient.invalidateQueries({ queryKey: ['checklist-items'] });
      toast({
        title: "Checklist excluída",
        description: "A checklist foi excluída com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao excluir checklist: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Create checklist item mutation
  const createChecklistItemMutation = useMutation({
    mutationFn: async ({ checklistId, text }: { checklistId: string, text: string }) => {
      const { data, error } = await supabase
        .from('checklist_items')
        .insert([
          {
            text,
            completed: false,
            checklist_id: checklistId,
          }
        ])
        .select();

      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-items'] });
      setIsAddItemDialogOpen(false);
      setNewItemText('');
      toast({
        title: "Item adicionado",
        description: "O item foi adicionado à sua checklist.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao adicionar item: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Toggle checklist item completion
  const toggleChecklistItemMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string, completed: boolean }) => {
      const { data, error } = await supabase
        .from('checklist_items')
        .update({ completed })
        .eq('id', id)
        .select();

      if (error) throw error;
      
      // Get the checklist_id to update its completion status
      const checklist_id = data[0].checklist_id;
      
      // Check if all items in this checklist are completed
      const { data: items } = await supabase
        .from('checklist_items')
        .select('*')
        .eq('checklist_id', checklist_id);
      
      if (items && items.length > 0) {
        const allCompleted = items.every(item => item.completed);
        
        // Update checklist completion status
        await supabase
          .from('checklists')
          .update({ is_complete: allCompleted })
          .eq('id', checklist_id);
      }
      
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-items'] });
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao atualizar item: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Create multiple checklist items mutation
  const createMultipleChecklistItemsMutation = useMutation({
    mutationFn: async ({ checklistId, items }: { checklistId: string, items: string[] }) => {
      const itemsToInsert = items.map(text => ({
        text,
        completed: false,
        checklist_id: checklistId,
      }));

      const { data, error } = await supabase
        .from('checklist_items')
        .insert(itemsToInsert)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-items'] });
      setIsBulkAddDialogOpen(false);
      toast({
        title: "Itens adicionados",
        description: "Os itens foram adicionados à sua checklist.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao adicionar itens: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete checklist item
  const deleteChecklistItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('checklist_items')
        .delete()
        .eq('id', id)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-items'] });
      toast({
        title: "Item excluído",
        description: "O item foi removido da sua checklist.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao excluir item: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update checklist item text mutation
  const updateChecklistItemTextMutation = useMutation({
    mutationFn: async ({ id, text }: { id: string, text: string }) => {
      const { data, error } = await supabase
        .from('checklist_items')
        .update({ text })
        .eq('id', id)
        .select();

      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-items'] });
      toast({
        title: "Item atualizado",
        description: "O item foi atualizado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao atualizar item: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Reorder checklist items mutation
  const reorderChecklistItemsMutation = useMutation({
    mutationFn: async ({ checklistId, itemIds }: { checklistId: string, itemIds: string[] }) => {
      // We don't have a position field in the database,
      // so we're just logging the reordering for now.
      // In a real application, you would add a position field to store the order.
      console.log(`Reordering items for checklist ${checklistId}:`, itemIds);
      return { checklistId, itemIds };
    },
    onSuccess: (data) => {
      // Since we're not actually changing the database, we don't need to invalidate queries
      toast({
        title: "Itens reordenados",
        description: "A ordem dos itens foi atualizada.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao reordenar itens: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Reorder checklists mutation
  const reorderChecklistsMutation = useMutation({
    mutationFn: async (checklistIds: string[]) => {
      // We don't have a position field in the database,
      // so we're just logging the reordering for now.
      console.log(`Reordering checklists:`, checklistIds);
      return checklistIds;
    },
    onSuccess: (data) => {
      // Since we're not actually changing the database, we don't need to invalidate queries
      toast({
        title: "Checklists reordenadas",
        description: "A ordem das checklists foi atualizada.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao reordenar checklists: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleCreateChecklist = () => {
    if (!newChecklist.name) {
      toast({
        title: "Informações ausentes",
        description: "Por favor, forneça um nome para sua checklist.",
        variant: "destructive",
      });
      return;
    }

    createChecklistMutation.mutate({
      name: newChecklist.name,
      description: newChecklist.description || '',
      pointId: newChecklist.pointId,
    });
  };

  const handleEditChecklist = (id: string) => {
    const checklistToEdit = checklists.find(c => c.id === id);
    if (checklistToEdit) {
      setCurrentChecklist(checklistToEdit);
      setNewChecklist({
        name: checklistToEdit.name,
        description: checklistToEdit.description || '',
        pointId: checklistToEdit.pointId,
      });
      setIsEditDialogOpen(true);
    }
  };

  const handleUpdateChecklist = () => {
    if (!currentChecklist || !newChecklist.name) {
      toast({
        title: "Informações ausentes",
        description: "Por favor, forneça um nome para sua checklist.",
        variant: "destructive",
      });
      return;
    }

    updateChecklistMutation.mutate({
      id: currentChecklist.id,
      checklist: newChecklist,
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
        title: "Informações ausentes",
        description: "Por favor, forneça um texto para seu item.",
        variant: "destructive",
      });
      return;
    }

    createChecklistItemMutation.mutate({
      checklistId: currentChecklist.id,
      text: newItemText.trim(),
    });
  };

  const handleCreateMultipleItems = (items: string[]) => {
    if (!currentChecklist || items.length === 0) return;

    createMultipleChecklistItemsMutation.mutate({
      checklistId: currentChecklist.id,
      items,
    });
  };

  // Handler for updating a checklist item's text
  const handleUpdateItemText = (id: string, text: string) => {
    if (!text.trim()) {
      toast({
        title: "Informações ausentes",
        description: "O texto do item não pode estar vazio.",
        variant: "destructive",
      });
      return;
    }

    updateChecklistItemTextMutation.mutate({
      id,
      text: text.trim(),
    });
  };

  // Handler for reordering checklist items
  const handleReorderItems = (checklistId: string, itemIds: string[]) => {
    reorderChecklistItemsMutation.mutate({ checklistId, itemIds });
  };

  // Handler for reordering checklists
  const handleReorderChecklists = (checklistIds: string[]) => {
    reorderChecklistsMutation.mutate(checklistIds);
  };

  const resetChecklistForm = () => {
    setNewChecklist({
      name: '',
      description: '',
      pointId: null,
      isComplete: false,
    });
  };

  if (isLoadingChecklists) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-travel-blue" />
          <span className="ml-2">Carregando checklists...</span>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-travel-dark">Checklists</h1>
          <p className="text-travel-dark/70">Gerencie suas checklists e tarefas de viagem</p>
        </div>
        <div className="flex gap-4 items-center">
          <ChecklistViewToggle currentView={viewMode} onViewChange={setViewMode} />
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-travel-mustard hover:bg-travel-mustard/80 text-travel-dark">
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Checklist
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar uma Nova Checklist</DialogTitle>
                <DialogDescription>
                  Adicione uma nova checklist para organizar suas tarefas.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={newChecklist.name}
                    onChange={(e) => setNewChecklist({ ...newChecklist, name: e.target.value })}
                    placeholder="ex: Itens Essenciais para Paris"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Descrição (opcional)</Label>
                  <Textarea
                    id="description"
                    value={newChecklist.description || ''}
                    onChange={(e) => setNewChecklist({ ...newChecklist, description: e.target.value })}
                    placeholder="Breve descrição desta checklist..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="point">Ponto Associado (opcional)</Label>
                  <Select
                    value={newChecklist.pointId || 'none'}
                    onValueChange={(value) => setNewChecklist({ ...newChecklist, pointId: value === 'none' ? null : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um ponto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {points.map((point) => (
                        <SelectItem key={point.id} value={point.id}>
                          {point.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateChecklist}
                  disabled={createChecklistMutation.isPending}
                  className="bg-travel-mustard hover:bg-travel-mustard/80 text-travel-dark"
                >
                  {createChecklistMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    "Criar Checklist"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {checklists.length === 0 ? (
        <motion.div 
          className="flex flex-col items-center justify-center h-[400px] bg-travel-beige/50 rounded-lg border border-travel-mustard/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <ClipboardList className="h-16 w-16 text-travel-mustard/50 mb-4" />
          <h3 className="text-xl font-medium text-travel-dark">Nenhuma checklist ainda</h3>
          <p className="text-travel-dark/70 mb-4">Crie sua primeira checklist para começar a organizar suas tarefas</p>
          <Button 
            className="bg-travel-mustard hover:bg-travel-mustard/80 text-travel-dark"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Criar Sua Primeira Checklist
          </Button>
        </motion.div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <ChecklistCardView
              checklists={checklists}
              checklistItems={checklistItems}
              points={points}
              onEdit={handleEditChecklist}
              onDelete={(id) => deleteChecklistMutation.mutate(id)}
              onChecklistView={handleViewChecklist}
              onToggleItem={(id, completed) => toggleChecklistItemMutation.mutate({ id, completed })}
              onDeleteItem={(id) => deleteChecklistItemMutation.mutate(id)}
              onAddItem={handleAddItem}
              onBulkAddItems={handleBulkAddItems}
              onUpdateItemText={handleUpdateItemText}
              onReorderItems={handleReorderItems}
              onReorderChecklists={handleReorderChecklists}
            />
          ) : (
            <ChecklistListView 
              checklists={checklists}
              checklistItems={checklistItems}
              onEdit={handleEditChecklist}
              onDelete={(id) => deleteChecklistMutation.mutate(id)}
              onChecklistView={handleViewChecklist}
              onToggleItem={(id, completed) => toggleChecklistItemMutation.mutate({ id, completed })}
              onDeleteItem={(id) => deleteChecklistItemMutation.mutate(id)}
              onAddItem={handleAddItem}
              onBulkAddItems={handleBulkAddItems}
              onUpdateItemText={handleUpdateItemText}
              onReorderItems={handleReorderItems}
              onReorderChecklists={handleReorderChecklists}
            />
          )}
        </>
      )}

      {/* Edit Checklist Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Checklist</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nome</Label>
              <Input
                id="edit-name"
                value={newChecklist.name}
                onChange={(e) => setNewChecklist({ ...newChecklist, name: e.target.value })}
                placeholder="ex: Itens Essenciais para Paris"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Descrição (opcional)</Label>
              <Textarea
                id="edit-description"
                value={newChecklist.description || ''}
                onChange={(e) => setNewChecklist({ ...newChecklist, description: e.target.value })}
                placeholder="Breve descrição desta checklist..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-point">Ponto Associado (opcional)</Label>
              <Select
                value={newChecklist.pointId || 'none'}
                onValueChange={(value) => setNewChecklist({ ...newChecklist, pointId: value === 'none' ? null : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um ponto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {points.map((point) => (
                    <SelectItem key={point.id} value={point.id}>
                      {point.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditDialogOpen(false);
                setCurrentChecklist(null);
                resetChecklistForm();
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateChecklist}
              disabled={updateChecklistMutation.isPending}
              className="bg-travel-mustard hover:bg-travel-mustard/80 text-travel-dark"
            >
              {updateChecklistMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Atualizando...
                </>
              ) : (
                "Atualizar Checklist"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Checklist Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{currentChecklist?.name}</DialogTitle>
            <DialogDescription>
              {currentChecklist?.description || 'Sem descrição'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {currentChecklist && (
              <>
                {points.find(p => p.id === (currentChecklist.pointId || currentChecklist.point_id)) && (
                  <div className="flex items-start gap-2 mb-4">
                    <MapPin className="h-4 w-4 text-travel-blue mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-travel-dark/70">
                      {points.find(p => p.id === (currentChecklist.pointId || currentChecklist.point_id))?.name}
                    </span>
                  </div>
                )}
                <div className="space-y-3 mt-4">
                  {checklistItems
                    .filter(item => item.checklist_id === currentChecklist.id)
                    .map(item => (
                      <div key={item.id} className="flex items-center justify-between group">
                        <div className="flex items-center gap-2">
                          <Checkbox 
                            id={`view-item-${item.id}`}
                            checked={item.completed}
                            onCheckedChange={(checked) => 
                              toggleChecklistItemMutation.mutate({
                                id: item.id,
                                completed: checked as boolean
                              })
                            }
                          />
                          <label
                            htmlFor={`view-item-${item.id}`}
                            className={`text-sm ${
                              item.completed ? 'line-through text-travel-dark/50' : 'text-travel-dark'
                            }`}
                          >
                            {item.text}
                          </label>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                            onClick={() => {
                              const newText = prompt("Editar item:", item.text);
                              if (newText !== null) {
                                handleUpdateItemText(item.id, newText);
                              }
                            }}
                          >
                            <Edit className="h-3 w-3 text-travel-blue" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                            onClick={() => deleteChecklistItemMutation.mutate(item.id)}
                          >
                            <Trash className="h-3 w-3 text-travel-red" />
                          </Button>
                        </div>
                      </div>
                    ))
                  }
                </div>
                {checklistItems.filter(item => item.checklist_id === currentChecklist.id).length === 0 && (
                  <div className="text-center py-8 text-travel-dark/60">
                    <p>Nenhum item nesta checklist ainda.</p>
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter className="flex justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-travel-blue border-travel-blue/30 hover:bg-travel-light-blue/10 hover:text-travel-blue"
                onClick={() => {
                  if (currentChecklist) {
                    setIsViewDialogOpen(false);
                    setIsAddItemDialogOpen(true);
                  }
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Item
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-travel-blue border-travel-blue/30 hover:bg-travel-light-blue/10 hover:text-travel-blue"
                onClick={() => {
                  if (currentChecklist) {
                    setIsViewDialogOpen(false);
                    setIsBulkAddDialogOpen(true);
                  }
                }}
              >
                <ListChecks className="h-4 w-4 mr-1" />
                Adicionar Vários
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={() => setIsViewDialogOpen(false)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={isAddItemDialogOpen} onOpenChange={setIsAddItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Item a {currentChecklist?.name}</DialogTitle>
            <DialogDescription>
              Adicione um novo item à sua checklist.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="item-text">Texto do Item</Label>
              <Input
                id="item-text"
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                placeholder="ex: Passaporte"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddItemDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateItem}
              disabled={createChecklistItemMutation.isPending || !newItemText.trim()}
              className="bg-travel-mustard hover:bg-travel-mustard/80 text-travel-dark"
            >
              {createChecklistItemMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adicionando...
                </>
              ) : (
                "Adicionar Item"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Add Items Dialog */}
      <BulkItemsDialog
        checklistId={currentChecklist?.id || ''}
        checklistName={currentChecklist?.name || ''}
        open={isBulkAddDialogOpen}
        onOpenChange={setIsBulkAddDialogOpen}
        onAddItems={handleCreateMultipleItems}
        isAdding={createMultipleChecklistItemsMutation.isPending}
      />
    </PageContainer>
  );
};

export default Checklists;
