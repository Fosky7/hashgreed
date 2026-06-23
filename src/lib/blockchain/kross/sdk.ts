// src/lib/blockchain/kross/sdk.ts
import { loadChainSdk } from "@/lib/blockchain/loadChainSdk";
import { NODE_URL, CHAIN_ID, FEES, toWavelets } from "./config";

/** Canonical dynamic loader for @waves/waves-transactions (loaded after globals). */
export async function loadTransactionsSdk() {
  return loadChainSdk("kross", "@waves/waves-transactions");
}

/** Dynamic loader for @waves/ts-lib-crypto. */
export async function loadCryptoSdk() {
  return loadChainSdk("kross", "@waves/ts-lib-crypto");
}

export interface KrossWallet {
  seedPhrase: string;
  privateKey: string;
  publicKey: string;
  address: string;
  encodedSeed: string;
}

export async function createWallet(): Promise<KrossWallet> {
  const crypto = await loadCryptoSdk();
  return deriveWallet(crypto, crypto.randomSeed(15));
}

export async function importWallet(seedPhrase: string): Promise<KrossWallet> {
  const trimmed = seedPhrase.trim().replace(/\s+/g, " ");
  if (!isValidSeedPhrase(trimmed)) throw new Error("Invalid seed phrase: expected 15 words");
  const crypto = await loadCryptoSdk();
  return deriveWallet(crypto, trimmed);
}

function deriveWallet(crypto: any, seedPhrase: string): KrossWallet {
  return {
    seedPhrase,
    privateKey: crypto.privateKey(seedPhrase),
    publicKey: crypto.publicKey(seedPhrase),
    address: crypto.address(seedPhrase, CHAIN_ID),
    encodedSeed: crypto.base58Encode(crypto.stringToBytes(seedPhrase)),
  };
}

export function isValidSeedPhrase(seedPhrase: string): boolean {
  if (!seedPhrase || typeof seedPhrase !== "string") return false;
  return seedPhrase.trim().split(/\s+/).filter(Boolean).length === 15;
}

export function isValidKrossAddress(address: string): boolean {
  return typeof address === "string" && address.startsWith("3K") && address.length >= 35;
}

export async function transferKSS(
  recipient: string,
  amountKSS: number,
  seedPhrase: string,
  attachment = "",
  nodeUrl: string = NODE_URL,
) {
  if (!isValidKrossAddress(recipient)) throw new Error("Invalid Kross address");
  const { transfer, broadcast, waitForTx } = await loadTransactionsSdk();
  const tx = transfer(
    {
      recipient,
      amount: toWavelets(amountKSS),
      assetId: null,
      attachment: attachment || undefined,
      fee: FEES.TRANSFER,
      chainId: CHAIN_ID,
    },
    seedPhrase,
  );
  const result = await broadcast(tx, nodeUrl);
  await waitForTx(result.id, { apiBase: nodeUrl });
  return result;
}

/** Broadcast a pre-signed transaction and wait for confirmation. */
export async function broadcastTx(signedTx: unknown, nodeUrl: string = NODE_URL) {
  const { broadcast, waitForTx } = await loadTransactionsSdk();
  const result = await broadcast(signedTx as any, nodeUrl);
  await waitForTx(result.id, { apiBase: nodeUrl });
  return result;
}

/**
 * Resolve the managed seed for the unlocked session, gated by password.
 * Seed material is decrypted ONLY inside this SDK/session layer and never
 * returned to React components.
 */
export async function getSeedFromPassword(password: string): Promise<string> {
  const { getSessionSeed } = await import("./session");
  const seed = await getSessionSeed(password);
  if (!seed) throw new Error("Unable to unlock wallet: invalid password or no active session");
  return seed;
}
