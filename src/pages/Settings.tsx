
import React, { useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Settings as SettingsIcon, Save, Bell, Shield, LogOut } from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';

const Settings = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState({
    notifyNewPoint: true,
    notifyChecklistComplete: true,
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');

  const handleSaveSettings = () => {
    setIsLoading(true);
    
    // Validate passwords if changing
    if (settings.password || settings.confirmPassword) {
      if (settings.password !== settings.confirmPassword) {
        toast({
          title: "Senhas não coincidem",
          description: "Verifique se suas senhas são iguais.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      if (settings.password.length < 6) {
        toast({
          title: "Senha muito curta",
          description: "A senha deve ter pelo menos 6 caracteres.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
    }
    
    // Simulate saving settings
    setTimeout(() => {
      toast({
        title: "Configurações salvas",
        description: "Suas preferências foram atualizadas com sucesso.",
      });
      setIsLoading(false);
      
      // Clear password fields
      setSettings({
        ...settings,
        password: '',
        confirmPassword: '',
      });
    }, 1000);
  };

  const handleLogout = async () => {
    await signOut(); // AuthProvider já faz o redirect
  };


  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-travel-dark">Configurações</h1>
        <p className="text-travel-dark/70">Gerencie sua conta e preferências</p>
      </div>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-travel-blue" />
              <CardTitle>Notificações</CardTitle>
            </div>
            <CardDescription>Configure como você deseja ser notificado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Novo Ponto de Interesse</Label>
                <p className="text-sm text-travel-dark/70">
                  Receber notificações quando novos pontos forem adicionados
                </p>
              </div>
              <Switch
                checked={settings.notifyNewPoint}
                onCheckedChange={(checked) => 
                  setSettings({ ...settings, notifyNewPoint: checked })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Conclusão de Checklist</Label>
                <p className="text-sm text-travel-dark/70">
                  Receber notificações quando um checklist for concluído
                </p>
              </div>
              <Switch
                checked={settings.notifyChecklistComplete}
                onCheckedChange={(checked) => 
                  setSettings({ ...settings, notifyChecklistComplete: checked })
                }
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
  <div className="flex items-center gap-2">
    <Shield className="h-5 w-5 text-travel-blue" />
    <CardTitle>Segurança</CardTitle>
  </div>
  <CardDescription>Altere sua senha</CardDescription>
</CardHeader>
<CardContent className="space-y-4">
  <form
    onSubmit={async (e) => {
      e.preventDefault();
      setIsLoading(true);
      setError('');
      if (!settings.password || !settings.confirmPassword) {
        setError('Preencha todos os campos.');
        setIsLoading(false);
        return;
      }
      if (settings.password !== settings.confirmPassword) {
        setError('As senhas não coincidem.');
        setIsLoading(false);
        return;
      }
      if (settings.password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres.');
        setIsLoading(false);
        return;
      }
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const { error } = await supabase.auth.updateUser({ password: settings.password });
        if (error) throw error;
        toast({ title: 'Senha atualizada!', description: 'Sua senha foi alterada com sucesso.' });
        setSettings({ ...settings, password: '', confirmPassword: '' });
      } catch (err: any) {
        setError(err.message || 'Erro ao atualizar senha.');
      } finally {
        setIsLoading(false);
      }
    }}
    className="flex flex-col gap-4"
  >
    <div className="grid gap-2">
      <Label htmlFor="new-password">Nova Senha</Label>
      <Input
        id="new-password"
        type="password"
        value={settings.password}
        onChange={(e) => setSettings({ ...settings, password: e.target.value })}
        placeholder="Digite a nova senha"
      />
    </div>
    <div className="grid gap-2">
      <Label htmlFor="confirm-password">Confirme a Nova Senha</Label>
      <Input
        id="confirm-password"
        type="password"
        value={settings.confirmPassword}
        onChange={(e) => setSettings({ ...settings, confirmPassword: e.target.value })}
        placeholder="Confirme a nova senha"
      />
    </div>
    {error && <div className="text-red-600 text-sm text-center">{error}</div>}
    <Button type="submit" className="w-full bg-travel-mustard text-travel-dark mt-2" disabled={isLoading}>
      {isLoading ? 'Salvando...' : 'Alterar Senha'}
    </Button>
  </form>
</CardContent>
        </Card>
        
        <div className="flex flex-col sm:flex-row justify-center sm:justify-end gap-4 mt-10 mb-2">
          <Button
            className="h-10 px-5 text-base font-medium rounded-md shadow bg-travel-mustard hover:bg-travel-mustard/80 text-travel-dark flex items-center gap-2"
            onClick={handleSaveSettings}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">
                  <SettingsIcon className="h-4 w-4" />
                </span>
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" /> Salvar
              </>
            )}
          </Button>
          <Button
            className="h-10 px-5 text-base font-medium rounded-md shadow bg-red-500 hover:bg-red-600 text-white flex items-center gap-2"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            Sair da Conta
          </Button>
        </div>
      </div>
    </PageContainer>
  );
};

export default Settings;
