import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NavigationMenu, NavigationMenuList, NavigationMenuItem } from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';
import { MapPin, ListChecks, ShoppingCart, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
export function TopNavigationMenu() {
  const location = useLocation();
  const menuItems = [{
    icon: MapPin,
    label: 'Pontos',
    to: '/points',
    description: 'Gerencie seus pontos de interesse'
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
  return <motion.div className="fixed left-0 right-0 top-0 z-50 flex justify-center" initial={{
    opacity: 0,
    y: -20
  }} animate={{
    opacity: 1,
    y: 0
  }} transition={{
    duration: 0.3
  }}>
      <NavigationMenu className="bg-white/90 backdrop-blur-sm shadow-md p-1 border border-travel-light-mustard/50 rounded-full mx-0 px-0 py-[5px] my-[11px]">
        <NavigationMenuList className="space-x-2 rounded-none py-0 px-[10px] mx-0 my-[5px]">
          <TooltipProvider delayDuration={300}>
            {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return <NavigationMenuItem key={item.to}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link to={item.to}>
                        <div className={cn("flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200", isActive ? "bg-travel-mustard text-travel-dark scale-110 shadow-sm" : "hover:bg-travel-light-mustard/50 text-travel-dark/70 hover:scale-105")} aria-label={item.label}>
                          <Icon className="h-5 w-5" />
                        </div>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent className="bg-white/90 backdrop-blur-sm border-travel-light-mustard/50">
                      <p className="font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </NavigationMenuItem>;
          })}
          </TooltipProvider>
        </NavigationMenuList>
      </NavigationMenu>
    </motion.div>;
}