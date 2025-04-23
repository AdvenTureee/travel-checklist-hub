import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
// Removido Flatpickr
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
              {/* Horários de funcionamento minimalista */}
              <div className="pt-2">
                <div className="flex justify-between items-center mb-2">
                  <Label className="block text-travel-dark text-xs font-semibold">Horários de funcionamento</Label>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      className="text-xs px-2 py-1 rounded-full border border-travel-mustard bg-travel-mustard/70 text-travel-dark font-semibold hover:bg-travel-mustard"
                      onClick={() => {
                        const seg = openingHours['Segunda'];
                        if (seg) {
                          const updated = Object.fromEntries(Object.entries(openingHours).map(([d, v]) => [d, { ...seg }]));
                          setOpeningHours(updated);
                          if (setOpeningHoursProp) setOpeningHoursProp(updated);
                        }
                      }}
                    >Copiar segunda</button>
                    <button
                      type="button"
                      className="text-xs px-2 py-1 rounded-full border border-gray-300 bg-gray-100 hover:bg-gray-200 text-gray-700"
                      onClick={() => {
                        const updated = Object.fromEntries(Object.entries(openingHours).map(([d]) => [d, { open: '', close: '' }]));
                        setOpeningHours(updated);
                        if (setOpeningHoursProp) setOpeningHoursProp(updated);
                      }}
                    >Fechar todos</button>
                  </div>
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-1 py-1 text-left font-semibold text-travel-dark/80">Dia</th>
                      <th className="px-1 py-1 font-semibold text-travel-dark/80">Abertura</th>
                      <th className="px-1 py-1 font-semibold text-travel-dark/80">Fechamento</th>
                      <th className="px-1 py-1"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(openingHours).map(([day, value]) => (
                      <tr key={day} className="border-b last:border-b-0">
                        <td className="px-1 py-1 whitespace-nowrap">{day}</td>
                        <td className="px-1 py-1">
                          <div className="flex items-center gap-1">
                            <select
                              value={value.open.split(':')[0] || ''}
                              onChange={e => handleOpeningHourChange(day, 'open', `${e.target.value}:${value.open.split(':')[1] || '00'}`)}
                              className="w-8 border rounded-lg px-1 py-1 bg-white text-xs"
                            >
                              <option value="">--</option>
                              {[...Array(24).keys()].map(h => (
                                <option key={h} value={h.toString().padStart(2, '0')}>{h.toString().padStart(2, '0')}</option>
                              ))}
                            </select>
                            <span>:</span>
                            <select
                              value={value.open.split(':')[1] || ''}
                              onChange={e => handleOpeningHourChange(day, 'open', `${value.open.split(':')[0] || '00'}:${e.target.value}`)}
                              className="w-8 border rounded-lg px-1 py-1 bg-white text-xs"
                            >
                              <option value="">--</option>
                              {[...Array(60).keys()].map(m => (
                                <option key={m} value={m.toString().padStart(2, '0')}>{m.toString().padStart(2, '0')}</option>
                              ))}
                            </select>
                          </div>
                        </td>
                        <td className="px-1 py-1">
                          <div className="flex items-center gap-1">
                            <select
                              value={value.close.split(':')[0] || ''}
                              onChange={e => handleOpeningHourChange(day, 'close', `${e.target.value}:${value.close.split(':')[1] || '00'}`)}
                              className="w-8 border rounded-lg px-1 py-1 bg-white text-xs"
                            >
                              <option value="">--</option>
                              {[...Array(24).keys()].map(h => (
                                <option key={h} value={h.toString().padStart(2, '0')}>{h.toString().padStart(2, '0')}</option>
                              ))}
                            </select>
                            <span>:</span>
                            <select
                              value={value.close.split(':')[1] || ''}
                              onChange={e => handleOpeningHourChange(day, 'close', `${value.close.split(':')[0] || '00'}:${e.target.value}`)}
                              className="w-8 border rounded-lg px-1 py-1 bg-white text-xs"
                            >
                              <option value="">--</option>
                              {[...Array(60).keys()].map(m => (
                                <option key={m} value={m.toString().padStart(2, '0')}>{m.toString().padStart(2, '0')}</option>
                              ))}
                            </select>
                          </div>
                        </td>
                        <td className="px-1 py-1">
                          <button
                            type="button"
                            className="text-xs px-2 py-1 border rounded border-gray-300 bg-gray-100 hover:bg-gray-200 text-gray-700"
                            onClick={() => {
                              const updated = { ...openingHours, [day]: { open: '', close: '' } };
                              setOpeningHours(updated);
                              if (setOpeningHoursProp) setOpeningHoursProp(updated);
                            }}
                          >Fechado</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          <DialogFooter className="flex flex-col gap-2 pt-4">
            <div className="flex flex-row gap-2 w-full">
              {step === 2 && (
                <button
                  type="button"
                  className="flex-1 bg-travel-mustard text-travel-dark font-bold py-2 px-4 rounded-full hover:bg-yellow-400 transition"
                  onClick={() => setStep(1)}
                >Voltar</button>
              )}
              {step === 1 && (
                <button
                  type="button"
                  className="flex-1 bg-travel-mustard text-travel-dark font-bold py-2 px-4 rounded-full hover:bg-yellow-400 transition"
                  onClick={() => setStep(2)}
                >Próximo</button>
              )}
              {step === 2 && (
                <button
                  type="submit"
                  className="flex-1 bg-travel-mustard text-travel-dark font-bold py-2 px-4 rounded-full hover:bg-yellow-400 transition disabled:opacity-60"
                  disabled={loading}
                >
                  {loading ? 'Salvando...' : 'Salvar ponto'}
                </button>
              )}
              <button
                type="button"
                className="w-full bg-gray-100 text-travel-dark font-bold py-2 px-4 rounded-full hover:bg-gray-200 transition"
                onClick={() => onOpenChange(false)}
              >Cancelar</button>
              {error && <div className="text-red-500 text-xs mt-1 text-center">{error}</div>}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
