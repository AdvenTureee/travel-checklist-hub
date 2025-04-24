import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
// Removido Flatpickr
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { formatOpeningHours } from './formatOpeningHours';
import OpeningHoursInput from './OpeningHoursInput';

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

// Novo tipo para horários de funcionamento
export interface OpeningHours {
  [day: string]: { open: string; close: string };
}

export const AddPointDialog: React.FC<AddPointDialogProps & {
  type?: string;
  setType?: (value: string) => void;
  googleMapsUrl?: string;
  setGoogleMapsUrl?: (value: string) => void;
  plannedVisitDate?: string;
  setPlannedVisitDate?: (value: string) => void;
  imageUrl?: string;
  setImageUrl?: (value: string) => void;
  openingHours?: OpeningHours;
  setOpeningHours?: (value: OpeningHours) => void;
}> = ({
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
  onSubmit,
  type = 'tourist',
  setType,
  googleMapsUrl = '',
  setGoogleMapsUrl,
  plannedVisitDate = '',
  setPlannedVisitDate,
  imageUrl = '',
  setImageUrl,
  openingHours: openingHoursProp,
  setOpeningHours: setOpeningHoursProp
}) => {
  const [imageMode, setImageMode] = React.useState<'upload' | 'url'>('upload');
  const [step, setStep] = React.useState(1);

  // Estado local para horários se não for controlado por prop
  const [openingHours, setOpeningHours] = React.useState<OpeningHours>(
    openingHoursProp || {
      'Segunda': { open: '', close: '' },
      'Terça': { open: '', close: '' },
      'Quarta': { open: '', close: '' },
      'Quinta': { open: '', close: '' },
      'Sexta': { open: '', close: '' },
      'Sábado': { open: '', close: '' },
      'Domingo': { open: '', close: '' },
    }
  );

  // Atualiza estado local e prop, se existir
  const handleOpeningHourChange = (day: string, field: 'open' | 'close', value: string) => {
    const updated = {
      ...openingHours,
      [day]: { ...openingHours[day], [field]: value }
    };
    setOpeningHours(updated);
    if (setOpeningHoursProp) setOpeningHoursProp(updated);
  };

  // Passar openingHours no onSubmit se necessário
  const handleSubmit = (e: React.FormEvent) => {
    if (onSubmit) {
      if (onSubmit.length > 1) {
        // Se onSubmit espera mais de 1 argumento, passar openingHours
        // @ts-ignore
        onSubmit(e, openingHours);
      } else {
        onSubmit(e);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl p-0 overflow-visible max-h-[90vh] flex flex-col">
        <DialogHeader className="p-4 pb-2 border-b">
          <DialogTitle className="text-xl md:text-2xl font-bold text-travel-blue">Cadastrar novo ponto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="px-4 md:px-8 pb-6 pt-2 space-y-6 flex-1 overflow-y-auto">
          {step === 1 && (
            <>
              {/* Dados principais compactos */}
              <div className="space-y-2">
                <div>
                  <Label className="mb-0.5 block text-travel-dark text-xs font-medium">Nome *</Label>
                  <Input required value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Museu do Amanhã" className="rounded-xl text-xs px-3 py-2" />
                </div>
                <div>
                  <Label className="mb-0.5 block text-travel-dark text-xs font-medium">Categoria *</Label>
                  <div className="flex gap-1 flex-wrap">
                    {[
                      { label: 'Turismo', value: 'tourist', icon: '🗺️' },
                      { label: 'Compras', value: 'shopping', icon: '🛍️' },
                      { label: 'Restaurante', value: 'restaurant', icon: '🍽️' },
                      { label: 'Hospedagem', value: 'accommodation', icon: '🏨' },
                      { label: 'Outro', value: 'other', icon: '⭐' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`px-2 py-1 rounded-full border flex items-center gap-1 text-xs transition-all ${type===opt.value ? 'bg-travel-mustard text-travel-dark border-travel-mustard font-bold shadow' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}`}
                        onClick={() => setType && setType(opt.value)}
                      >
                        <span>{opt.icon}</span> {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="mb-0.5 block text-travel-dark text-xs font-medium">Endereço *</Label>
                  <Input required value={address} onChange={e => setAddress(e.target.value)} placeholder="Ex: Av. Exemplo, 123, Centro, Cidade" className="rounded-xl text-xs px-3 py-2" />
                </div>
                <div>
                  <Label className="mb-0.5 block text-travel-dark text-xs font-medium">Descrição</Label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Dicas, curiosidades, detalhes..." className="rounded-xl text-xs px-3 py-2" />
                </div>
              </div>

              {/* Imagem */}
              <div className="border-t pt-3 mt-2">
                <Label className="mb-0.5 block text-travel-dark text-xs font-medium">Imagem</Label>
                <div className="flex gap-1 mb-1">
                  <button type="button" className={`px-2 py-1 rounded-xl text-xs ${imageMode==='upload'?'bg-travel-mustard text-travel-dark':''}`} onClick={() => setImageMode('upload')}>Arquivo</button>
                  <button type="button" className={`px-2 py-1 rounded-xl text-xs ${imageMode==='url'?'bg-travel-mustard text-travel-dark':''}`} onClick={() => setImageMode('url')}>Link</button>
                </div>
                <div className="flex gap-2 items-center">
                  {imageMode === 'upload' ? (
                    <Input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} className="rounded-xl text-xs px-2 py-1" />
                  ) : (
                    <Input type="url" placeholder="Link da imagem..." value={imageUrl} onChange={e => setImageUrl && setImageUrl(e.target.value)} className="rounded-xl text-xs px-2 py-1" />
                  )}
                  {(imageFile || imageUrl) && (
                    <div className="w-12 h-12 rounded-lg border overflow-hidden bg-gray-100 flex items-center justify-center">
                      {/* eslint-disable-next-line jsx-a11y/alt-text */}
                      <img
                        src={imageFile ? URL.createObjectURL(imageFile) : imageUrl}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Localização */}
              <div className="border-t pt-3 mt-2 grid grid-cols-1 gap-2">
                <div>
                  <Label className="mb-0.5 block text-travel-dark text-xs font-medium">Google Maps</Label>
                  <Input type="url" value={googleMapsUrl} onChange={e => setGoogleMapsUrl && setGoogleMapsUrl(e.target.value)} placeholder="Link do Google Maps..." className="rounded-xl text-xs px-3 py-2" />
                </div>
                <div>
                  <Label className="mb-0.5 block text-travel-dark text-xs font-medium">Data planejada</Label>
                  <Input type="date" value={plannedVisitDate || ''} onChange={e => setPlannedVisitDate && setPlannedVisitDate(e.target.value)} placeholder="Selecione a data" className="rounded-xl text-xs px-3 py-2" />
                </div>
              </div>
            </>
          )}
          {step === 2 && (
            <>
              {/* Horários de funcionamento amigável */}
              <div className="pt-2">
                <OpeningHoursInput
                  value={JSON.stringify(openingHours)}
                  onChange={str => {
                    try {
                      const parsed = JSON.parse(str);
                      setOpeningHours(parsed);
                      if (setOpeningHoursProp) setOpeningHoursProp(parsed);
                    } catch {
                      // fallback: não atualiza
                    }
                  }}
                />
              </div>
              {/* Resumo amigável dos horários de funcionamento */}
              <div className="mt-4">
                <Label className="block text-travel-dark text-xs font-semibold mb-1">Resumo dos horários</Label>
                <pre className="bg-gray-50 rounded-lg p-2 text-xs text-travel-dark/80 whitespace-pre-wrap">
                  {formatOpeningHours(openingHours)}
                </pre>
              </div>
            </>
          )}
          <DialogFooter className="flex flex-col gap-2 pt-4">
            <div className="flex flex-row gap-2 w-full">
              {step === 2 && (
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 border-travel-mustard text-travel-dark font-bold"
                  onClick={() => setStep(1)}
                >Voltar</Button>
              )}
              {step === 1 && (
                <Button
                  type="button"
                  variant="default"
                  className="flex-1 bg-travel-mustard text-travel-dark font-bold"
                  onClick={() => setStep(2)}
                >Próximo</Button>
              )}
              {step === 2 && (
                <Button
                  type="submit"
                  variant="default"
                  className="flex-1 bg-travel-mustard text-travel-dark font-bold disabled:opacity-60"
                  disabled={loading}
                >
                  {loading ? 'Salvando...' : 'Salvar ponto'}
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                className="w-full text-travel-dark font-bold"
                onClick={() => onOpenChange(false)}
              >Cancelar</Button>
              {error && <div className="text-red-500 text-xs mt-1 text-center">{error}</div>}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
