
import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Points from "./pages/Points";
import Checklists from "./pages/Checklists";
import Shopping from "./pages/Shopping";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import { AuthProvider } from "@/components/auth/AuthProvider";
import RequireAuth from "@/components/layout/RequireAuth";
import { useState } from "react";

const App = () => {
  // Create the client as a state variable to ensure it's only created once
  const [queryClient] = useState(() => new QueryClient());
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Navigate to="/auth" replace />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/points" element={<RequireAuth><Points /></RequireAuth>} />
              <Route path="/checklists" element={<RequireAuth><Checklists /></RequireAuth>} />
              <Route path="/shopping" element={<RequireAuth><Shopping /></RequireAuth>} />
              <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
