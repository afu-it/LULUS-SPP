'use client';

import { createContext, useCallback, useEffect, useMemo, useState } from 'react';

interface AuthActionResult {
  ok: boolean;
  error?: string;
}

interface AuthContextValue {
  isLoading: boolean;
  isAdmin: boolean;
  adminUsername: string | null;
  login: (username: string, password: string) => Promise<AuthActionResult>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

interface AuthResponse {
  authenticated?: boolean;
  username?: string;
  error?: string;
}

async function readAuthError(response: Response) {
  try {
    const payload = (await response.json()) as AuthResponse;
    return payload.error ?? 'Authentication request failed.';
  } catch {
    return 'Authentication request failed.';
  }
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUsername, setAdminUsername] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      if (!response.ok) {
        setIsAdmin(false);
        setAdminUsername(null);
        return;
      }

      const data = (await response.json()) as AuthResponse;
      setIsAdmin(Boolean(data.authenticated));
      setAdminUsername(data.username ?? null);
    } catch {
      setIsAdmin(false);
      setAdminUsername(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const error = await readAuthError(response);
        setIsAdmin(false);
        setAdminUsername(null);
        return { ok: false, error } as AuthActionResult;
      }

      const data = (await response.json()) as AuthResponse;

      setIsAdmin(Boolean(data.authenticated));
      setAdminUsername(data.username ?? username);

      return { ok: true };
    } catch {
      setIsAdmin(false);
      setAdminUsername(null);
      return {
        ok: false,
        error: 'Unable to reach auth endpoint.',
      } as AuthActionResult;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);

    try {
      await fetch('/api/auth', {
        method: 'DELETE',
        credentials: 'include',
      });
    } finally {
      setIsAdmin(false);
      setAdminUsername(null);
      setIsLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      isLoading,
      isAdmin,
      adminUsername,
      login,
      logout,
      refresh,
    }),
    [adminUsername, isAdmin, isLoading, login, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
