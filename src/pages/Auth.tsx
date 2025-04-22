
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Navigate } from 'react-router-dom';
import { Plane } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';

import { supabase } from '@/integrations/supabase/client';

const Auth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');
  const { signIn, signUp, user, loading } = useAuth();

  // Handle keyboard navigation
  useEffect(() => {
    // Preencher campos se houver dados salvos
    const saved = localStorage.getItem('travelhub_login');
    if (saved) {
      try {
        const { email, password } = JSON.parse(saved);
        setEmail(email || '');
        setPassword(password || '');
        setRemember(true);
      } catch {}
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (activeTab === 'signin') {
          handleSignIn();
        } else {
          handleSignUp();
        }
      } else if (e.key === 'Tab' && e.shiftKey && e.altKey) {
        // Toggle between tabs with Alt+Shift+Tab
        setActiveTab(prev => prev === 'signin' ? 'signup' : 'signin');
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, email, password]);

  const handleSignIn = () => {
    if (email && password) {
      const cookieConsent = localStorage.getItem('cookie_consent');
      if (remember && cookieConsent) {
        localStorage.setItem('travelhub_login', JSON.stringify({ email, password }));
      } else {
        localStorage.removeItem('travelhub_login');
      }
      signIn(email, password);
    }
  };

  const handleSignUp = () => {
    if (email && password) {
      signUp(email, password);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-travel-beige">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-travel-mustard"></div>
      </div>
    );
  }

  // Função para login social Google
  const handleSocialLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/points' } });
  };

  if (user) {
    return <Navigate to="/points" />;
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-travel-beige">
      <Dialog open={true}>
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="w-full max-w-sm sm:max-w-md md:max-w-lg mx-auto bg-white rounded-2xl shadow-2xl p-2 sm:p-4 md:p-8 flex flex-col justify-center items-center relative animate-fade-in overflow-y-auto max-h-[95vh]">

            <div className="w-full flex justify-center mb-3">
              <img 
                src="https://storage.wiseapp360.com/typebot/public/workspaces/clwl6fdyf000511ohlamongyl/typebots/cm683siyl000dm4kxlrec9tb8/results/m1y4olu1oilvu3kzi3j3otc6/blocks/cz78pvc8stcisz1y8sq2khj1/22%20de%20abr.%20de%202025%2C%2015_55_48.png"
                alt="Logo Travel Hub"
                className="max-h-36 sm:max-h-44 w-auto rounded-xl object-contain"
              />
            </div>

            <div className="text-sm sm:text-base text-center text-travel-dark/80 mb-2">Acesse sua conta ou cadastre-se para gerenciar suas viagens</div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-md mx-auto">
              <TabsList className="grid w-full grid-cols-2 h-9 rounded-lg bg-travel-mustard/20 p-0.5 gap-0.5 mb-2">
                <TabsTrigger value="signin" className="text-xs sm:text-sm font-normal rounded-lg py-1 px-1 transition-all data-[state=active]:bg-travel-mustard data-[state=active]:text-travel-dark data-[state=active]:shadow focus-visible:ring-2 focus-visible:ring-travel-mustard">Entrar</TabsTrigger>
                <TabsTrigger value="signup" className="text-xs sm:text-sm font-normal rounded-lg py-1 px-1 transition-all data-[state=active]:bg-travel-mustard data-[state=active]:text-travel-dark data-[state=active]:shadow focus-visible:ring-2 focus-visible:ring-travel-mustard">Cadastrar</TabsTrigger>
              </TabsList>
              <TabsContent value="signin">
                <CardContent className="space-y-5 pt-2 pb-1">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-0.5">
                      <Label htmlFor="signin-email" className="text-xs font-medium text-travel-dark/70 mb-0.5">Email</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="seuemail@exemplo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        className="h-9 text-sm px-2 rounded-lg border border-travel-mustard/30 bg-travel-beige/60 shadow-sm focus:border-travel-mustard focus:ring-2 focus:ring-travel-mustard/40 transition"
                      />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <Label htmlFor="signin-password" className="text-xs font-medium text-travel-dark/70 mb-0.5">Senha</Label>
                      <Input
                        id="signin-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        className="h-9 text-sm px-2 rounded-lg border border-travel-mustard/30 bg-travel-beige/60 shadow-sm focus:border-travel-mustard focus:ring-2 focus:ring-travel-mustard/40 transition"
                      />
                      <div className="text-right mt-0.5">
                        <a href="/auth/forgot" className="text-xs text-travel-blue hover:underline">Esqueci a senha</a>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="mt-3 flex flex-row gap-2 w-full">
                  <Button 
                    className="w-1/2 h-8 text-xs font-normal bg-travel-mustard/90 hover:bg-travel-mustard text-travel-dark rounded-lg px-1 transition-all min-w-[90px]"
                    onClick={handleSignIn}
                  >
                    Entrar
                  </Button>
                  <button
                    type="button"
                    className="w-1/2 h-8 flex items-center justify-center gap-1 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 transition px-1 min-w-[90px] focus:outline-none focus:ring-2 focus:ring-travel-mustard"
                    onClick={handleSocialLogin}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 48 48"><g><path fill="#4285F4" d="M24 9.5c3.54 0 6.72 1.22 9.22 3.62l6.9-6.9C35.64 2.63 30.24 0 24 0 14.84 0 6.71 5.82 2.69 14.13l8.18 6.35C12.7 13.13 17.91 9.5 24 9.5z"/><path fill="#34A853" d="M46.1 24.6c0-1.67-.15-3.26-.43-4.8H24v9.1h12.43c-.54 2.9-2.16 5.36-4.6 7.05l7.07 5.51C43.94 37.12 46.1 31.3 46.1 24.6z"/><path fill="#FBBC05" d="M10.87 28.48A14.49 14.49 0 019.5 24c0-1.56.27-3.07.74-4.48l-8.18-6.35A23.97 23.97 0 000 24c0 3.91.94 7.62 2.56 10.92l8.31-6.44z"/><path fill="#EA4335" d="M24 48c6.24 0 11.48-2.07 15.3-5.63l-7.07-5.51c-2 1.35-4.55 2.14-8.23 2.14-6.09 0-11.3-3.63-13.13-8.7l-8.31 6.44C6.71 42.18 14.84 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></g></svg>
                    Google
                  </button>
                </CardFooter>
              </TabsContent>
              <TabsContent value="signup">
                <CardContent className="space-y-5 pt-2 pb-1">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="signup-email" className="text-xs font-medium text-travel-dark/70 mb-0.5">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="seuemail@exemplo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        className="h-11 text-base px-3 rounded-lg border border-travel-mustard/30 bg-travel-beige/60 shadow-sm focus:border-travel-mustard focus:ring-2 focus:ring-travel-mustard/40 transition"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="signup-password" className="text-xs font-medium text-travel-dark/70 mb-0.5">Senha</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                        className="h-11 text-base px-3 rounded-lg border border-travel-mustard/30 bg-travel-beige/60 shadow-sm focus:border-travel-mustard focus:ring-2 focus:ring-travel-mustard/40 transition"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="mt-3">
                  <Button 
                    className="w-full h-8 text-xs font-normal bg-travel-mustard/90 hover:bg-travel-mustard text-travel-dark rounded-lg px-1 transition-all min-w-[90px]"
                    onClick={handleSignUp}
                  >
                    Cadastrar
                  </Button>
                </CardFooter>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default Auth;
