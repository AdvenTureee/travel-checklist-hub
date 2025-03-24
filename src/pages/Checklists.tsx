import React, { useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, ListChecks, Edit, Trash, X, MapPin } from 'lucide-react';
import { Checklist, ChecklistItem, Point } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

// Mock data for points (to link checklists to points)
const mockPoints: Point[] = [
  {
    id: '1',
    name: 'Sagrada Familia',
    description: 'Beautiful basilica designed by Antoni Gaudí.',
    address: 'Carrer de Mallorca, 401, 08013 Barcelona, Spain',
    type: 'tourist',
    createdAt: new Date('2023-01-15').toISOString(),
  },
  {
    id: '2',
    name: 'Mercado de San Miguel',
    description: 'Historic market with delicious Spanish cuisine.',
    address: 'Plaza de San Miguel, s/n, 28005 Madrid, Spain',
    type: 'restaurant',
    createdAt: new Date('2023-02-20').toISOString(),
  },
  {
    id: '3',
    name: 'Copacabana Beach',
    description: 'Famous beach in Rio de Janeiro.',
    address: 'Av. Atlântica, Rio de Janeiro - RJ, Brazil',
    type: 'tourist',
    createdAt: new Date('2023-03-10').toISOString(),
  }
];

// Mock data for checklists
const initialChecklists: Checklist[] = [
  {
    id: '1',
    name: 'Barcelona Trip Essentials',
    description: 'Things to prepare before visiting Barcelona',
    items: [
      { id: '1-1', text: 'Book flights', completed: true },
      { id: '1-2', text: 'Reserve hotel', completed: true },
      { id: '1-3', text: 'Get travel insurance', completed: false },
      { id: '1-4', text: 'Exchange currency', completed: false },
    ],
    pointId: '1',
    createdAt: new Date('2023-05-10').toISOString(),
    isComplete: false,
  },
  {
    id: '2',
    name: 'Madrid Food Tour',
    description: 'Foods to try at Mercado de San Miguel',
    items: [
      { id: '2-1', text: 'Jamón ibérico', completed: false },
      { id: '2-2', text: 'Paella', completed: false },
      { id: '2-3', text: 'Spanish olives', completed: true },
      { id: '2-4', text: 'Churros with chocolate', completed: false },
    ],
    pointId: '2',
    createdAt: new Date('2023-06-15').toISOString(),
    isComplete: false,
  }
];

const Checklists: React.FC = () => {
  const [checklists, setChecklists] = useState<Checklist[]>(initialChecklists);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [currentChecklist, setCurrentChecklist] = useState<Checklist | null>(null);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [newChecklist, setNewChecklist] = useState<Partial<Checklist>>({
    name: '',
    description: '',
    items: [],
    pointId: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const handleAddChecklist = () => {
    if (!newChecklist.name || newChecklist.items?.length === 0) {
      toast({
        title: "Missing information",
        description: "Please provide a name and at least one item for your checklist.",
        variant: "destructive",
      });
      return;
    }

    if (isEditing && newChecklist.id) {
      // Update existing checklist
      const updatedChecklists = checklists.map(c => 
        c.id === newChecklist.id ? {...newChecklist as Checklist} : c
      );
      
      setChecklists(updatedChecklists);
      toast({
        title: "Checklist updated",
        description: `${newChecklist.name} has been updated.`,
      });
    } else {
      // Add new checklist
      const checklist: Checklist = {
        id: Date.now().toString(),
        name: newChecklist.name,
        description: newChecklist.description || '',
        items: newChecklist.items || [],
        pointId: newChecklist.pointId,
        createdAt: new Date().toISOString(),
        isComplete: false,
      };

      setChecklists([checklist, ...checklists]);
      toast({
        title: "Checklist added",
        description: `${checklist.name} has been created.`,
      });
    }
    
    resetFormAndCloseDialog();
  };

  const resetFormAndCloseDialog = () => {
    setNewChecklist({
      name: '',
      description: '',
      items: [],
      pointId: '',
    });
    setIsEditing(false);
    setIsAddDialogOpen(false);
  };

  const handleDeleteChecklist = (id: string) => {
    const checklistToDelete = checklists.find(c => c.id === id);
    setChecklists(checklists.filter(checklist => checklist.id !== id));
    
    toast({
      title: "Checklist deleted",
      description: `${checklistToDelete?.name} has been removed.`,
    });
  };

  const handleAddItem = () => {
    if (!newChecklistItem.trim()) return;
    
    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      text: newChecklistItem,
      completed: false,
    };
    
    setNewChecklist({
      ...newChecklist,
      items: [...(newChecklist.items || []), newItem],
    });
    
    setNewChecklistItem('');
  };

  const handleRemoveItem = (itemId: string) => {
    setNewChecklist({
      ...newChecklist,
      items: newChecklist.items?.filter(item => item.id !== itemId) || [],
    });
  };

  const viewChecklist = (checklist: Checklist) => {
    setCurrentChecklist(checklist);
    setIsViewDialogOpen(true);
  };

  const editChecklist = (checklist: Checklist) => {
    setNewChecklist({
      ...checklist,
      items: [...checklist.items],
    });
    setIsEditing(true);
    setIsAddDialogOpen(true);
  };

  const toggleItemCompletion = (checklistId: string, itemId: string) => {
    const updatedChecklists = checklists.map(checklist => {
      if (checklist.id === checklistId) {
        const updatedItems = checklist.items.map(item => {
          if (item.id === itemId) {
            return { ...item, completed: !item.completed };
          }
          return item;
        });
        
        // Check if all items are completed
        const isComplete = updatedItems.every(item => item.completed);
        
        return { 
          ...checklist, 
          items: updatedItems,
          isComplete
        };
      }
      return checklist;
    });
    
    setChecklists(updatedChecklists);
    
    // If we're viewing the details of a checklist, update the current checklist as well
    if (currentChecklist && currentChecklist.id === checklistId) {
      const updatedCurrentChecklist = updatedChecklists.find(c => c.id === checklistId);
      if (updatedCurrentChecklist) {
        setCurrentChecklist(updatedCurrentChecklist);
      }
    }
  };

  const calculateProgress = (checklist: Checklist) => {
    if (checklist.items.length === 0) return 0;
    return Math.round((checklist.items.filter(item => item.completed).length / checklist.items.length) * 100);
  };

  const getPointName = (pointId?: string) => {
    if (!pointId) return null;
    const point = mockPoints.find(p => p.id === pointId);
    return point ? point.name : null;
  };

  return (
    <PageContainer>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-travel-dark">Checklists</h1>
          <p className="text-travel-dark/70">Manage your travel checklists and tasks</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) resetFormAndCloseDialog();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-travel-mustard hover:bg-travel-mustard/80 text-travel-dark">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Checklist
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Edit Checklist' : 'Create New Checklist'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Checklist Name</Label>
                <Input
                  id="name"
                  value={newChecklist.name}
                  onChange={(e) => setNewChecklist({ ...newChecklist, name: e.target.value })}
                  placeholder="e.g., Beach Trip Essentials"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={newChecklist.description}
                  onChange={(e) => setNewChecklist({ ...newChecklist, description: e.target.value })}
                  placeholder="Brief description of this checklist..."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="point">Connect to a Point (optional)</Label>
                <Select 
                  value={newChecklist.pointId} 
                  onValueChange={(value) => setNewChecklist({ ...newChecklist, pointId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a point of interest" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockPoints.map(point => (
                      <SelectItem key={point.id} value={point.id}>{point.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label>Checklist Items</Label>
                  <span className="text-xs text-travel-dark/50">
                    {newChecklist.items?.length || 0} items
                  </span>
                </div>
                <div className="flex space-x-2">
                  <Input
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    placeholder="Add a new item..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddItem();
                      }
                    }}
                  />
                  <Button 
                    type="button" 
                    onClick={handleAddItem}
                    className="bg-travel-mustard hover:bg-travel-mustard/80 text-travel-dark"
                  >
                    Add
                  </Button>
                </div>
                <div className="mt-2 space-y-2 max-h-[200px] overflow-y-auto">
                  {newChecklist.items?.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-travel-beige rounded-md">
                      <span className="text-travel-dark">{item.text}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-travel-red hover:text-travel-red/70"
                        onClick={() => handleRemoveItem(item.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={resetFormAndCloseDialog}
              >
                Cancel
              </Button>
              <Button 
                className="bg-travel-mustard hover:bg-travel-mustard/80 text-travel-dark"
                onClick={handleAddChecklist}
              >
                {isEditing ? 'Update Checklist' : 'Create Checklist'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {checklists.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[400px] bg-travel-beige/50 rounded-lg border border-travel-mustard/20">
          <ListChecks className="h-16 w-16 text-travel-mustard/50 mb-4" />
          <h3 className="text-xl font-medium text-travel-dark">No checklists yet</h3>
          <p className="text-travel-dark/70 mb-4">Create your first checklist to organize your trip</p>
          <Button 
            className="bg-travel-mustard hover:bg-travel-mustard/80 text-travel-dark"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Your First Checklist
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {checklists.map((checklist) => (
            <Card key={checklist.id} className="card-hover">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {checklist.name}
                      {checklist.isComplete && (
                        <span className="inline-block text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                          Completed
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {new Date(checklist.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => editChecklist(checklist)}
                    >
                      <Edit className="h-4 w-4 text-travel-blue" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8" 
                      onClick={() => handleDeleteChecklist(checklist.id)}
                    >
                      <Trash className="h-4 w-4 text-travel-red" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {checklist.description && (
                  <p className="text-sm text-travel-dark/80 mb-4">{checklist.description}</p>
                )}
                
                {checklist.pointId && (
                  <div className="flex items-center gap-2 mb-4 p-2 bg-travel-light-blue/20 rounded-md">
                    <MapPin className="h-4 w-4 text-travel-blue" />
                    <span className="text-sm text-travel-blue">{getPointName(checklist.pointId)}</span>
                  </div>
                )}
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-travel-dark">Progress</span>
                    <span className="text-sm text-travel-dark/70">
                      {calculateProgress(checklist)}%
                    </span>
                  </div>
                  <div className="w-full bg-travel-beige/70 rounded-full h-2.5">
                    <div 
                      className="bg-travel-mustard h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${calculateProgress(checklist)}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full bg-travel-light-mustard hover:bg-travel-mustard text-travel-dark"
                  onClick={() => viewChecklist(checklist)}
                >
                  View Details
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* View Checklist Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{currentChecklist?.name}</DialogTitle>
          </DialogHeader>
          {currentChecklist && (
            <div className="py-4">
              {currentChecklist.description && (
                <p className="text-travel-dark/80 mb-4">{currentChecklist.description}</p>
              )}
              
              {currentChecklist.pointId && (
                <div className="flex items-center gap-2 mb-4 p-3 bg-travel-light-blue/20 rounded-md">
                  <MapPin className="h-5 w-5 text-travel-blue" />
                  <div>
                    <div className="text-travel-blue font-medium">{getPointName(currentChecklist.pointId)}</div>
                    <div className="text-xs text-travel-blue/70">Connected Point</div>
                  </div>
                </div>
              )}
              
              <div className="space-y-2 mt-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-travel-dark">Items</h3>
                  <span className="text-xs text-travel-dark/70">
                    {currentChecklist.items.filter(item => item.completed).length} of {currentChecklist.items.length} completed
                  </span>
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {currentChecklist.items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-2 p-3 bg-travel-beige/50 rounded-md">
                      <Checkbox 
                        id={`item-${item.id}`} 
                        checked={item.completed}
                        onCheckedChange={() => toggleItemCompletion(currentChecklist.id, item.id)}
                        className="border-travel-mustard data-[state=checked]:bg-travel-mustard data-[state=checked]:text-travel-dark"
                      />
                      <label 
                        htmlFor={`item-${item.id}`}
                        className={`flex-1 text-travel-dark ${item.completed ? 'line-through text-travel-dark/50' : ''}`}
                      >
                        {item.text}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
};

export default Checklists;
