import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

interface SharePointDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pointId: string;
}

interface AppUser {
  id: string;
  email: string;
}

export const SharePointDialog: React.FC<SharePointDialogProps> = ({ open, onOpenChange, pointId }) => {
  // O tipo da view public.users deve ser compatível com AppUser
  type PublicUser = { id: string; email: string | null };
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    if (open) {
      (async () => {
        const { data, error } = await supabase
          .from('users')
          .select('id, email');
        if (!error && data) {
          setUsers(data as AppUser[]);
        }
      })();
    }
  }, [open]);

  const handleShare = async () => {
    if (!selectedUserId) {
      toast({
        title: 'Selecione um usuário',
        description: 'Por favor, escolha um usuário para compartilhar.',
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);
    const currentUser = (await supabase.auth.getUser()).data.user;
    if (!currentUser) {
      toast({
        title: 'Erro de autenticação',
        description: 'Usuário não autenticado.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }
    const { error } = await supabase.from('shared_points').insert([
      { point_id: pointId, user_id: selectedUserId, sender_id: currentUser.id }
    ]);
    setLoading(false);
    if (error) {
      toast({
        title: 'Erro ao compartilhar',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Ponto compartilhado',
        description: 'O ponto foi compartilhado com sucesso!',
      });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Compartilhar Ponto</DialogTitle>
          <DialogDescription>
            Escolha um usuário para compartilhar este ponto de interesse.
          </DialogDescription>
        </DialogHeader>
        <div className="my-4">
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione um usuário" />
            </SelectTrigger>
            <SelectContent>
              {users.map(user => (
                <SelectItem key={user.id} value={user.id}>
                  {user.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button onClick={handleShare} disabled={loading || !selectedUserId} className="bg-travel-mustard hover:bg-travel-mustard/80 text-travel-dark w-full">
            {loading ? 'Compartilhando...' : 'Compartilhar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
