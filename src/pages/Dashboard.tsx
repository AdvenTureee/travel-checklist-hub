
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';

const Dashboard = () => {
  const navigate = useNavigate();
  
  // Redirect to Points page for now
  useEffect(() => {
    navigate('/points');
  }, [navigate]);
  
  return <PageContainer>Loading...</PageContainer>;
};

export default Dashboard;
