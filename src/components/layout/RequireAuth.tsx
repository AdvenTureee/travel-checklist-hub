
import { useAuth } from '@/components/auth/AuthProvider';
import { Navigate } from 'react-router-dom';
import React from 'react';

interface RequireAuthProps {
  children: React.ReactNode;
}

const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-travel-mustard"></div>
    </div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

export default RequireAuth;
