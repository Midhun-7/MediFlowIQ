import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { AuthUser, LoginCredentials, UserRole } from '../types';
import { login as apiLogin } from '../services/api';

// ── Context shape ──────────────────────────────────────────────────────────

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isDoctor: boolean;
  isStaff: boolean;
  hasRole: (role: UserRole) => boolean;
  login: (creds: LoginCredentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Storage helpers ────────────────────────────────────────────────────────

const STORAGE_KEY = 'mediflowiq_auth';

const loadUser = (): AuthUser | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const user: AuthUser = JSON.parse(raw);
    // Check token not expired
    if (user.expiresAt && Date.now() > user.expiresAt) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return user;
  } catch {
    return null;
  }
};

// ── Provider ───────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadUser);

  const login = useCallback(async (creds: LoginCredentials) => {
    const data = await apiLogin(creds);
    const authUser: AuthUser = {
      username:     data.username,
      fullName:     data.fullName,
      role:         data.role,
      accessToken:  data.accessToken,
      refreshToken: data.refreshToken,
      expiresAt:    Date.now() + data.expiresIn * 1000,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
    setUser(authUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  const hasRole = useCallback(
    (role: UserRole) => user?.role === role,
    [user]
  );

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    isAdmin:         user?.role === 'ADMIN',
    isDoctor:        user?.role === 'DOCTOR',
    isStaff:         user?.role === 'STAFF',
    hasRole,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
