// src/lib/blockchain/kross/external-wallet.ts
//
// External (Keeper / Signer) wallet adapter for the Kross / RIDE v6 chain.
//
// Seed material NEVER touches this app: signing happens inside the user's
// Keeper extension or their Signer provider. We only request the address,
// read balances (via the existing READ layer), and ask the provider to sign
// & broadcast transactions the user explicitly approves.
//
// Both @waves/signer and @waves/provider-keeper touch Node globals / are not
// build-resolvable, so they are loaded through the centralized runtime loader
// (non-literal specifier). Import polyfills first.
import './polyfills';
import { loadChainSdk } from '../loadChainSdk';
import { KROSS_CONFIG } from './config';
import { isValidKrossAddress } from './sdk';

/* eslint-disable @typescript-eslint/no-explicit-any */

export type ProviderKind = 'keeper';

export interface ConnectedAccount {
  address: string;
  publicKey?: string;
}

const STORAGE_KEY = 'kross_external_provider_v1';

// The active Signer instance (holds the connected provider + session).
let signer: any = null;
let activeKind: ProviderKind | null = null;

/** Node endpoint used by Signer for tx params / broadcast. */
function nodeUrl(): string {
  return (KROSS_CONFIG as any).nodeUrl ?? (KROSS_CONFIG as any).nodeUrls?.[0];
}

/** Persist which provider was last used so we can restore the session. */
export function getStoredProvider(): ProviderKind | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'keeper' ? v : null;
  } catch {
    return null;
  }
}

function storeProvider(kind: ProviderKind | null) {
  try {
    if (kind) localStorage.setItem(STORAGE_KEY, kind);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Connect the Keeper provider via @waves/signer. Returns the active account.
 * Throws a user-friendly error when the extension is missing or login is
 * rejected.
 */
export async function connectKeeper(): Promise<ConnectedAccount> {
  const [signerMod, keeperMod] = await Promise.all([
    loadChainSdk('signer'),
    loadChainSdk('provider-keeper'),
  ]);

  const Signer = signerMod.Signer ?? signerMod.default?.Signer ?? signerMod.default;
  const ProviderKeeper =
    keeperMod.ProviderKeeper ?? keeperMod.default?.ProviderKeeper ?? keeperMod.default;

  if (!Signer || !ProviderKeeper) {
    throw new Error('Wallet SDK failed to load. Please retry.');
  }

  const s = new Signer({ NODE_URL: nodeUrl() });
  s.setProvider(new ProviderKeeper());

  let account: any;
  try {
    account = await s.login();
  } catch (e: any) {
    const msg = String(e?.message ?? e ?? '');
    if (/install|not found|undefined/i.test(msg)) {
      throw new Error('Keeper Wallet extension was not detected. Please install it.');
    }
    throw new Error('Connection was rejected in the wallet.');
  }

  const address: string = account?.address;
  if (!address || !isValidKrossAddress(address)) {
    // Don't hard-fail on a non-3K address (testnets differ) but warn.
    if (!address) throw new Error('Wallet did not return an address.');
  }

  signer = s;
  activeKind = 'keeper';
  storeProvider('keeper');
  return { address, publicKey: account?.publicKey };
}

/** True when a provider session is currently active in this tab. */
export function isConnected(): boolean {
  return signer != null && activeKind != null;
}

export function getActiveKind(): ProviderKind | null {
  return activeKind;
}

/**
 * Sign & broadcast an invokeScript / transfer tx through the connected
 * provider. The user approves it in their wallet; we never see the key.
 *
 * @param tx a Signer tx descriptor, e.g.
 *   { type: 16, dApp, call: { function, args }, payment }
 * @returns the broadcast tx (with id).
 */
export async function signAndBroadcast(tx: any): Promise<any> {
  if (!signer) throw new Error('No wallet connected.');
  // Signer fluent API: signer.invoke(...).broadcast() or signer.broadcast(tx)
  if (tx?.type === 16 && typeof signer.invoke === 'function') {
    const [bc] = await signer.invoke(tx).broadcast();
    return bc;
  }
  if (tx?.type === 4 && typeof signer.transfer === 'function') {
    const [bc] = await signer.transfer(tx).broadcast();
    return bc;
  }
  const signed = await signer.sign([tx]);
  return signer.broadcast(signed);
}

/** End the session in this tab. */
export async function disconnect(): Promise<void> {
  try {
    if (signer?.logout) await signer.logout();
  } catch {
    /* ignore */
  }
  signer = null;
  activeKind = null;
  storeProvider(null);
}
