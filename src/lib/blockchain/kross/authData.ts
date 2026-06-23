// src/lib/blockchain/kross/authData.ts
import { loadChainSdk } from "../loadChainSdk";

/**
 * Canonical Kross auth-data serialization.
 * Layout: [0,0,0,0] + u16(len host) + host + u16(len data) + data
 * Returned base58 so signMessage() signs deterministic bytes the
 * server can reconstruct byte-for-byte. Chain: Kross (KSS).
 *
 * Async because base58Encode comes from the dynamically-loaded SDK
 * (static import crashes the preview before Node globals exist).
 */
export async function serializeAuthData(host: string, data: string): Promise<string> {
  const { crypto } = await loadChainSdk("kross");
  const { base58Encode } = crypto;

  const enc = new TextEncoder();
  const hostB = enc.encode(host);
  const dataB = enc.encode(data);

  const out = new Uint8Array(4 + 2 + hostB.length + 2 + dataB.length);
  let o = 4; // leading [0,0,0,0]

  out[o++] = (hostB.length >> 8) & 0xff;
  out[o++] = hostB.length & 0xff;
  out.set(hostB, o); o += hostB.length;

  out[o++] = (dataB.length >> 8) & 0xff;
  out[o++] = dataB.length & 0xff;
  out.set(dataB, o);

  return base58Encode(out);
}

/** Build the challenge "data" string with a server nonce + expiry. (pure) */
export function buildChallengeData(nonce: string, expiresAt: number): string {
  return JSON.stringify({ chain: "kross", nonce, expiresAt });
}
