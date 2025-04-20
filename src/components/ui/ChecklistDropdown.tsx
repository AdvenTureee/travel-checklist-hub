import React from 'react';
import { ChecklistItem } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';

interface ChecklistDropdownProps {
  items: ChecklistItem[];
  onToggle: (id: string, completed: boolean) => void;
}

const ChecklistDropdown: React.FC<ChecklistDropdownProps> = ({ items, onToggle }) => {
  if (!items || items.length === 0) return <span className="text-xs text-travel-dark/50">Nenhum item</span>;

  // Novo: Modal centralizado e responsivo para marcar rapidamente
  const [open, setOpen] = React.useState(true);
  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-2 overflow-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full min-w-[280px] max-w-[95vw] sm:max-w-[600px] mx-auto px-2 sm:px-6 py-4 flex flex-col gap-4 border-2 border-travel-mustard animate-fade-in"
            style={{
              minHeight: 'auto',
              maxHeight: '90vh',
              boxSizing: 'border-box',
              justifyContent: 'center',
              alignItems: 'center',
              display: 'flex',
              overflow: 'auto',
            }}
          >
            <h2 className="text-xl font-bold text-center text-travel-dark mb-2">Checklist Rápida</h2>
            <div className="flex flex-col gap-3 w-full max-h-[60vh] overflow-y-auto px-1 sm:px-2">
              {items.map(item => (
                <label key={item.id} className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-travel-beige/60 transition">
                  <Checkbox checked={item.completed} onCheckedChange={() => onToggle(item.id, !item.completed)} />
                  <span className={item.completed ? 'line-through text-travel-dark/40 text-base' : 'text-travel-dark/80 text-base'}>{item.text}</span>
                </label>
              ))}
            </div>
            <button className="mt-4 w-full bg-travel-mustard text-travel-dark font-bold py-3 rounded-lg shadow hover:bg-travel-mustard/90 transition" onClick={() => setOpen(false)}>
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChecklistDropdown;
