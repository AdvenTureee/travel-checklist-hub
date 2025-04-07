
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle
} from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';
import { MapPin, ListChecks, ShoppingCart, Settings, Menu } from 'lucide-react';
import { motion } from 'framer-motion';

export function TopNavigationMenu() {
  const location = useLocation();
  
  const menuItems = [
    { icon: MapPin, label: 'Pontos', to: '/points' },
    { icon: ListChecks, label: 'Checklists', to: '/checklists' },
    { icon: ShoppingCart, label: 'Compras', to: '/shopping' },
    { icon: Settings, label: 'Configurações', to: '/settings' },
  ];

  return (
    <motion.div 
      className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <NavigationMenu className="bg-white rounded-full shadow-md p-1 border border-travel-light-mustard">
        <NavigationMenuList className="space-x-0.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            
            return (
              <NavigationMenuItem key={item.to}>
                <Link to={item.to}>
                  <div
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-full transition-colors",
                      isActive 
                        ? "bg-travel-mustard text-travel-dark" 
                        : "hover:bg-travel-light-mustard/50 text-travel-dark/70"
                    )}
                    aria-label={item.label}
                    title={item.label}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </Link>
              </NavigationMenuItem>
            );
          })}
        </NavigationMenuList>
      </NavigationMenu>
    </motion.div>
  );
}
