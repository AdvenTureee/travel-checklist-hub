
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
      <DialogContent className="w-[90vw] max-w-[550px] sm:w-auto">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">Add Multiple Items to {checklistName}</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Enter one item per line. All items will be added to your checklist.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2 sm:py-4">
          <div className="grid gap-2">
            <Label htmlFor="bulk-items">Items (one per line)</Label>
            <Textarea
              id="bulk-items"
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder="Pack passport
Charge camera
Print tickets
Exchange currency"
              className="min-h-[150px] sm:min-h-[200px]"
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
            Cancel
          </Button>
          <Button
            onClick={handleAddItems}
            disabled={isAdding || !bulkText.trim()}
            className="w-full sm:w-auto bg-travel-mustard hover:bg-travel-mustard/80 text-travel-dark text-xs sm:text-sm"
          >
            {isAdding ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Items"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkItemsDialog;
