import React, { createContext, useContext, useEffect, useState } from 'react';
import { getToken, setToken, removeToken, validateToken, type User } from '~/utils/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (token && validateToken(token)) {
      // In a real app, you might want to fetch user data from the token
      // For now, we'll just mark as authenticated
      // You could decode the JWT to get user info
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ 
          _id: payload.id, 
          username: '', // You might want to store this in the token
          email: '' 
        });
      } catch {
        removeToken();
      }
    }
    setIsLoading(false);
  }, []);

  const login = (token: string, userData: User) => {
    setToken(token);
    setUser(userData);
  };

  const logout = () => {
    removeToken();
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 