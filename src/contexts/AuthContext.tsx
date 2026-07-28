import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../api/services';
import { authApi } from '../api/services';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (u: User) => void;
  logout: () => void;
  isOwner: boolean;
  isMember: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const isOwner = user?.role === 'owner';
  const isMember = user?.role === 'member';

  useEffect(() => {
    authApi.me().then((res) => setUser(res.data)).catch(() => setUser(null)).finally(() => setLoading(false));
    
    const handleAuthError = () => setUser(null);
    window.addEventListener('auth-error', handleAuthError);
    return () => window.removeEventListener('auth-error', handleAuthError);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      authApi.me()
        .then((res) => {
          setUser(res.data);
        })
        .catch(() => {
          setUser(null);
        })
        .finally(() => {
          setLoading(false);
        });
    }, 500);
  
    return () => clearTimeout(timer);
  }, []);
  const handleAuthError = () => {
    console.log("AUTH ERROR EVENT");
    setUser(null);
  };
  console.log(handleAuthError.toString())
  const login = (u: User) => setUser(u);
  const logout = async () => { await authApi.logout(); setUser(null); };

  return <AuthContext.Provider value={
    { user, 
      loading, 
      login, 
      logout, 
      isOwner,
    isMember 
  }
  }>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);