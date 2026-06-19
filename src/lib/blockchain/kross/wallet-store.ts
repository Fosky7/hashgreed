// src/lib/blockchain/kross/wallet-store.ts
import { KrossWallet } from './sdk';

const STORAGE_KEY = 'kross_wallet_v1';

/**
 * Encrypt and persist the wallet. Only the encrypted seed is stored.
 * Replace `encryptSeed`/`decryptSeed` with your managed-wallet signer.
 */
async function encryptSeed(seed: string, password: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(seed)
  );
  const payload = {
    salt: Array.from(salt),
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(cipher)),
  };
  return btoa(JSON.stringify(payload));
}

async function decryptSeed(encoded: string, password: string): Promise<string> {
  const dec = new TextDecoder();
  const enc = new TextEncoder();
  const { salt, iv, data } = JSON.parse(atob(encoded));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new Uint8Array(salt),
      iterations: 100_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv) },
    key,
    new Uint8Array(data)
  );
  return dec.decode(plain);
}

export async function saveWallet(
  wallet: KrossWallet,
  password: string
): Promise<void> {
  const encrypted = await encryptSeed(wallet.seedPhrase, password);
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ address: wallet.address, encrypted })
  );
}

export function getStoredAddress(): string | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  return JSON.parse(raw).address ?? null;
}

export async function unlockWallet(password: string): Promise<string> {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) throw new Error('No wallet found');
  const { encrypted } = JSON.parse(raw);
  return decryptSeed(encrypted, password);
}

export function hasWallet(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}
