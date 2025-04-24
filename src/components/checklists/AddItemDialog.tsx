
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface AddItemDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  checklistName?: string;
  values: {
    name: string;
    description: string;
    address: string;
    type: string;
    google_maps_url: string;
    opening_hours: string;
    planned_visit_date: string;
    image_url: string;
  };
  onChange: (field: keyof AddItemDialogProps['values'], value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  types?: string[];
}

const AddItemDialog = ({
  isOpen,
  onOpenChange,
  checklistName,
  values,
  onChange,
  onSubmit,
  isSubmitting,
  types = ['tourist', 'shopping', 'restaurant', 'accommodation', 'other']
}: AddItemDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{checklistName ? `Adicionar ponto à ${checklistName}` : 'Adicionar ponto'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={values.name}
              onChange={e => onChange('name', e.target.value)}
              placeholder="ex: Torre Eiffel"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              value={values.description}
              onChange={e => onChange('description', e.target.value)}
              placeholder="Opcional"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              value={values.address}
              onChange={e => onChange('address', e.target.value)}
              placeholder="ex: Champ de Mars, Paris"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="type">Tipo</Label>
            <select
              id="type"
              className="input"
              value={values.type}
              onChange={e => onChange('type', e.target.value)}
              required
            >
              <option value="">Selecione...</option>
              {types.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="google_maps_url">URL Google Maps</Label>
            <Input
              id="google_maps_url"
              value={values.google_maps_url}
              onChange={e => onChange('google_maps_url', e.target.value)}
              placeholder="https://maps.google.com/..."
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="opening_hours">Horário de Funcionamento</Label>
            <Input
              id="opening_hours"
              value={values.opening_hours}
              onChange={e => onChange('opening_hours', e.target.value)}
              placeholder="ex: 09:00 - 18:00"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="planned_visit_date">Data planejada para visita</Label>
            <Input
              id="planned_visit_date"
              type="date"
              value={values.planned_visit_date}
              onChange={e => onChange('planned_visit_date', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="image_url">URL da Imagem</Label>
            <Input
              id="image_url"
              value={values.image_url}
              onChange={e => onChange('image_url', e.target.value)}
              placeholder="Opcional"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            onClick={onSubmit}
            disabled={isSubmitting || !values.name.trim() || !values.address.trim() || !values.type}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adicionando...
              </>
            ) : (
              'Adicionar Ponto'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddItemDialog;
