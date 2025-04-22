import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const EmailConfirmed: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <h1 className="text-2xl font-bold text-travel-blue mb-4">Email confirmado com sucesso!</h1>
      <p className="mb-6 text-travel-dark text-center max-w-md">Agora você já pode fazer login na sua conta.</p>
      <Button onClick={() => navigate('/auth/login')} className="bg-travel-mustard text-travel-dark">
        Fazer login
      </Button>
    </div>
  );
};

export default EmailConfirmed;
