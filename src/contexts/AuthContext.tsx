import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../api/services';
import { authApi } from '../api/services';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (u: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi.me().then((res) => setUser(res.data)).catch(() => setUser(null)).finally(() => setLoading(false));
    
    const handleAuthError = () => setUser(null);
    window.addEventListener('auth-error', handleAuthError);
    return () => window.removeEventListener('auth-error', handleAuthError);
  }, []);

  const login = (u: User) => setUser(u);
  const logout = async () => { await authApi.logout(); setUser(null); };

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);