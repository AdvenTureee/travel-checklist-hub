
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plane } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

export function LoginForm() {
  const [username, setUsername] = useState('gabriel.mauro@fieldcorp.com.br');
  const [password, setPassword] = useState('741129');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!username || !password) {
      toast({
        title: "Credenciais inválidas",
        description: "Por favor, informe usuário e senha",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    // Simulate login process
    setTimeout(() => {
      // For now, just accept any login
      localStorage.setItem('token', 'dummy-token');
      toast({
        title: "Login realizado com sucesso",
        description: "Bem-vindo ao Travel Hub!",
      });
      setIsLoading(false);
      navigate('/points');
    }, 1500);
  };

  return (
    <Card className="w-full max-w-md shadow-lg animate-fade-in">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-2">
          <div className="bg-travel-mustard p-3 rounded-full">
            <Plane className="h-6 w-6 text-travel-dark" />
          </div>
        </div>
        <CardTitle className="text-xl sm:text-2xl font-bold">Bem-vindo ao Travel Hub</CardTitle>
        <CardDescription className="text-sm sm:text-base">
          Informe suas credenciais para acessar seus planos de viagem
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 px-4 sm:px-6">
          <div className="space-y-2">
            <Label htmlFor="username">Usuário</Label>
            <Input
              id="username"
              type="text"
              placeholder="Digite seu usuário"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="transition-all duration-200 focus:ring-travel-mustard"
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Senha</Label>
              <button type="button" className="text-xs sm:text-sm text-travel-blue hover:underline">
                Esqueceu a senha?
              </button>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="Digite sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="transition-all duration-200 focus:ring-travel-mustard"
              required
            />
          </div>
        </CardContent>
        <CardFooter className="px-4 sm:px-6 pb-6">
          <Button 
            type="submit" 
            className="w-full bg-travel-mustard hover:bg-travel-mustard/80 text-travel-dark py-2 h-auto sm:h-10 text-sm sm:text-base"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-travel-dark" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Entrando...
              </span>
            ) : (
              'Entrar'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
