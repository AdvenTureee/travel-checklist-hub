
import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <motion.main 
      className={cn("flex-1 overflow-auto p-6 min-h-screen w-full bg-background", className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mx-auto max-w-7xl">
        {children}
      </div>
    </motion.main>
  );
}
