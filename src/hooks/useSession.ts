// src/hooks/useSession.ts
import { useState, useEffect, useCallback, useRef } from "react";
import { login as doLogin } from "../lib/blockchain/kross/login";
import {
  getStoredToken,
  getStoredAddress,
  validateSession,
  revokeSession,
  clearSession,
} from "../lib/blockchain/kross/session";

interface SessionState {
  address: string | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

const REVALIDATE_INTERVAL_MS = 60_000;

export function useSession() {
  const [state, setState] = useState<SessionState>({
    address: getStoredAddress(),
    isConnected: false,
    isLoading: true,
    error: null,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Validate the stored token on load and on a polling interval.
  const checkSession = useCallback(async (force = false) => {
    const token = getStoredToken();
    if (!token) {
      setState({ address: null, isConnected: false, isLoading: false, error: null });
      return;
    }
    const result = await validateSession(token, { force });
    if (result.valid && result.address) {
      setState({
        address: result.address,
        isConnected: true,
        isLoading: false,
        error: null,
      });
    } else {
      clearSession();
      setState({ address: null, isConnected: false, isLoading: false, error: null });
    }
  }, []);

  useEffect(() => {
    checkSession(true);

    // Poll for revocation/expiry; clean up on unmount to avoid leaks.
    intervalRef.current = setInterval(() => {
      checkSession(false);
    }, REVALIDATE_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [checkSession]);

  const login = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const { address } = await doLogin();
      setState({ address, isConnected: true, isLoading: false, error: null });
    } catch (e) {
      setState({
        address: null,
        isConnected: false,
        isLoading: false,
        error: e instanceof Error ? e.message : "Login failed",
      });
    }
  }, []);

  const logout = useCallback(async () => {
    const token = getStoredToken();
    if (token) await revokeSession(token);
    clearSession();
    setState({ address: null, isConnected: false, isLoading: false, error: null });
  }, []);

  return { ...state, login, logout, refresh: () => checkSession(true) };
}
