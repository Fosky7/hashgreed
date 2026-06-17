// src/lib/blockchain/kross/sdk.ts
import {
  address as deriveAddress,
  publicKey as derivePublicKey,
  privateKey as derivePrivateKey,
} from '@waves/ts-lib-crypto';
import { KROSS_CONFIG } from './config';
import { SEED_WORD_LIST } from './word-list';

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
 * Generate a 15-word seed phrase from the Kross/Waves word list.
 * NOTE: seed material must only be handled inside this SDK layer,
 * never passed raw through React components.
 */
function generateSeedPhrase(): string {
  // generateNewSeed produces a valid 15-word Waves/Kross seed phrase.
  // Seed material stays confined to this SDK layer.
  return generateNewSeed(15).trim().replace(/\s+/g, ' ');
}

/**
 * Derive all wallet credentials from a seed phrase for the Kross chain.
 */
function deriveWallet(seedPhrase: string): KrossWallet {
  const addr = deriveAddress(seedPhrase, KROSS_CONFIG.chainId);
  return {
    seedPhrase,
    privateKey: derivePrivateKey(seedPhrase),
    publicKey: derivePublicKey(seedPhrase),
    address: addr,
  };
}

/**
 * Create a brand new Kross wallet (15-word seed, 3K address).
 */
export function createWallet(): KrossWallet {
  const seedPhrase = generateSeedPhrase();
  return deriveWallet(seedPhrase);
}

/**
 * Import / restore a Kross wallet from an existing 15-word seed phrase.
 */
export function importWallet(seedPhrase: string): KrossWallet {
  const trimmed = seedPhrase.trim().replace(/\s+/g, ' ');
  if (!isValidSeedPhrase(trimmed)) {
    throw new Error('Invalid seed phrase. Expected 15 words.');
  }
  return deriveWallet(trimmed);
}

/**
 * Validate a Kross address (must start with 3K and be 35 chars).
 */
export function isValidKrossAddress(addr: string): boolean {
  return (
    typeof addr === 'string' &&
    addr.startsWith(KROSS_CONFIG.addressPrefix) &&
    addr.length === 35
  );
}

/**
 * Basic seed-phrase validation: must be exactly 15 words.
 */
export function isValidSeedPhrase(seedPhrase: string): boolean {
  const words = seedPhrase.trim().split(/\s+/);
  return words.length === 15 && words.every((w) => w.length > 0);
}
