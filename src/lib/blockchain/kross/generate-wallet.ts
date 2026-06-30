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

export async function generateKrossWallet(): Promise<GeneratedWallet> {
  const { crypto } = await loadChainSdk('kross');
  const { random, randomSeed, address, publicKey } = crypto as Record<
    string,
    (...args: unknown[]) => unknown
  >;

  // Prefer the SDK's dedicated seed generator; fall back to `random` words.
  let seed: string;
  if (typeof randomSeed === 'function') {
    seed = randomSeed() as string;
  } else if (typeof random === 'function') {
    // 15 random words is the standard Waves/Kross seed length.
    seed = random(15, 'Array of words') as string;
  } else {
    throw new Error('Kross SDK does not expose a seed generator.');
  }

  const pub = publicKey(seed) as string;
  const addr = address(seed, 'N') as string;

  return { seed, address: addr, publicKey: pub };
}
