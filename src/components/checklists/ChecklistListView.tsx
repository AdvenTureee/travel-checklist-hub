import React, { useState, useRef, useEffect } from 'react';
import { Checklist, ChecklistItem } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit, Trash, Plus, ListChecks, ListPlus, ChevronDown, ChevronUp, Check, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { DropResult } from 'react-beautiful-dnd';
import DraggableList from '../shared/DraggableList';
import DraggableItem from '../shared/DraggableItem';

interface ChecklistListViewProps {
  checklists: Checklist[];
  checklistItems: ChecklistItem[];
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

const ChecklistListView: React.FC<ChecklistListViewProps> = ({
  checklists,
  checklistItems,
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
  // State to track which checklists are expanded
  const [expandedChecklists, setExpandedChecklists] = useState<Record<string, boolean>>({});
  // State to track which item is being edited
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  // State to track the current editing text
  const [editingText, setEditingText] = useState<string>('');
  // Reference for the input field
  const inputRef = useRef<HTMLInputElement>(null);

  // Toggle expansion for a checklist
  const toggleExpansion = (checklistId: string) => {
    setExpandedChecklists(prev => ({
      ...prev,
      [checklistId]: !prev[checklistId]
    }));
  };

  // Start editing an item
  const handleStartEdit = (item: ChecklistItem) => {
    setEditingItemId(item.id);
    setEditingText(item.text);
  };

  // Save edited text
  const handleSaveEdit = () => {
    if (editingItemId && onUpdateItemText && editingText.trim()) {
      onUpdateItemText(editingItemId, editingText);
    }
    setEditingItemId(null);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditingText('');
  };

  // Handle key press events for the input field
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  // Focus the input field when editing starts
  useEffect(() => {
    if (editingItemId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingItemId]);

  // Calculate completion percentage for a checklist
  const calculateCompletion = (checklistId: string) => {
    const items = checklistItems.filter(item => item.checklist_id === checklistId);
    if (items.length === 0) return 0;
    const completedItems = items.filter(item => item.completed).length;
    return Math.round((completedItems / items.length) * 100);
  };

  // Handle drag end for checklists
  const handleChecklistDragEnd = (result: DropResult) => {
    if (!result.destination || !onReorderChecklists) return;
    
    const newOrder = Array.from(checklists.map(c => c.id));
    const [reorderedItem] = newOrder.splice(result.source.index, 1);
    newOrder.splice(result.destination.index, 0, reorderedItem);
    
    onReorderChecklists(newOrder);
  };

  // Handle drag end for checklist items
  const handleItemsDragEnd = (checklistId: string, result: DropResult) => {
    if (!result.destination || !onReorderItems) return;
    
    const items = checklistItems.filter(item => item.checklist_id === checklistId);
    const newOrder = Array.from(items.map(item => item.id));
    const [reorderedItem] = newOrder.splice(result.source.index, 1);
    newOrder.splice(result.destination.index, 0, reorderedItem);
    
    onReorderItems(checklistId, newOrder);
  };

  return (
    <TooltipProvider>
      <DraggableList 
        droppableId="checklists" 
        onDragEnd={handleChecklistDragEnd}
        className="space-y-4"
      >
        {checklists.map((checklist, index) => {
          const items = checklistItems.filter(item => item.checklist_id === checklist.id);
          const completionPercentage = calculateCompletion(checklist.id);
          const isExpanded = expandedChecklists[checklist.id] || false;
          
          return (
            <DraggableItem 
              key={checklist.id} 
              id={checklist.id} 
              index={index}
              className="rounded-lg"
            >
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                layout
              >
                <Card className="border-l-4 border-l-travel-blue">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{checklist.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {checklist.description || 'Sem descrição'}
                        </p>
                      </div>
                      <div className="flex space-x-1">
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
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-muted-foreground">Conclusão</span>
                        <span className="text-xs font-medium">{completionPercentage}%</span>
                      </div>
                      <Progress value={completionPercentage} className="h-2" />
                    </div>
                    
                    <Collapsible open={isExpanded} onOpenChange={() => toggleExpansion(checklist.id)}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-medium">Itens ({items.length})</div>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            {isExpanded ? 
                              <ChevronUp className="h-4 w-4" /> : 
                              <ChevronDown className="h-4 w-4" />
                            }
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                      
                      {!isExpanded && items.length > 0 && (
                        <div className="space-y-2 mt-4">
                          {items.slice(0, 3).map(item => (
                            <div key={item.id} className="flex items-center justify-between group">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id={`list-item-${item.id}`}
                                  checked={item.completed}
                                  onCheckedChange={(checked) => 
                                    onToggleItem(item.id, checked as boolean)
                                  }
                                />
                                <label
                                  htmlFor={`list-item-${item.id}`}
                                  className={`text-sm ${
                                    item.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                                  }`}
                                >
                                  {item.text}
                                </label>
                              </div>
                              <div className="flex items-center opacity-0 group-hover:opacity-100">
                                {onUpdateItemText && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 mr-1"
                                    onClick={() => handleStartEdit(item)}
                                  >
                                    <Edit className="h-3 w-3 text-travel-blue" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => onDeleteItem(item.id)}
                                >
                                  <Trash className="h-3 w-3 text-travel-red" />
                                </Button>
                              </div>
                            </div>
                          ))}
                          {items.length > 3 && (
                            <div className="text-sm text-muted-foreground mt-1">
                              + {items.length - 3} mais itens
                            </div>
                          )}
                        </div>
                      )}
                      
                      <CollapsibleContent 
                        className="transition-all data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up"
                      >
                        {onReorderItems ? (
                          <DraggableList
                            droppableId={`checklist-items-${checklist.id}`}
                            onDragEnd={(result) => handleItemsDragEnd(checklist.id, result)}
                            className="space-y-2 mt-2 max-h-[300px] overflow-y-auto pr-1"
                          >
                            {items.map((item, itemIndex) => (
                              <DraggableItem
                                key={item.id}
                                id={item.id}
                                index={itemIndex}
                              >
                                <motion.div 
                                  className="flex items-center justify-between group"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  {editingItemId === item.id ? (
                                    <div className="flex-1 flex items-center gap-2">
                                      <Input
                                        ref={inputRef}
                                        value={editingText}
                                        onChange={(e) => setEditingText(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        className="h-7 py-1 text-sm"
                                      />
                                      <div className="flex items-center">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0 text-green-600"
                                          onClick={handleSaveEdit}
                                        >
                                          <Check className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0 text-travel-red"
                                          onClick={handleCancelEdit}
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="flex items-center gap-2">
                                        <Checkbox
                                          id={`expanded-item-${item.id}`}
                                          checked={item.completed}
                                          onCheckedChange={(checked) => 
                                            onToggleItem(item.id, checked as boolean)
                                          }
                                        />
                                        <label
                                          htmlFor={`expanded-item-${item.id}`}
                                          className={`text-sm ${
                                            item.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                                          }`}
                                        >
                                          {item.text}
                                        </label>
                                      </div>
                                      <div className="flex items-center opacity-0 group-hover:opacity-100">
                                        {onUpdateItemText && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 mr-1"
                                            onClick={() => handleStartEdit(item)}
                                          >
                                            <Edit className="h-3 w-3 text-travel-blue" />
                                          </Button>
                                        )}
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0"
                                          onClick={() => onDeleteItem(item.id)}
                                        >
                                          <Trash className="h-3 w-3 text-travel-red" />
                                        </Button>
                                      </div>
                                    </>
                                  )}
                                </motion.div>
                              </DraggableItem>
                            ))}
                          </DraggableList>
                        ) : (
                          <motion.div 
                            className="space-y-2 mt-2 max-h-[300px] overflow-y-auto pr-1"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                          >
                            {items.map(item => (
                              <motion.div 
                                key={item.id} 
                                className="flex items-center justify-between group"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                {editingItemId === item.id ? (
                                  <div className="flex-1 flex items-center gap-2">
                                    <Input
                                      ref={inputRef}
                                      value={editingText}
                                      onChange={(e) => setEditingText(e.target.value)}
                                      onKeyDown={handleKeyDown}
                                      className="h-7 py-1 text-sm"
                                    />
                                    <div className="flex items-center">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 text-green-600"
                                        onClick={handleSaveEdit}
                                      >
                                        <Check className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 text-travel-red"
                                        onClick={handleCancelEdit}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex items-center gap-2">
                                      <Checkbox
                                        id={`expanded-item-${item.id}`}
                                        checked={item.completed}
                                        onCheckedChange={(checked) => 
                                          onToggleItem(item.id, checked as boolean)
                                        }
                                      />
                                      <label
                                        htmlFor={`expanded-item-${item.id}`}
                                        className={`text-sm ${
                                          item.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                                        }`}
                                      >
                                        {item.text}
                                      </label>
                                    </div>
                                    <div className="flex items-center opacity-0 group-hover:opacity-100">
                                      {onUpdateItemText && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0 mr-1"
                                          onClick={() => handleStartEdit(item)}
                                        >
                                          <Edit className="h-3 w-3 text-travel-blue" />
                                        </Button>
                                      )}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0"
                                        onClick={() => onDeleteItem(item.id)}
                                      >
                                        <Trash className="h-3 w-3 text-travel-red" />
                                      </Button>
                                    </div>
                                  </>
                                )}
                              </motion.div>
                            ))}
                          </motion.div>
                        )}
                        {items.length === 0 && (
                          <div className="text-center py-4 text-muted-foreground text-sm">
                            Nenhum item nesta checklist ainda
                          </div>
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-1">
                    <div className="flex space-x-3">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-travel-blue"
                            onClick={() => onAddItem(checklist.id)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Adicionar Item</p>
                        </TooltipContent>
                      </Tooltip>
                      
                      {onBulkAddItems && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-travel-blue"
                              onClick={() => onBulkAddItems(checklist.id)}
                            >
                              <ListPlus className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Adicionar Vários Itens</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => onChecklistView(checklist.id)}
                          className="h-8 w-8 text-travel-dark"
                        >
                          <ListChecks className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Ver Todos os Itens</p>
                      </TooltipContent>
                    </Tooltip>
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

export default ChecklistListView;
