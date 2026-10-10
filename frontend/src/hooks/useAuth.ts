import { useState, useCallback } from 'react';
import { apiClient } from '../api/client';

const TOKEN_KEY = 'gmath_admin_token';

export function useAuth() {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem(TOKEN_KEY),
  );

  const isAuthenticated = !!token;

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiClient<{ access_token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem(TOKEN_KEY, data.access_token);
    setToken(data.access_token);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }, []);

  return { token, isAuthenticated, login, logout };
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
