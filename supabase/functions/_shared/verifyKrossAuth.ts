// supabase/functions/_shared/verifyKrossAuth.ts

/**
 * Verifies a base58 Kross auth signature against reconstructed auth-data bytes.
 * Crypto is imported dynamically so module load never touches Node globals
 * before the runtime is ready (mirrors the front-end loadChainSdk pattern).
 */
function serializeAuthData(host: string, data: string): Uint8Array {
  const enc = new TextEncoder();
  const hostB = enc.encode(host);
  const dataB = enc.encode(data);
  const out = new Uint8Array(4 + 2 + hostB.length + 2 + dataB.length);
  let o = 4;
  out[o++] = (hostB.length >> 8) & 0xff;
  out[o++] = hostB.length & 0xff;
  out.set(hostB, o); o += hostB.length;
  out[o++] = (dataB.length >> 8) & 0xff;
  out[o++] = dataB.length & 0xff;
  out.set(dataB, o);
  return out;
}

export async function verifyKrossAuth(params: {
  host: string;
  data: string;
  publicKey: string;
  signatureBase58: string;
}): Promise<boolean> {
  const { verifySignature, base58Decode } = await import(
    "npm:@waves/ts-lib-crypto"
  );
  const bytes = serializeAuthData(params.host, params.data);
  try {
    return verifySignature(
      params.publicKey,
      bytes,
      base58Decode(params.signatureBase58)
    );
  } catch {
    return false;
  }
}
