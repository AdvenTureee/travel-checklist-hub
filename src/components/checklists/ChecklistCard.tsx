import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Checklist, ChecklistItem, Point } from '@/lib/types';
import { PlusCircle, Edit, Trash, ListChecks, MapPin, ListPlus, ChevronDown, Plus } from 'lucide-react';
interface ChecklistCardProps {
  checklist: Checklist;
  items: ChecklistItem[];
  completionPercentage: number;
  associatedPoint: Point | null;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
  onToggleItem: (id: string, completed: boolean) => void;
  onUpdateItemText: (id: string, text: string) => void;
  onDeleteItem: (id: string) => void;
  onAddItem: (id: string) => void;
  onBulkAddItems: (id: string) => void;
}
const ChecklistCard = ({
  checklist,
  items,
  completionPercentage,
  associatedPoint,
  onEdit,
  onDelete,
  onView,
  onToggleItem,
  onUpdateItemText,
  onDeleteItem,
  onAddItem,
  onBulkAddItems
}: ChecklistCardProps) => {
  return <motion.div key={checklist.id} initial={{
    opacity: 0,
    y: 20
  }} animate={{
    opacity: 1,
    y: 0
  }} transition={{
    duration: 0.3
  }} layout>
      <Card className="overflow-hidden shadow-md border-l-4 border-l-travel-blue hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="pb-2 bg-gradient-to-r from-white to-travel-beige/30">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl text-travel-dark">{checklist.name}</CardTitle>
              <CardDescription className="mt-1 text-travel-dark/70">
                {new Date(checklist.createdAt || checklist.created_at).toLocaleDateString()}
              </CardDescription>
            </div>
            <div className="flex gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-travel-light-blue/20" onClick={() => onEdit(checklist.id)}>
                      <Edit className="h-4 w-4 text-travel-blue" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Edit Checklist</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-travel-light-red/20" onClick={() => onDelete(checklist.id)}>
                      <Trash className="h-4 w-4 text-travel-red" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Delete Checklist</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-sm text-travel-dark/80 mb-4 line-clamp-2">{checklist.description || 'No description'}</p>
          
          {associatedPoint && <div className="flex items-start gap-2 mb-4 p-2 bg-travel-beige rounded-md">
              <MapPin className="h-4 w-4 text-travel-blue mt-0.5 flex-shrink-0" />
              <span className="text-sm text-travel-dark/80">{associatedPoint.name}</span>
            </div>}
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-travel-dark/70">Completion</span>
              <span className="text-xs font-semibold">{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2.5 bg-travel-beige" indicatorClassName="bg-gradient-to-r from-travel-blue to-travel-light-blue" />
          </div>
          
          <div className="space-y-2 mt-4">
            {items.slice(0, 3).map(item => <div key={item.id} className="flex items-center justify-between group p-2 rounded-md hover:bg-travel-beige/50 transition-colors">
                <div className="flex items-center gap-2 flex-grow">
                  <Checkbox id={`item-${item.id}`} checked={item.completed} onCheckedChange={checked => onToggleItem(item.id, checked as boolean)} className="border-travel-blue data-[state=checked]:bg-travel-blue data-[state=checked]:text-white" />
                  <label htmlFor={`item-${item.id}`} className={`text-sm transition-all ${item.completed ? 'line-through text-travel-dark/50' : 'text-travel-dark'}`}>
                    {item.text}
                  </label>
                </div>
                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-travel-light-blue/20" onClick={() => {
                const newText = prompt("Edit item:", item.text);
                if (newText !== null) {
                  onUpdateItemText(item.id, newText);
                }
              }}>
                    <Edit className="h-3 w-3 text-travel-blue" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-1 hover:bg-travel-light-red/20" onClick={() => onDeleteItem(item.id)}>
                    <Trash className="h-3 w-3 text-travel-red" />
                  </Button>
                </div>
              </div>)}
          </div>
          
          {items.length > 3 && <div className="flex justify-center mt-4">
              <Button variant="ghost" size="sm" className="text-travel-dark hover:bg-travel-light-mustard font-medium" onClick={() => onView(checklist.id)}>
                <ChevronDown className="h-4 w-4 mr-1" />
                Show {items.length - 3} more items
              </Button>
            </div>}
        </CardContent>
        <CardFooter className="bg-travel-beige/30 border-t border-travel-beige px-[10px] py-0 my-[4px]">
          <div className="w-full flex justify-between items-center mx-[11px] my-[20px] px-0 py-0">
            <div className="flex gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="h-8 w-8 text-travel-blue border-travel-blue/30 hover:bg-travel-light-blue/10 hover:text-travel-blue" onClick={() => onAddItem(checklist.id)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Add Item</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="h-8 w-8 text-travel-blue border-travel-blue/30 hover:bg-travel-light-blue/10 hover:text-travel-blue" onClick={() => onBulkAddItems(checklist.id)}>
                      <ListPlus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Bulk Add Items</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8 text-travel-dark border-travel-dark/30 hover:bg-travel-dark/10" onClick={() => onView(checklist.id)}>
                    <ListChecks className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View All Items</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardFooter>
      </Card>
    </motion.div>;
};
export default ChecklistCard;