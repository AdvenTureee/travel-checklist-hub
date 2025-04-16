import React from 'react';
import { ChecklistItem } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';

interface ChecklistDropdownProps {
  items: ChecklistItem[];
  onToggle: (id: string, completed: boolean) => void;
}

const ChecklistDropdown: React.FC<ChecklistDropdownProps> = ({ items, onToggle }) => {
  if (!items || items.length === 0) return <span className="text-xs text-travel-dark/50">Nenhum item</span>;

  return (
    <div className="flex flex-col gap-1 py-2 px-3 bg-white border border-travel-beige rounded shadow-md z-20 min-w-[180px] max-h-60 overflow-y-auto">
      {items.map(item => (
        <label key={item.id} className="flex items-center gap-2 cursor-pointer">
          <Checkbox checked={item.completed} onCheckedChange={() => onToggle(item.id, !item.completed)} />
          <span className={item.completed ? 'line-through text-travel-dark/40 text-xs' : 'text-travel-dark/80 text-xs'}>{item.text}</span>
        </label>
      ))}
    </div>
  );
};

export default ChecklistDropdown;
