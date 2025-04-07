
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { MapPin, Plus, Edit, Trash } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Checklist, ChecklistItem, Point } from '@/lib/types';

interface ChecklistViewDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  checklist: Checklist | null;
  items: ChecklistItem[];
  associatedPoint: Point | null;
  completionPercentage: number;
  onToggleItem: (id: string, completed: boolean) => void;
  onDeleteItem: (id: string) => void;
  onUpdateItemText: (id: string, text: string) => void;
  onAddNewItem: () => void;
  newItemText: string;
  onNewItemTextChange: (text: string) => void;
}

const ChecklistViewDialog = ({
  isOpen,
  onOpenChange,
  checklist,
  items,
  associatedPoint,
  completionPercentage,
  onToggleItem,
  onDeleteItem,
  onUpdateItemText,
  onAddNewItem,
  newItemText,
  onNewItemTextChange
}: ChecklistViewDialogProps) => {
  if (!checklist) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{checklist.name}</DialogTitle>
          {checklist.description && (
            <p className="text-sm text-muted-foreground mt-1">{checklist.description}</p>
          )}
          {associatedPoint && (
            <div className="flex items-center gap-2 mt-2">
              <MapPin className="h-4 w-4 text-travel-blue" />
              <span className="text-sm text-travel-dark/70">{associatedPoint.name}</span>
            </div>
          )}
          <div className="mt-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-travel-dark/70">Completion</span>
              <span className="text-xs font-medium">{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>
        </DialogHeader>

        <div className="overflow-y-auto py-4 flex-grow">
          <div className="space-y-4">
            {items.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No items in this checklist yet.</p>
            ) : (
              <div className="space-y-2">
                {items.map(item => (
                  <div key={item.id} className="flex items-center justify-between group p-2 hover:bg-muted/50 rounded-md">
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id={`view-item-${item.id}`}
                        checked={item.completed}
                        onCheckedChange={(checked) => 
                          onToggleItem(item.id, checked as boolean)
                        }
                      />
                      <label
                        htmlFor={`view-item-${item.id}`}
                        className={item.completed ? 'line-through text-travel-dark/50' : 'text-travel-dark'}
                      >
                        {item.text}
                      </label>
                    </div>
                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => {
                                const newText = prompt("Edit item:", item.text);
                                if (newText !== null) {
                                  onUpdateItemText(item.id, newText);
                                }
                              }}
                            >
                              <Edit className="h-3.5 w-3.5 text-travel-blue" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit Item</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => onDeleteItem(item.id)}
                            >
                              <Trash className="h-3.5 w-3.5 text-travel-red" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Delete Item</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-end gap-2">
            <div className="flex-grow">
              <Label htmlFor="new-item" className="text-sm">Add New Item</Label>
              <Input
                id="new-item"
                placeholder="Enter item text..."
                value={newItemText}
                onChange={(e) => onNewItemTextChange(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button 
              onClick={onAddNewItem}
              size="sm"
              className="bg-travel-mustard hover:bg-travel-mustard/80 text-travel-dark"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ChecklistViewDialog;
