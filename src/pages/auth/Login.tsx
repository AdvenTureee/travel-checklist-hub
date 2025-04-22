import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message || 'Erro ao fazer login.');
    } else {
      navigate('/');
    }
  };

  // Função para login social
  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin + '/points' } });
    setLoading(false);
    if (error) setError(error.message || 'Erro ao entrar com ' + provider);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <h1 className="text-2xl font-bold text-travel-blue mb-4">Entrar</h1>
      <div className="w-full max-w-md bg-white rounded-lg shadow p-6 flex flex-col gap-4 mb-4">
        <button
          type="button"
          className="flex items-center justify-center gap-2 w-full py-2 px-4 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 shadow-sm text-base font-medium text-gray-700 transition"
          onClick={() => handleSocialLogin('google')}
          disabled={loading}
        >
          <svg className="w-5 h-5" viewBox="0 0 48 48"><g><path fill="#4285F4" d="M24 9.5c3.54 0 6.72 1.22 9.22 3.62l6.9-6.9C35.64 2.63 30.24 0 24 0 14.84 0 6.71 5.82 2.69 14.13l8.18 6.35C12.7 13.13 17.91 9.5 24 9.5z"/><path fill="#34A853" d="M46.1 24.6c0-1.67-.15-3.26-.43-4.8H24v9.1h12.43c-.54 2.9-2.16 5.36-4.6 7.05l7.07 5.51C43.94 37.12 46.1 31.3 46.1 24.6z"/><path fill="#FBBC05" d="M10.87 28.48A14.49 14.49 0 019.5 24c0-1.56.27-3.07.74-4.48l-8.18-6.35A23.97 23.97 0 000 24c0 3.91.94 7.62 2.56 10.92l8.31-6.44z"/><path fill="#EA4335" d="M24 48c6.24 0 11.48-2.07 15.3-5.63l-7.07-5.51c-2 1.35-4.55 2.14-8.23 2.14-6.09 0-11.3-3.63-13.13-8.7l-8.31 6.44C6.71 42.18 14.84 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></g></svg>
          Entrar com Google
        </button>
        <button
          type="button"
          className="flex items-center justify-center gap-2 w-full py-2 px-4 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 shadow-sm text-base font-medium text-gray-700 transition"
          onClick={() => handleSocialLogin('facebook')}
          disabled={loading}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#1877F3" d="M22.675 0h-21.35C.595 0 0 .592 0 1.326v21.348C0 23.408.595 24 1.325 24h11.495v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.797.143v3.24l-1.918.001c-1.504 0-1.797.715-1.797 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.325-.592 1.325-1.326V1.326C24 .592 23.405 0 22.675 0"/></svg>
          Entrar com Facebook
        </button>
        <div className="flex items-center gap-2 my-2">
          <span className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">ou</span>
          <span className="flex-1 h-px bg-gray-200" />
        </div>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <Input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
          />
          <Input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          {error && <div className="text-red-600 text-sm text-center">{error}</div>}
          <Button type="submit" className="bg-travel-mustard text-travel-dark mt-2" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
          <div className="text-sm text-center mt-2">
            <Link to="/auth/forgot" className="text-travel-blue hover:underline">Esqueci a senha</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
