
import React from 'react';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />
      <motion.main 
        className={cn("flex-1 overflow-auto p-6", className)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="mx-auto max-w-7xl">
          {children}
        </div>
      </motion.main>
    </div>
  );
}
