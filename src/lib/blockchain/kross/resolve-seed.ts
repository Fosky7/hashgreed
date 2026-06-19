// src/lib/blockchain/kross/resolve-seed.ts
import { unlockWallet } from './wallet-store';
import { getSessionSeed, isUnlocked } from './session';

/**
 * Resolve the seed for signing:
 * - If a password is provided, decrypt directly (one-off).
 * - Otherwise use the active in-memory session.
 * Seed material is only ever handled inside the SDK layer.
 */
export async function resolveSeed(password?: string): Promise<string> {
  if (password && password.length > 0) {
    return unlockWallet(password);
  }
  if (isUnlocked()) {
    return getSessionSeed();
  }
  throw new Error('Wallet is locked. Unlock or provide a password.');
}
