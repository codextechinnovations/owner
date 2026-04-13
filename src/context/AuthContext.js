import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pgs, setPgs] = useState([]);
  const [selectedPg, setSelectedPg] = useState(null);

  useEffect(() => {
    const initAuth = () => {
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        const storedPgs = localStorage.getItem('pgs');
        if (storedPgs) {
          const parsedPgs = JSON.parse(storedPgs);
          setPgs(parsedPgs);
          const storedPgId = localStorage.getItem('pg_id');
          const sel = parsedPgs.find(p => p._id === storedPgId) || parsedPgs[0];
          setSelectedPg(sel);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (phone, password) => {
    const response = await authService.login(phone, password);
    if (response.accessToken) {
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('owner', JSON.stringify(response.owner));
      localStorage.setItem('pgs', JSON.stringify(response.pgs));
      if (response.pgs?.length > 0) {
        localStorage.setItem('pg_id', response.pgs[0]._id);
        setSelectedPg(response.pgs[0]);
      }
      setUser(response.owner);
      setPgs(response.pgs);
      return true;
    }
    return false;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setPgs([]);
    setSelectedPg(null);
  };

  const selectPg = (pg) => {
    setSelectedPg(pg);
    localStorage.setItem('pg_id', pg._id);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAuthenticated: !!user,
      login,
      logout,
      pgs,
      selectedPg,
      selectPg,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
