'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '@/services/api';

interface User {
  id: string;
  username: string;
  email: string;
  preferences: { theme: string; language: string; voice: boolean };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updatePreferences: (prefs: Partial<User['preferences']>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('cosmic_token');
    const storedUser = localStorage.getItem('cosmic_user');
    if (stored && storedUser) {
      setToken(stored);
      setUser(JSON.parse(storedUser));
      api.defaults.headers.common['Authorization'] = `Bearer ${stored}`;
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('cosmic_token', data.token);
    localStorage.setItem('cosmic_user', JSON.stringify(data.user));
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
  }, []);

  const register = useCallback(async (username: string, email: string, password: string) => {
    const { data } = await api.post('/auth/register', { username, email, password });
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('cosmic_token', data.token);
    localStorage.setItem('cosmic_user', JSON.stringify(data.user));
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('cosmic_token');
    localStorage.removeItem('cosmic_user');
    delete api.defaults.headers.common['Authorization'];
  }, []);

  const updatePreferences = useCallback(async (prefs: Partial<User['preferences']>) => {
    const { data } = await api.patch('/auth/preferences', prefs);
    setUser(prev => prev ? { ...prev, preferences: data.preferences } : prev);
    localStorage.setItem('cosmic_user', JSON.stringify({ ...user, preferences: data.preferences }));
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, updatePreferences }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
