
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
import { motion } from 'framer-motion';

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
        <DialogHeader className="bg-gradient-to-r from-white to-travel-beige/30 pb-4 -mt-2 -mx-2 px-6 pt-6 rounded-t-lg">
          <DialogTitle className="text-xl text-travel-dark">{checklist.name}</DialogTitle>
          {checklist.description && (
            <p className="text-sm text-travel-dark/70 mt-1">{checklist.description}</p>
          )}
          {associatedPoint && (
            <div className="flex items-center gap-2 mt-2 p-2 bg-travel-beige/50 rounded-md w-fit">
              <MapPin className="h-4 w-4 text-travel-blue" />
              <span className="text-sm text-travel-dark/80">{associatedPoint.name}</span>
            </div>
          )}
          <div className="mt-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-travel-dark/70">Conclusão</span>
              <span className="text-xs font-semibold">{completionPercentage}%</span>
            </div>
            <Progress 
              value={completionPercentage} 
              className="h-2.5 bg-travel-beige" 
              indicatorClassName="bg-gradient-to-r from-travel-blue to-travel-light-blue"
            />
          </div>
        </DialogHeader>

        <div className="overflow-y-auto py-4 flex-grow custom-scrollbar px-1">
          <div className="space-y-1">
            {items.length === 0 ? (
              <div className="text-center py-8 text-travel-dark/60 bg-travel-beige/30 rounded-md">
                <p className="font-medium">No items in this checklist yet</p>
                <p className="text-sm mt-1">Add your first item below</p>
              </div>
            ) : (
              <motion.div 
                className="space-y-1" 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {items.map((item, index) => (
                  <motion.div 
                    key={item.id} 
                    className="flex items-center justify-between group p-2.5 hover:bg-travel-beige/50 rounded-md transition-colors"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                  >
                    <div className="flex items-center gap-2 flex-grow">
                      <Checkbox 
                        id={`view-item-${item.id}`}
                        checked={item.completed}
                        onCheckedChange={(checked) => 
                          onToggleItem(item.id, checked as boolean)
                        }
                        className="border-travel-blue data-[state=checked]:bg-travel-blue data-[state=checked]:text-white"
                      />
                      <label
                        htmlFor={`view-item-${item.id}`}
                        className={`text-sm transition-all ${
                          item.completed ? 'line-through text-travel-dark/50' : 'text-travel-dark'
                        }`}
                      >
                        {item.text}
                      </label>
                    </div>
                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 hover:bg-travel-light-blue/20"
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
                              className="h-7 w-7 p-0 hover:bg-travel-light-red/20"
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
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>

        <div className="border-t pt-4 bg-travel-beige/20">
          <div className="flex items-end gap-2">
            <div className="flex-grow">
              <Label htmlFor="new-item" className="text-sm font-medium text-travel-dark">Add New Item</Label>
              <Input
                id="new-item"
                placeholder="Enter item text..."
                value={newItemText}
                onChange={(e) => onNewItemTextChange(e.target.value)}
                className="mt-1 border-travel-blue/30 focus:border-travel-blue focus:ring-1 focus:ring-travel-blue"
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

        <DialogFooter className="mt-4">
          <Button 
            onClick={() => onOpenChange(false)}
            className="bg-travel-blue hover:bg-travel-blue/80 text-white"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ChecklistViewDialog;
