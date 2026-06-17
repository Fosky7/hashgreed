// src/lib/blockchain/kross/useSession.ts
import { useState, useEffect, useSyncExternalStore } from 'react';
import { subscribe, isUnlocked, unlock, lock } from './session';

export function useKrossSession() {
  const unlocked = useSyncExternalStore(subscribe, isUnlocked, () => false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Clear stale error when state flips.
  useEffect(() => {
    if (unlocked) setError('');
  }, [unlocked]);

  const doUnlock = async (password: string) => {
    setBusy(true);
    setError('');
    try {
      await unlock(password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Incorrect password.');
    } finally {
      setBusy(false);
    }
  };

  return { unlocked, error, busy, unlock: doUnlock, lock };
}
