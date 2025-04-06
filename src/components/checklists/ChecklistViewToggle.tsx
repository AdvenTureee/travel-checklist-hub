
import React from 'react';
import { Button } from '@/components/ui/button';
import { Grid2X2, List } from 'lucide-react';
import { motion } from 'framer-motion';

interface ChecklistViewToggleProps {
  currentView: 'grid' | 'list';
  onViewChange: (view: 'grid' | 'list') => void;
}

const ChecklistViewToggle: React.FC<ChecklistViewToggleProps> = ({ currentView, onViewChange }) => {
  return (
    <div className="flex items-center space-x-2 relative">
      <Button
        variant={currentView === 'grid' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onViewChange('grid')}
        className={`relative z-10 ${currentView === 'grid' ? 'bg-travel-blue text-white' : 'text-travel-dark'}`}
      >
        <Grid2X2 className="h-4 w-4 mr-1" />
        Grade
      </Button>
      <Button
        variant={currentView === 'list' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onViewChange('list')}
        className={`relative z-10 ${currentView === 'list' ? 'bg-travel-blue text-white' : 'text-travel-dark'}`}
      >
        <List className="h-4 w-4 mr-1" />
        Lista
      </Button>
      <motion.div 
        className="absolute top-0 bottom-0 rounded-md bg-travel-blue"
        initial={false}
        animate={{ 
          left: currentView === 'grid' ? 0 : 'calc(50% + 2px)',
          width: 'calc(50% - 2px)'
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{ zIndex: 0 }}
      />
    </div>
  );
};

export default ChecklistViewToggle;
