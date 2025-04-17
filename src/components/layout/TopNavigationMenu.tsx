import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NavigationMenu, NavigationMenuList, NavigationMenuItem } from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';
import { Plane, ListChecks, MapPin, Settings, LogOut, User, ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
export function TopNavigationMenu() {
  const location = useLocation();

  // Função para saber se o usuário está dentro de uma viagem
  function isInTrip() {
    const params = new URLSearchParams(location.search);
    const tripId = params.get('tripId') || localStorage.getItem('selectedTripId');
    return !!tripId;
  }
  const inTrip = isInTrip();

  const menuItems = [
    {
      icon: Plane,
      label: 'Viagens',
      to: '/trips',
      description: 'Gerencie suas viagens',
      alwaysShow: true
    },
    {
      icon: MapPin,
      label: 'Pontos',
      to: '/points',
      description: 'Gerencie seus pontos de interesse',
      showWhenInTrip: true
    },
    {
      icon: ListChecks,
      label: 'Checklists',
      to: '/checklists',
      description: 'Organize suas listas de tarefas',
      showWhenInTrip: true
    },
    {
      icon: ShoppingCart,
      label: 'Compras',
      to: '/shopping',
      description: 'Gerencie sua lista de compras',
      showWhenInTrip: true
    }
  ];
  const recebidosItem = {
    icon: User,
    label: 'Recebidos',
    to: '/shared-points',
    description: 'Veja os pontos compartilhados com você',
    alwaysShow: true
  };
  const settingsItem = {
    icon: Settings,
    label: 'Configurações',
    to: '/settings',
    description: 'Ajuste as preferências do sistema',
    alwaysShow: true
  };


  return (
    <motion.div
      className="fixed left-0 right-0 top-0 z-50 flex justify-center"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-white/90 backdrop-blur-sm shadow-md border border-travel-light-mustard/50 rounded-full px-4 py-2 flex items-center gap-3 mt-3">
        {[
          ...menuItems.filter(item => item.alwaysShow || (item.showWhenInTrip && inTrip)),
          recebidosItem,
          settingsItem
        ].map((item, idx, arr) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to;
          // Se for o botão de Viagens, sobrescreva o onClick
          if (item.label === 'Viagens') {
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
                onClick={() => {
                  localStorage.removeItem('selectedTripId');
                }}
              >
                <Icon className="w-6 h-6 mx-auto my-auto align-middle leading-[0]" style={{ display: 'block' }} />
              </Link>
            );
          }
          // Recebidos deve sempre ficar imediatamente antes de Configurações
          if (item.label === 'Recebidos') {
            // Só renderiza Recebidos se settingsItem for o próximo
            if (arr[idx + 1] && arr[idx + 1].label === 'Configurações') {
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
            }
            return null;
          }
          // Configurações
          if (item.label === 'Configurações') {
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
          }
          // Outros
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