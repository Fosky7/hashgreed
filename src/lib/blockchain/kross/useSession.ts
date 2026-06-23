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
}

export function useSession(): UseSession {
  const [state, setState] = useState<SessionState>(getState());

  useEffect(() => subscribe(setState), []);

  const unlock = useCallback((password: string) => unlockSession(password), []);
  const lock = useCallback(() => lockSession(), []);

  return {
    ...state,
    isUnlocked: isUnlocked(),
    hasWallet: hasStoredWallet(),
    unlock,
    lock,
  };
}

export default useSession;
