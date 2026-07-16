import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/api';
import { authApi } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!token && !!user;

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, [token]);

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    const { token: newToken, refreshToken, user: userData } = response.data.data;
    
    localStorage.setItem('token', newToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(userData));
    
    setToken(newToken);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout API errors
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    // Redirect to login page after logout
    window.location.href = '/kelola/login';
  };

  const refreshUser = async () => {
    try {
      const response = await authApi.me();
      const userData = response.data.data;
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch {
      logout();
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
