import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';

interface AddPointDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  address: string;
  description: string;
  imageFile: File | null;
  setName: (value: string) => void;
  setAddress: (value: string) => void;
  setDescription: (value: string) => void;
  setImageFile: (file: File | null) => void;
  loading: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent) => void;
}

export const AddPointDialog: React.FC<AddPointDialogProps> = ({
  open,
  onOpenChange,
  name,
  address,
  description,
  imageFile,
  setName,
  setAddress,
  setDescription,
  setImageFile,
  loading,
  error,
  onSubmit
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cadastrar novo ponto</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label>Nome</Label>
            <Input required value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <Label>Endereço</Label>
            <Input required value={address} onChange={e => setAddress(e.target.value)} />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div>
            <Label>Imagem do ponto</Label>
            <Input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} />
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <DialogFooter>
            <Button type="submit" disabled={loading} className="bg-travel-mustard text-travel-dark w-full">
              {loading ? 'Cadastrando...' : 'Cadastrar ponto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
