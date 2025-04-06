
import React, { useState } from 'react';
import { Checklist, ChecklistItem } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit, Trash, Plus, ListChecks, ListPlus, ChevronDown, MapPin } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion } from 'framer-motion';
import { Point } from '@/lib/types';
import { DropResult } from 'react-beautiful-dnd';
import DraggableList from '../shared/DraggableList';
import DraggableItem from '../shared/DraggableItem';

interface ChecklistCardViewProps {
  checklists: Checklist[];
  checklistItems: ChecklistItem[];
  points: Point[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onChecklistView: (id: string) => void;
  onToggleItem: (id: string, completed: boolean) => void;
  onDeleteItem: (id: string) => void;
  onAddItem: (checklistId: string) => void;
  onBulkAddItems?: (checklistId: string) => void;
  onUpdateItemText?: (id: string, text: string) => void;
  onReorderItems?: (checklistId: string, itemIds: string[]) => void;
  onReorderChecklists?: (checklistIds: string[]) => void;
}

const ChecklistCardView: React.FC<ChecklistCardViewProps> = ({
  checklists,
  checklistItems,
  points,
  onEdit,
  onDelete,
  onChecklistView,
  onToggleItem,
  onDeleteItem,
  onAddItem,
  onBulkAddItems,
  onUpdateItemText,
  onReorderItems,
  onReorderChecklists
}) => {
  // Calculate completion percentage for a checklist
  const calculateCompletion = (checklistId: string) => {
    const items = checklistItems.filter(item => item.checklist_id === checklistId);
    if (items.length === 0) return 0;
    const completedItems = items.filter(item => item.completed).length;
    return Math.round((completedItems / items.length) * 100);
  };

  // Find the associated point for a checklist
  const getAssociatedPoint = (pointId: string | null | undefined) => {
    if (!pointId) return null;
    return points.find(p => p.id === pointId);
  };

  // Handle drag end for checklists
  const handleChecklistDragEnd = (result: DropResult) => {
    if (!result.destination || !onReorderChecklists) return;
    
    const newOrder = Array.from(checklists.map(c => c.id));
    const [reorderedItem] = newOrder.splice(result.source.index, 1);
    newOrder.splice(result.destination.index, 0, reorderedItem);
    
    onReorderChecklists(newOrder);
  };

  return (
    <TooltipProvider>
      <DraggableList 
        droppableId="checklistCards" 
        onDragEnd={handleChecklistDragEnd}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {checklists.map((checklist, index) => {
          const completionPercentage = calculateCompletion(checklist.id);
          const associatedPoint = getAssociatedPoint(checklist.pointId || checklist.point_id);
          const items = checklistItems.filter(item => item.checklist_id === checklist.id);
          
          return (
            <DraggableItem
              key={checklist.id}
              id={checklist.id}
              index={index}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                layout
              >
                <Card className="overflow-hidden">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{checklist.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {new Date(checklist.createdAt || checklist.created_at).toLocaleDateString('pt-BR')}
                        </CardDescription>
                      </div>
                      <div className="flex gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => onEdit(checklist.id)}
                              >
                                <Edit className="h-4 w-4 text-travel-blue" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Editar Checklist</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8" 
                                onClick={() => onDelete(checklist.id)}
                              >
                                <Trash className="h-4 w-4 text-travel-red" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Excluir Checklist</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-travel-dark/80 mb-4">{checklist.description || 'Sem descrição'}</p>
                    
                    {associatedPoint && (
                      <div className="flex items-start gap-2 mb-4">
                        <MapPin className="h-4 w-4 text-travel-blue mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-travel-dark/70">{associatedPoint.name}</span>
                      </div>
                    )}
                    
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-travel-dark/70">Conclusão</span>
                        <span className="text-xs font-medium">{completionPercentage}%</span>
                      </div>
                      <Progress value={completionPercentage} className="h-2" />
                    </div>
                    
                    <div className="space-y-2 mt-4">
                      {items.slice(0, 3).map(item => (
                        <div key={item.id} className="flex items-center justify-between group">
                          <div className="flex items-center gap-2">
                            <Checkbox 
                              id={`item-${item.id}`}
                              checked={item.completed}
                              onCheckedChange={(checked) => 
                                onToggleItem(item.id, checked as boolean)
                              }
                            />
                            <label
                              htmlFor={`item-${item.id}`}
                              className={`text-sm ${
                                item.completed ? 'line-through text-travel-dark/50' : 'text-travel-dark'
                              }`}
                            >
                              {item.text}
                            </label>
                          </div>
                          <div className="flex">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                              onClick={() => {
                                const newText = prompt("Editar item:", item.text);
                                if (newText !== null && onUpdateItemText) {
                                  onUpdateItemText(item.id, newText);
                                }
                              }}
                            >
                              <Edit className="h-3 w-3 text-travel-blue" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                              onClick={() => onDeleteItem(item.id)}
                            >
                              <Trash className="h-3 w-3 text-travel-red" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {items.length > 3 && (
                      <div className="flex justify-center mt-4">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-travel-dark hover:bg-travel-light-mustard"
                          onClick={() => onChecklistView(checklist.id)}
                        >
                          <ChevronDown className="h-4 w-4 mr-1" />
                          Mostrar {items.length - 3} mais itens
                        </Button>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <div className="w-full flex justify-between items-center">
                      <div className="flex gap-3">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 text-travel-blue border-travel-blue/30 hover:bg-travel-light-blue/10 hover:text-travel-blue"
                                onClick={() => onAddItem(checklist.id)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Adicionar Item</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 text-travel-blue border-travel-blue/30 hover:bg-travel-light-blue/10 hover:text-travel-blue"
                                onClick={() => onBulkAddItems && onBulkAddItems(checklist.id)}
                              >
                                <ListPlus className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Adicionar Vários Itens</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 text-travel-dark border-travel-dark/30 hover:bg-travel-dark/10"
                              onClick={() => onChecklistView(checklist.id)}
                            >
                              <ListChecks className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Ver Todos os Itens</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </CardFooter>
                </Card>
              </motion.div>
            </DraggableItem>
          );
        })}
      </DraggableList>
    </TooltipProvider>
  );
};

export default ChecklistCardView;
