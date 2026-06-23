// src/lib/blockchain/kross/auth.ts
import { createKrossSigner, signAuthData } from "./signer";
import { buildChallengeData } from "./authData";

const AUTH_HOST = "kross-nft-marketplace";

/**
 * Full login flow: fetch nonce -> sign auth-data -> submit to edge fn.
 * signAuthData internally awaits the now-async serializeAuthData.
 */
export async function loginWithKross(supabaseFnBase: string): Promise<{
  token: string;
  address: string;
}> {
  const signer = createKrossSigner();

  // 1. get a server nonce
  const nonceRes = await fetch(`${supabaseFnBase}/kross-auth-nonce`, {
    method: "POST",
  });
  if (!nonceRes.ok) throw new Error("Failed to fetch nonce");
  const { nonce, expiresAt } = await nonceRes.json();

  // 2. build challenge + sign (await — async chain)
  const data = buildChallengeData(nonce, expiresAt);
  const signature = await signAuthData(signer, AUTH_HOST, data);

  const [publicKey, address] = await Promise.all([
    signer.getPublicKey(),
    signer.getAddress(),
  ]);

  // 3. submit for verification
  const verifyRes = await fetch(`${supabaseFnBase}/kross-auth-verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ host: AUTH_HOST, data, signature, publicKey, address }),
  });
  if (!verifyRes.ok) throw new Error("Auth verification failed");

  const { token } = await verifyRes.json();
  return { token, address };
}
