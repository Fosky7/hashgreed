// src/lib/blockchain/kross/login.ts
import { signer } from "./signer";
import { storeSession } from "./session";

const FUNCTIONS_BASE = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL ?? "";

interface LoginResult {
  token: string;
  address: string;
  expiresAt: string;
}

/**
 * Full server-side login:
 *  1. Ask the server for a one-time nonce bound to our address.
 *  2. Sign the nonce with the managed signer (seed never leaves the signer).
 *  3. Send signature back; server verifies and issues a session token.
 */
export async function login(): Promise<LoginResult> {
  // Managed signer exposes the active account's address + public key.
  const { address, publicKey } = await signer.getActiveAccount();

  // 1. Request nonce.
  const nonceRes = await fetch(`${FUNCTIONS_BASE}/kross-nonce`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address }),
  });
  if (!nonceRes.ok) throw new Error("Failed to get nonce");
  const { nonce, error: nonceErr } = await nonceRes.json();
  if (!nonce) throw new Error(nonceErr ?? "No nonce returned");

  // 2. Sign the nonce via the managed signer (delegates to signer object).
  const signature = await signer.signMessage(nonce);

  // 3. Exchange signed nonce for a session token.
  const createRes = await fetch(`${FUNCTIONS_BASE}/kross-session-create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, publicKey, nonce, signature }),
  });
  const data = await createRes.json();
  if (!createRes.ok || !data.token) {
    throw new Error(data.error ?? "Login failed");
  }

  storeSession(data.token, data.address);
  return data;
}
