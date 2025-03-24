
import React from 'react';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />
      <main className={cn("flex-1 overflow-auto p-6", className)}>
        <div className="mx-auto max-w-7xl animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
