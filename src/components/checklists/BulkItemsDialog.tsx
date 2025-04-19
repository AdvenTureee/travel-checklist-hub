
import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface BulkItemsDialogProps {
  checklistId: string;
  checklistName: string;
  open: boolean; // Corrected prop name from isOpen to open
  onOpenChange: (open: boolean) => void;
  onAddItems: (items: string[]) => void;
  isAdding: boolean;
}

const BulkItemsDialog: React.FC<BulkItemsDialogProps> = ({
  checklistId,
  checklistName,
  open, // Updated prop name from isOpen to open
  onOpenChange,
  onAddItems,
  isAdding
}) => {
  const [bulkText, setBulkText] = useState('');
  const isMobile = useIsMobile();

  const handleAddItems = () => {
    if (bulkText.trim()) {
      // Split by new lines and filter out empty items
      const items = bulkText
        .split('\n')
        .map(item => item.trim())
        .filter(item => item.length > 0);
      
      if (items.length > 0) {
        onAddItems(items);
        setBulkText('');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[350px] w-full p-4 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">Adicionar vários itens à {checklistName}</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Digite um item por linha. Todos os itens serão adicionados à sua checklist.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2 sm:py-4">
          <div className="grid gap-2">
            <Label htmlFor="bulk-items">Itens (um por linha)</Label>
            <Textarea
              id="bulk-items"
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder="Separar passaporte"
              className="w-full sm:w-[250px] mx-auto min-h-[120px]"
            />
          </div>
        </div>
        <DialogFooter className="sm:space-x-2 flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-0">
          <Button 
            variant="outline" 
            onClick={() => {
              onOpenChange(false);
              setBulkText('');
            }}
            className="w-full sm:w-auto text-xs sm:text-sm"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleAddItems}
            disabled={isAdding || !bulkText.trim()}
            className="w-full sm:w-auto bg-travel-mustard hover:bg-travel-mustard/80 text-travel-dark text-xs sm:text-sm"
          >
            {isAdding ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                Adicionando...
              </>
            ) : (
              "Adicionar itens"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkItemsDialog;
