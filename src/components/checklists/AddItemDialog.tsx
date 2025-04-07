
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface AddItemDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  checklistName: string;
  itemText: string;
  onItemTextChange: (text: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

const AddItemDialog = ({
  isOpen,
  onOpenChange,
  checklistName,
  itemText,
  onItemTextChange,
  onSubmit,
  isSubmitting
}: AddItemDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Item to {checklistName}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="grid gap-2">
            <Label htmlFor="item-text">Item</Label>
            <Input
              id="item-text"
              value={itemText}
              onChange={(e) => onItemTextChange(e.target.value)}
              placeholder="e.g., Pack passport"
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isSubmitting || !itemText.trim()}
            className="bg-travel-mustard hover:bg-travel-mustard/80 text-travel-dark"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Item"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddItemDialog;
