import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CheckCircle, Clock, Edit, MapPin, MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Checklist, ChecklistItem, Point } from '@/lib/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const Checklists: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // State for checklist form
  const [newChecklist, setNewChecklist] = useState<{
    name: string;
    description: string;
    pointId: string | null;
  }>({
    name: '',
    description: '',
    pointId: null,
  });
  
  // State for checklist item form
  const [newItem, setNewItem] = useState<{
    text: string;
    checklistId: string | null;
  }>({
    text: '',
    checklistId: null,
  });
  
  // State for dialogs
  const [isNewChecklistOpen, setIsNewChecklistOpen] = useState(false);
  const [isNewItemOpen, setIsNewItemOpen] = useState(false);
  const [isEditChecklistOpen, setIsEditChecklistOpen] = useState(false);
  const [editingChecklist, setEditingChecklist] = useState<Checklist | null>(null);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);

  // Fetch user's checklists
  const { data: checklists, isLoading: isLoadingChecklists } = useQuery({
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
      
      // Convert snake_case to camelCase for TypeScript compatibility
      return (data as Checklist[]).map(checklist => ({
        ...checklist,
        pointId: checklist.point_id,
        createdAt: checklist.created_at,
        isComplete: checklist.is_complete,
        items: []
      }));
    },
  });

  // Fetch user's points for the dropdown
  const { data: points } = useQuery({
    queryKey: ['points'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('points')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Point[];
    },
  });

  // Fetch checklist items for all checklists
  const { data: checklistItems } = useQuery({
    queryKey: ['checklistItems'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checklist_items')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as ChecklistItem[];
    },
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
      toast({
        title: 'Success',
        description: 'Checklist created successfully',
      });
      setNewChecklist({ name: '', description: '', pointId: null });
      setIsNewChecklistOpen(false);
    },
    onError: (error) => {
      console.error('Error creating checklist:', error);
      toast({
        title: 'Error',
        description: 'Failed to create checklist',
        variant: 'destructive',
      });
    },
  });

  // Update checklist mutation
  const updateChecklistMutation = useMutation({
    mutationFn: async (checklist: Checklist) => {
      const { data, error } = await supabase
        .from('checklists')
        .update({ 
          name: checklist.name, 
          description: checklist.description,
          point_id: checklist.pointId || checklist.point_id,
          is_complete: checklist.isComplete || checklist.is_complete
        })
        .eq('id', checklist.id)
        .select();
      
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
      toast({
        title: 'Success',
        description: 'Checklist updated successfully',
      });
      setEditingChecklist(null);
      setIsEditChecklistOpen(false);
    },
    onError: (error) => {
      console.error('Error updating checklist:', error);
      toast({
        title: 'Error',
        description: 'Failed to update checklist',
        variant: 'destructive',
      });
    },
  });

  // Delete checklist mutation
  const deleteChecklistMutation = useMutation({
    mutationFn: async (checklistId: string) => {
      const { error } = await supabase
        .from('checklists')
        .delete()
        .eq('id', checklistId);
      
      if (error) throw error;
      return checklistId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
      toast({
        title: 'Success',
        description: 'Checklist deleted successfully',
      });
    },
    onError: (error) => {
      console.error('Error deleting checklist:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete checklist',
        variant: 'destructive',
      });
    },
  });

  // Create checklist item mutation
  const createChecklistItemMutation = useMutation({
    mutationFn: async (item: { text: string; checklistId: string }) => {
      const { data, error } = await supabase
        .from('checklist_items')
        .insert([
          { 
            text: item.text, 
            checklist_id: item.checklistId,
            completed: false
          }
        ])
        .select();
      
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklistItems'] });
      toast({
        title: 'Success',
        description: 'Item added successfully',
      });
      setNewItem({ text: '', checklistId: null });
      setIsNewItemOpen(false);
    },
    onError: (error) => {
      console.error('Error creating checklist item:', error);
      toast({
        title: 'Error',
        description: 'Failed to add item',
        variant: 'destructive',
      });
    },
  });

  // Update checklist item mutation
  const updateChecklistItemMutation = useMutation({
    mutationFn: async (item: { id: string; completed: boolean }) => {
      const { data, error } = await supabase
        .from('checklist_items')
        .update({ completed: item.completed })
        .eq('id', item.id)
        .select();
      
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklistItems'] });
      checkAndUpdateChecklistStatus();
    },
    onError: (error) => {
      console.error('Error updating checklist item:', error);
      toast({
        title: 'Error',
        description: 'Failed to update item',
        variant: 'destructive',
      });
    },
  });

  // Delete checklist item mutation
  const deleteChecklistItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('checklist_items')
        .delete()
        .eq('id', itemId);
      
      if (error) throw error;
      return itemId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklistItems'] });
      toast({
        title: 'Success',
        description: 'Item deleted successfully',
      });
      checkAndUpdateChecklistStatus();
    },
    onError: (error) => {
      console.error('Error deleting checklist item:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete item',
        variant: 'destructive',
      });
    },
  });

  // Function to check and update checklist completion status
  const checkAndUpdateChecklistStatus = () => {
    if (!checklists || !checklistItems) return;
    
    checklists.forEach(checklist => {
      const items = checklistItems.filter(item => item.checklist_id === checklist.id);
      if (items.length === 0) return;
      
      const allCompleted = items.every(item => item.completed);
      if (allCompleted !== checklist.is_complete) {
        updateChecklistMutation.mutate({
          ...checklist,
          isComplete: allCompleted
        });
      }
    });
  };

  // Function to handle new checklist submission
  const handleCreateChecklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklist.name) {
      toast({
        title: 'Error',
        description: 'Please enter a checklist name',
        variant: 'destructive',
      });
      return;
    }
    
    createChecklistMutation.mutate(newChecklist);
  };

  // Function to handle edit checklist submission
  const handleUpdateChecklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChecklist) return;
    
    updateChecklistMutation.mutate(editingChecklist);
  };

  // Function to handle new checklist item submission
  const handleCreateChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.text || !newItem.checklistId) {
      toast({
        title: 'Error',
        description: 'Please enter an item text',
        variant: 'destructive',
      });
      return;
    }
    
    createChecklistItemMutation.mutate({
      text: newItem.text,
      checklistId: newItem.checklistId
    });
  };

  // Function to toggle checklist item completion
  const toggleItemCompletion = (item: ChecklistItem) => {
    updateChecklistItemMutation.mutate({
      id: item.id,
      completed: !item.completed
    });
  };

  // Function to delete checklist item
  const deleteChecklistItem = (itemId: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      deleteChecklistItemMutation.mutate(itemId);
    }
  };

  // Function to delete checklist
  const deleteChecklist = (checklistId: string) => {
    if (confirm('Are you sure you want to delete this checklist?')) {
      deleteChecklistMutation.mutate(checklistId);
    }
  };

  // Function to open edit checklist dialog
  const openEditDialog = (checklist: Checklist) => {
    setEditingChecklist({
      ...checklist,
      pointId: checklist.point_id || checklist.pointId || null
    });
    setIsEditChecklistOpen(true);
  };

  // Function to open new item dialog
  const openNewItemDialog = (checklistId: string) => {
    setNewItem({
      text: '',
      checklistId
    });
    setIsNewItemOpen(true);
  };

  // Function to get point name by ID
  const getPointNameById = (pointId: string | null) => {
    if (!pointId || !points) return 'None';
    const point = points.find(p => p.id === pointId);
    return point ? point.name : 'None';
  };

  // Function to calculate checklist progress
  const calculateProgress = (checklistId: string) => {
    if (!checklistItems) return { completed: 0, total: 0, percentage: 0 };
    
    const items = checklistItems.filter(item => item.checklist_id === checklistId);
    const completed = items.filter(item => item.completed).length;
    const total = items.length;
    const percentage = total ? Math.round((completed / total) * 100) : 0;
    
    return { completed, total, percentage };
  };

  return (
    <PageContainer>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-travel-dark">Travel Checklists</h1>
          <p className="text-travel-dark/70">Create and manage checklists for your trips</p>
        </div>
        <Button 
          className="bg-travel-mustard hover:bg-travel-mustard/90 text-travel-dark"
          onClick={() => setIsNewChecklistOpen(true)}
        >
          <Plus className="mr-1 h-4 w-4" /> New Checklist
        </Button>
      </div>
      
      {isLoadingChecklists ? (
        <div className="flex items-center justify-center h-64">
          <p>Loading checklists...</p>
        </div>
      ) : (!checklists || checklists.length === 0) ? (
        <div className="flex flex-col items-center justify-center h-[400px] bg-travel-beige/50 rounded-lg border border-travel-mustard/20">
          <h3 className="text-xl font-medium text-travel-dark">No Checklists Yet</h3>
          <p className="text-travel-dark/70 mt-2 mb-4">Create your first checklist to keep track of your travel items</p>
          <Button 
            className="bg-travel-mustard hover:bg-travel-mustard/90 text-travel-dark"
            onClick={() => setIsNewChecklistOpen(true)}
          >
            <Plus className="mr-1 h-4 w-4" /> Create Checklist
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {checklists.map(checklist => {
            const progress = calculateProgress(checklist.id);
            return (
              <div 
                key={checklist.id} 
                className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
              >
                <div className="p-4 md:p-6 border-b border-gray-100">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center">
                      <h3 className="text-xl font-semibold text-travel-dark">{checklist.name}</h3>
                      {checklist.is_complete && (
                        <CheckCircle className="ml-2 h-5 w-5 text-green-500" />
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openNewItemDialog(checklist.id)}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add Item
                      </Button>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-40 p-2">
                          <div className="flex flex-col space-y-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="justify-start"
                              onClick={() => openEditDialog(checklist)}
                            >
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="justify-start text-red-500"
                              onClick={() => deleteChecklist(checklist.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  
                  {checklist.description && (
                    <p className="text-travel-dark/70 mb-3">{checklist.description}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                    {(checklist.point_id || checklist.pointId) && (
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1 text-travel-red" />
                        <span>{getPointNameById(checklist.point_id || checklist.pointId)}</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1 text-travel-blue" />
                      <span>{new Date(checklist.created_at || checklist.createdAt || '').toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium text-gray-700">{progress.completed}/{progress.total} completed</span>
                      <span className="ml-2 text-xs bg-travel-beige/50 rounded-full px-2 py-0.5">
                        {progress.percentage}%
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 md:p-6">
                  {checklistItems && checklistItems.filter(item => item.checklist_id === checklist.id).length > 0 ? (
                    <ul className="divide-y divide-gray-100">
                      {checklistItems
                        .filter(item => item.checklist_id === checklist.id)
                        .map(item => (
                          <li key={item.id} className="py-3 flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                              <Checkbox 
                                id={`item-${item.id}`}
                                checked={item.completed}
                                onCheckedChange={() => toggleItemCompletion(item)}
                              />
                              <label 
                                htmlFor={`item-${item.id}`}
                                className={`text-sm md:text-base ${item.completed ? 'line-through text-gray-400' : 'text-travel-dark'}`}
                              >
                                {item.text}
                              </label>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500 opacity-0 group-hover:opacity-100 focus:opacity-100"
                              onClick={() => deleteChecklistItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </li>
                        ))}
                    </ul>
                  ) : (
                    <div className="text-center py-6 text-gray-400">
                      <p>No items in this checklist</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => openNewItemDialog(checklist.id)}
                      >
                        <Plus className="mr-1 h-4 w-4" /> Add Item
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Checklist Dialog */}
      <Dialog open={isNewChecklistOpen} onOpenChange={setIsNewChecklistOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Checklist</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateChecklist}>
            <div className="space-y-4 py-2">
              <div>
                <label htmlFor="name" className="text-sm font-medium block mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="name"
                  value={newChecklist.name}
                  onChange={(e) => setNewChecklist({...newChecklist, name: e.target.value})}
                  placeholder="e.g., Trip to Paris Checklist"
                  className="w-full"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="description" className="text-sm font-medium block mb-1">
                  Description
                </label>
                <Textarea
                  id="description"
                  value={newChecklist.description}
                  onChange={(e) => setNewChecklist({...newChecklist, description: e.target.value})}
                  placeholder="Optional description for your checklist"
                  className="w-full"
                />
              </div>
              
              <div>
                <label htmlFor="pointId" className="text-sm font-medium block mb-1">
                  Associated Point
                </label>
                <select
                  id="pointId"
                  value={newChecklist.pointId || ''}
                  onChange={(e) => setNewChecklist({
                    ...newChecklist, 
                    pointId: e.target.value === '' ? null : e.target.value
                  })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Not associated with a point</option>
                  {points && points.map(point => (
                    <option key={point.id} value={point.id}>
                      {point.name} - {point.type}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setIsNewChecklistOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-travel-mustard text-travel-dark hover:bg-travel-mustard/90">
                Create Checklist
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Checklist Dialog */}
      <Dialog open={isEditChecklistOpen} onOpenChange={setIsEditChecklistOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Checklist</DialogTitle>
          </DialogHeader>
          {editingChecklist && (
            <form onSubmit={handleUpdateChecklist}>
              <div className="space-y-4 py-2">
                <div>
                  <label htmlFor="edit-name" className="text-sm font-medium block mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="edit-name"
                    value={editingChecklist.name}
                    onChange={(e) => setEditingChecklist({...editingChecklist, name: e.target.value})}
                    placeholder="e.g., Trip to Paris Checklist"
                    className="w-full"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="edit-description" className="text-sm font-medium block mb-1">
                    Description
                  </label>
                  <Textarea
                    id="edit-description"
                    value={editingChecklist.description || ''}
                    onChange={(e) => setEditingChecklist({...editingChecklist, description: e.target.value})}
                    placeholder="Optional description for your checklist"
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label htmlFor="edit-pointId" className="text-sm font-medium block mb-1">
                    Associated Point
                  </label>
                  <select
                    id="edit-pointId"
                    value={editingChecklist.pointId || editingChecklist.point_id || ''}
                    onChange={(e) => setEditingChecklist({
                      ...editingChecklist, 
                      pointId: e.target.value === '' ? null : e.target.value
                    })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Not associated with a point</option>
                    {points && points.map(point => (
                      <option key={point.id} value={point.id}>
                        {point.name} - {point.type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <DialogFooter className="mt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditChecklistOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-travel-mustard text-travel-dark hover:bg-travel-mustard/90">
                  Update Checklist
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* New Checklist Item Dialog */}
      <Dialog open={isNewItemOpen} onOpenChange={setIsNewItemOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Checklist Item</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateChecklistItem}>
            <div className="space-y-4 py-2">
              <div>
                <label htmlFor="item-text" className="text-sm font-medium block mb-1">
                  Item <span className="text-red-500">*</span>
                </label>
                <Input
                  id="item-text"
                  value={newItem.text}
                  onChange={(e) => setNewItem({...newItem, text: e.target.value})}
                  placeholder="e.g., Pack passport"
                  className="w-full"
                  required
                />
              </div>
            </div>
            
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setIsNewItemOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-travel-mustard text-travel-dark hover:bg-travel-mustard/90">
                Add Item
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
};

export default Checklists;
