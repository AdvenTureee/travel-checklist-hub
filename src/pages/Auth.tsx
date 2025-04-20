
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

  if (user) {
    return <Navigate to="/points" />;
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-travel-beige">
      <Dialog open={true}>
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="w-full max-w-lg mx-auto bg-white rounded-2xl shadow-2xl p-4 sm:p-8 flex flex-col justify-center items-center relative animate-fade-in">

            <div className="mx-auto mb-3 bg-travel-mustard rounded-xl px-3 py-2 shadow-md flex items-center justify-center gap-2 w-fit">
              <Plane className="h-7 w-7 text-travel-dark" />
              <span className="text-2xl sm:text-3xl font-extrabold text-travel-dark tracking-wide">Travel Hub</span>
            </div>
            <div className="text-sm sm:text-base text-center text-travel-dark/80 mb-2">Acesse sua conta ou cadastre-se para gerenciar suas viagens</div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-md mx-auto">
          <TabsList className="grid w-full grid-cols-2 h-9 rounded-lg bg-travel-mustard/20 p-0.5 gap-0.5 mb-2">
            <TabsTrigger value="signin" className="text-xs sm:text-sm font-normal rounded-lg py-1 px-1 transition-all data-[state=active]:bg-travel-mustard data-[state=active]:text-travel-dark data-[state=active]:shadow focus-visible:ring-2 focus-visible:ring-travel-mustard">Entrar</TabsTrigger>
            <TabsTrigger value="signup" className="text-xs sm:text-sm font-normal rounded-lg py-1 px-1 transition-all data-[state=active]:bg-travel-mustard data-[state=active]:text-travel-dark data-[state=active]:shadow focus-visible:ring-2 focus-visible:ring-travel-mustard">Cadastrar</TabsTrigger>
          </TabsList>
          <TabsContent value="signin">
            <CardContent className="space-y-5 pt-2 pb-1">
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="signin-email" className="text-xs font-medium text-travel-dark/70 mb-0.5">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="seuemail@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className="h-11 text-base px-3 rounded-lg border border-travel-mustard/30 bg-travel-beige/60 shadow-sm focus:border-travel-mustard focus:ring-2 focus:ring-travel-mustard/40 transition"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="signin-password" className="text-xs font-medium text-travel-dark/70 mb-0.5">Senha</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="h-11 text-base px-3 rounded-lg border border-travel-mustard/30 bg-travel-beige/60 shadow-sm focus:border-travel-mustard focus:ring-2 focus:ring-travel-mustard/40 transition"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <input
                  id="remember-login"
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  className="accent-travel-mustard w-5 h-5"
                />
                <Label htmlFor="remember-login" className="text-base cursor-pointer">Lembrar login</Label>
              </div>

            </CardContent>
            <CardFooter className="mt-6">
              <Button 
                className="w-full h-9 text-base font-normal bg-travel-mustard/90 hover:bg-travel-mustard text-travel-dark rounded-lg shadow px-3 transition-all"
                onClick={handleSignIn}
              >
                Entrar
              </Button>
            </CardFooter>
          </TabsContent>
          <TabsContent value="signup">
            <CardContent className="space-y-5 pt-2 pb-1">
              <div className="flex flex-col gap-5">
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
            <CardFooter className="mt-6">
              <Button 
                className="w-full h-9 text-base font-normal bg-travel-mustard/90 hover:bg-travel-mustard text-travel-dark rounded-lg shadow px-3 transition-all"
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
