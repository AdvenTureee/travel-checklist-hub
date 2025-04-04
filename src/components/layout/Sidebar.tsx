
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MapPin, ListChecks, Settings, LogOut, ChevronLeft, ChevronRight, ShoppingCart, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  to: string;
  isActive: boolean;
  isCollapsed: boolean;
}

const SidebarItem = ({ icon: Icon, label, to, isActive, isCollapsed }: SidebarItemProps) => {
  return (
    <Link
      to={to}
      className={cn(
        "relative flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-300 my-1 overflow-hidden",
        isActive 
          ? "bg-travel-mustard text-travel-dark font-medium" 
          : "hover:bg-travel-light-mustard text-travel-dark/70",
        isCollapsed ? "justify-center" : ""
      )}
    >
      <div className={cn("min-w-6 flex justify-center", isCollapsed ? "mx-auto" : "")}>
        <Icon className={cn("h-5 w-5", isActive ? "text-travel-dark" : "text-travel-dark/70")} />
      </div>
      
      <AnimatePresence>
        {!isCollapsed && (
          <motion.span 
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2 }}
            className="truncate"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
};

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCollapsed, setIsCollapsed] = useState(true); // Default to collapsed
  
  // Set collapsed state to true whenever the page changes
  useEffect(() => {
    setIsCollapsed(true);
  }, [location.pathname]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logout realizado com sucesso",
        description: "Você foi desconectado com sucesso.",
      });
      navigate('/auth');
    } catch (error) {
      console.error('Erro durante logout:', error);
      toast({
        title: "Falha no logout",
        description: "Ocorreu um erro ao tentar sair.",
        variant: "destructive",
      });
    }
  };

  return (
    <motion.div 
      className={cn(
        "h-screen flex flex-col border-r border-border bg-white shadow-sm",
        className
      )}
      animate={{ width: isCollapsed ? '70px' : '250px' }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="flex items-center justify-between p-4 border-b border-border h-16">
        <AnimatePresence>
          {!isCollapsed && (
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="text-lg font-semibold text-travel-dark truncate"
            >
              Travel Hub
            </motion.h1>
          )}
        </AnimatePresence>
        
        <motion.button 
          onClick={toggleSidebar}
          className={cn(
            "p-1.5 rounded-full bg-travel-light-mustard text-travel-dark hover:bg-travel-mustard transition-colors",
            isCollapsed ? "mx-auto" : ""
          )}
          whileTap={{ scale: 0.9 }}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </motion.button>
      </div>
      
      <div className="flex flex-col flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        <SidebarItem 
          icon={Home} 
          label="Início" 
          to="/" 
          isActive={location.pathname === '/'} 
          isCollapsed={isCollapsed} 
        />
        <SidebarItem 
          icon={MapPin} 
          label="Pontos" 
          to="/points" 
          isActive={location.pathname === '/points'} 
          isCollapsed={isCollapsed} 
        />
        <SidebarItem 
          icon={ListChecks} 
          label="Checklists" 
          to="/checklists" 
          isActive={location.pathname === '/checklists'} 
          isCollapsed={isCollapsed} 
        />
        <SidebarItem 
          icon={ShoppingCart} 
          label="Compras" 
          to="/shopping" 
          isActive={location.pathname === '/shopping'} 
          isCollapsed={isCollapsed} 
        />
        <SidebarItem 
          icon={Settings} 
          label="Configurações" 
          to="/settings" 
          isActive={location.pathname === '/settings'} 
          isCollapsed={isCollapsed} 
        />
      </div>
      
      <div className="p-2 border-t border-border">
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-300 text-travel-red hover:bg-travel-light-red w-full",
            isCollapsed && "justify-center"
          )}
        >
          <div className={cn("min-w-6 flex justify-center", isCollapsed ? "mx-auto" : "")}>
            <LogOut className="h-5 w-5" />
          </div>
          
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span 
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="truncate"
              >
                Sair
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.div>
  );
}
