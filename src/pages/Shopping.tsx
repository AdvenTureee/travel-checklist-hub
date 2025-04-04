import React, { useState, useEffect } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingItem, UserBudget, Point, Checklist } from '@/lib/types';
import { PlusCircle, ShoppingBag, Package, DollarSign, Loader2, Check, Trash } from 'lucide-react';

const Shopping: React.FC = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState<Partial<ShoppingItem>>({
    name: '',
    price: 0,
    currency: 'BRL',
    purchased: false,
  });
  const [budget, setBudget] = useState<Partial<UserBudget>>({
    amount: 0,
    currency: 'BRL',
  });
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch shopping items
  const {
    data: shoppingItems = [],
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

  // Fetch user budget
  const {
    data: userBudget,
    isLoading: isLoadingBudget,
  } = useQuery({
    queryKey: ['user-budget'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_budgets')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      return data[0] as UserBudget;
    },
  });

  // Fetch points for dropdown
  const {
    data: points = [],
    isLoading: isLoadingPoints,
  } = useQuery({
    queryKey: ['points'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('points')
        .select('id, name')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as Pick<Point, 'id' | 'name'>[];
    },
  });

  // Fetch checklists for dropdown
  const {
    data: checklists = [],
    isLoading: isLoadingChecklists,
  } = useQuery({
    queryKey: ['checklists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checklists')
        .select('id, name')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as Pick<Checklist, 'id' | 'name'>[];
    },
  });

  // Add shopping item mutation
  const addItemMutation = useMutation({
    mutationFn: async (item: Omit<ShoppingItem, 'id' | 'created_at' | 'user_id'>) => {
      const { data, error } = await supabase
        .from('shopping_list_items')
        .insert([
          {
            name: item.name,
            price: item.price,
            currency: item.currency,
            image_url: item.image_url,
            point_id: item.point_id || null,
            checklist_id: item.checklist_id || null,
            purchased: item.purchased,
            user_id: user?.id,
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
        title: "Item adicionado",
        description: `${newItem.name} foi adicionado à sua lista de compras.`,
      });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar item",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update budget mutation
  const updateBudgetMutation = useMutation({
    mutationFn: async (budgetData: Partial<UserBudget>) => {
      if (userBudget) {
        // Update existing budget
        const { data, error } = await supabase
          .from('user_budgets')
          .update({
            amount: budgetData.amount,
            currency: budgetData.currency,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userBudget.id)
          .select();

        if (error) throw error;
        return data[0];
      } else {
        // Create new budget
        const { data, error } = await supabase
          .from('user_budgets')
          .insert([
            {
              amount: budgetData.amount,
              currency: budgetData.currency,
              user_id: user?.id,
            }
          ])
          .select();

        if (error) throw error;
        return data[0];
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-budget'] });
      setIsBudgetDialogOpen(false);
      toast({
        title: "Orçamento atualizado",
        description: "Seu orçamento foi atualizado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar orçamento",
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
        title: "Erro ao atualizar item",
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
      const itemToDelete = shoppingItems.find(item => item.id === id);
      toast({
        title: "Item excluído",
        description: `${itemToDelete?.name} foi removido da sua lista de compras.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir item",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle add item
  const handleAddItem = () => {
    if (!newItem.name || newItem.price === undefined) {
      toast({
        title: "Informações faltando",
        description: "Por favor, preencha pelo menos o nome e o preço.",
        variant: "destructive",
      });
      return;
    }

    addItemMutation.mutate(newItem as Omit<ShoppingItem, 'id' | 'created_at' | 'user_id'>);
  };

  // Handle update budget
  const handleUpdateBudget = () => {
    if (budget.amount === undefined) {
      toast({
        title: "Informações faltando",
        description: "Por favor, insira um valor para o orçamento.",
        variant: "destructive",
      });
      return;
    }

    updateBudgetMutation.mutate(budget);
  };

  // Handle toggle purchased
  const handleTogglePurchased = (id: string, purchased: boolean) => {
    togglePurchasedMutation.mutate({ id, purchased: !purchased });
  };

  // Handle delete item
  const handleDeleteItem = (id: string) => {
    deleteItemMutation.mutate(id);
  };

  // Reset form
  const resetForm = () => {
    setNewItem({
      name: '',
      price: 0,
      currency: 'BRL',
      purchased: false,
    });
  };

  // Init budget from fetched budget
  useEffect(() => {
    if (userBudget) {
      setBudget({
        amount: userBudget.amount,
        currency: userBudget.currency,
      });
    }
  }, [userBudget]);

  // Calculate total spent and remaining budget
  const totalSpent = shoppingItems.reduce((sum, item) => 
    item.purchased ? sum + item.price : sum, 0);
  
  const remainingBudget = userBudget ? userBudget.amount - totalSpent : 0;

  // Filter items for tabs
  const allItems = shoppingItems;
  const purchasedItems = shoppingItems.filter(item => item.purchased);
  const unpurchasedItems = shoppingItems.filter(item => !item.purchased);

  // Loading state
  if (isLoadingItems || isLoadingBudget) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-travel-blue" />
          <span className="ml-2">Carregando lista de compras...</span>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-travel-dark">Lista de Compras</h1>
          <p className="text-travel-dark/70">Gerencie os itens de compra da sua viagem</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Dialog open={isBudgetDialogOpen} onOpenChange={setIsBudgetDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center">
                <DollarSign className="mr-2 h-4 w-4" />
                {userBudget ? "Atualizar Orçamento" : "Definir Orçamento"}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{userBudget ? "Atualizar Orçamento" : "Definir Orçamento"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="budget">Valor do Orçamento</Label>
                  <Input
                    id="budget"
                    type="number"
                    min="0"
                    step="0.01"
                    value={budget.amount}
                    onChange={(e) => setBudget({ ...budget, amount: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="currency">Moeda</Label>
                  <Select 
                    value={budget.currency} 
                    onValueChange={(value) => setBudget({ ...budget, currency: value })}
                  >
                    <SelectTrigger id="currency" className="w-full">
                      <SelectValue placeholder="Selecione a moeda" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRL">Real Brasileiro (R$)</SelectItem>
                      <SelectItem value="USD">Dólar Americano ($)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                      <SelectItem value="GBP">Libra Esterlina (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsBudgetDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleUpdateBudget}>
                  {updateBudgetMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : userBudget ? "Atualizar Orçamento" : "Salvar Orçamento"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Add Item Button */}
          <Button 
            className="bg-travel-mustard hover:bg-travel-mustard/80 text-travel-dark"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Item
          </Button>
        </div>
      </div>

      {userBudget && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle>Visão Geral do Orçamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-travel-light-blue p-4 rounded-md">
                <div className="text-sm text-travel-dark/70 mb-1">Orçamento Total</div>
                <div className="text-xl font-semibold text-travel-dark">
                  {userBudget.currency === 'EUR' && '€'}
                  {userBudget.currency === 'USD' && '$'}
                  {userBudget.currency === 'BRL' && 'R$'}
                  {userBudget.currency === 'GBP' && '£'}
                  {userBudget.amount.toFixed(2)}
                </div>
              </div>
              <div className="bg-travel-light-mustard p-4 rounded-md">
                <div className="text-sm text-travel-dark/70 mb-1">Total Gasto</div>
                <div className="text-xl font-semibold text-travel-dark">
                  {userBudget.currency === 'EUR' && '€'}
                  {userBudget.currency === 'USD' && '$'}
                  {userBudget.currency === 'BRL' && 'R$'}
                  {userBudget.currency === 'GBP' && '£'}
                  {totalSpent.toFixed(2)}
                </div>
              </div>
              <div className={`p-4 rounded-md ${remainingBudget >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                <div className="text-sm text-travel-dark/70 mb-1">Restante</div>
                <div className={`text-xl font-semibold ${remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {userBudget.currency === 'EUR' && '€'}
                  {userBudget.currency === 'USD' && '$'}
                  {userBudget.currency === 'BRL' && 'R$'}
                  {userBudget.currency === 'GBP' && '£'}
                  {remainingBudget.toFixed(2)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Item Dialog - Separate from the button */}
      <Dialog 
        open={isAddDialogOpen} 
        onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Adicionar Item de Compra</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome do Item</Label>
              <Input
                id="name"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                placeholder="ex., Souvenir"
                className="w-full"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">Preço</Label>
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
                <Label htmlFor="item-currency">Moeda</Label>
                <Select 
                  value={newItem.currency} 
                  onValueChange={(value) => setNewItem({ ...newItem, currency: value })}
                >
                  <SelectTrigger id="item-currency" className="w-full">
                    <SelectValue placeholder="Selecione a moeda" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BRL">Real Brasileiro (R$)</SelectItem>
                    <SelectItem value="USD">Dólar Americano ($)</SelectItem>
                    <SelectItem value="EUR">Euro (€)</SelectItem>
                    <SelectItem value="GBP">Libra Esterlina (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="image_url">URL da Imagem (opcional)</Label>
              <Input
                id="image_url"
                value={newItem.image_url || ''}
                onChange={(e) => setNewItem({ ...newItem, image_url: e.target.value })}
                placeholder="https://exemplo.com/imagem.jpg"
                className="w-full"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="point">Ponto Associado (opcional)</Label>
              <Select 
                value={newItem.point_id || ''} 
                onValueChange={(value) => setNewItem({ ...newItem, point_id: value || null })}
              >
                <SelectTrigger id="point" className="w-full">
                  <SelectValue placeholder="Selecione um ponto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {points.map((point) => (
                    <SelectItem key={point.id} value={point.id}>{point.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="checklist">Checklist Associado (opcional)</Label>
              <Select 
                value={newItem.checklist_id || ''} 
                onValueChange={(value) => setNewItem({ ...newItem, checklist_id: value || null })}
              >
                <SelectTrigger id="checklist" className="w-full">
                  <SelectValue placeholder="Selecione um checklist" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {checklists.map((checklist) => (
                    <SelectItem key={checklist.id} value={checklist.id}>{checklist.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox 
                id="purchased" 
                checked={newItem.purchased} 
                onCheckedChange={(checked) => setNewItem({ ...newItem, purchased: checked as boolean })}
              />
              <Label htmlFor="purchased" className="cursor-pointer">Já comprado</Label>
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
              Cancelar
            </Button>
            <Button 
              className="bg-travel-mustard hover:bg-travel-mustard/80 text-travel-dark"
              onClick={handleAddItem}
              disabled={addItemMutation.isPending}
            >
              {addItemMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adicionando...
                </>
              ) : (
                "Adicionar Item"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full sm:w-auto mb-4">
          <TabsTrigger value="all" className="flex-1 sm:flex-none">
            Todos os Itens ({allItems.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex-1 sm:flex-none">
            Pendentes ({unpurchasedItems.length})
          </TabsTrigger>
          <TabsTrigger value="purchased" className="flex-1 sm:flex-none">
            Comprados ({purchasedItems.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-0">
          {allItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] bg-travel-beige/50 rounded-lg border border-travel-mustard/20">
              <ShoppingBag className="h-16 w-16 text-travel-mustard/50 mb-4" />
              <h3 className="text-xl font-medium text-travel-dark">Sua lista de compras está vazia</h3>
              <p className="text-travel-dark/70 mb-4">Comece adicionando itens à sua lista de compras</p>
              <Button 
                className="bg-travel-mustard hover:bg-travel-mustard/80 text-travel-dark"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Seu Primeiro Item
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {allItems.map((item) => (
                <ShoppingItemCard 
                  key={item.id}
                  item={item}
                  onTogglePurchased={handleTogglePurchased}
                  onDelete={handleDeleteItem}
                  currency={userBudget?.currency || 'BRL'}
                  points={points}
                  checklists={checklists}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="pending" className="mt-0">
          {unpurchasedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] bg-travel-beige/50 rounded-lg border border-travel-mustard/20">
              <Package className="h-16 w-16 text-travel-mustard/50 mb-4" />
              <h3 className="text-xl font-medium text-travel-dark">Sem itens pendentes</h3>
              <p className="text-travel-dark/70 mb-4">Todos os seus itens foram comprados</p>
              <Button 
                className="bg-travel-mustard hover:bg-travel-mustard/80 text-travel-dark"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Novo Item
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {unpurchasedItems.map((item) => (
                <ShoppingItemCard 
                  key={item.id}
                  item={item}
                  onTogglePurchased={handleTogglePurchased}
                  onDelete={handleDeleteItem}
                  currency={userBudget?.currency || 'BRL'}
                  points={points}
                  checklists={checklists}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="purchased" className="mt-0">
          {purchasedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] bg-travel-beige/50 rounded-lg border border-travel-mustard/20">
              <Check className="h-16 w-16 text-travel-mustard/50 mb-4" />
              <h3 className="text-xl font-medium text-travel-dark">Sem itens comprados</h3>
              <p className="text-travel-dark/70 mb-4">Você ainda não comprou nenhum item</p>
              <Button 
                className="bg-travel-mustard hover:bg-travel-mustard/80 text-travel-dark"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Novo Item
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {purchasedItems.map((item) => (
                <ShoppingItemCard 
                  key={item.id}
                  item={item}
                  onTogglePurchased={handleTogglePurchased}
                  onDelete={handleDeleteItem}
                  currency={userBudget?.currency || 'BRL'}
                  points={points}
                  checklists={checklists}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
};

// Shopping Item Card component
interface ShoppingItemCardProps {
  item: ShoppingItem;
  onTogglePurchased: (id: string, purchased: boolean) => void;
  onDelete: (id: string) => void;
  currency: string;
  points: Pick<Point, 'id' | 'name'>[];
  checklists: Pick<Checklist, 'id' | 'name'>[];
}

const ShoppingItemCard: React.FC<ShoppingItemCardProps> = ({ 
  item, 
  onTogglePurchased, 
  onDelete, 
  currency,
  points,
  checklists
}) => {
  const pointName = points.find(p => p.id === item.point_id)?.name;
  const checklistName = checklists.find(c => c.id === item.checklist_id)?.name;

  return (
    <Card className={`overflow-hidden border ${item.purchased ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox 
              id={`purchased-${item.id}`}
              checked={item.purchased}
              onCheckedChange={() => onTogglePurchased(item.id, item.purchased)}
              className="h-5 w-5"
            />
            <CardTitle className={`text-lg ${item.purchased ? 'line-through text-gray-500' : ''}`}>
              {item.name}
            </CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => onDelete(item.id)}
            >
              <Trash className="h-4 w-4 text-travel-red" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="flex flex-wrap gap-4">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Preço</div>
            <div className="font-medium">
              {item.currency === 'EUR' && '€'}
              {item.currency === 'USD' && '$'}
              {item.currency === 'BRL' && 'R$'}
              {item.currency === 'GBP' && '£'}
              {item.price.toFixed(2)}
            </div>
          </div>

          {pointName && (
            <div>
              <div className="text-sm text-muted-foreground mb-1">Localização</div>
              <div className="font-medium">{pointName}</div>
            </div>
          )}

          {checklistName && (
            <div>
              <div className="text-sm text-muted-foreground mb-1">Checklist</div>
              <div className="font-medium">{checklistName}</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default Shopping;
