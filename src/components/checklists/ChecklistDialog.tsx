import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { Checklist, Point } from '@/lib/types';
interface ChecklistFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  checklist: Partial<Checklist>;
  points: Point[];
  isSubmitting: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  onChecklistChange: (checklist: Partial<Checklist>) => void;
  submitButtonText: string;
  loadingText: string;
}
const ChecklistDialog = ({
  isOpen,
  onOpenChange,
  title,
  description,
  checklist,
  points,
  isSubmitting,
  onSubmit,
  onCancel,
  onChecklistChange,
  submitButtonText,
  loadingText
}: ChecklistFormProps) => {
  return <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" value={checklist.name || ''} onChange={e => onChecklistChange({
            ...checklist,
            name: e.target.value
          })} placeholder="ex: Itens essenciais para Paris" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea id="description" value={checklist.description || ''} onChange={e => onChecklistChange({
            ...checklist,
            description: e.target.value
          })} placeholder="Breve descrição desta checklist..." />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="point">Ponto associado (opcional)</Label>
            <Select value={checklist.pointId || 'none'} onValueChange={value => onChecklistChange({
            ...checklist,
            pointId: value === 'none' ? null : value
          })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um ponto" />
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
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="bg-travel-mustard hover:bg-travel-mustard/80 text-travel-dark"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {loadingText}
              </>
            ) : (
              submitButtonText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  }


export default ChecklistDialog;