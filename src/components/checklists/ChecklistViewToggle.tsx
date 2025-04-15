import React from 'react';
import { Button } from '@/components/ui/button';
import { Grid2X2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface ChecklistViewToggleProps {
  currentView: 'grid';
  onViewChange: (view: 'grid') => void;
}

const ChecklistViewToggle: React.FC<ChecklistViewToggleProps> = ({
  currentView,
  onViewChange
}) => {
  return <div className="flex items-center space-x-2 relative">
      <Button variant={currentView === 'grid' ? 'default' : 'outline'} size="sm" onClick={() => onViewChange('grid')} className={`relative z-10 ${currentView === 'grid' ? 'bg-travel-blue text-white' : 'text-travel-dark'}`}>
        <Grid2X2 className="h-4 w-4 mr-1" />
        Grade
      </Button>
    </div>;
};

export default ChecklistViewToggle;