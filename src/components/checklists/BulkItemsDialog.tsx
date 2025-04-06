
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BulkItemsDialogProps {
  checklistId: string;
  checklistName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddItems: (items: string[]) => void;
  isAdding: boolean;
}

const BulkItemsDialog: React.FC<BulkItemsDialogProps> = ({
  checklistId,
  checklistName,
  open,
  onOpenChange,
  onAddItems,
  isAdding,
}) => {
  const [itemsText, setItemsText] = useState('');
  const { toast } = useToast();

  const handleAddItems = () => {
    const lines = itemsText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (lines.length === 0) {
      toast({
        title: "Nenhum item para adicionar",
        description: "Por favor, digite pelo menos um item para adicionar.",
        variant: "destructive",
      });
      return;
    }

    onAddItems(lines);
    setItemsText('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Vários Itens a {checklistName}</DialogTitle>
          <DialogDescription>
            Digite um item por linha para adicionar vários itens de uma vez.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            placeholder="Ex:
Documento de identidade
Passaporte
Escova de dentes
Carregador de celular"
            value={itemsText}
            onChange={(e) => setItemsText(e.target.value)}
            className="min-h-[150px]"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleAddItems}
            disabled={isAdding || itemsText.trim() === ''}
            className="bg-travel-mustard hover:bg-travel-mustard/80 text-travel-dark"
          >
            {isAdding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adicionando...
              </>
            ) : (
              "Adicionar Itens"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkItemsDialog;
