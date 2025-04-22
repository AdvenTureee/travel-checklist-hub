import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/auth/reset',
    });
    setLoading(false);
    if (error) {
      setError(error.message || 'Erro ao enviar e-mail.');
    } else {
      setSuccess(true);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="flex flex-col items-center gap-2 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-travel-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0-1.104-.896-2-2-2s-2 .896-2 2 .896 2 2 2 2-.896 2-2zm0 0c0 1.104.896 2 2 2s2-.896 2-2-.896-2-2-2-2 .896-2 2zm0 0v2m0 4h.01" /></svg>
        <h1 className="text-2xl font-bold text-travel-blue">Recuperar senha</h1>
      </div>
      <div className="text-travel-dark/80 text-center mb-4 max-w-md">
        Informe o e-mail da sua conta e enviaremos um link para você redefinir sua senha.
      </div>
      <form onSubmit={handleForgot} className="w-full max-w-md bg-white rounded-lg shadow p-6 flex flex-col gap-4">
        <Input
          type="email"
          placeholder="Seu e-mail"
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="email"
        />
        {error && (
          <div className="text-red-700 bg-red-100 rounded p-3 text-center flex items-center gap-2 justify-center">
            <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' /></svg>
            {error}
          </div>
        )}
        {success && (
          <div className="text-green-700 bg-green-100 rounded p-4 text-center flex flex-col items-center">
            <svg xmlns='http://www.w3.org/2000/svg' className='h-7 w-7 mb-1' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' /></svg>
            <span>Enviamos um e-mail com instruções para redefinir sua senha.</span>
            <span className="text-xs text-travel-dark/60 mt-1">Verifique sua caixa de entrada e também o spam!</span>
          </div>
        )}
        <Button type="submit" className="bg-travel-mustard text-travel-dark mt-2" disabled={loading}>
          {loading ? 'Enviando...' : 'Enviar e-mail de redefinição'}
        </Button>
        <div className="text-sm text-center mt-2">
          <span onClick={() => navigate('/auth/login')} className="text-travel-blue hover:underline cursor-pointer">Voltar para login</span>
        </div>
      </form>
    </div>
  );
};

export default ForgotPassword;
