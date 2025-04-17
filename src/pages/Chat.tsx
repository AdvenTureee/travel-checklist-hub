import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import TripChatDialog from '@/components/chat/TripChatDialog';

interface Trip {
  id: string;
  nome: string;
  local: string;
}

interface TripShare {
  id: string;
  trip_id: string;
  inviter_id: string;
  invitee_id: string;
  status: string;
  trip: Trip;
  inviter: { email: string };
}

import { PageContainer } from '@/components/layout/PageContainer';

const Chat: React.FC = () => {
  // ...

  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [receivedInvites, setReceivedInvites] = useState<TripShare[]>([]);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Buscar viagens do usuário
  useEffect(() => {
    if (!user) return;
    supabase.from('trip')
      .select('id, nome, local')
      .eq('user_id', user.id)
      .then(({ data }) => setTrips(data || []));
  }, [user]);

  // Buscar convites recebidos (apenas pendentes)
  useEffect(() => {
    if (!user) return;
    async function fetchReceived() {
      const { data, error } = await supabase
        .from('trip_shares')
        .select('id, trip_id, inviter_id, invitee_id, status, trip(id, nome, local)')
        .eq('invitee_id', user.id)
        .eq('status', 'pending');
      if (error) {
        setReceivedInvites([]);
        setMessage('Erro ao buscar convites: ' + error.message);
        return;
      }
      // Buscar emails dos remetentes
      const inviterIds = [...new Set((data || []).map((d: any) => d.inviter_id))];
      let inviterEmails: Record<string, string> = {};
      if (inviterIds.length > 0) {
        const { data: users } = await supabase.from('all_users').select('id, email').in('id', inviterIds);
        inviterEmails = Object.fromEntries((users || []).map((u: any) => [u.id, u.email]));
      }
      setReceivedInvites(
        (data || []).map((invite: any) => ({ ...invite, inviter: { email: inviterEmails[invite.inviter_id] || '' } }))
      );
    }
    fetchReceived();
  }, [user, acceptingId]);

  // Enviar convite
  const handleSendInvite = async () => {
    setSending(true);
    setMessage(null);
    try {
      if (!inviteEmail) {
        setMessage('Digite o email do usuário.');
        setSending(false);
        return;
      }
      if (!selectedTripId) {
        setMessage('Selecione uma viagem.');
        setSending(false);
        return;
      }
      // Buscar usuário pelo email
      const { data: users, error: userErr } = await supabase.from('all_users').select('id').eq('email', inviteEmail);
      if (userErr || !users || users.length === 0) {
        setMessage('Usuário não encontrado.');
        setSending(false);
        return;
      }
      const inviteeId = users[0].id;
      // Verificar se já existe convite pendente
      const { data: existing } = await supabase.from('trip_shares')
        .select('id')
        .eq('trip_id', selectedTripId)
        .eq('invitee_id', inviteeId)
        .eq('status', 'pending');
      if (existing && existing.length > 0) {
        setMessage('Já existe um convite pendente para este usuário nesta viagem.');
        setSending(false);
        return;
      }
      // Inserir convite
      const { error } = await supabase.from('trip_shares').insert({
        trip_id: selectedTripId,
        inviter_id: user.id,
        invitee_id: inviteeId,
        status: 'pending',
      });
      if (error) {
        setMessage('Erro ao enviar convite: ' + error.message);
      } else {
        setMessage('Convite enviado!');
        setInviteEmail('');
      }
    } catch (err: any) {
      setMessage('Erro inesperado: ' + (err?.message || err));
    }
    setSending(false);
  };

  // Aceitar convite
  const handleAcceptInvite = async (inviteId: string) => {
    setAcceptingId(inviteId);
    setMessage(null);
    const { error } = await supabase.from('trip_shares').update({ status: 'accepted' }).eq('id', inviteId);
    if (error) {
      setMessage('Erro ao aceitar convite: ' + error.message);
    } else {
      setMessage('Convite aceito! Agora você pode conversar sobre esta viagem.');
    }
    setAcceptingId(null);
  };

  // Buscar viagens compartilhadas já aceitas
  const [sharedTrips, setSharedTrips] = useState<any[]>([]);
  const [openChatTripId, setOpenChatTripId] = useState<string | null>(null);
  const [openChatOtherUserId, setOpenChatOtherUserId] = useState<string | null>(null);
  useEffect(() => {
    if (!user) return;
    async function fetchShared() {
      // O usuário pode ser o convidado OU o convidador
      const { data, error } = await supabase
        .from('trip_shares')
        .select('id, trip_id, inviter_id, invitee_id, status, trip(id, nome, local)')
        .or(`inviter_id.eq.${user.id},invitee_id.eq.${user.id}`)
        .eq('status', 'accepted');
      if (error) {
        setSharedTrips([]);
        return;
      }
      setSharedTrips(data || []);
    }
    fetchShared();
  }, [user, acceptingId]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 mt-16">
      <h1 className="text-2xl font-bold mb-4">Chat & Compartilhamento de Viagens</h1>
      <div className="w-full max-w-xl bg-white rounded-xl shadow p-6 flex flex-col gap-6">
        <div>
          <h2 className="font-semibold mb-2">Minhas viagens</h2>
          {trips.length === 0 && <div className="text-gray-500">Nenhuma viagem cadastrada.</div>}
          <ul className="divide-y">
            {trips.map(trip => (
              <li key={trip.id} className="py-1 flex items-center justify-between">
                <span>{trip.nome} - {trip.local}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-semibold mb-2">Viagens compartilhadas já aceitas</h2>
          {sharedTrips.length === 0 && <div className="text-gray-500">Nenhuma viagem compartilhada aceita.</div>}
          <ul className="divide-y">
            {sharedTrips.map(tripShare => {
              // Descobrir o outro usuário
              const otherUserId = tripShare.inviter_id === user.id ? tripShare.invitee_id : tripShare.inviter_id;
              return (
                <li key={tripShare.id} className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-bold">{tripShare.trip?.nome}</span> - {tripShare.trip?.local}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-travel-blue/90 hover:bg-travel-blue"
                      onClick={() => {
                        setOpenChatTripId(tripShare.trip_id);
                        setOpenChatOtherUserId(otherUserId);
                      }}
                    >
                      Abrir chat
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-travel-blue text-travel-blue group-hover:bg-travel-blue/10"
                      onClick={() => window.location.href = `/points?tripId=${tripShare.trip_id}`}
                    >
                      Ver viagem
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        <div>
          <h2 className="font-semibold mb-2">Convidar usuário para viagem</h2>
          <div className="flex flex-col sm:flex-row gap-2 items-center">
            <Select value={selectedTripId ?? ''} onValueChange={setSelectedTripId}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Selecione a viagem" />
              </SelectTrigger>
              <SelectContent>
                {trips.map(trip => (
                  <SelectItem key={trip.id} value={trip.id}>{trip.nome} - {trip.local}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="email"
              placeholder="Email do usuário"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              className="w-64"
              disabled={sending}
            />
            <Button onClick={handleSendInvite} disabled={sending || !selectedTripId || !inviteEmail}>
              {sending ? 'Enviando...' : 'Enviar convite'}
            </Button>
          </div>
        </div>
        <div>
          <h2 className="font-semibold mb-2">Convites recebidos</h2>
          {receivedInvites.length === 0 && <div className="text-gray-500">Nenhum convite recebido.</div>}
          <ul className="divide-y">
            {receivedInvites.map(invite => (
              <li key={invite.id} className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-bold">{invite.trip?.nome}</span> - {invite.trip?.local}<br />
                  <span className="text-xs text-gray-500">Enviado por: {invite.inviter?.email}</span>
                </div>
                <Button
                  size="sm"
                  className="bg-travel-green/90 hover:bg-travel-green"
                  disabled={acceptingId === invite.id}
                  onClick={() => handleAcceptInvite(invite.id)}
                >
                  {acceptingId === invite.id ? 'Aceitando...' : 'Aceitar'}
                </Button>
              </li>
            ))}
          </ul>
        </div>
        {message && <div className="text-center text-travel-blue font-semibold mt-2">{message}</div>}
      </div>
      {/* Dialog de chat */}
      {openChatTripId && openChatOtherUserId && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40">
          <div className="bg-white rounded-xl shadow-lg p-4 w-full max-w-lg relative">
            <Button className="absolute top-2 right-2" size="sm" onClick={() => { setOpenChatTripId(null); setOpenChatOtherUserId(null); }}>Fechar</Button>
            <TripChatDialog open={true} onOpenChange={() => { setOpenChatTripId(null); setOpenChatOtherUserId(null); }} tripId={openChatTripId} otherUserId={openChatOtherUserId} />
          </div>
        </div>
      )}
    </div>
  );
};


export default Chat;


