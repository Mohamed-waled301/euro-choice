import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, setAccessToken, getAccessToken } from '../lib/api';
import { AuthUser, LoginRequest } from '@eurochoice/shared';
import { isDemoMode, mockLogin, getMockUser } from '../lib/demoMode';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    try {
      if (isDemoMode()) {
        const token = getAccessToken();
        if (token) {
          const storedUser = localStorage.getItem('ec_demo_user');
          if (storedUser) {
            try {
              setUser(JSON.parse(storedUser));
            } catch {
              setUser(getMockUser());
            }
          } else {
            setUser(getMockUser());
          }
        }
        return;
      }

      const token = getAccessToken();
      if (!token) {
        // Attempt refresh
        const refreshRes = await api.post('/auth/refresh');
        setAccessToken(refreshRes.accessToken);
        setUser(refreshRes.user);
        return;
      }
      const data = await api.get('/auth/me');
      setUser(data.user);
    } catch {
      setAccessToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();

    const handleLogoutEvent = () => {
      setUser(null);
    };
    window.addEventListener('auth:logout', handleLogoutEvent);
    return () => window.removeEventListener('auth:logout', handleLogoutEvent);
  }, [fetchCurrentUser]);

  const login = async (credentials: LoginRequest) => {
    if (isDemoMode()) {
      const res = await mockLogin(credentials);
      setAccessToken(res.accessToken);
      setUser(res.user);
      return;
    }

    const res = await api.post('/auth/login', credentials);
    setAccessToken(res.accessToken);
    setUser(res.user);
  };

  const logout = async () => {
    try {
      if (isDemoMode()) {
        localStorage.removeItem('ec_demo_user');
        localStorage.removeItem('ec_demo_email');
      } else {
        await api.post('/auth/logout');
      }
    } catch {
      // ignore
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!user) return false;
      // Admin has all permissions or check explicit array
      return user.permissions.includes(permission) || user.role?.name === 'Admin';
    },
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
