import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface TripChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  otherUserId: string;
}

interface Message {
  id: string;
  sender_id: string;
  message: string;
  sent_at: string;
}

const TripChatDialog: React.FC<TripChatDialogProps> = ({ open, onOpenChange, tripId, otherUserId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = (window as any).useAuth ? (window as any).useAuth() : { user: null };

  // Fetch or create chat room
  useEffect(() => {
    if (!open || !user) return;
    let subscription: any;
    const fetchChatAndMessages = async () => {
      // Buscar chat pelo trip_id
      const { data: chatArr, error: chatError } = await supabase
        .from('trip_chats' as any)
        .select('id')
        .eq('trip_id', tripId);

      let chat: any = null;
      if (chatError) {
        // trate o erro (exemplo: mostrar toast ou retornar)
        return;
      }
      if (Array.isArray(chatArr) && chatArr.length > 0 && typeof chatArr[0]?.id === 'string') {
        chat = chatArr[0];
      }

      if (!chat) {
        // Criar chat
        const { data: newChatArr, error: newChatError } = await supabase
          .from('trip_chats' as any)
          .insert([{ trip_id: tripId }])
          .select('id');
        if (Array.isArray(newChatArr) && newChatArr.length > 0 && typeof newChatArr[0]?.id === 'string') {
          chat = newChatArr[0];
        }
      }

      // Garantir que o usuário está como participante
      if (chat && typeof chat.id === 'string') {
        await supabase
          .from('trip_chat_participants' as any)
          .upsert([{ chat_id: chat.id, user_id: user.id }], { onConflict: 'chat_id,user_id' });
        setChatId(chat.id);

        // Buscar mensagens
        const { data: msgs } = await supabase
          .from('trip_chat_messages' as any)
          .select('*')
          .eq('chat_id', chat.id)
          .order('sent_at', { ascending: true });
        setMessages((Array.isArray(msgs) ? msgs : []).map(({id, sender_id, message, sent_at}: any) => ({id, sender_id, message, sent_at})));

        // Subscribe para novas mensagens
        subscription = supabase
          .channel('trip_chat_messages')
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'trip_chat_messages', filter: `chat_id=eq.${chat.id}` },
            (payload: any) => {
              setMessages(prev => [...prev, (({id, sender_id, message, sent_at}) => ({id, sender_id, message, sent_at}))(payload.new)]);
            }
          )
          .subscribe();
      }
    };
    fetchChatAndMessages();
    return () => {
      if (subscription) supabase.removeChannel(subscription);
    };
  }, [open, tripId, otherUserId, user]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;
    setLoading(true);
    if (!chatId) {
      console.error('chatId indefinido ao tentar enviar mensagem');
      setLoading(false);
      return;
    }
    console.log('Enviando mensagem:', { chat_id: chatId, sender_id: user.id, message: newMessage });
    const { error, data } = await supabase.from('trip_chat_messages').insert([
      { chat_id: chatId, sender_id: user.id, message: newMessage }
    ]);
    if (error) {
      console.error('Erro ao enviar mensagem:', error);
    } else {
      console.log('Mensagem enviada com sucesso:', data);
    }
    setNewMessage('');
    setLoading(false);
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-end justify-end ${open ? '' : 'pointer-events-none'}`}>
      <div className="bg-white shadow-lg rounded-t-lg w-full max-w-md p-4 m-4 border border-travel-mustard">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-bold">Chat da Viagem</h3>
          <Button size="sm" variant="ghost" onClick={() => onOpenChange(false)}>Fechar</Button>
        </div>
        <div className="overflow-y-auto h-64 mb-2 bg-gray-50 p-2 rounded">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`mb-2 flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`p-2 rounded-lg ${msg.sender_id === user?.id ? 'bg-travel-mustard text-travel-dark' : 'bg-gray-200'}`}>
                {msg.message}
                <div className="text-xs text-gray-500 mt-1 text-right">{new Date(msg.sent_at).toLocaleTimeString()}</div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
            placeholder="Digite sua mensagem..."
            disabled={loading}
          />
          <Button onClick={sendMessage} disabled={loading || !newMessage.trim()}>
            Enviar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TripChatDialog;
