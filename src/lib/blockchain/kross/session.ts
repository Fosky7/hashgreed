// src/lib/blockchain/kross/session.ts
import { loadChainSdk } from "@/lib/blockchain/loadChainSdk";
import { CHAIN_ID } from "./config";

type Listener = (state: SessionState) => void;

export interface SessionState {
  unlocked: boolean;
  address: string | null;
  publicKey: string | null;
}

const STORAGE_KEY = "kross_encrypted_seed";

let _seed: string | null = null;
let _state: SessionState = { unlocked: false, address: null, publicKey: null };
const _listeners = new Set<Listener>();

function emit() {
  for (const l of _listeners) l(_state);
}

export function subscribe(listener: Listener): () => void {
  _listeners.add(listener);
  listener(_state);
  return () => _listeners.delete(listener);
}

export function getState(): SessionState {
  return _state;
}

export function isUnlocked(): boolean {
  return _state.unlocked && _seed !== null;
}

export function hasStoredWallet(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

export async function storeEncryptedSeed(seedPhrase: string, password: string): Promise<void> {
  const cipher = await encrypt(seedPhrase, password);
  localStorage.setItem(STORAGE_KEY, cipher);
}

/** Unlock the session with a password. Returns true on success. */
export async function unlock(password: string): Promise<boolean> {
  const seed = await getSessionSeed(password);
  return seed !== null;
}

export async function getSessionSeed(password: string): Promise<string | null> {
  if (_seed) return _seed;
  const cipher = localStorage.getItem(STORAGE_KEY);
  if (!cipher) return null;
  try {
    const seed = await decrypt(cipher, password);
    await activate(seed);
    return seed;
  } catch {
    return null;
  }
}

async function activate(seedPhrase: string) {
  const crypto = await loadChainSdk("kross", "@waves/ts-lib-crypto");
  _seed = seedPhrase;
  _state = {
    unlocked: true,
    address: crypto.address(seedPhrase, CHAIN_ID),
    publicKey: crypto.publicKey(seedPhrase),
  };
  emit();
}

export function lock(): void {
  _seed = null;
  _state = { unlocked: false, address: null, publicKey: null };
  emit();
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const base = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

async function encrypt(plaintext: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plaintext)),
  );
  const out = new Uint8Array(salt.length + iv.length + ct.length);
  out.set(salt, 0);
  out.set(iv, salt.length);
  out.set(ct, salt.length + iv.length);
  return btoa(String.fromCharCode(...out));
}

async function decrypt(cipher: string, password: string): Promise<string> {
  const raw = Uint8Array.from(atob(cipher), (c) => c.charCodeAt(0));
  const salt = raw.slice(0, 16);
  const iv = raw.slice(16, 28);
  const ct = raw.slice(28);
  const key = await deriveKey(password, salt);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return new TextDecoder().decode(pt);
}
