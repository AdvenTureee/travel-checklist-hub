import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NavigationMenu, NavigationMenuList, NavigationMenuItem } from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';
import { Home, ListChecks, MapPin, Plus, Settings, LogOut, User, ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
export function TopNavigationMenu() {
  const location = useLocation();
  const menuItems = [{
    icon: Home,
    label: 'Pontos',
    to: '/points',
    description: 'Gerencie seus pontos de interesse'
  }, {
    icon: User,
    label: 'Recebidos',
    to: '/shared-points',
    description: 'Veja os pontos compartilhados com você'
  }, {
    icon: ListChecks,
    label: 'Checklists',
    to: '/checklists',
    description: 'Organize suas listas de tarefas'
  }, {
    icon: ShoppingCart,
    label: 'Compras',
    to: '/shopping',
    description: 'Gerencie sua lista de compras'
  }, {
    icon: Settings,
    label: 'Configurações',
    to: '/settings',
    description: 'Ajuste as preferências do sistema'
  }];

  return (
    <motion.div
      className="fixed left-0 right-0 top-0 z-50 flex justify-center"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-white/90 backdrop-blur-sm shadow-md border border-travel-light-mustard/50 rounded-full px-4 py-2 flex items-center gap-3 mt-3">
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to;
          // Desabilitar o link de 'Recebidos' (shared-points)
          // Permitir navegação normalmente para 'Recebidos'
          // if (item.to === '/shared-points') {
          //   ...
          // }

          return (
            <Link
              key={item.to}
              to={item.to}
              title={item.label + (item.description ? ` — ${item.description}` : '')}
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200",
                isActive
                  ? "bg-travel-mustard text-travel-dark scale-110 shadow-md"
                  : "hover:bg-travel-light-mustard/50 text-travel-dark/70 hover:scale-105"
              )}
              aria-label={item.label}
            >
              <Icon className="w-6 h-6 mx-auto my-auto align-middle leading-[0]" style={{ display: 'block' }} />
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}