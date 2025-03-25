
import React from 'react';
import { Button } from '@/components/ui/button';
import { Grid2X2, List } from 'lucide-react';

interface ChecklistViewToggleProps {
  currentView: 'grid' | 'list';
  onViewChange: (view: 'grid' | 'list') => void;
}

const ChecklistViewToggle: React.FC<ChecklistViewToggleProps> = ({ currentView, onViewChange }) => {
  return (
    <div className="flex items-center space-x-2">
      <Button
        variant={currentView === 'grid' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onViewChange('grid')}
        className={currentView === 'grid' ? 'bg-travel-blue text-white' : 'text-travel-dark'}
      >
        <Grid2X2 className="h-4 w-4 mr-1" />
        Grid
      </Button>
      <Button
        variant={currentView === 'list' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onViewChange('list')}
        className={currentView === 'list' ? 'bg-travel-blue text-white' : 'text-travel-dark'}
      >
        <List className="h-4 w-4 mr-1" />
        List
      </Button>
    </div>
  );
};

export default ChecklistViewToggle;
