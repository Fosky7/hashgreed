// src/lib/blockchain/kross/session.ts
import { unlockWallet } from './wallet-store';

/**
 * In-memory session for the decrypted seed. The seed NEVER touches
 * localStorage or React state — it lives only in this module's closure
 * and is cleared on lock / timeout / tab close.
 */
let sessionSeed: string | null = null;
let lockTimer: ReturnType<typeof setTimeout> | null = null;
let expiresAt = 0;

const AUTO_LOCK_MS = 5 * 60 * 1000; // 5 minutes

type Listener = (unlocked: boolean) => void;
const listeners = new Set<Listener>();

function notify() {
  const state = isUnlocked();
  listeners.forEach((l) => l(state));
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isUnlocked(): boolean {
  return sessionSeed !== null && Date.now() < expiresAt;
}

function scheduleLock() {
  if (lockTimer) clearTimeout(lockTimer);
  lockTimer = setTimeout(lock, AUTO_LOCK_MS);
}

/**
 * Decrypt the seed with the password and open a session.
 */
export async function unlock(password: string): Promise<void> {
  const seed = await unlockWallet(password); // decrypts inside SDK layer
  sessionSeed = seed;
  expiresAt = Date.now() + AUTO_LOCK_MS;
  scheduleLock();
  notify();
}

/**
 * Clear the in-memory seed immediately.
 */
export function lock(): void {
  sessionSeed = null;
  expiresAt = 0;
  if (lockTimer) clearTimeout(lockTimer);
  lockTimer = null;
  notify();
}

/**
 * Retrieve the active session seed. Throws if locked.
 * Refreshes the auto-lock timer on each use (activity-based).
 */
export function getSessionSeed(): string {
  if (!isUnlocked() || !sessionSeed) {
    throw new Error('Wallet is locked. Please unlock to continue.');
  }
  expiresAt = Date.now() + AUTO_LOCK_MS;
  scheduleLock();
  return sessionSeed;
}

// Clear on tab close for safety.
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', lock);
}
