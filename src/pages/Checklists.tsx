
import React, { useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Point } from '@/lib/types';

const Checklists: React.FC = () => {
  // Mock data for points (to be replaced with real data)
  const [points] = useState<Point[]>([
    {
      id: '1',
      name: 'Eiffel Tower',
      description: 'Iconic iron tower in Paris',
      address: 'Champ de Mars, 5 Avenue Anatole France, 75007 Paris, France',
      type: 'tourist',
      created_at: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      user_id: 'user-1',
    },
    {
      id: '2',
      name: 'Le Bistrot Parisien',
      description: 'Classic French cuisine in a cozy setting',
      address: '56 Rue de la Montagne, 75008 Paris, France',
      type: 'restaurant',
      created_at: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      user_id: 'user-1',
    },
    {
      id: '3',
      name: 'Louvre Museum',
      description: 'World\'s largest art museum and historic monument',
      address: 'Rue de Rivoli, 75001 Paris, France',
      type: 'tourist',
      created_at: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      user_id: 'user-1',
    }
  ]);

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-travel-dark">Travel Checklists</h1>
        <p className="text-travel-dark/70">Create and manage checklists for your trips</p>
      </div>
      
      <div className="flex flex-col items-center justify-center h-[400px] bg-travel-beige/50 rounded-lg border border-travel-mustard/20">
        <h3 className="text-xl font-medium text-travel-dark">Checklists Coming Soon</h3>
        <p className="text-travel-dark/70 mt-2">This feature is under development</p>
      </div>
    </PageContainer>
  );
};

export default Checklists;
