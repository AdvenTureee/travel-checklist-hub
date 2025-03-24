
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
    language: 'en',
    password: '',
    confirmPassword: '',
  });

  const handleSaveSettings = () => {
    setIsLoading(true);
    
    // Validate passwords if changing
    if (settings.password || settings.confirmPassword) {
      if (settings.password !== settings.confirmPassword) {
        toast({
          title: "Passwords don't match",
          description: "Please make sure your passwords match.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      if (settings.password.length < 6) {
        toast({
          title: "Password too short",
          description: "Password should be at least 6 characters long.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
    }
    
    // Simulate saving settings
    setTimeout(() => {
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully.",
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
        <h1 className="text-3xl font-bold text-travel-dark">Settings</h1>
        <p className="text-travel-dark/70">Manage your account and preferences</p>
      </div>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-travel-blue" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>Configure how you want to be notified</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">New Point of Interest</Label>
                <p className="text-sm text-travel-dark/70">
                  Receive notifications when new points are added
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
                <Label className="text-base">Checklist Completion</Label>
                <p className="text-sm text-travel-dark/70">
                  Receive notifications when a checklist is completed
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
              <CardTitle>Language & Region</CardTitle>
            </div>
            <CardDescription>Configure your language preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <Label htmlFor="language">Application Language</Label>
              <select
                id="language"
                value={settings.language}
                onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="pt">Português</option>
              </select>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-travel-blue" />
              <CardTitle>Security</CardTitle>
            </div>
            <CardDescription>Update your password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="current-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={settings.password}
                onChange={(e) => setSettings({ ...settings, password: e.target.value })}
                placeholder="Enter new password"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={settings.confirmPassword}
                onChange={(e) => setSettings({ ...settings, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
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
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </PageContainer>
  );
};

export default Settings;
