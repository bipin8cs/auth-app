import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/api';

interface Role {
  id: string;
  name: string;
  description: string;
  permissions?: Permission[];
}

interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  provider: string;
  isActive: boolean;
  department: string;
  location: string;
  roles: Role[];
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
  isManager: boolean;
  hasRole: (role: string) => boolean;
  hasPermission: (resource: string, action: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      const res = await authApi.me();
      setUser(res.data.user);
    } catch {
      setUser(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    localStorage.setItem('accessToken', res.data.accessToken);
    localStorage.setItem('refreshToken', res.data.refreshToken);
    setUser(res.data.user);
  };

  const register = async (email: string, password: string, firstName?: string, lastName?: string) => {
    const res = await authApi.register({ email, password, firstName, lastName });
    localStorage.setItem('accessToken', res.data.accessToken);
    localStorage.setItem('refreshToken', res.data.refreshToken);
    setUser(res.data.user);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  const isAdmin = user?.roles?.some((r) => r.name === 'admin') ?? false;
  const isManager = user?.roles?.some((r) => r.name === 'manager') ?? false;

  const hasRole = (role: string) => user?.roles?.some((r) => r.name === role) ?? false;

  const hasPermission = (resource: string, action: string) => {
    if (!user?.roles) return false;
    return user.roles.some((role) =>
      role.permissions?.some(
        (p) =>
          (p.resource === resource || p.resource === '*') &&
          (p.action === action || p.action === 'manage')
      )
    );
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refreshUser, isAdmin, isManager, hasRole, hasPermission }}
    >
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
