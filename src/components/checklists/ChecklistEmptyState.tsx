
import React from 'react';
import { Button } from '@/components/ui/button';
import { ClipboardList, PlusCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface ChecklistEmptyStateProps {
  onCreateClick: () => void;
}

const ChecklistEmptyState = ({ onCreateClick }: ChecklistEmptyStateProps) => {
  return (
    <motion.div 
      className="flex flex-col items-center justify-center h-[400px] bg-travel-beige/50 rounded-lg border border-travel-mustard/20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <ClipboardList className="h-16 w-16 text-travel-mustard/50 mb-4" />
      <h3 className="text-xl font-medium text-travel-dark">No checklists yet</h3>
      <p className="text-travel-dark/70 mb-4">Create your first checklist to start organizing your tasks</p>
      <Button 
        className="bg-travel-mustard hover:bg-travel-mustard/80 text-travel-dark"
        onClick={onCreateClick}
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        Create Your First Checklist
      </Button>
    </motion.div>
  );
};

export default ChecklistEmptyState;
