import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import TripChatDialog from './TripChatDialog';

interface TripChatButtonProps {
  tripId: string;
  otherUserId: string;
}

const TripChatButton: React.FC<TripChatButtonProps> = ({ tripId, otherUserId }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className="fixed bottom-6 right-6 z-50 bg-travel-mustard text-travel-dark rounded-full p-4 shadow-lg hover:bg-travel-mustard/80 focus:outline-none"
        onClick={() => setOpen(true)}
        title="Abrir chat da viagem"
      >
        <MessageCircle size={28} />
      </button>
      <TripChatDialog
        open={open}
        onOpenChange={setOpen}
        tripId={tripId}
        otherUserId={otherUserId}
      />
    </>
  );
};

export default TripChatButton;
