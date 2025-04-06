
import React from 'react';
import { Button } from '@/components/ui/button';
import { List } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface ChecklistViewToggleProps {
  currentView: 'list';
  onViewChange: (view: 'list') => void;
}

const ChecklistViewToggle: React.FC<ChecklistViewToggleProps> = ({ currentView, onViewChange }) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="flex items-center space-x-2 relative">
      <Button
        variant="default"
        size={isMobile ? "sm" : "default"}
        className="relative z-10 bg-travel-blue text-white hover:bg-travel-blue/90 transition-all"
      >
        <List className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />
        Lista
      </Button>
    </div>
  );
};

export default ChecklistViewToggle;
