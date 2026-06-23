// src/lib/blockchain/kross/useSession.ts
import { useEffect, useState, useCallback } from "react";
import {
  subscribe,
  getState,
  isUnlocked,
  unlock as unlockSession,
  lock as lockSession,
  hasStoredWallet,
  type SessionState,
} from "./session";

export interface UseSession extends SessionState {
  unlock: (password: string) => Promise<boolean>;
  lock: () => void;
  isUnlocked: boolean;
  hasWallet: boolean;
  // Compatibility fields used by wallet components.
  unlocked: boolean;
  busy: boolean;
  error: string | null;
}

export function useSession(): UseSession {
  const [state, setState] = useState<SessionState>(getState());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => subscribe(setState), []);

  const unlock = useCallback(async (password: string) => {
    setBusy(true);
    setError(null);
    try {
      const ok = await unlockSession(password);
      if (!ok) setError("Invalid password");
      return ok;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unlock failed");
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  const lock = useCallback(() => lockSession(), []);

  return {
    ...state,
    isUnlocked: isUnlocked(),
    unlocked: isUnlocked(),
    hasWallet: hasStoredWallet(),
    busy,
    error,
    unlock,
    lock,
  };
}

/** Compatibility alias expected by wallet components. */
export const useKrossSession = useSession;

export default useSession;
