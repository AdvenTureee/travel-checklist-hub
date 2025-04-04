
import React, { useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Settings as SettingsIcon, Save, Bell, Globe, Shield } from 'lucide-react';

const Settings = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState({
    notifyNewPoint: true,
    notifyChecklistComplete: true,
    language: 'pt',
    password: '',
    confirmPassword: '',
  });

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
              <Globe className="h-5 w-5 text-travel-blue" />
              <CardTitle>Idioma e Região</CardTitle>
            </div>
            <CardDescription>Configure suas preferências de idioma</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <Label htmlFor="language">Idioma do Aplicativo</Label>
              <select
                id="language"
                value={settings.language}
                onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="pt">Português (Brasil)</option>
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-travel-blue" />
              <CardTitle>Segurança</CardTitle>
            </div>
            <CardDescription>Atualize sua senha</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="current-password">Nova Senha</Label>
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
          </CardContent>
        </Card>
        
        <div className="flex justify-end mt-4">
          <Button
            className="bg-travel-mustard hover:bg-travel-mustard/80 text-travel-dark"
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
                <Save className="mr-2 h-4 w-4" />
                Salvar Configurações
              </>
            )}
          </Button>
        </div>
      </div>
    </PageContainer>
  );
};

export default Settings;
