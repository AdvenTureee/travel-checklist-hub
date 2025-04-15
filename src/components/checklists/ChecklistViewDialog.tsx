
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
      <DialogContent className="w-screen h-screen max-w-none max-h-none rounded-none p-0 flex flex-col justify-center items-center overflow-auto bg-white/90">
        <DialogHeader className="w-[95vw] max-w-3xl mx-auto bg-white/95 rounded-lg shadow-md px-6 py-4 mb-2">
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

        <div className="overflow-y-auto py-1 flex-grow custom-scrollbar px-0 min-h-0 w-[95vw] max-w-3xl mx-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
          <div className="space-y-1">
            {items.length === 0 ? (
              <div className="text-center py-4 text-travel-dark/60 bg-travel-beige/30 rounded-md">
                <p className="font-medium">No items in this checklist yet</p>
                <p className="text-sm mt-1">Add your first item below</p>
              </div>
            ) : (
              <motion.div 
                className="space-y-0.5" 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {items.map((item, index) => (
                  <motion.div 
                    key={item.id} 
                    className="flex items-center justify-between group p-1.5 hover:bg-travel-beige/40 rounded transition-colors min-h-[36px] border-b border-travel-beige/60"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                  >
                    <div className="flex items-center gap-1 flex-grow">
                      <Checkbox 
                        id={`view-item-${item.id}`}
                        checked={item.completed}
                        onCheckedChange={(checked) => 
                          onToggleItem(item.id, checked as boolean)
                        }
                        className="border-travel-blue data-[state=checked]:bg-travel-blue data-[state=checked]:text-white h-4 w-4 min-h-4 min-w-4"
                      />
                      <label
                        htmlFor={`view-item-${item.id}`}
                        className={`text-xs transition-all ${
                          item.completed ? 'line-through text-travel-dark/50' : 'text-travel-dark'
                        }`}
                      >
                        {item.text}
                      </label>
                    </div>
                    <div className="flex space-x-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 hover:bg-travel-light-blue/20"
                              onClick={() => {
                                const newText = prompt("Edit item:", item.text);
                                if (newText !== null) {
                                  onUpdateItemText(item.id, newText);
                                }
                              }}
                            >
                              <Edit className="h-3 w-3 text-travel-blue" />
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
                              className="h-6 w-6 p-0 hover:bg-travel-light-red/20"
                              onClick={() => onDeleteItem(item.id)}
                            >
                              <Trash className="h-3 w-3 text-travel-red" />
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

        <div className="border-t pt-2 bg-travel-beige/20 w-[95vw] max-w-3xl mx-auto">
          <div className="flex items-end gap-1">
            <div className="flex-grow">
              <Label htmlFor="new-item" className="text-xs font-medium text-travel-dark">Novo item</Label>
              <Input
                id="new-item"
                placeholder="Digite o item..."
                value={newItemText}
                onChange={(e) => onNewItemTextChange(e.target.value)}
                className="mt-0.5 border-travel-blue/30 focus:border-travel-blue focus:ring-1 focus:ring-travel-blue text-xs h-8 bg-white/95"
              />
            </div>
            <Button 
              onClick={onAddNewItem}
              size="sm"
              className="bg-travel-mustard hover:bg-travel-mustard/80 text-travel-dark h-8 px-3 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Adicionar
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
