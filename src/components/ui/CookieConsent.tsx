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
    // Aguarda o componente sumir visualmente antes de chamar onAccept (evita flicker)
    setTimeout(() => {
      onAccept();
    }, 300);
  };

  if (!visible) return null;

  return (
    <div
      style={{ position: 'fixed', bottom: 10, left: 0, right: 0, zIndex: 9999, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}
      className="transition-all duration-300"
    >
      <Card
        className="w-[95vw] max-w-xs sm:max-w-sm flex flex-col items-center p-2 sm:p-3 bg-white shadow-lg border border-travel-mustard pointer-events-auto"
        style={{ boxShadow: '0 2px 16px 0 rgba(0,0,0,0.10)' }}
      >
        <div className="mb-1 text-travel-dark text-xs sm:text-sm text-center leading-tight">
          Este site utiliza cookies para salvar seu login e preferências. Para continuar, aceite o uso de cookies.
        </div>
        <Button
          onClick={handleAccept}
          className="bg-travel-mustard mt-1 px-3 py-2 text-xs sm:text-sm rounded-md w-full"
          style={{ minHeight: 0, height: '2.1rem' }}
        >
          Aceitar e continuar
        </Button>
      </Card>
    </div>
  );
};
