import React, { useState, useEffect } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, MapPin, Edit, Trash, Loader2, ExternalLink, Globe, Clock, Calendar } from 'lucide-react';
import { Point } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PointDetailsModal from '@/components/points/PointDetailsModal';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import OpeningHoursInput from '@/components/points/OpeningHoursInput';

const Points: React.FC = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editPointId, setEditPointId] = useState<string | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<Point | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [newPoint, setNewPoint] = useState<Partial<Point>>({
    name: '',
    description: '',
    address: '',
    type: 'tourist',
    googleMapsUrl: '',
    openingHours: '',
    plannedVisitDate: null,
  });
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch points from Supabase
  const {
    data: points = [],
    isLoading,
    error: fetchError,
  } = useQuery({
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

  // Add point mutation
  const addPointMutation = useMutation({
    mutationFn: async (point: Omit<Point, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('points')
        .insert([
          {
            name: point.name,
            description: point.description,
            address: point.address,
            type: point.type,
            image_url: point.imageUrl,
            google_maps_url: point.googleMapsUrl,
            opening_hours: point.openingHours,
            planned_visit_date: point.plannedVisitDate,
            user_id: user?.id
          }
        ])
        .select();

      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['points'] });
      setIsAddDialogOpen(false);
      toast({
        title: "Point added",
        description: `${newPoint.name} has been added to your points.`,
      });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error adding point",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update point mutation
  const updatePointMutation = useMutation({
    mutationFn: async ({ id, point }: { id: string, point: Partial<Point> }) => {
      const { data, error } = await supabase
        .from('points')
        .update({
          name: point.name,
          description: point.description,
          address: point.address,
          type: point.type,
          image_url: point.imageUrl,
          google_maps_url: point.googleMapsUrl,
          opening_hours: point.openingHours,
          planned_visit_date: point.plannedVisitDate
        })
        .eq('id', id)
        .select();

      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['points'] });
      setIsEditDialogOpen(false);
      setEditPointId(null);
      toast({
        title: "Point updated",
        description: `${newPoint.name} has been updated.`,
      });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error updating point",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete point mutation
  const deletePointMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('points')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['points'] });
      const pointToDelete = points.find(p => p.id === id);
      toast({
        title: "Point deleted",
        description: `${pointToDelete?.name} has been removed.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting point",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleAddPoint = () => {
    if (!newPoint.name || !newPoint.address) {
      toast({
        title: "Missing information",
        description: "Please fill in at least the name and address.",
        variant: "destructive",
      });
      return;
    }

    addPointMutation.mutate({
      name: newPoint.name,
      description: newPoint.description || '',
      address: newPoint.address,
      type: newPoint.type as Point['type'],
      imageUrl: newPoint.imageUrl,
      googleMapsUrl: newPoint.googleMapsUrl,
      openingHours: newPoint.openingHours,
      plannedVisitDate: date ? format(date, 'yyyy-MM-dd') : null,
      user_id: user!.id
    } as any);
  };

  const handleDeletePoint = (id: string) => {
    deletePointMutation.mutate(id);
  };

  const handleEditPoint = (id: string) => {
    const pointToEdit = points.find(p => p.id === id);
    if (pointToEdit) {
      setNewPoint({
        name: pointToEdit.name,
        description: pointToEdit.description,
        address: pointToEdit.address,
        type: pointToEdit.type,
        imageUrl: pointToEdit.image_url,
        googleMapsUrl: pointToEdit.google_maps_url,
        openingHours: pointToEdit.opening_hours,
        plannedVisitDate: pointToEdit.planned_visit_date,
      });
      setDate(pointToEdit.planned_visit_date ? new Date(pointToEdit.planned_visit_date) : undefined);
      setEditPointId(id);
      setIsEditDialogOpen(true);
    }
  };

  const handleOpenDetails = (point: Point) => {
    setSelectedPoint(point);
    setIsDetailsModalOpen(true);
  };

  const handleUpdatePoint = () => {
    if (!newPoint.name || !newPoint.address || !editPointId) {
      toast({
        title: "Missing information",
        description: "Please fill in at least the name and address.",
        variant: "destructive",
      });
      return;
    }

    updatePointMutation.mutate({ 
      id: editPointId, 
      point: {
        ...newPoint,
        plannedVisitDate: date ? format(date, 'yyyy-MM-dd') : null,
      }
    });
  };

  const resetForm = () => {
    setNewPoint({
      name: '',
      description: '',
      address: '',
      type: 'tourist',
      googleMapsUrl: '',
      openingHours: '',
      plannedVisitDate: null,
    });
    setDate(undefined);
  };

  // Show error if fetch failed
  useEffect(() => {
    if (fetchError) {
      toast({
        title: "Error fetching points",
        description: (fetchError as any).message,
        variant: "destructive",
      });
    }
  }, [fetchError, toast]);

  // Show loading state
  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-travel-blue" />
          <span className="ml-2">Loading points...</span>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-travel-dark">Points of Interest</h1>
          <p className="text-travel-dark/70">Manage your favorite places and destinations</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-travel-mustard hover:bg-travel-mustard/80 text-travel-dark">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Point
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Point of Interest</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newPoint.name}
                  onChange={(e) => setNewPoint({ ...newPoint, name: e.target.value })}
                  placeholder="e.g., Eiffel Tower"
                  className="w-full"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newPoint.description}
                  onChange={(e) => setNewPoint({ ...newPoint, description: e.target.value })}
                  placeholder="Brief description of this place..."
                  className="w-full"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={newPoint.address}
                  onChange={(e) => setNewPoint({ ...newPoint, address: e.target.value })}
                  placeholder="Full address"
                  className="w-full"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="googleMapsUrl">Google Maps URL (optional)</Label>
                <Input
                  id="googleMapsUrl"
                  value={newPoint.googleMapsUrl || ''}
                  onChange={(e) => setNewPoint({ ...newPoint, googleMapsUrl: e.target.value })}
                  placeholder="https://maps.google.com/..."
                  className="w-full"
                />
              </div>
              
              <OpeningHoursInput 
                value={newPoint.openingHours || ''}
                onChange={(value) => setNewPoint({ ...newPoint, openingHours: value })}
              />
              
              <div className="grid gap-2">
                <Label htmlFor="plannedVisitDate">Planned Visit Date (optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="plannedVisitDate"
                      variant="outline"
                      className="w-full flex justify-start text-left font-normal h-10"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {date ? format(date, 'PPP') : <span className="text-muted-foreground">Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Type</Label>
                <Select 
                  value={newPoint.type} 
                  onValueChange={(value) => setNewPoint({ ...newPoint, type: value as Point['type'] })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tourist">Tourist Attraction</SelectItem>
                    <SelectItem value="shopping">Shopping</SelectItem>
                    <SelectItem value="restaurant">Restaurant</SelectItem>
                    <SelectItem value="accommodation">Accommodation</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="imageUrl">Image URL (optional)</Label>
                <Input
                  id="imageUrl"
                  value={newPoint.imageUrl || ''}
                  onChange={(e) => setNewPoint({ ...newPoint, imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="w-full"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  resetForm();
                  setIsAddDialogOpen(false);
                }}
                className="w-24 sm:w-28"
              >
                Cancel
              </Button>
              <Button 
                className="bg-travel-mustard hover:bg-travel-mustard/80 text-travel-dark w-24 sm:w-28"
                onClick={handleAddPoint}
                disabled={addPointMutation.isPending}
              >
                {addPointMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Point"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Point of Interest</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={newPoint.name}
                  onChange={(e) => setNewPoint({ ...newPoint, name: e.target.value })}
                  placeholder="e.g., Eiffel Tower"
                  className="w-full"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={newPoint.description}
                  onChange={(e) => setNewPoint({ ...newPoint, description: e.target.value })}
                  placeholder="Brief description of this place..."
                  className="w-full"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-address">Address</Label>
                <Input
                  id="edit-address"
                  value={newPoint.address}
                  onChange={(e) => setNewPoint({ ...newPoint, address: e.target.value })}
                  placeholder="Full address"
                  className="w-full"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-googleMapsUrl">Google Maps URL (optional)</Label>
                <Input
                  id="edit-googleMapsUrl"
                  value={newPoint.googleMapsUrl || ''}
                  onChange={(e) => setNewPoint({ ...newPoint, googleMapsUrl: e.target.value })}
                  placeholder="https://maps.google.com/..."
                  className="w-full"
                />
              </div>
              
              <OpeningHoursInput 
                value={newPoint.openingHours || ''}
                onChange={(value) => setNewPoint({ ...newPoint, openingHours: value })}
              />
              
              <div className="grid gap-2">
                <Label htmlFor="edit-plannedVisitDate">Planned Visit Date (optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="edit-plannedVisitDate"
                      variant="outline"
                      className="w-full flex justify-start text-left font-normal h-10"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {date ? format(date, 'PPP') : <span className="text-muted-foreground">Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-type">Type</Label>
                <Select 
                  value={newPoint.type} 
                  onValueChange={(value) => setNewPoint({ ...newPoint, type: value as Point['type'] })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tourist">Tourist Attraction</SelectItem>
                    <SelectItem value="shopping">Shopping</SelectItem>
                    <SelectItem value="restaurant">Restaurant</SelectItem>
                    <SelectItem value="accommodation">Accommodation</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-imageUrl">Image URL (optional)</Label>
                <Input
                  id="edit-imageUrl"
                  value={newPoint.imageUrl || ''}
                  onChange={(e) => setNewPoint({ ...newPoint, imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="w-full"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  resetForm();
                  setEditPointId(null);
                  setIsEditDialogOpen(false);
                }}
                className="w-24 sm:w-28"
              >
                Cancel
              </Button>
              <Button 
                className="bg-travel-mustard hover:bg-travel-mustard/80 text-travel-dark w-24 sm:w-28"
                onClick={handleUpdatePoint}
                disabled={updatePointMutation.isPending}
              >
                {updatePointMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Point"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {points.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[400px] bg-travel-beige/50 rounded-lg border border-travel-mustard/20">
          <MapPin className="h-16 w-16 text-travel-mustard/50 mb-4" />
          <h3 className="text-xl font-medium text-travel-dark">No points added yet</h3>
          <p className="text-travel-dark/70 mb-4">Start adding your favorite places and destinations</p>
          <Button 
            className="bg-travel-mustard hover:bg-travel-mustard/80 text-travel-dark"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Your First Point
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {points.map((point) => (
            <Card key={point.id} className="overflow-hidden card-hover">
              {point.image_url && (
                <div 
                  className="h-48 overflow-hidden cursor-pointer" 
                  onClick={() => handleOpenDetails(point)}
                  aria-label={`View details for ${point.name}`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleOpenDetails(point);
                    }
                  }}
                >
                  <img 
                    src={point.image_url} 
                    alt={point.name} 
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{point.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {new Date(point.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => handleEditPoint(point.id)}
                    >
                      <Edit className="h-4 w-4 text-travel-blue" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8" 
                      onClick={() => handleDeletePoint(point.id)}
                    >
                      <Trash className="h-4 w-4 text-travel-red" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-travel-dark/80 mb-4">{point.description}</p>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-travel-blue mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-travel-dark/70">{point.address}</span>
                </div>
                
                {/* Opening Hours */}
                {(point.opening_hours || point.openingHours) && (
                  <div className="flex items-start gap-2 mt-2">
                    <Clock className="h-4 w-4 text-travel-blue mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-travel-dark/70">
                      {point.opening_hours || point.openingHours}
                    </span>
                  </div>
                )}
                
                {point.google_maps_url && (
                  <div className="flex items-start gap-2 mt-2">
                    <Globe className="h-4 w-4 text-travel-blue mt-0.5 flex-shrink-0" />
                    <a 
                      href={point.google_maps_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-travel-blue hover:underline flex items-center"
                    >
                      Google Maps
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </div>
                )}
                
                {/* Planned Visit Date */}
                {(point.planned_visit_date || point.plannedVisitDate) && (
                  <div className="flex items-start gap-2 mt-2">
                    <Calendar className="h-4 w-4 text-travel-blue mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-travel-dark/70">
                      Planned visit: {format(new Date(point.planned_visit_date || point.plannedVisitDate!), 'PPP')}
                    </span>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <div className="w-full flex justify-between items-center">
                  <span className="inline-block text-xs px-2 py-1 rounded-full bg-travel-light-blue text-travel-blue">
                    {point.type.charAt(0).toUpperCase() + point.type.slice(1)}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="ml-auto text-travel-dark"
                    onClick={() => handleOpenDetails(point)}
                  >
                    View Details
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Details Modal */}
      <PointDetailsModal 
        point={selectedPoint} 
        isOpen={isDetailsModalOpen} 
        onClose={() => setIsDetailsModalOpen(false)} 
      />
    </PageContainer>
  );
};

export default Points;
