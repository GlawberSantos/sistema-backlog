import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from './Layout'; // Importando o Layout

const PrivateRoute = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

export default PrivateRoute;
