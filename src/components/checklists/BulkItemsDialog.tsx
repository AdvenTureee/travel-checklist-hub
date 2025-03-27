
import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

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
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Add Multiple Items to {checklistName}</DialogTitle>
          <DialogDescription>
            Enter one item per line. All items will be added to your checklist.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
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
              className="min-h-[200px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => {
              onOpenChange(false);
              setBulkText('');
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddItems}
            disabled={isAdding || !bulkText.trim()}
            className="bg-travel-mustard hover:bg-travel-mustard/80 text-travel-dark"
          >
            {isAdding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
