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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = (window as any).useAuth ? (window as any).useAuth() : { user: null };

  // Fetch or create chat room
  useEffect(() => {
    if (!open || !user) return;
    let chatId: string;
    let subscription: any;
    const fetchChatAndMessages = async () => {
      // Find or create chat room
      let { data: chat, error } = await supabase
        .from('trip_chats')
        .select('id')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq('trip_id', tripId)
        .maybeSingle();
      if (!chat) {
        // Create chat
        const { data: newChat } = await supabase
          .from('trip_chats')
          .insert([
            { trip_id: tripId, user1_id: user.id, user2_id: otherUserId }
          ])
          .select('id')
          .single();
        chat = newChat;
      }
      chatId = chat.id;
      // Fetch messages
      const { data: msgs } = await supabase
        .from('trip_chat_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('sent_at', { ascending: true });
      setMessages(msgs || []);
      // Subscribe to new messages
      subscription = supabase
        .channel('trip_chat_messages')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'trip_chat_messages', filter: `chat_id=eq.${chatId}` },
          payload => {
            setMessages(prev => [...prev, payload.new]);
          }
        )
        .subscribe();
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
    await supabase.from('trip_chat_messages').insert([
      { chat_id: messages[0]?.chat_id, sender_id: user.id, message: newMessage }
    ]);
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
