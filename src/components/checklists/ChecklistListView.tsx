
import React, { useState, useRef, useEffect } from 'react';
import { Checklist, ChecklistItem } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit, Trash, Plus, ListChecks, ListPlus, ChevronDown, ChevronUp, Check, X, GripVertical } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { DropResult } from 'react-beautiful-dnd';
import DraggableList from '../shared/DraggableList';
import DraggableItem from '../shared/DraggableItem';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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
      <div className="space-y-6">
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]"></TableHead>
                <TableHead className="w-[250px]">Nome da Checklist</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="w-[150px]">Progresso</TableHead>
                <TableHead className="w-[150px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <DraggableList 
                droppableId="checklists" 
                onDragEnd={handleChecklistDragEnd}
                className=""
              >
                {checklists.map((checklist, index) => {
                  const items = checklistItems.filter(item => item.checklist_id === checklist.id);
                  const completionPercentage = calculateCompletion(checklist.id);
                  const isExpanded = expandedChecklists[checklist.id] || false;
                  
                  return (
                    <React.Fragment key={checklist.id}>
                      <DraggableItem 
                        id={checklist.id} 
                        index={index}
                        className=""
                      >
                        <TableRow className="group">
                          <TableCell className="p-2">
                            <div className="flex items-center justify-center">
                              <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{checklist.name}</TableCell>
                          <TableCell>{checklist.description || 'Sem descrição'}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={completionPercentage} className="h-2 flex-grow" />
                              <span className="text-xs font-medium">{completionPercentage}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => toggleExpansion(checklist.id)}
                                    >
                                      {isExpanded ? 
                                        <ChevronUp className="h-4 w-4" /> : 
                                        <ChevronDown className="h-4 w-4" />
                                      }
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{isExpanded ? 'Recolher' : 'Expandir'} Itens</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              
                              <TooltipProvider>
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
                              </TooltipProvider>
                              
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
                          </TableCell>
                        </TableRow>
                      </DraggableItem>
                      
                      {/* Items section that expands/collapses */}
                      {isExpanded && (
                        <TableRow>
                          <TableCell colSpan={5} className="p-0 border-0">
                            <div className="bg-muted/30 px-4 py-3">
                              {items.length > 0 ? (
                                <div className="space-y-2">
                                  <h4 className="text-sm font-medium mb-2">Itens ({items.length})</h4>
                                  {onReorderItems ? (
                                    <DraggableList
                                      droppableId={`checklist-items-${checklist.id}`}
                                      onDragEnd={(result) => handleItemsDragEnd(checklist.id, result)}
                                      className="space-y-2"
                                    >
                                      {items.map((item, itemIndex) => (
                                        <DraggableItem
                                          key={item.id}
                                          id={item.id}
                                          index={itemIndex}
                                        >
                                          <div className="flex items-center justify-between group bg-background p-2 rounded-md">
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
                                                <div className="flex items-center gap-3 flex-grow">
                                                  <div className="flex items-center gap-2">
                                                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                                                    <Checkbox
                                                      id={`expanded-item-${item.id}`}
                                                      checked={item.completed}
                                                      onCheckedChange={(checked) => 
                                                        onToggleItem(item.id, checked as boolean)
                                                      }
                                                    />
                                                  </div>
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
                                          </div>
                                        </DraggableItem>
                                      ))}
                                    </DraggableList>
                                  ) : (
                                    <div className="space-y-2">
                                      {items.map(item => (
                                        <div key={item.id} className="flex items-center justify-between group bg-background p-2 rounded-md">
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
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-center py-4 text-muted-foreground text-sm">
                                  Nenhum item nesta checklist ainda. 
                                  <Button 
                                    variant="link" 
                                    className="text-travel-blue p-0 h-auto"
                                    onClick={() => onAddItem(checklist.id)}
                                  >
                                    Adicionar item
                                  </Button>
                                </div>
                              )}
                              
                              <div className="flex justify-end mt-3">
                                {onBulkAddItems && (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-travel-blue"
                                    onClick={() => onBulkAddItems(checklist.id)}
                                  >
                                    <ListPlus className="h-4 w-4 mr-1" />
                                    Adicionar Vários Itens
                                  </Button>
                                )}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </DraggableList>
              {checklists.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Nenhuma checklist encontrada. Crie uma nova para começar.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default ChecklistListView;
