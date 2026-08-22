import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('gt_token'));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('gt_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function verify() {
      if (token) {
        try {
          const { user: freshUser } = await api.me(token);
          if (!cancelled) setUser(freshUser);
        } catch {
          if (!cancelled) {
            setToken(null);
            setUser(null);
            localStorage.removeItem('gt_token');
            localStorage.removeItem('gt_user');
          }
        }
      }
      if (!cancelled) setReady(true);
    }
    verify();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (email, password) => {
    const { token: t, user: u } = await api.login({ email, password });
    localStorage.setItem('gt_token', t);
    localStorage.setItem('gt_user', JSON.stringify(u));
    setToken(t);
    setUser(u);
  }, []);

  const register = useCallback(async (name, email, password) => {
    const { token: t, user: u } = await api.register({ name, email, password });
    localStorage.setItem('gt_token', t);
    localStorage.setItem('gt_user', JSON.stringify(u));
    setToken(t);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('gt_token');
    localStorage.removeItem('gt_user');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, ready, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
