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
  onUpdateItemText
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
    return Math.round(completedItems / items.length * 100);
  };
  return (
    <TooltipProvider>
      <div className="space-y-6 px-4 sm:px-6 py-4">
        {checklists.map(checklist => {
          const items = checklistItems.filter(item => item.checklist_id === checklist.id);
          const completionPercentage = calculateCompletion(checklist.id);
          const isExpanded = expandedChecklists[checklist.id] || false;
          
          return (
            <motion.div 
              key={checklist.id} 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.3 }}
              layout
              className="w-full"
            >
              <Card className="border-l-4 border-l-travel-blue shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="pb-2 bg-gradient-to-r from-white to-travel-beige/30">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl text-travel-dark">{checklist.name}</CardTitle>
                      <p className="text-sm text-travel-dark/70 mt-1">
                        {checklist.description || 'No description'}
                      </p>
                    </div>
                    <div className="flex space-x-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 hover:bg-travel-light-blue/20" 
                            onClick={() => onEdit(checklist.id)}
                          >
                            <Edit className="h-4 w-4 text-travel-blue" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Edit Checklist</p>
                        </TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 hover:bg-travel-light-red/20" 
                            onClick={() => onDelete(checklist.id)}
                          >
                            <Trash className="h-4 w-4 text-travel-red" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Delete Checklist</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-travel-dark/70">Completion</span>
                      <span className="text-xs font-semibold">{completionPercentage}%</span>
                    </div>
                    <Progress 
                      value={completionPercentage} 
                      className="h-2.5 bg-travel-beige" 
                      indicatorClassName="bg-gradient-to-r from-travel-blue to-travel-light-blue" 
                    />
                  </div>
                  
                  <Collapsible open={isExpanded} onOpenChange={() => toggleExpansion(checklist.id)}>
                    <div className="flex items-center justify-between mb-3 border-b pb-2 border-travel-beige">
                      <div className="text-sm font-medium text-travel-dark">Items ({items.length})</div>
                      <CollapsibleTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={`h-7 w-7 p-0 ${isExpanded ? 'bg-travel-light-blue/10' : ''}`}
                        >
                          {isExpanded ? 
                            <ChevronUp className="h-4 w-4 text-travel-blue" /> : 
                            <ChevronDown className="h-4 w-4 text-travel-dark" />}
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                    
                    {!isExpanded && items.length > 0 && (
                      <div className="space-y-2 mt-4">
                        {items.slice(0, 3).map(item => (
                          <div 
                            key={item.id} 
                            className="flex items-center justify-between group p-2 rounded-md hover:bg-travel-beige/50 transition-colors"
                          >
                            <div className="flex items-center gap-2 flex-grow">
                              <Checkbox 
                                id={`list-item-${item.id}`} 
                                checked={item.completed} 
                                onCheckedChange={checked => onToggleItem(item.id, checked as boolean)}
                                className="border-travel-blue data-[state=checked]:bg-travel-blue data-[state=checked]:text-white"
                              />
                              <label 
                                htmlFor={`list-item-${item.id}`} 
                                className={`text-sm transition-all ${item.completed ? 'line-through text-travel-dark/50' : 'text-travel-dark'}`}
                              >
                                {item.text}
                              </label>
                            </div>
                            <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                              {onUpdateItemText && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 w-6 p-0 hover:bg-travel-light-blue/20"
                                  onClick={() => handleStartEdit(item)}
                                >
                                  <Edit className="h-3 w-3 text-travel-blue" />
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 w-6 p-0 ml-1 hover:bg-travel-light-red/20"
                                onClick={() => onDeleteItem(item.id)}
                              >
                                <Trash className="h-3 w-3 text-travel-red" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        {items.length > 3 && (
                          <div className="text-sm text-travel-dark/60 font-medium mt-2 pl-2">
                            + {items.length - 3} more items
                          </div>
                        )}
                      </div>
                    )}
                    
                    <CollapsibleContent className="transition-all data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
                      <motion.div 
                        className="space-y-2 mt-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar" 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                      >
                        {items.map(item => (
                          <motion.div 
                            key={item.id} 
                            className="flex items-center justify-between group p-2 rounded-md hover:bg-travel-beige/50 transition-colors"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            {editingItemId === item.id ? (
                              <div className="flex-1 flex items-center gap-2">
                                <Input 
                                  ref={inputRef} 
                                  value={editingText} 
                                  onChange={e => setEditingText(e.target.value)} 
                                  onKeyDown={handleKeyDown} 
                                  className="h-7 py-1 text-sm focus:ring-travel-blue" 
                                />
                                <div className="flex items-center">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 w-6 p-0 text-green-600 hover:bg-green-100"
                                    onClick={handleSaveEdit}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 w-6 p-0 text-travel-red hover:bg-travel-light-red/20"
                                    onClick={handleCancelEdit}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-2 flex-grow">
                                  <Checkbox 
                                    id={`expanded-item-${item.id}`} 
                                    checked={item.completed} 
                                    onCheckedChange={checked => onToggleItem(item.id, checked as boolean)}
                                    className="border-travel-blue data-[state=checked]:bg-travel-blue data-[state=checked]:text-white"
                                  />
                                  <label 
                                    htmlFor={`expanded-item-${item.id}`} 
                                    className={`text-sm transition-all ${item.completed ? 'line-through text-travel-dark/50' : 'text-travel-dark'}`}
                                  >
                                    {item.text}
                                  </label>
                                </div>
                                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                                  {onUpdateItemText && (
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-6 w-6 p-0 hover:bg-travel-light-blue/20"
                                      onClick={() => handleStartEdit(item)}
                                    >
                                      <Edit className="h-3 w-3 text-travel-blue" />
                                    </Button>
                                  )}
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 w-6 p-0 ml-1 hover:bg-travel-light-red/20"
                                    onClick={() => onDeleteItem(item.id)}
                                  >
                                    <Trash className="h-3 w-3 text-travel-red" />
                                  </Button>
                                </div>
                              </>
                            )}
                          </motion.div>
                        ))}
                        {items.length === 0 && (
                          <div className="text-center py-4 text-travel-dark/60 text-sm bg-travel-beige/30 rounded-md">
                            No items in this checklist yet
                          </div>
                        )}
                      </motion.div>
                    </CollapsibleContent>
                  </Collapsible>
                </CardContent>
                <CardFooter className="pt-2 bg-travel-beige/30 border-t border-travel-beige">
                  <div className="flex justify-between w-full">
                    <div className="flex space-x-3">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-travel-blue hover:bg-travel-light-blue/20"
                            onClick={() => onAddItem(checklist.id)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Add Item</p>
                        </TooltipContent>
                      </Tooltip>
                      
                      {onBulkAddItems && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-travel-blue hover:bg-travel-light-blue/20"
                              onClick={() => onBulkAddItems(checklist.id)}
                            >
                              <ListPlus className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Bulk Add Items</p>
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
                          className="h-8 w-8 text-travel-dark hover:bg-travel-dark/10"
                        >
                          <ListChecks className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>View All Items</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </TooltipProvider>
  );
};

export default ChecklistListView;
