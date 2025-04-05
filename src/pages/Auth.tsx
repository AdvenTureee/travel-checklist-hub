
import React, { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Navigate } from 'react-router-dom';
import { Plane } from 'lucide-react';

const Auth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, signUp, user, loading } = useAuth();

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
    <div className="flex justify-center items-center min-h-screen bg-travel-beige p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto bg-travel-mustard w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Plane className="h-8 w-8 text-travel-dark" />
          </div>
          <CardTitle className="text-2xl font-bold text-center text-travel-dark">Bem-vindo ao Travel Hub</CardTitle>
          <CardDescription className="text-center">Entre ou crie uma conta para gerenciar seus pontos de interesse</CardDescription>
        </CardHeader>
        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Entrar</TabsTrigger>
            <TabsTrigger value="signup">Cadastrar</TabsTrigger>
          </TabsList>
          <TabsContent value="signin">
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input
                  id="signin-email"
                  type="email"
                  placeholder="seuemail@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password">Senha</Label>
                <Input
                  id="signin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full bg-travel-mustard hover:bg-travel-mustard/80 text-travel-dark" 
                onClick={() => signIn(email, password)}
              >
                Entrar
              </Button>
            </CardFooter>
          </TabsContent>
          <TabsContent value="signup">
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="seuemail@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Senha</Label>
                <Input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full bg-travel-mustard hover:bg-travel-mustard/80 text-travel-dark" 
                onClick={() => signUp(email, password)}
              >
                Cadastrar
              </Button>
            </CardFooter>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Auth;
