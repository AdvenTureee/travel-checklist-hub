
import React, { useState } from 'react';
import { Checklist, ChecklistItem } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit, Trash, Plus, ListChecks, ListPlus, ChevronDown, ChevronUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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
  onBulkAddItems
}) => {
  // State to track which checklists are expanded
  const [expandedChecklists, setExpandedChecklists] = useState<Record<string, boolean>>({});

  // Toggle expansion for a checklist
  const toggleExpansion = (checklistId: string) => {
    setExpandedChecklists(prev => ({
      ...prev,
      [checklistId]: !prev[checklistId]
    }));
  };

  // Calculate completion percentage for a checklist
  const calculateCompletion = (checklistId: string) => {
    const items = checklistItems.filter(item => item.checklist_id === checklistId);
    if (items.length === 0) return 0;
    const completedItems = items.filter(item => item.completed).length;
    return Math.round((completedItems / items.length) * 100);
  };

  return (
    <div className="space-y-4">
      {checklists.map(checklist => {
        const items = checklistItems.filter(item => item.checklist_id === checklist.id);
        const completionPercentage = calculateCompletion(checklist.id);
        const isExpanded = expandedChecklists[checklist.id] || false;
        
        return (
          <Card key={checklist.id} className="border-l-4 border-l-travel-blue">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{checklist.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {checklist.description || 'No description'}
                  </p>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onEdit(checklist.id)}
                  >
                    <Edit className="h-4 w-4 text-travel-blue" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onDelete(checklist.id)}
                  >
                    <Trash className="h-4 w-4 text-travel-red" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-muted-foreground">Completion</span>
                  <span className="text-xs font-medium">{completionPercentage}%</span>
                </div>
                <Progress value={completionPercentage} className="h-2" />
              </div>
              
              <Collapsible open={isExpanded} onOpenChange={() => toggleExpansion(checklist.id)}>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium">Items ({items.length})</div>
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
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                          onClick={() => onDeleteItem(item.id)}
                        >
                          <Trash className="h-3 w-3 text-travel-red" />
                        </Button>
                      </div>
                    ))}
                    {items.length > 3 && (
                      <div className="text-sm text-muted-foreground mt-1">
                        + {items.length - 3} more items
                      </div>
                    )}
                  </div>
                )}
                
                <CollapsibleContent>
                  <div className="space-y-2 mt-2 max-h-[300px] overflow-y-auto pr-1">
                    {items.map(item => (
                      <div key={item.id} className="flex items-center justify-between group">
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
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                          onClick={() => onDeleteItem(item.id)}
                        >
                          <Trash className="h-3 w-3 text-travel-red" />
                        </Button>
                      </div>
                    ))}
                    {items.length === 0 && (
                      <div className="text-center py-4 text-muted-foreground text-sm">
                        No items in this checklist yet
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
            <CardFooter className="flex justify-between pt-1">
              <div className="flex space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-travel-blue hover:text-travel-blue/80 p-0"
                  onClick={() => onAddItem(checklist.id)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
                {onBulkAddItems && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-travel-blue hover:text-travel-blue/80 p-0"
                    onClick={() => onBulkAddItems(checklist.id)}
                  >
                    <ListPlus className="h-4 w-4 mr-1" />
                    Bulk Add
                  </Button>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onChecklistView(checklist.id)}
                className="text-travel-dark"
              >
                <ListChecks className="h-4 w-4 mr-1" />
                View All
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
};

export default ChecklistListView;
