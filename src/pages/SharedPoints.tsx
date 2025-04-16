import React, { useEffect, useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, Calendar, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

interface SharedPoint {
  id: string;
  point: {
    id: string;
    name: string;
    address: string;
    description: string;
    planned_visit_date: string | null;
    created_at: string;
    user_id: string;
  };
  sender_email: string;
  user_email: string;
}

import PointDetailsModal from '@/components/points/PointDetailsModal';

export default function SharedPoints() {
  const { user } = useAuth();
  const [sharedPoints, setSharedPoints] = useState<SharedPoint[]>([]);
  const [sentPoints, setSentPoints] = useState<SharedPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'received' | 'sent'>('received');
  const [selectedPoint, setSelectedPoint] = useState<any>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [editPoint, setEditPoint] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    async function fetchSharedPoints() {
      setLoading(true);
      // Recebidos
      const { data: received, error: errorReceived } = await supabase
        .from('shared_points')
        .select('id, point:points(id, name, address, description, planned_visit_date, created_at, user_id), sender:users(email), user:users(email)')
        .eq('user_id', user.id);
      if (!errorReceived && received) {
        setSharedPoints(
          received.map((item: any) => ({
            id: item.id,
            point: item.point,
            sender_email: item.sender?.email || 'Desconhecido',
            user_email: item.user?.email || 'Desconhecido',
          }))
        );
      }
      // Enviados
      const { data: sent, error: errorSent } = await supabase
        .from('shared_points')
        .select('id, point:points(id, name, address, description, planned_visit_date, created_at, user_id), sender:users(email), user:users(email)')
        .eq('sender_id', user.id);
      if (!errorSent && sent) {
        setSentPoints(
          sent.map((item: any) => ({
            id: item.id,
            point: item.point,
            sender_email: item.sender?.email || 'Desconhecido',
            user_email: item.user?.email || 'Desconhecido',
          }))
        );
      }
      setLoading(false);
    }
    fetchSharedPoints();
  }, [user]);

  const handleAccept = async (sharedPointId: string) => {
    // Aqui você pode copiar o ponto para os pontos do usuário ou marcar como aceito
    // Exemplo: copiar para tabela points
    const shared = sharedPoints.find(sp => sp.id === sharedPointId);
    if (!shared) return;
    // Montar objeto compatível com Insert de points
    // Garantir que todos os campos opcionais existam
    const point = shared.point as any;
    await supabase.from('points').insert({
      name: point.name,
      address: point.address,
      description: point.description || '',
      planned_visit_date: point.planned_visit_date || null,
      type: point.type || 'outro',
      user_id: user.id,
      created_at: new Date().toISOString(),
      google_maps_url: point.google_maps_url || null,
      image_url: point.image_url || null,
      opening_hours: point.opening_hours || null,
    });
    // Remover da lista de compartilhados
    await supabase.from('shared_points').delete().eq('id', sharedPointId);
    setSharedPoints(sharedPoints.filter(sp => sp.id !== sharedPointId));
  };

  const handleReject = async (sharedPointId: string) => {
    await supabase.from('shared_points').delete().eq('id', sharedPointId);
    setSharedPoints(sharedPoints.filter(sp => sp.id !== sharedPointId));
  };

  return (
    <PageContainer>
      <h1 className="text-2xl font-bold mb-4">Pontos Compartilhados</h1>
      <div className="flex gap-4 mb-6">
        <Button variant={tab === 'received' ? 'default' : 'outline'} onClick={() => setTab('received')}>Recebidos</Button>
        <Button variant={tab === 'sent' ? 'default' : 'outline'} onClick={() => setTab('sent')}>Enviados</Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          Carregando...
        </div>
      ) : (
        <>
          {tab === 'received' ? (
            sharedPoints.length === 0 ? (
              <div className="text-center text-travel-dark/60 mt-10">Nenhum ponto recebido.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sharedPoints.map(sp => (
                  <Card key={sp.id} className="border border-travel-mustard">
                    <CardHeader>
                      <CardTitle>{sp.point.name}</CardTitle>
                      <CardDescription>Enviado por <UserIcon className="inline h-4 w-4 mb-1 mr-1" /> {sp.sender_email}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-2 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-travel-blue" />
                        <span>{sp.point.address}</span>
                      </div>
                      <div className="mb-2 text-sm text-travel-dark/80">{sp.point.description}</div>
                      {sp.point.planned_visit_date && (
                        <div className="flex items-center gap-2 text-xs text-travel-dark/60">
                          <Calendar className="h-4 w-4" />
                          Visita planejada: {sp.point.planned_visit_date}
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="flex gap-2">
                      <Button onClick={() => handleAccept(sp.id)} className="bg-travel-mustard hover:bg-travel-mustard/80 text-travel-dark">Aceitar</Button>
                      <Button variant="outline" onClick={() => handleReject(sp.id)}>Recusar</Button>
                      <Button variant="ghost" onClick={() => { setSelectedPoint(sp.point); setDetailsModalOpen(true); }}>Ver detalhes</Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )
          ) : (
            sentPoints.length === 0 ? (
              <div className="text-center text-travel-dark/60 mt-10">Nenhum ponto enviado.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sentPoints.map(sp => (
                  <Card key={sp.id} className="border border-travel-mustard">
                    <CardHeader>
                      <CardTitle>{sp.point.name}</CardTitle>
                      <CardDescription>Enviado para <UserIcon className="inline h-4 w-4 mb-1 mr-1" /> {sp.user_email}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-2 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-travel-blue" />
                        <span>{sp.point.address}</span>
                      </div>
                      <div className="mb-2 text-sm text-travel-dark/80">{sp.point.description}</div>
                      {sp.point.planned_visit_date && (
                        <div className="flex items-center gap-2 text-xs text-travel-dark/60">
                          <Calendar className="h-4 w-4" />
                          Visita planejada: {sp.point.planned_visit_date}
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="flex gap-2">
                      <Button variant="ghost" onClick={() => { setSelectedPoint(sp.point); setDetailsModalOpen(true); }}>Ver detalhes</Button>
                      <Button variant="outline" onClick={async () => {
                        await supabase.from('shared_points').delete().eq('id', sp.id);
                        setSentPoints(sentPoints.filter(s => s.id !== sp.id));
                      }}>Excluir</Button>
                      <Button variant="outline" onClick={() => { setEditPoint(sp); setEditDialogOpen(true); }}>Editar</Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )
          )}
        </>
      )}
      <PointDetailsModal point={selectedPoint} isOpen={detailsModalOpen} onClose={() => setDetailsModalOpen(false)} />
      {/* Edit dialog pode ser implementado aqui, usando um modal semelhante ao de editar ponto */}
    </PageContainer>
  );
}
