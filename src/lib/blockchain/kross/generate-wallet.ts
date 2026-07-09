// src/lib/blockchain/kross/generate-wallet.ts
import { loadChainSdk } from '../loadChainSdk';

/**
 * Generates a brand-new Kross wallet:
 *  - creates a fresh 15-word seed phrase via the Kross crypto SDK
 *  - derives the public key and 3K… address (chainId "N")
 *
 * Seed material is produced and handled ONLY inside this SDK layer.
 * The caller receives the seed once so it can be shown for backup and
 * then encrypted/persisted by the wallet store.
 */
export interface GeneratedWallet {
  seed: string;
  address: string;
  publicKey: string;
}

/** Resolve the Kross crypto helpers from the dynamically-loaded SDK. */
async function loadKrossCrypto() {
  const cryptoSdk = await loadChainSdk('kross', '@waves/ts-lib-crypto');
  // esm.sh may place exports on the module root or on `.default` (CJS interop).
  return (cryptoSdk?.random || cryptoSdk?.randomSeed || cryptoSdk?.address)
    ? cryptoSdk
    : (cryptoSdk?.default ?? cryptoSdk);
}

export async function generateKrossWallet(): Promise<GeneratedWallet> {
  const crypto = await loadKrossCrypto();

  const random = crypto.random as
    | ((len: number, type: string) => string)
    | undefined;
  const randomSeed = crypto.randomSeed as (() => string) | undefined;
  const address = crypto.address as (seed: string, chainId: string) => string;
  const publicKey = crypto.publicKey as (seed: string) => string;

  if (typeof address !== 'function' || typeof publicKey !== 'function') {
    throw new Error('Kross crypto SDK did not expose address/publicKey.');
  }

  // Prefer the SDK's dedicated seed generator; fall back to `random` words.
  let seed: string;
  if (typeof randomSeed === 'function') {
    seed = randomSeed();
  } else if (typeof random === 'function') {
    // 15 random words is the standard Waves/Kross seed length.
    seed = random(15, 'Array of words');
  } else {
    throw new Error('Kross SDK does not expose a seed generator.');
  }

  const pub = publicKey(seed);
  const addr = address(seed, 'N');

  return { seed, address: addr, publicKey: pub };
}

/**
 * Imports/validates an existing Kross wallet from a recovery phrase:
 *  - normalizes the seed phrase
 *  - derives the public key and 3K… address (chainId "N") via the SDK
 *
 * Throws if the phrase cannot produce a valid Kross (3K…) address.
 * Seed material is handled ONLY inside this SDK layer.
 */
export async function importKrossWallet(
  seedPhrase: string,
): Promise<GeneratedWallet> {
  const normalized = (seedPhrase ?? '').trim().replace(/\s+/g, ' ');
  if (!normalized) {
    throw new Error('Recovery phrase is required.');
  }

  const crypto = await loadKrossCrypto();

  const address = crypto.address as (seed: string, chainId: string) => string;
  const publicKey = crypto.publicKey as (seed: string) => string;

  if (typeof address !== 'function' || typeof publicKey !== 'function') {
    throw new Error('Kross crypto SDK did not expose address/publicKey.');
  }

  let pub: string;
  let addr: string;
  try {
    pub = publicKey(normalized);
    addr = address(normalized, 'N');
  } catch {
    throw new Error('Invalid recovery phrase. Please check and try again.');
  }

  // Kross mainnet addresses must start with the 3K prefix.
  if (!addr || !addr.startsWith('3K')) {
    throw new Error('Recovery phrase did not produce a valid Kross address.');
  }

  return { seed: normalized, address: addr, publicKey: pub };
}
