import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api, { setAuthToken } from '../api/client';

const AuthContext = createContext(null);

const STORAGE_KEY = 'shortlink_token';
const USER_KEY = 'shortlink_user';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(USER_KEY);
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  const login = (newToken, newUser) => {
    localStorage.setItem(STORAGE_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      /* ignore */
    }
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    setAuthToken(null);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      login,
      logout,
    }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
