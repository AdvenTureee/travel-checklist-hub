
import React, { useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingItem, Point } from '@/lib/types';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { 
  PlusCircle, 
  ShoppingCart, 
  Edit, 
  Trash, 
  Check, 
  X, 
  Loader2, 
  ChevronUp, 
  ChevronDown,
  Image as ImageIcon
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const Shopping: React.FC = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [newItem, setNewItem] = useState<Partial<ShoppingItem>>({
    name: '',
    price: 0,
    currency: 'USD',
    purchased: false,
    image_url: '',
    point_id: null,
  });
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch shopping items
  const {
    data: items = [],
    isLoading: isLoadingItems,
  } = useQuery({
    queryKey: ['shopping-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shopping_list_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ShoppingItem[];
    },
  });

  // Fetch points for reference
  const {
    data: points = [],
    isLoading: isLoadingPoints,
  } = useQuery({
    queryKey: ['points'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('points')
        .select('id, name');

      if (error) throw error;
      return data as Pick<Point, 'id' | 'name'>[];
    },
  });

  // Calculate total shopping cost
  const calculateTotal = () => {
    return items.reduce((acc, item) => acc + item.price, 0);
  };

  // Add item mutation
  const addItemMutation = useMutation({
    mutationFn: async (item: Omit<ShoppingItem, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('shopping_list_items')
        .insert([
          {
            name: item.name,
            price: item.price,
            currency: item.currency,
            purchased: item.purchased,
            image_url: item.image_url,
            point_id: item.point_id === 'none' ? null : item.point_id,
            user_id: user?.id
          }
        ])
        .select();

      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-items'] });
      setIsAddDialogOpen(false);
      toast({
        title: "Item added",
        description: `${newItem.name} has been added to your shopping list.`,
      });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error adding item",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update item mutation
  const updateItemMutation = useMutation({
    mutationFn: async ({ id, item }: { id: string, item: Partial<ShoppingItem> }) => {
      const { data, error } = await supabase
        .from('shopping_list_items')
        .update({
          name: item.name,
          price: item.price,
          currency: item.currency,
          image_url: item.image_url,
          point_id: item.point_id === 'none' ? null : item.point_id,
        })
        .eq('id', id)
        .select();

      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-items'] });
      setIsEditDialogOpen(false);
      setEditItemId(null);
      toast({
        title: "Item updated",
        description: `${newItem.name} has been updated.`,
      });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error updating item",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('shopping_list_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['shopping-items'] });
      const itemToDelete = items.find(i => i.id === id);
      toast({
        title: "Item deleted",
        description: `${itemToDelete?.name} has been removed.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting item",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Toggle purchased status mutation
  const togglePurchasedMutation = useMutation({
    mutationFn: async ({ id, purchased }: { id: string, purchased: boolean }) => {
      const { data, error } = await supabase
        .from('shopping_list_items')
        .update({ purchased })
        .eq('id', id)
        .select();

      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-items'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleAddItem = () => {
    if (!newItem.name || newItem.price === undefined) {
      toast({
        title: "Missing information",
        description: "Please fill in at least the name and price.",
        variant: "destructive",
      });
      return;
    }

    addItemMutation.mutate({
      name: newItem.name,
      price: Number(newItem.price),
      currency: newItem.currency || 'USD',
      purchased: false,
      image_url: newItem.image_url || null,
      point_id: newItem.point_id,
      user_id: user!.id
    } as any);
  };

  const handleTogglePurchased = (id: string, purchased: boolean) => {
    togglePurchasedMutation.mutate({ id, purchased: !purchased });
  };

  const handleEditItem = (id: string) => {
    const itemToEdit = items.find(i => i.id === id);
    if (itemToEdit) {
      setNewItem({
        name: itemToEdit.name,
        price: itemToEdit.price,
        currency: itemToEdit.currency,
        purchased: itemToEdit.purchased,
        image_url: itemToEdit.image_url || '',
        point_id: itemToEdit.point_id || 'none',
      });
      setEditItemId(id);
      setIsEditDialogOpen(true);
    }
  };

  const handleUpdateItem = () => {
    if (!newItem.name || newItem.price === undefined || !editItemId) {
      toast({
        title: "Missing information",
        description: "Please fill in at least the name and price.",
        variant: "destructive",
      });
      return;
    }

    updateItemMutation.mutate({ 
      id: editItemId, 
      item: newItem
    });
  };

  const handleDeleteItem = (id: string) => {
    deleteItemMutation.mutate(id);
  };

  const resetForm = () => {
    setNewItem({
      name: '',
      price: 0,
      currency: 'USD',
      purchased: false,
      image_url: '',
      point_id: null,
    });
  };

  const getPointName = (pointId: string | null) => {
    if (!pointId) return "N/A";
    const point = points.find(p => p.id === pointId);
    return point ? point.name : "N/A";
  };

  // Show loading state
  if (isLoadingItems || isLoadingPoints) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-travel-blue" />
          <span className="ml-2">Loading shopping items...</span>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-travel-dark">Shopping List</h1>
          <p className="text-travel-dark/70">Track items you want to buy during your trip</p>
        </div>
        <Button 
          className="bg-travel-mustard hover:bg-travel-mustard/80 text-travel-dark"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </div>

      {/* Summary Card */}
      <Card className="mb-6 overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl">Shopping Summary</CardTitle>
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleTrigger
                className="rounded-full p-1 hover:bg-travel-beige/50"
              >
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-travel-dark/70" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-travel-dark/70" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-2">
                  <div className="flex justify-between text-travel-dark">
                    <div>
                      <span className="font-medium">Total Items:</span>
                      <span className="ml-2">{items.length}</span>
                    </div>
                    <div>
                      <span className="font-medium">Purchased:</span>
                      <span className="ml-2">{items.filter(item => item.purchased).length}</span>
                    </div>
                    <div>
                      <span className="font-medium">Remaining:</span>
                      <span className="ml-2">{items.filter(item => !item.purchased).length}</span>
                    </div>
                    <div>
                      <span className="font-medium">Total Cost:</span>
                      <span className="ml-2">${calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </div>
          <CardDescription>Track your shopping expenses</CardDescription>
        </CardHeader>
      </Card>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[400px] bg-travel-beige/50 rounded-lg border border-travel-mustard/20">
          <ShoppingCart className="h-16 w-16 text-travel-mustard/50 mb-4" />
          <h3 className="text-xl font-medium text-travel-dark">No items in your shopping list</h3>
          <p className="text-travel-dark/70 mb-4">Start adding items you want to buy during your trip</p>
          <Button 
            className="bg-travel-mustard hover:bg-travel-mustard/80 text-travel-dark"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Your First Item
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead className="w-12">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow 
                  key={item.id}
                  className={item.purchased ? "bg-travel-beige/20 opacity-75" : ""}
                >
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 ${item.purchased ? 'bg-travel-mustard/10' : 'bg-travel-light-blue/20'}`}
                      onClick={() => handleTogglePurchased(item.id, item.purchased)}
                      aria-label={item.purchased ? "Mark as not purchased" : "Mark as purchased"}
                    >
                      {item.purchased ? (
                        <Check className="h-4 w-4 text-travel-mustard" />
                      ) : (
                        <ShoppingCart className="h-4 w-4 text-travel-blue" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>
                    {item.image_url ? (
                      <img 
                        src={item.image_url} 
                        alt={item.name} 
                        className="w-10 h-10 object-cover rounded-md"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-travel-beige/50 rounded-md flex items-center justify-center">
                        <ImageIcon className="h-5 w-5 text-travel-dark/40" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className={item.purchased ? "line-through text-travel-dark/60" : ""}>
                    {item.name}
                  </TableCell>
                  <TableCell>${item.price.toFixed(2)}</TableCell>
                  <TableCell>{getPointName(item.point_id)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEditItem(item.id)}
                      >
                        <Edit className="h-4 w-4 text-travel-blue" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        <Trash className="h-4 w-4 text-travel-red" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add Item Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Add Shopping Item</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Item Name</Label>
              <Input
                id="name"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                placeholder="e.g., Souvenir Magnet"
                className="w-full"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) })}
                  placeholder="0.00"
                  className="w-full"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="currency">Currency</Label>
                <Select 
                  value={newItem.currency} 
                  onValueChange={(value) => setNewItem({ ...newItem, currency: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="JPY">JPY (¥)</SelectItem>
                    <SelectItem value="CAD">CAD ($)</SelectItem>
                    <SelectItem value="AUD">AUD ($)</SelectItem>
                    <SelectItem value="CNY">CNY (¥)</SelectItem>
                    <SelectItem value="BRL">BRL (R$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="image_url">Image URL (optional)</Label>
              <Input
                id="image_url"
                value={newItem.image_url || ''}
                onChange={(e) => setNewItem({ ...newItem, image_url: e.target.value })}
                placeholder="https://example.com/image.jpg"
                className="w-full"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="point_id">Location (optional)</Label>
              <Select 
                value={newItem.point_id || 'none'} 
                onValueChange={(value) => setNewItem({ ...newItem, point_id: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {points.map((point) => (
                    <SelectItem key={point.id} value={point.id}>
                      {point.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                resetForm();
                setIsAddDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              className="bg-travel-mustard hover:bg-travel-mustard/80 text-travel-dark"
              onClick={handleAddItem}
              disabled={addItemMutation.isPending}
            >
              {addItemMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Item"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Shopping Item</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Item Name</Label>
              <Input
                id="edit-name"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                placeholder="e.g., Souvenir Magnet"
                className="w-full"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-price">Price</Label>
                <Input
                  id="edit-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) })}
                  placeholder="0.00"
                  className="w-full"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-currency">Currency</Label>
                <Select 
                  value={newItem.currency} 
                  onValueChange={(value) => setNewItem({ ...newItem, currency: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="JPY">JPY (¥)</SelectItem>
                    <SelectItem value="CAD">CAD ($)</SelectItem>
                    <SelectItem value="AUD">AUD ($)</SelectItem>
                    <SelectItem value="CNY">CNY (¥)</SelectItem>
                    <SelectItem value="BRL">BRL (R$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-image_url">Image URL (optional)</Label>
              <Input
                id="edit-image_url"
                value={newItem.image_url || ''}
                onChange={(e) => setNewItem({ ...newItem, image_url: e.target.value })}
                placeholder="https://example.com/image.jpg"
                className="w-full"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-point_id">Location (optional)</Label>
              <Select 
                value={newItem.point_id || 'none'} 
                onValueChange={(value) => setNewItem({ ...newItem, point_id: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {points.map((point) => (
                    <SelectItem key={point.id} value={point.id}>
                      {point.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                resetForm();
                setEditItemId(null);
                setIsEditDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              className="bg-travel-mustard hover:bg-travel-mustard/80 text-travel-dark"
              onClick={handleUpdateItem}
              disabled={updateItemMutation.isPending}
            >
              {updateItemMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Item"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
};

export default Shopping;
