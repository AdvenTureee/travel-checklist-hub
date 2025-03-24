
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '@/components/auth/LoginForm';

const Index = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/points');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-travel-beige p-4">
      <div className="w-full max-w-md mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2 text-travel-dark">Travel Checklist Hub</h1>
        <p className="text-travel-dark/80">Plan, organize, and enjoy your trips</p>
      </div>
      <LoginForm />
    </div>
  );
};

export default Index;
