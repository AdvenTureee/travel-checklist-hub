
import React from 'react';
import { Button } from '@/components/ui/button';
import { List } from 'lucide-react';
import { motion } from 'framer-motion';

interface ChecklistViewToggleProps {
  currentView: 'list';
  onViewChange: (view: 'list') => void;
}

const ChecklistViewToggle: React.FC<ChecklistViewToggleProps> = ({ currentView, onViewChange }) => {
  // Agora só temos um modo de visualização, então este componente é mais simples
  return (
    <div className="flex items-center space-x-2 relative">
      <Button
        variant="default"
        size="sm"
        className="relative z-10 bg-travel-blue text-white"
      >
        <List className="h-4 w-4 mr-1" />
        Lista
      </Button>
    </div>
  );
};

export default ChecklistViewToggle;
