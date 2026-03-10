import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { fetchCurrentUser } from '../api/users';

const STORAGE_KEY = 'techforce_user';

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  /** Multiple roles; may be absent for legacy stored users (treat as single role). */
  roles?: string[];
  /** @deprecated Use roles; kept for backward compat with stored auth. */
  role?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    if (!parsed || typeof parsed.id !== 'number' || !parsed.username) return null;
    // Normalize: ensure roles array for consumers (migrate legacy role)
    if (!Array.isArray(parsed.roles) || parsed.roles.length === 0) {
      if (parsed.role) parsed.roles = [parsed.role];
      else parsed.roles = ['sales'];
    }
    return parsed;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadStoredUser);

  // Sync roles (and profile) from server on load so sidebar/Employees reflect DB (e.g. after migration or admin grant)
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    fetchCurrentUser(user.id)
      .then((fresh) => {
        if (cancelled) return;
        setUser((prev) => {
          if (!prev) return null;
          const next = { ...prev, roles: fresh.roles, username: fresh.username, email: fresh.email };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          return next;
        });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user?.id]);

  const login = useCallback((u: AuthUser) => {
    setUser(u);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const updateUser = useCallback((updates: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return null;
      const next = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
