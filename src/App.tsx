import React, { useEffect, useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { PageTransition } from "@/components/PageTransition";
import { ScrollToTop } from "@/components/ScrollToTop";
import Points from "./pages/Points";
import { CookieConsent } from "@/components/ui/CookieConsent";

import Checklists from "./pages/Checklists";
import Shopping from "./pages/Shopping";
import Settings from './pages/Settings';
import Chat from './pages/Chat';
import NotFound from "./pages/NotFound";
import Auth from '@/pages/Auth';
import Login from '@/pages/auth/Login';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import Trips from "./pages/Trips";
import { AuthProvider } from "@/components/auth/AuthProvider";
import RequireAuth from "@/components/layout/RequireAuth";
import { TopNavigationMenu } from "@/components/layout/TopNavigationMenu";

const App = () => {
  const [cookieConsent, setCookieConsent] = useState(() => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('cookie_consent');
    }
    return false;
  });
  const location = typeof window !== 'undefined' ? window.location : undefined;
  // React Router v6: useLocation só funciona dentro de Router, então criamos um wrapper
  const AnimatedRoutes = () => {
    const location = useLocation();
    return (
      <>
        {location.pathname !== '/auth' && <TopNavigationMenu />}
        <PageTransition locationKey={location.key}>
          <Routes location={location}>
            <Route path="/" element={<Navigate to="/auth" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/login" element={<Login />} />
<Route path="/auth/forgot" element={<ForgotPassword />} />
            <Route path="/points" element={<RequireAuth><Points /></RequireAuth>} />
            <Route path="/checklists" element={<RequireAuth><Checklists /></RequireAuth>} />
            <Route path="/shopping" element={<RequireAuth><Shopping /></RequireAuth>} />
            <Route path="/trips" element={<RequireAuth><Trips compact /></RequireAuth>} />
            <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
            <Route path="/chat" element={<RequireAuth><Chat /></RequireAuth>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </PageTransition>
      </>
    );
  }
  // Create the client as a state variable to ensure it's only created once
  const [queryClient] = useState(() => new QueryClient());
  
  // Handle focus outlines only when using keyboard
  useEffect(() => {
    const handleFirstTab = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        document.body.classList.add('user-is-tabbing');
        window.removeEventListener('keydown', handleFirstTab);
        window.addEventListener('mousedown', handleMouseDownOnce);
      }
    };
    
    const handleMouseDownOnce = () => {
      document.body.classList.remove('user-is-tabbing');
      window.removeEventListener('mousedown', handleMouseDownOnce);
      window.addEventListener('keydown', handleFirstTab);
    };
    
    window.addEventListener('keydown', handleFirstTab);
    
    return () => {
      window.removeEventListener('keydown', handleFirstTab);
      window.removeEventListener('mousedown', handleMouseDownOnce);
    };
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <div className="app-container custom-scroll">
              <ScrollToTop />
              <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white focus:text-travel-dark focus:top-0 focus:left-0">
                Pular para o conteúdo principal
              </a>
              <AnimatedRoutes />
              {!cookieConsent && (
                <CookieConsent onAccept={() => setCookieConsent(true)} />
              )}
            </div>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
