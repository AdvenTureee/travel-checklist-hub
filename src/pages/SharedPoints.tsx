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
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Compartilhamento de pontos e viagens</h1>
      <p className="text-lg text-gray-600">Esta funcionalidade está temporariamente desativada. Em breve, uma nova versão estará disponível para compartilhar viagens com outros usuários.</p>
    </div>
  );
  const { user } = useAuth();
  const [sharedPoints, setSharedPoints] = useState<SharedPoint[]>([]);
  const [sentPoints, setSentPoints] = useState<SharedPoint[]>([]);
  const [sharedTrips, setSharedTrips] = useState<any[]>([]);
  const [sentTrips, setSentTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'received' | 'sent' | 'trips' | 'trips-sent'>('received');
  const [selectedPoint, setSelectedPoint] = useState<any>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [editPoint, setEditPoint] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    async function fetchSharedPointsAndTrips() {
      setLoading(true);
      // Recebidos
      const { data: received, error: errorReceived } = await supabase
        .from('shared_points')
        .select('id, point:points(id, name, address, description, planned_visit_date, created_at, user_id), sender_id, user_id')
        .eq('user_id', user.id);
      if (errorReceived) {
        console.error('Supabase fetch error (shared_points):', errorReceived.message, errorReceived.details);
      }
      console.log('Received shared_points:', received); // Debugging
      if (!errorReceived && received) {
        // Collect unique user IDs
        const userIds = [
          ...new Set([
            ...received.map((sp: any) => sp.sender_id),
            ...received.map((sp: any) => sp.user_id),
          ]),
        ];
        // Fetch emails from all_users view
        const { data: users, error: userError } = await supabase
          .from('all_users')
          .select('id, email')
          .in('id', userIds);
        if (userError) {
          console.error('Supabase fetch error (all_users):', userError.message, userError.details);
        }
        const idToEmail = users ? Object.fromEntries(users.map((u: any) => [u.id, u.email])) : {};
        setSharedPoints(
          received.map((item: any) => ({
            ...item,
            sender_email: idToEmail[item.sender_id] || '',
            user_email: idToEmail[item.user_id] || '',
          }))
        );
      }

      // Shared Trips - RECEIVED
      const { data: receivedTrips, error: errorReceivedTrips } = await supabase
        .from('shared_trips')
        .select('id, trip:trip(id, nome, local, datain, dataout, created_at, user_id), sender_id, user_id')
        .eq('user_id', user.id);
      if (errorReceivedTrips) {
        console.error('Supabase fetch error (shared_trips, received):', errorReceivedTrips.message, errorReceivedTrips.details);
      }
      console.log('Received shared_trips:', receivedTrips); // Debugging
      if (!errorReceivedTrips && receivedTrips) {
        const tripUserIds = [
          ...new Set([
            ...receivedTrips.map((st: any) => st.sender_id),
            ...receivedTrips.map((st: any) => st.user_id),
          ]),
        ];
        const { data: tripUsers, error: tripUserError } = await supabase
          .from('all_users')
          .select('id, email')
          .in('id', tripUserIds);
        if (tripUserError) {
          console.error('Supabase fetch error (all_users for received trips):', tripUserError.message, tripUserError.details);
        }
        const idToEmailTrips = tripUsers ? Object.fromEntries(tripUsers.map((u: any) => [u.id, u.email])) : {};
        setSharedTrips(
          receivedTrips.map((item: any) => ({
            ...item,
            sender_email: idToEmailTrips[item.sender_id] || '',
            user_email: idToEmailTrips[item.user_id] || '',
          }))
        );
      }

      // Shared Trips - SENT
      const { data: sentTrips, error: errorSentTrips } = await supabase
        .from('shared_trips')
        .select('id, trip:trip(id, nome, local, datain, dataout, created_at, user_id), sender_id, user_id')
        .eq('sender_id', user.id);
      if (errorSentTrips) {
        console.error('Supabase fetch error (shared_trips, sent):', errorSentTrips.message, errorSentTrips.details);
      }
      console.log('Sent shared_trips:', sentTrips); // Debugging
      if (!errorSentTrips && sentTrips) {
        const tripUserIds = [
          ...new Set([
            ...sentTrips.map((st: any) => st.sender_id),
            ...sentTrips.map((st: any) => st.user_id),
          ]),
        ];
        const { data: tripUsers, error: tripUserError } = await supabase
          .from('all_users')
          .select('id, email')
          .in('id', tripUserIds);
        if (tripUserError) {
          console.error('Supabase fetch error (all_users for sent trips):', tripUserError.message, tripUserError.details);
        }
        const idToEmailTrips = tripUsers ? Object.fromEntries(tripUsers.map((u: any) => [u.id, u.email])) : {};
        setSentTrips(
          sentTrips.map((item: any) => ({
            ...item,
            sender_email: idToEmailTrips[item.sender_id] || '',
            user_email: idToEmailTrips[item.user_id] || '',
          }))
        );
      }

      // Enviados
      const { data: sent, error: errorSent } = await supabase
        .from('shared_points')
        .select('id, point:points(id, name, address, description, planned_visit_date, created_at, user_id), sender_id, user_id')
        .eq('sender_id', user.id);
      if (!errorSent && sent) {
        // Collect unique user IDs
        const userIds = [
          ...new Set([
            ...sent.map((sp: any) => sp.sender_id),
            ...sent.map((sp: any) => sp.user_id),
          ]),
        ];
        // Fetch emails from all_users view
        const { data: users, error: userError } = await supabase
          .from('all_users')
          .select('id, email')
          .in('id', userIds);
        if (userError) {
          console.error('Supabase fetch error (all_users for sent):', userError.message, userError.details);
        }
        const idToEmail = users ? Object.fromEntries(users.map((u: any) => [u.id, u.email])) : {};
        setSentPoints(
          sent.map((item: any) => ({
            ...item,
            sender_email: idToEmail[item.sender_id] || '',
            user_email: idToEmail[item.user_id] || '',
          }))
        );
      }
      setLoading(false);
    }
    fetchSharedPointsAndTrips();
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
      <h1 className="text-2xl font-bold mb-4">Compartilhamentos Recebidos e Enviados</h1>
      <div className="flex gap-4 mb-6 flex-wrap">
        <Button variant={tab === 'received' ? 'default' : 'outline'} onClick={() => setTab('received')}>Pontos Recebidos</Button>
        <Button variant={tab === 'sent' ? 'default' : 'outline'} onClick={() => setTab('sent')}>Pontos Enviados</Button>
        <Button variant={tab === 'trips' ? 'default' : 'outline'} onClick={() => setTab('trips')}>Viagens Recebidas</Button>
        <Button variant={tab === 'trips-sent' ? 'default' : 'outline'} onClick={() => setTab('trips-sent')}>Viagens Enviadas</Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          Carregando...
        </div>
      ) : (
        <>
          {tab === 'received' && (
            sharedPoints.length === 0 ? (
              <div className="text-center text-travel-dark/60 mt-10">Nenhum ponto recebido.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sharedPoints.map(sp => (
                  <Card key={sp.id} className="border border-travel-mustard">
                    <CardHeader>
                      <CardTitle>{sp.point ? sp.point.name : '(Ponto não encontrado)'}</CardTitle>
                      <CardDescription>Enviado por <UserIcon className="inline h-4 w-4 mb-1 mr-1" /> {sp.sender_email}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-2 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-travel-blue" />
                        <span>{sp.point ? sp.point.address : ''}</span>
                      </div>
                      <div className="mb-2 text-sm text-travel-dark/80">{sp.point ? sp.point.description : ''}</div>
                      {sp.point.planned_visit_date && (
                        <div className="flex items-center gap-2 text-xs text-travel-dark/60">
                          <Calendar className="h-4 w-4" />
                          Visita planejada: {sp.point && sp.point.planned_visit_date ? sp.point.planned_visit_date : ''}
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
          )}
          {tab === 'sent' && (
            sentPoints.length === 0 ? (
              <div className="text-center text-travel-dark/60 mt-10">Nenhum ponto enviado.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sentPoints.map(sp => (
                  <Card key={sp.id} className="border border-travel-mustard">
                    <CardHeader>
                      <CardTitle>{sp.point ? sp.point.name : '(Ponto não encontrado)'}</CardTitle>
                      <CardDescription>Enviado para <UserIcon className="inline h-4 w-4 mb-1 mr-1" /> {sp.user_email}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-2 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-travel-blue" />
                        <span>{sp.point ? sp.point.address : ''}</span>
                      </div>
                      <div className="mb-2 text-sm text-travel-dark/80">{sp.point ? sp.point.description : ''}</div>
                      {sp.point.planned_visit_date && (
                        <div className="flex items-center gap-2 text-xs text-travel-dark/60">
                          <Calendar className="h-4 w-4" />
                          Visita planejada: {sp.point && sp.point.planned_visit_date ? sp.point.planned_visit_date : ''}
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
          {tab === 'trips' && (
            sharedTrips.length === 0 ? (
              <div className="text-center text-travel-dark/60 mt-10">Nenhuma viagem recebida.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sharedTrips.map(st => (
                  <Card key={st.id} className="border border-travel-mustard">
                    <CardHeader>
                      <CardTitle>{st.trip?.nome || 'Viagem sem nome'}</CardTitle>
                      <CardDescription>Recebida de <UserIcon className="inline h-4 w-4 mb-1 mr-1" /> {st.sender?.email || 'Desconhecido'}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-2 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-travel-blue" />
                        <span>{st.trip?.local || '-'}</span>
                      </div>
                      <div className="mb-2 text-sm text-travel-dark/80">Data: {st.trip?.datain} até {st.trip?.dataout}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          )}
          {tab === 'trips-sent' && (
            sentTrips.length === 0 ? (
              <div className="text-center text-travel-dark/60 mt-10">Nenhuma viagem enviada.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sentTrips.map(st => (
                  <Card key={st.id} className="border border-travel-mustard">
                    <CardHeader>
                      <CardTitle>{st.trip?.nome || 'Viagem sem nome'}</CardTitle>
                      <CardDescription>Enviada para <UserIcon className="inline h-4 w-4 mb-1 mr-1" /> {st.user?.email || 'Desconhecido'}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-2 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-travel-blue" />
                        <span>{st.trip?.local || '-'}</span>
                      </div>
                      <div className="mb-2 text-sm text-travel-dark/80">Data: {st.trip?.datain} até {st.trip?.dataout}</div>
                    </CardContent>
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
