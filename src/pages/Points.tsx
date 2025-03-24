
import React, { useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, MapPin, Edit, Trash } from 'lucide-react';
import { Point } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

// Mock data for points of interest
const initialPoints: Point[] = [
  {
    id: '1',
    name: 'Sagrada Familia',
    description: 'Beautiful basilica designed by Antoni Gaudí.',
    address: 'Carrer de Mallorca, 401, 08013 Barcelona, Spain',
    type: 'tourist',
    imageUrl: 'https://images.unsplash.com/photo-1583779457094-ab6f9164a948?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    createdAt: new Date('2023-01-15').toISOString(),
  },
  {
    id: '2',
    name: 'Mercado de San Miguel',
    description: 'Historic market with delicious Spanish cuisine.',
    address: 'Plaza de San Miguel, s/n, 28005 Madrid, Spain',
    type: 'restaurant',
    imageUrl: 'https://images.unsplash.com/photo-1519077336050-4ca5cac9d64f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    createdAt: new Date('2023-02-20').toISOString(),
  },
  {
    id: '3',
    name: 'Copacabana Beach',
    description: 'Famous beach in Rio de Janeiro.',
    address: 'Av. Atlântica, Rio de Janeiro - RJ, Brazil',
    type: 'tourist',
    imageUrl: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    createdAt: new Date('2023-03-10').toISOString(),
  }
];

const Points: React.FC = () => {
  const [points, setPoints] = useState<Point[]>(initialPoints);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newPoint, setNewPoint] = useState<Partial<Point>>({
    name: '',
    description: '',
    address: '',
    type: 'tourist',
  });
  const { toast } = useToast();

  const handleAddPoint = () => {
    if (!newPoint.name || !newPoint.address) {
      toast({
        title: "Missing information",
        description: "Please fill in at least the name and address.",
        variant: "destructive",
      });
      return;
    }

    const point: Point = {
      id: Date.now().toString(),
      name: newPoint.name,
      description: newPoint.description || '',
      address: newPoint.address,
      type: newPoint.type as Point['type'] || 'tourist',
      imageUrl: newPoint.imageUrl,
      createdAt: new Date().toISOString(),
    };

    setPoints([point, ...points]);
    setNewPoint({
      name: '',
      description: '',
      address: '',
      type: 'tourist',
    });
    setIsAddDialogOpen(false);
    
    toast({
      title: "Point added",
      description: `${point.name} has been added to your points.`,
    });
  };

  const handleDeletePoint = (id: string) => {
    const pointToDelete = points.find(p => p.id === id);
    setPoints(points.filter(point => point.id !== id));
    
    toast({
      title: "Point deleted",
      description: `${pointToDelete?.name} has been removed.`,
    });
  };

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
          <DialogContent className="sm:max-w-[550px]">
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
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newPoint.description}
                  onChange={(e) => setNewPoint({ ...newPoint, description: e.target.value })}
                  placeholder="Brief description of this place..."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={newPoint.address}
                  onChange={(e) => setNewPoint({ ...newPoint, address: e.target.value })}
                  placeholder="Full address"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Type</Label>
                <Select 
                  value={newPoint.type} 
                  onValueChange={(value) => setNewPoint({ ...newPoint, type: value as Point['type'] })}
                >
                  <SelectTrigger>
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
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                className="bg-travel-mustard hover:bg-travel-mustard/80 text-travel-dark"
                onClick={handleAddPoint}
              >
                Add Point
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
              {point.imageUrl && (
                <div className="h-48 overflow-hidden">
                  <img 
                    src={point.imageUrl} 
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
                      {new Date(point.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
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
              </CardContent>
              <CardFooter>
                <div className="w-full flex justify-between items-center">
                  <span className="inline-block text-xs px-2 py-1 rounded-full bg-travel-light-blue text-travel-blue">
                    {point.type.charAt(0).toUpperCase() + point.type.slice(1)}
                  </span>
                  <Button variant="outline" size="sm" className="ml-auto text-travel-dark">
                    View Details
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
};

export default Points;
