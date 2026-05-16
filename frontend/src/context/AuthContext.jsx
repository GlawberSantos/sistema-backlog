import React, { createContext, useState, useEffect, useContext } from 'react';
import { login as apiLogin } from '../services/apiService';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserFromStorage = () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('usuario');
      if (token && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          api.defaults.headers.Authorization = `Bearer ${token}`;
          setUser(parsedUser);
        } catch (error) {
          console.error("Falha ao parsear usuário do localStorage", error);
          logout();
        }
      }
      setLoading(false);
    };
    loadUserFromStorage();
  }, []);

  const login = async (email, password) => {
    try {
      const data = await apiLogin(email, password);
      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));
      api.defaults.headers.Authorization = `Bearer ${data.token}`;
      setUser(data.usuario);
      return data.usuario;
    } catch (error) {
      console.error('Falha no login', error);
      logout();
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    delete api.defaults.headers.Authorization;
  };

  const authContextValue = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
