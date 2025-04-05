
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ListChecks, Settings, LogOut, ChevronLeft, ChevronRight, ShoppingCart, MapPin } from 'lucide-react';
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
  keyboardShortcut?: string;
}

const SidebarItem = ({ icon: Icon, label, to, isActive, isCollapsed, keyboardShortcut }: SidebarItemProps) => {
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
      aria-label={label}
      role="menuitem"
      tabIndex={0}
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
      
      {!isCollapsed && keyboardShortcut && (
        <span className="ml-auto text-xs opacity-60 bg-travel-light-mustard/50 px-1.5 py-0.5 rounded">
          {keyboardShortcut}
        </span>
      )}
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

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not in an input, textarea, or select
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      switch (e.key) {
        case 'p':
          if (e.altKey) {
            e.preventDefault();
            navigate('/points');
          }
          break;
        case 'c':
          if (e.altKey) {
            e.preventDefault();
            navigate('/checklists');
          }
          break;
        case 's':
          if (e.altKey) {
            e.preventDefault();
            if (e.shiftKey) {
              navigate('/settings');
            } else {
              navigate('/shopping');
            }
          }
          break;
        case 'Escape':
          setIsCollapsed(true);
          break;
        case 'b':
          if (e.altKey) {
            e.preventDefault();
            setIsCollapsed(!isCollapsed);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, isCollapsed]);

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
        "h-screen flex flex-col border-r border-border bg-white shadow-sm z-30",
        className
      )}
      animate={{ width: isCollapsed ? '70px' : '250px' }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      role="navigation"
      aria-label="Menu principal"
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
          aria-label={isCollapsed ? "Expandir menu" : "Recolher menu"}
          title={isCollapsed ? "Expandir menu" : "Recolher menu"}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </motion.button>
      </div>
      
      <div className="flex flex-col flex-1 px-2 py-4 space-y-1 overflow-y-auto" role="menu">
        <SidebarItem 
          icon={MapPin} 
          label="Pontos" 
          to="/points" 
          isActive={location.pathname === '/points'} 
          isCollapsed={isCollapsed} 
          keyboardShortcut="Alt+P"
        />
        <SidebarItem 
          icon={ListChecks} 
          label="Checklists" 
          to="/checklists" 
          isActive={location.pathname === '/checklists'} 
          isCollapsed={isCollapsed} 
          keyboardShortcut="Alt+C"
        />
        <SidebarItem 
          icon={ShoppingCart} 
          label="Compras" 
          to="/shopping" 
          isActive={location.pathname === '/shopping'} 
          isCollapsed={isCollapsed} 
          keyboardShortcut="Alt+S"
        />
        <SidebarItem 
          icon={Settings} 
          label="Configurações" 
          to="/settings" 
          isActive={location.pathname === '/settings'} 
          isCollapsed={isCollapsed} 
          keyboardShortcut="Alt+Shift+S"
        />
      </div>
      
      <div className="p-2 border-t border-border">
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-300 text-travel-red hover:bg-travel-light-red w-full",
            isCollapsed && "justify-center"
          )}
          aria-label="Sair da conta"
          title="Sair da conta"
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
