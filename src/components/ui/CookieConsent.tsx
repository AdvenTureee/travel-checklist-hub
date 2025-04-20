import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface CookieConsentProps {
  onAccept: () => void;
}

export const CookieConsent: React.FC<CookieConsentProps> = ({ onAccept }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) setVisible(true);
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'true');
    setVisible(false);
    onAccept();
  };

  if (!visible) return null;

  return (
    <div style={{ position: 'fixed', bottom: 20, left: 0, right: 0, zIndex: 9999, display: 'flex', justifyContent: 'center' }}>
      <Card className="max-w-md w-full flex flex-col items-center p-4 bg-white shadow-lg border border-travel-mustard">
        <div className="mb-2 text-travel-dark text-sm text-center">
          Este site utiliza cookies para salvar seu login e preferências. Para continuar, aceite o uso de cookies.
        </div>
        <Button onClick={handleAccept} className="bg-travel-mustard mt-2">Aceitar e continuar</Button>
      </Card>
    </div>
  );
};
