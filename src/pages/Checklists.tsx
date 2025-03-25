
import React, { useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Checklist, ChecklistItem, Point } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { PlusCircle, Edit, Trash, ListChecks, ClipboardList, Loader2, MapPin } from 'lucide-react';
import ChecklistViewToggle from '@/components/checklists/ChecklistViewToggle';
import ChecklistListView from '@/components/checklists/ChecklistListView';

const Checklists = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
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
        throw new Error("User not authenticated");
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
        throw new Error("User not authenticated");
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
        throw new Error("User not authenticated");
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
        console.error("Error creating checklist:", error);
        throw error;
      }
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
      setIsAddDialogOpen(false);
      toast({
        title: "Checklist created",
        description: "Your new checklist has been created successfully.",
      });
      resetChecklistForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create checklist: ${error.message}`,
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
        title: "Checklist updated",
        description: "Your checklist has been updated successfully.",
      });
      setCurrentChecklist(null);
      resetChecklistForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update checklist: ${error.message}`,
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
        title: "Checklist deleted",
        description: "The checklist has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete checklist: ${error.message}`,
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
        title: "Item added",
        description: "The item has been added to your checklist.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add item: ${error.message}`,
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
        title: "Error",
        description: `Failed to update item: ${error.message}`,
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
        title: "Item deleted",
        description: "The item has been removed from your checklist.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete item: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleCreateChecklist = () => {
    if (!newChecklist.name) {
      toast({
        title: "Missing information",
        description: "Please provide a name for your checklist.",
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
        title: "Missing information",
        description: "Please provide a name for your checklist.",
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

  const handleCreateItem = () => {
    if (!currentChecklist || !newItemText.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide text for your item.",
        variant: "destructive",
      });
      return;
    }

    createChecklistItemMutation.mutate({
      checklistId: currentChecklist.id,
      text: newItemText.trim(),
    });
  };

  const resetChecklistForm = () => {
    setNewChecklist({
      name: '',
      description: '',
      pointId: null,
      isComplete: false,
    });
  };

  // Calculate completion percentage for a checklist
  const calculateCompletion = (checklistId: string) => {
    const items = checklistItems.filter(item => item.checklist_id === checklistId);
    if (items.length === 0) return 0;
    const completedItems = items.filter(item => item.completed).length;
    return Math.round((completedItems / items.length) * 100);
  };

  // Find the associated point for a checklist
  const getAssociatedPoint = (pointId: string | null | undefined) => {
    if (!pointId) return null;
    return points.find(p => p.id === pointId);
  };

  if (isLoadingChecklists) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-travel-blue" />
          <span className="ml-2">Loading checklists...</span>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-travel-dark">Checklists</h1>
          <p className="text-travel-dark/70">Manage your travel checklists and tasks</p>
        </div>
        <div className="flex gap-4 items-center">
          <ChecklistViewToggle currentView={viewMode} onViewChange={setViewMode} />
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-travel-mustard hover:bg-travel-mustard/80 text-travel-dark">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Checklist
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a New Checklist</DialogTitle>
                <DialogDescription>
                  Add a new checklist to organize your tasks.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newChecklist.name}
                    onChange={(e) => setNewChecklist({ ...newChecklist, name: e.target.value })}
                    placeholder="e.g., Paris Trip Essentials"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={newChecklist.description || ''}
                    onChange={(e) => setNewChecklist({ ...newChecklist, description: e.target.value })}
                    placeholder="Brief description of this checklist..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="point">Associated Point (optional)</Label>
                  <Select
                    value={newChecklist.pointId || ''}
                    onValueChange={(value) => setNewChecklist({ ...newChecklist, pointId: value || null })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a point" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
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
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateChecklist}
                  disabled={createChecklistMutation.isPending}
                  className="bg-travel-mustard hover:bg-travel-mustard/80 text-travel-dark"
                >
                  {createChecklistMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Checklist"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {checklists.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[400px] bg-travel-beige/50 rounded-lg border border-travel-mustard/20">
          <ClipboardList className="h-16 w-16 text-travel-mustard/50 mb-4" />
          <h3 className="text-xl font-medium text-travel-dark">No checklists yet</h3>
          <p className="text-travel-dark/70 mb-4">Create your first checklist to start organizing your tasks</p>
          <Button 
            className="bg-travel-mustard hover:bg-travel-mustard/80 text-travel-dark"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Your First Checklist
          </Button>
        </div>
      ) : (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {checklists.map((checklist) => {
              const completionPercentage = calculateCompletion(checklist.id);
              const associatedPoint = getAssociatedPoint(checklist.pointId || checklist.point_id);
              
              return (
                <Card key={checklist.id} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{checklist.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {new Date(checklist.createdAt || checklist.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleEditChecklist(checklist.id)}
                        >
                          <Edit className="h-4 w-4 text-travel-blue" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8" 
                          onClick={() => deleteChecklistMutation.mutate(checklist.id)}
                        >
                          <Trash className="h-4 w-4 text-travel-red" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-travel-dark/80 mb-4">{checklist.description || 'No description'}</p>
                    
                    {associatedPoint && (
                      <div className="flex items-start gap-2 mb-4">
                        <MapPin className="h-4 w-4 text-travel-blue mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-travel-dark/70">{associatedPoint.name}</span>
                      </div>
                    )}
                    
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-travel-dark/70">Completion</span>
                        <span className="text-xs font-medium">{completionPercentage}%</span>
                      </div>
                      <Progress value={completionPercentage} className="h-2" />
                    </div>
                    
                    <div className="space-y-2 mt-4">
                      {checklistItems
                        .filter(item => item.checklist_id === checklist.id)
                        .slice(0, 3)
                        .map(item => (
                          <div key={item.id} className="flex items-center justify-between group">
                            <div className="flex items-center gap-2">
                              <Checkbox 
                                id={`item-${item.id}`}
                                checked={item.completed}
                                onCheckedChange={(checked) => 
                                  toggleChecklistItemMutation.mutate({
                                    id: item.id,
                                    completed: checked as boolean
                                  })
                                }
                              />
                              <label
                                htmlFor={`item-${item.id}`}
                                className={`text-sm ${
                                  item.completed ? 'line-through text-travel-dark/50' : 'text-travel-dark'
                                }`}
                              >
                                {item.text}
                              </label>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                              onClick={() => deleteChecklistItemMutation.mutate(item.id)}
                            >
                              <Trash className="h-3 w-3 text-travel-red" />
                            </Button>
                          </div>
                        ))}
                    </div>
                    
                    {checklistItems.filter(item => item.checklist_id === checklist.id).length > 3 && (
                      <p className="text-xs text-travel-dark/50 mt-2">
                        +{checklistItems.filter(item => item.checklist_id === checklist.id).length - 3} more items
                      </p>
                    )}
                  </CardContent>
                  <CardFooter>
                    <div className="w-full flex justify-between items-center">
                      <Button 
                        variant="ghost"
                        size="sm"
                        className="text-travel-blue p-0"
                        onClick={() => handleAddItem(checklist.id)}
                      >
                        <PlusCircle className="h-4 w-4 mr-1" />
                        Add Item
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-travel-dark"
                        onClick={() => handleViewChecklist(checklist.id)}
                      >
                        <ListChecks className="h-4 w-4 mr-1" />
                        View All
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
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
          />
        )
      )}

      {/* Edit Checklist Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Checklist</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={newChecklist.name}
                onChange={(e) => setNewChecklist({ ...newChecklist, name: e.target.value })}
                placeholder="e.g., Paris Trip Essentials"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description (optional)</Label>
              <Textarea
                id="edit-description"
                value={newChecklist.description || ''}
                onChange={(e) => setNewChecklist({ ...newChecklist, description: e.target.value })}
                placeholder="Brief description of this checklist..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-point">Associated Point (optional)</Label>
              <Select
                value={newChecklist.pointId || ''}
                onValueChange={(value) => setNewChecklist({ ...newChecklist, pointId: value || null })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a point" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
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
              Cancel
            </Button>
            <Button
              onClick={handleUpdateChecklist}
              disabled={updateChecklistMutation.isPending}
              className="bg-travel-mustard hover:bg-travel-mustard/80 text-travel-dark"
            >
              {updateChecklistMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Checklist"
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
              {currentChecklist?.description || 'No description'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {currentChecklist && (
              <>
                {getAssociatedPoint(currentChecklist.pointId || currentChecklist.point_id) && (
                  <div className="flex items-center gap-2 mb-4 text-travel-dark/70">
                    <MapPin className="h-4 w-4 text-travel-blue" />
                    <span>
                      Associated with: {getAssociatedPoint(currentChecklist.pointId || currentChecklist.point_id)?.name}
                    </span>
                  </div>
                )}
                
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-travel-dark/70">Completion</span>
                    <span className="text-xs font-medium">{calculateCompletion(currentChecklist.id)}%</span>
                  </div>
                  <Progress value={calculateCompletion(currentChecklist.id)} className="h-2" />
                </div>
                
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {checklistItems
                    .filter(item => item.checklist_id === currentChecklist.id)
                    .map(item => (
                      <div key={item.id} className="py-3 flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <Checkbox 
                            id={`item-${item.id}`}
                            checked={item.completed}
                            onCheckedChange={(checked) => 
                              toggleChecklistItemMutation.mutate({
                                id: item.id,
                                completed: checked as boolean
                              })
                            }
                          />
                          <label
                            htmlFor={`item-${item.id}`}
                            className={`${
                              item.completed ? 'line-through text-travel-dark/50' : 'text-travel-dark'
                            }`}
                          >
                            {item.text}
                          </label>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0"
                          onClick={() => deleteChecklistItemMutation.mutate(item.id)}
                        >
                          <Trash className="h-4 w-4 text-travel-red" />
                        </Button>
                      </div>
                    ))}
                    
                  {checklistItems.filter(item => item.checklist_id === currentChecklist.id).length === 0 && (
                    <div className="text-center py-8 text-travel-dark/50">
                      <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      <p>No items in this checklist yet</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button
              variant="outline"
              className="text-travel-blue"
              onClick={() => {
                if (currentChecklist) {
                  handleAddItem(currentChecklist.id);
                  setIsViewDialogOpen(false);
                }
              }}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Item
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsViewDialogOpen(false);
                setCurrentChecklist(null);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={isAddItemDialogOpen} onOpenChange={setIsAddItemDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Add Item to {currentChecklist?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="grid gap-2">
              <Label htmlFor="item-text">Item Text</Label>
              <Input
                id="item-text"
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                placeholder="e.g., Pack passport"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsAddItemDialogOpen(false);
                setNewItemText('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateItem}
              disabled={createChecklistItemMutation.isPending}
              className="bg-travel-mustard hover:bg-travel-mustard/80 text-travel-dark"
            >
              {createChecklistItemMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Item"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
};

export default Checklists;
