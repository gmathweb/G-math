import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { toast } from 'sonner';
import { BASE_URL } from '../api/client';

interface User {
  id: string;
  email: string;
  role: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

type AuthContextType = AuthState & AuthActions;

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = 'admin_token';

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function extractUser(token: string): User | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  return {
    id: String(payload.sub ?? payload.id ?? ''),
    email: String(payload.email ?? ''),
    role: String(payload.role ?? 'admin'),
  };
}

function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') return true;
  return Date.now() >= payload.exp * 1000;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored && !isTokenExpired(stored)) {
      setToken(stored);
      setUser(extractUser(stored));
    } else if (stored) {
      localStorage.removeItem(TOKEN_KEY);
    }
    setIsLoading(false);
  }, []);

  // Auto-logout timer based on token expiry
  useEffect(() => {
    if (!token) return;
    const payload = decodeJwtPayload(token);
    if (!payload || typeof payload.exp !== 'number') return;

    const msUntilExpiry = payload.exp * 1000 - Date.now();
    if (msUntilExpiry <= 0) return;

    const timer = setTimeout(() => {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUser(null);
      toast.error('פג תוקף ההתחברות, נא להתחבר מחדש');
      window.location.href = '/admin/login';
    }, msUntilExpiry);

    return () => clearTimeout(timer);
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail ?? 'שם משתמש או סיסמה שגויים');
    }

    const data = await res.json();
    const newToken: string = data.access_token ?? data.token;
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setUser(extractUser(newToken));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    window.location.href = '/admin/login';
  }, []);

  return (
    <AuthContext.Provider
      value={{ token, user, isAuthenticated: !!token, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
}
