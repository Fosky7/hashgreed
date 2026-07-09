// src/lib/blockchain/kross/session.ts
import {
  getStoredAddress as getStoredWalletAddress,
  hasWallet,
  unlockWallet,
} from './wallet-store';
import {
  getStoredToken as tokenGetStoredToken,
  getStoredAddress as tokenGetStoredAddress,
  storeSession as tokenStoreSession,
  validateSession as tokenValidateSession,
  revokeSession as tokenRevokeSession,
  clearSession as clearTokenSession,
} from './session-tokens';

export interface SessionState {
  unlocked: boolean;
  seed: string | null;
  address: string | null;
  publicKey: string | null;
}

type SessionListener = (state: SessionState) => void;

let sessionSeed: string | null = null;
let sessionAddress: string | null = null;
let sessionPublicKey: string | null = null;

const listeners = new Set<SessionListener>();

export const getStoredToken = tokenGetStoredToken;
export const getStoredAddress = tokenGetStoredAddress;
export const storeSession = tokenStoreSession;
export const validateSession = tokenValidateSession;
export const revokeSession = tokenRevokeSession;

export function getState(): SessionState {
  return {
    unlocked: Boolean(sessionSeed),
    seed: sessionSeed,
    address: sessionAddress ?? getStoredWalletAddress(),
    publicKey: sessionPublicKey,
  };
}

function emitSessionChange() {
  const state = getState();
  listeners.forEach((listener) => listener(state));
}

export function isUnlocked(): boolean {
  return Boolean(sessionSeed);
}

export function getSessionSeed(): string | null {
  return sessionSeed;
}

export function getUnlockedSeed(): string | null {
  return sessionSeed;
}

export function requireSessionSeed(): string {
  if (!sessionSeed) {
    throw new Error('Unlock your Kross wallet before signing transactions.');
  }
  return sessionSeed;
}

async function derivePublicKey(seed: string): Promise<string | null> {
  try {
    const sdk = (await import('./sdk')) as any;
    const crypto = await sdk.loadCryptoSdk?.();
    return typeof crypto?.publicKey === 'function' ? crypto.publicKey(seed) : null;
  } catch {
    return null;
  }
}

export async function unlockSession(password: string): Promise<boolean> {
  try {
    const seed = await unlockWallet(password);
    sessionSeed = seed;
    sessionAddress = getStoredWalletAddress();
    sessionPublicKey = await derivePublicKey(seed);
    emitSessionChange();
    return true;
  } catch (error) {
    console.warn('[kross/session] unlock failed', error);
    sessionSeed = null;
    sessionAddress = getStoredWalletAddress();
    sessionPublicKey = null;
    emitSessionChange();
    return false;
  }
}

export const unlock = unlockSession;

export function lockSession(): void {
  sessionSeed = null;
  sessionAddress = getStoredWalletAddress();
  sessionPublicKey = null;
  emitSessionChange();
}

export const lock = lockSession;

export function subscribeSession(listener: SessionListener): () => void {
  listeners.add(listener);
  listener(getState());
  return () => {
    listeners.delete(listener);
  };
}

export const subscribe = subscribeSession;
export const onSessionChange = subscribeSession;

export function getSessionSnapshot(): SessionState {
  return getState();
}

export function hasStoredWallet(): boolean {
  return hasWallet();
}

export function clearSession(): void {
  clearTokenSession();
  lockSession();
}
