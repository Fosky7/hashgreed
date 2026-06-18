// src/lib/blockchain/kross/sdk.ts
//
// IMPORTANT: @waves/ts-lib-crypto evaluates Node globals (Buffer) at import
// time and crashes in the browser before polyfills run. We therefore NEVER
// statically import it here. It is loaded lazily inside the async derivation
// path, after './polyfills' has installed the globals.
import './polyfills';
import { loadChainSdk } from '../loadChainSdk';
import { KROSS_CONFIG } from './config';
import { SEED_WORD_LIST } from './word-list';

// Lazily load the crypto lib via the centralized runtime loader so esbuild
// never tries to resolve '@waves/ts-lib-crypto' at build time and so the
// Node-global polyfills are guaranteed to be installed first.
async function loadCrypto() {
  const mod: any = await loadChainSdk('ts-lib-crypto');
  const address = mod.address ?? mod.default?.address;
  const publicKey = mod.publicKey ?? mod.default?.publicKey;
  const privateKey = mod.privateKey ?? mod.default?.privateKey;
  if (!address || !publicKey || !privateKey) {
    throw new Error('Kross crypto functions failed to load.');
  }
  return { address, publicKey, privateKey };
}

// The esm.sh build of @waves/ts-lib-crypto does not re-export `seedWordList`,
// so we rely on a bundled local word list for deterministic seed generation.
const seedWordList = SEED_WORD_LIST;

export interface KrossWallet {
  seedPhrase: string;
  privateKey: string;
  publicKey: string;
  address: string;
}

/**
 * Generate a 15-word seed phrase from the bundled Kross/Waves word list.
 * Uses the platform CSPRNG (crypto.getRandomValues) so no external SDK call
 * is required for generation. NOTE: seed material must only be handled inside
 * this SDK layer, never passed raw through React components.
 */
function generateSeedPhrase(): string {
  const words: string[] = [];
  const rng = globalThis.crypto;
  for (let i = 0; i < 15; i++) {
    const arr = new Uint32Array(1);
    rng.getRandomValues(arr);
    const idx = arr[0] % seedWordList.length;
    words.push(seedWordList[idx]);
  }
  return words.join(' ');
}

/**
 * Derive all wallet credentials from a seed phrase for the Kross chain.
 * Crypto helpers are loaded lazily (post-polyfill, build-safe), so this is async.
 */
async function deriveWallet(seedPhrase: string): Promise<KrossWallet> {
  const { address, publicKey, privateKey } = await loadCrypto();
  return {
    seedPhrase,
    privateKey: privateKey(seedPhrase),
    publicKey: publicKey(seedPhrase),
    address: address(seedPhrase, KROSS_CONFIG.chainId),
  };
}

/**
 * Create a brand new Kross wallet (15-word seed, 3K address).
 */
export async function createWallet(): Promise<KrossWallet> {
  const seedPhrase = generateSeedPhrase();
  return deriveWallet(seedPhrase);
}

/**
 * Import / restore a Kross wallet from an existing 15-word seed phrase.
 */
export async function importWallet(seedPhrase: string): Promise<KrossWallet> {
  const trimmed = seedPhrase.trim().replace(/\s+/g, ' ');
  if (!isValidSeedPhrase(trimmed)) {
    throw new Error('Invalid seed phrase. Expected 15 words.');
  }
  return deriveWallet(trimmed);
}

/**
 * Official Kross address format (source of truth: decentralizedafrica.com/sdk).
 * Must start with the literal `3K` prefix and be followed by exactly 33
 * ASCII-alphanumeric characters, for a total length of 35.
 */
export const KROSS_ADDRESS_REGEX = /^3K[a-zA-Z0-9]{33}$/;

/**
 * Validate a Kross address.
 * Enforces the SDK rule: starts with `3K` and matches /^3K[a-zA-Z0-9]{33}$/.
 * Rejects non-strings and any address containing non-alphanumeric symbols.
 */
export function isValidKrossAddress(addr: string): boolean {
  return typeof addr === 'string' && KROSS_ADDRESS_REGEX.test(addr);
}

/**
 * Basic seed-phrase validation: must be exactly 15 words.
 */
export function isValidSeedPhrase(seedPhrase: string): boolean {
  const words = seedPhrase.trim().split(/\s+/);
  return words.length === 15 && words.every((w) => w.length > 0);
}
