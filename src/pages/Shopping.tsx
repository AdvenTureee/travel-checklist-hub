import React, { useState, useEffect } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingItem, Point, UserBudget } from '@/lib/types';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, ShoppingCart, Edit, Trash, Check, X, Loader2, ChevronUp, ChevronDown, Image as ImageIcon, DollarSign, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { useLocation, useNavigate } from 'react-router-dom';

const Shopping: React.FC = () => {
  const { user } = useAuth();
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
  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false);
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [newItem, setNewItem] = useState<Partial<ShoppingItem>>({
    name: '',
    price: 0,
    currency: 'USD',
    purchased: false,
    image_url: '',
    point_id: null
  });
  const [newBudget, setNewBudget] = useState<number>(0);
  const {
    toast
  } = useToast();

  const queryClient = useQueryClient();

  // Fetch shopping items
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['shopping-items', tripId],
    queryFn: async () => {
      if (!tripId) return [];
      const { data, error } = await supabase
        .from('shopping_list_items')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ShoppingItem[];
    },
    enabled: !!tripId
  });

  // Fetch user budget
  const {
    data: budget,
    isLoading: isLoadingBudget
  } = useQuery({
    queryKey: ['user-budget'],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('user_budgets')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      return data as UserBudget || null;
    }
  });

  // Fetch points for reference
  const {
    data: points = [],
    isLoading: isLoadingPoints
  } = useQuery({
    queryKey: ['points'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('points').select('id, name, google_maps_url');
      if (error) throw error;
      return data as (Pick<Point, 'id' | 'name' | 'googleMapsUrl' | 'google_maps_url'>)[];
    }
  });

  // Calculate total shopping cost
  const calculateTotal = () => {
    return items.reduce((acc, item) => acc + item.price, 0);
  };

  // Calculate budget progress percentage
  const calculateBudgetProgress = () => {
    if (!budget || budget.amount === 0) return 0;
    const total = calculateTotal();
    return Math.min(Math.round(total / budget.amount * 100), 100);
  };

  // Calculate remaining budget
  const calculateRemainingBudget = () => {
    if (!budget) return 0;
    const total = calculateTotal();
    return Math.max(budget.amount - total, 0);
  };

  // Add item mutation
  const addItemMutation = useMutation({
    mutationFn: async (item: Omit<ShoppingItem, 'id' | 'created_at'>) => {
      const {
        data,
        error
      } = await supabase.from('shopping_list_items').insert([{
        name: item.name,
        price: item.price,
        currency: item.currency,
        purchased: item.purchased,
        image_url: item.image_url,
        point_id: item.point_id === 'none' ? null : item.point_id,
        user_id: user?.id,
        trip_id: tripId
      }]).select();
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['shopping-items']
      });
      setIsAddDialogOpen(false);
      toast({
        title: "Item adicionado",
        description: `${newItem.name} foi adicionado à sua lista de compras.`
      });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar item",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Update item mutation
  const updateItemMutation = useMutation({
    mutationFn: async ({
      id,
      item
    }: {
      id: string;
      item: Partial<ShoppingItem>;
    }) => {
      const {
        data,
        error
      } = await supabase.from('shopping_list_items').update({
        name: item.name,
        price: item.price,
        currency: item.currency,
        image_url: item.image_url,
        point_id: item.point_id === 'none' ? null : item.point_id,
        trip_id: tripId
      }).eq('id', id).select();
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['shopping-items']
      });
      setIsEditDialogOpen(false);
      setEditItemId(null);
      toast({
        title: "Item atualizado",
        description: `${newItem.name} foi atualizado.`
      });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar item",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const {
        error
      } = await supabase.from('shopping_list_items').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: ['shopping-items']
      });
      const itemToDelete = items.find(i => i.id === id);
      toast({
        title: "Item excluído",
        description: `${itemToDelete?.name} foi removido.`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir item",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Toggle purchased status mutation
  const togglePurchasedMutation = useMutation({
    mutationFn: async ({
      id,
      purchased
    }: {
      id: string;
      purchased: boolean;
    }) => {
      const {
        data,
        error
      } = await supabase.from('shopping_list_items').update({
        purchased
      }).eq('id', id).select();
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['shopping-items']
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Add or update budget mutation
  const updateBudgetMutation = useMutation({
    mutationFn: async (amount: number) => {
      if (budget) {
        // Update existing budget
        const {
          data,
          error
        } = await supabase.from('user_budgets').update({
          amount,
          updated_at: new Date().toISOString()
        }).eq('id', budget.id).select();
        if (error) throw error;
        return data[0];
      } else {
        // Create new budget
        const {
          data,
          error
        } = await supabase.from('user_budgets').insert([{
          amount,
          currency: 'USD',
          user_id: user?.id
        }]).select();
        if (error) throw error;
        return data[0];
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['user-budget']
      });
      setIsBudgetDialogOpen(false);
      toast({
        title: "Orçamento atualizado",
        description: "Seu orçamento de compras foi atualizado."
      });
      setNewBudget(0);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar orçamento",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  const handleAddItem = () => {
    if (!newItem.name || newItem.price === undefined) {
      toast({
        title: "Missing information",
        description: "Please fill in at least the name and price.",
        variant: "destructive"
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
    togglePurchasedMutation.mutate({
      id,
      purchased: !purchased
    });
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
        point_id: itemToEdit.point_id || 'none'
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
        variant: "destructive"
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
  const handleUpdateBudget = () => {
    if (newBudget <= 0) {
      toast({
        title: "Orçamento inválido",
        description: "Por favor, insira um valor de orçamento maior que zero.",
        variant: "destructive"
      });
      return;
    }
    updateBudgetMutation.mutate(newBudget);
  };
  const handleOpenBudgetDialog = () => {
    if (budget) {
      setNewBudget(budget.amount);
    }
    setIsBudgetDialogOpen(true);
  };
  const resetForm = () => {
    setNewItem({
      name: '',
      price: 0,
      currency: 'USD',
      purchased: false,
      image_url: '',
      point_id: null
    });
  };
  const getPointName = (pointId: string | null) => {
    if (!pointId) return "N/A";
    const point = points.find(p => p.id === pointId);
    return point ? point.name : "N/A";
  };

  // Show loading state
  if (isLoading || isLoadingPoints || isLoadingBudget) {
    return <PageContainer>
        <div className="flex justify-center items-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-travel-blue" />
          <span className="ml-2">Carregando itens de compras...</span>
        </div>
      
  {/* Botão flutuante de adicionar item */}
  <button
    onClick={() => setIsAddDialogOpen(true)}
    className="fixed bottom-6 right-6 z-50 bg-travel-mustard hover:bg-travel-mustard/90 text-travel-dark rounded-full shadow-lg p-4 flex items-center justify-center transition-all duration-200"
    aria-label="Adicionar Item"
    style={{ boxShadow: '0 4px 24px 0 rgba(0,0,0,0.16)' }}
  >
    <Plus size={32} />
  </button>
</PageContainer>;

  }
  return <PageContainer>
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/trips')}
          className="mr-2 text-travel-blue hover:text-travel-dark flex items-center"
          title="Sair da viagem"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left w-6 h-6"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        </button>
        
      </div>
      <h1 className="text-xl md:text-2xl mb-1 font-bold text-travel-blue font-['Lexend']">Lista de Compras</h1>
      <div className="text-sm sm:text-base text-travel-dark/80 mb-6">Gerencie itens para comprar antes e durante sua viagem.</div>
      <div className="mb-4 flex flex-col sm:flex-row gap-3 sm:gap-6 items-start w-full">
        {/* Coluna esquerda com botões de ação global */}
        
        {/* Header e descrição */}
        <div className="flex flex-col flex-1 w-full">

        </div>
      </div>

      {/* Improved Summary Card */}
      <Card className="mb-4 sm:mb-6 overflow-hidden border-travel-light-blue/30 mx-0 px-2 sm:px-0">
        <CardHeader className="pb-2 sm:pb-4 bg-gradient-to-r from-travel-light-blue/30 to-travel-beige">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
            <CardTitle className="text-lg sm:text-xl text-travel-dark">Resumo</CardTitle>
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleTrigger className="rounded-full p-1 hover:bg-travel-beige/50">
                {isExpanded ? <ChevronUp className="h-5 w-5 text-travel-dark/70" /> : <ChevronDown className="h-5 w-5 text-travel-dark/70" />}
              </CollapsibleTrigger>
            </Collapsible>
          </div>
          
        </CardHeader>
        
        <Collapsible open={isExpanded}>
          <CollapsibleContent>
            <CardContent className="pt-4 px-0 sm:px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-travel-beige/50 p-4 rounded-lg">
                      <p className="text-sm text-travel-dark/70 mb-1">Total de itens</p>
                      <div className="flex items-center">
                        <ShoppingCart className="h-5 w-5 text-travel-blue mr-2" />
                        <span className="text-2xl font-semibold text-travel-dark">{items.length}</span>
                      </div>
                      <div className="mt-2 text-sm">
                        <span className="text-travel-blue font-medium">{items.filter(item => item.purchased).length}</span> comprados
                            <span className="mx-2">•</span>
                            <span className="text-travel-mustard font-medium">{items.filter(item => !item.purchased).length}</span> restantes
                      </div>
                    </div>
                    
                    <div className="bg-travel-beige/50 p-4 rounded-lg">
                      <p className="text-sm text-travel-dark/70 mb-1">Custo total</p>
                      <div className="flex items-center">
                        <DollarSign className="h-5 w-5 text-travel-mustard mr-2" />
                        <span className="text-2xl font-semibold text-travel-dark">${calculateTotal().toFixed(2)}</span>
                      </div>
                      <div className="mt-2 text-sm">
                        <span className="text-travel-dark/70">
                          {budget ? `de $${budget.amount.toFixed(2)} de orçamento` : 'Nenhum orçamento definido'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-travel-light-blue/20 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-md font-medium text-travel-dark">Status do orçamento</h3>
                      {budget && <span className="text-sm font-medium" style={{
                      color: calculateBudgetProgress() > 80 ? '#E63946' : calculateBudgetProgress() > 60 ? '#F5CB5C' : '#457B9D'
                    }}>
                          {calculateBudgetProgress()}% usado
                        </span>}
                    </div>
                    
                    {budget ? <>
                        <Progress value={calculateBudgetProgress()} className="h-2 mb-2" indicatorClassName={calculateBudgetProgress() > 80 ? "bg-travel-red" : calculateBudgetProgress() > 60 ? "bg-travel-mustard" : "bg-travel-blue"} />
                        
                        <div className="flex justify-between text-sm mb-4">
                          <span className="text-travel-dark/70">Restante:</span>
                          <span className="font-medium text-travel-blue">${calculateRemainingBudget().toFixed(2)}</span>
                        </div>
                      </> : <div className="text-center py-2 text-travel-dark/70 text-sm mb-4">
                        Nenhum orçamento definido ainda
                      </div>}
                  </div>
                  
                  <Button variant="outline" className="border-travel-mustard text-travel-dark hover:bg-travel-mustard/20" onClick={handleOpenBudgetDialog}>
                    <Plus className="h-4 w-4 mr-2" />
                    {budget ? 'Atualizar orçamento' : 'Adicionar orçamento'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {items.length === 0 ? <div className="flex flex-col items-center justify-center h-[400px] bg-travel-beige/50 rounded-lg border border-travel-mustard/20">
            <ShoppingCart className="h-16 w-16 text-travel-mustard/50 mb-4" />
            <h3 className="text-xl font-medium text-travel-dark">Nenhum item na sua lista de compras</h3>
            <p className="text-travel-dark/70 mb-4">Adicione itens que deseja comprar durante sua viagem</p>
          </div> : <div className="overflow-x-auto w-full border border-travel-mustard rounded-2xl">
          <Table className="min-w-full sm:min-w-full md:min-w-full bg-white rounded-2xl text-xs sm:text-sm md:text-base">
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 mx-0"></TableHead>
                <TableHead className="w-12">Imagem</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(item => <TableRow key={item.id} className={item.purchased ? "bg-travel-beige/20 opacity-75" : ""}>
                  <TableCell>
                    <Button variant="ghost" size="icon" className={`h-8 w-8 ${item.purchased ? 'bg-travel-mustard/10' : 'bg-travel-light-blue/20'}`} onClick={() => handleTogglePurchased(item.id, item.purchased)} aria-label={item.purchased ? "Marcar como não comprado" : "Marcar como comprado"}>
                      {item.purchased ? <Check className="h-4 w-4 text-travel-mustard" /> : <ShoppingCart className="h-4 w-4 text-travel-blue" />}
                    </Button>
                  </TableCell>
                  <TableCell>
                    {item.image_url ? <img src={item.image_url} alt={item.name} className="w-10 h-10 object-cover rounded-md" /> : <div className="w-10 h-10 bg-travel-beige/50 rounded-md flex items-center justify-center">
                        <ImageIcon className="h-5 w-5 text-travel-dark/40" />
                      </div>}
                  </TableCell>
                  <TableCell className={item.purchased ? "line-through text-travel-dark/60" : ""}>
                    {item.name}
                  </TableCell>
                  <TableCell>${item.price.toFixed(2)}</TableCell>
                  <TableCell>
  {(() => {
    const point = points.find(p => p.id === item.point_id);
    if (point && point.google_maps_url) {
      return (
        <a
          href={point.google_maps_url}
          target="_blank"
          rel="noopener noreferrer"
          className="caricature-location-link"
          title={point.name}
        >
          {point.name}
        </a>
      );
    }
    const name = getPointName(item.point_id);
    if (name === 'N/A') {
      return <span className="caricature-na">N/A</span>;
    }
    return name;
  })()}
</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap h-10 w-10 hover:bg-accent hover:text-accent-foreground"
                        onClick={() => handleEditItem(item.id)}
                        title="Editar"
                      >
                        <Edit className="w-4 h-4 text-travel-blue" />
                      </Button>
                      <Button
                        variant="ghost"
                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md h-10 w-10 hover:bg-accent hover:text-accent-foreground"
                        onClick={() => handleDeleteItem(item.id)}
                        title="Excluir"
                      >
                        <Trash className="w-4 h-4 text-travel-red" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>)}
            </TableBody>
          </Table>
        </div>}

      {/* Floating Action Button para adicionar item */}
      <Button
        onClick={() => setIsAddDialogOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-travel-mustard hover:bg-travel-mustard/80 text-travel-dark p-2 h-12 w-12 flex items-center justify-center rounded-full shadow-md"
        aria-label="Adicionar Item"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Add Item Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Adicionar Item de Compras</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome do Item</Label>
              <Input
                id="name"
                className="text-base py-2 w-full"
                value={newItem.name}
                onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                placeholder="ex: Ímã de lembrança"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">Preço</Label>
                <Input
                  id="price"
                  className="text-base py-2 w-full"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newItem.price}
                  onChange={e => setNewItem({ ...newItem, price: parseFloat(e.target.value) })}
                  placeholder="0,00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="currency">Moeda</Label>
                <Select value={newItem.currency} onValueChange={value => setNewItem({
                  ...newItem,
                  currency: value
                })}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione a moeda" />
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
              <Label htmlFor="image_url">URL da Imagem (opcional)</Label>
              <Input
                id="image_url"
                className="text-base py-2 w-full"
                value={newItem.image_url || ''}
                onChange={e => setNewItem({ ...newItem, image_url: e.target.value })}
                placeholder="https://exemplo.com/imagem.jpg"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="point_id">Local (opcional)</Label>
              <Select value={newItem.point_id || 'none'} onValueChange={value => setNewItem({
                ...newItem,
                point_id: value
              })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o local" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {points.map(point => <SelectItem key={point.id} value={point.id}>
                      {point.name}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
            resetForm();
            setIsAddDialogOpen(false);
          }}>
              Cancelar
            </Button>
            <Button className="bg-travel-mustard hover:bg-travel-mustard/80 text-travel-dark w-full sm:w-auto mt-2 sm:mt-0" onClick={handleAddItem} disabled={addItemMutation.isPending}>
              {addItemMutation.isPending ? <>
                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                   Adicionando item...
                 </> : "Adicionar Item"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Editar Item de Compras</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nome do Item</Label>
              <Input id="edit-name" value={newItem.name} onChange={e => setNewItem({
              ...newItem,
              name: e.target.value
            })} placeholder="e.g., Souvenir Magnet" className="w-full" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-price">Preço</Label>
                <Input id="edit-price" type="number" min="0" step="0.01" value={newItem.price} onChange={e => setNewItem({
                ...newItem,
                price: parseFloat(e.target.value)
              })} placeholder="0.00" className="w-full" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-currency">Moeda</Label>
                <Select value={newItem.currency} onValueChange={value => setNewItem({
                ...newItem,
                currency: value
              })}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione a moeda" />
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
              <Label htmlFor="edit-image_url">URL da Imagem (opcional)</Label>
              <Input id="edit-image_url" value={newItem.image_url || ''} onChange={e => setNewItem({
              ...newItem,
              image_url: e.target.value
            })} placeholder="https://example.com/image.jpg" className="w-full" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-point_id">Local (opcional)</Label>
              <Select value={newItem.point_id || 'none'} onValueChange={value => setNewItem({
              ...newItem,
              point_id: value
            })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o local" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {points.map(point => <SelectItem key={point.id} value={point.id}>
                      {point.name}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
            resetForm();
            setEditItemId(null);
            setIsEditDialogOpen(false);
          }}>
              Cancelar
            </Button>
            <Button className="bg-travel-mustard hover:bg-travel-mustard/80 text-travel-dark" onClick={handleUpdateItem} disabled={updateItemMutation.isPending}>
              {updateItemMutation.isPending ? <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Atualizando...
                </> : "Salvar Alterações"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Update Budget Dialog */}
      <Dialog open={isBudgetDialogOpen} onOpenChange={setIsBudgetDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{budget ? 'Atualizar Orçamento de Compras' : 'Definir Orçamento de Compras'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="budget-amount">Valor do Orçamento</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-travel-dark/60" />
                <Input id="budget-amount" type="number" min="0" step="0.01" value={newBudget} onChange={e => setNewBudget(parseFloat(e.target.value))} placeholder="0.00" className="w-full pl-10" />
              </div>
              <p className="text-sm text-travel-dark/70 mt-1">
                Defina o valor total que deseja gastar em compras durante sua viagem.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
            setNewBudget(0);
            setIsBudgetDialogOpen(false);
          }}>
              Cancelar
            </Button>
            <Button className="bg-travel-blue hover:bg-travel-blue/80 text-white" onClick={handleUpdateBudget} disabled={updateBudgetMutation.isPending}>
              {updateBudgetMutation.isPending ? <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </> : budget ? "Atualizar Orçamento" : "Salvar Orçamento"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
}
export default Shopping;