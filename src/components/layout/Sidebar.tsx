
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MapPin, ListChecks, Settings, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
        "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-300 my-1",
        isActive 
          ? "bg-travel-mustard text-travel-dark font-medium" 
          : "hover:bg-travel-light-mustard text-travel-dark/70",
        isCollapsed && "justify-center"
      )}
    >
      <Icon className={cn("h-5 w-5", isActive ? "text-travel-dark" : "text-travel-dark/70")} />
      {!isCollapsed && <span className="animate-fade-in">{label}</span>}
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
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logout successful",
        description: "You have been logged out successfully.",
      });
      navigate('/auth');
    } catch (error) {
      console.error('Error during logout:', error);
      toast({
        title: "Logout failed",
        description: "There was an error logging out.",
        variant: "destructive",
      });
    }
  };

  return (
    <div 
      className={cn(
        "h-screen flex flex-col border-r border-border bg-white transition-all duration-300 ease-in-out",
        isCollapsed ? "w-[70px]" : "w-[250px]",
        className
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!isCollapsed && (
          <h1 className="text-lg font-semibold text-travel-dark animate-fade-in">
            Travel Hub
          </h1>
        )}
        <button 
          onClick={toggleSidebar}
          className="p-1.5 rounded-full bg-travel-light-mustard text-travel-dark hover:bg-travel-mustard transition-colors"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
      
      <div className="flex flex-col flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        <SidebarItem 
          icon={MapPin} 
          label="Points" 
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
          icon={Settings} 
          label="Settings" 
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
          <LogOut className="h-5 w-5" />
          {!isCollapsed && <span className="animate-fade-in">Logout</span>}
        </button>
      </div>
    </div>
  );
}
