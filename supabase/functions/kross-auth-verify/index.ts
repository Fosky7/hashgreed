// supabase/functions/kross-auth-verify/index.ts
// Verifies a signed Kross auth challenge and issues a session token.
// Flow: client fetches a nonce → signs host+data → posts here → we verify the
// signature, bind publicKey→address, consume the nonce (single-use), and mint
// a session row.
import { createClient } from "jsr:@supabase/supabase-js@2";

const AUTH_HOST = "kross-nft-marketplace";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), {
    status: s,
    headers: { ...cors, "content-type": "application/json" },
  });

/**
 * Verify the auth signature AND that the publicKey hashes to the claimed 3K
 * address. SDK is imported DYNAMICALLY (never at module top-level) so the
 * Node-global init code only runs on demand — mirroring loadChainSdk. This
 * keeps the module side-effect-free at import time.
 */
async function verifyAndBind(params: {
  host: string;
  data: string;
  publicKey: string;
  signature: string;
  address: string;
}): Promise<{ ok: boolean; reason?: string }> {
  const { verifyAuthData } = await import("npm:@waves/waves-transactions@4.3.4");
  const { address: deriveAddress } = await import("npm:@waves/ts-lib-crypto@1.4.4-beta.1");

  // 1. Derive the expected address from the submitted publicKey (chain "N").
  let expectedAddress: string;
  try {
    expectedAddress = deriveAddress({ publicKey: params.publicKey }, "N");
  } catch {
    return { ok: false, reason: "bad publicKey" };
  }
  if (expectedAddress !== params.address) {
    return { ok: false, reason: "address/publicKey mismatch" };
  }

  // 2. Verify the signature over the host+data auth payload.
  try {
    const valid = verifyAuthData(
      {
        publicKey: params.publicKey,
        signature: params.signature,
        address: params.address,
      },
      { data: params.data, host: params.host },
    );
    return valid ? { ok: true } : { ok: false, reason: "invalid signature" };
  } catch {
    return { ok: false, reason: "verify error" };
  }
}

/** Parse the nonce out of the signed data payload. */
function extractNonce(data: string): { nonce?: string; expiresAt?: number } {
  try {
    const parsed = JSON.parse(data);
    return { nonce: parsed?.nonce, expiresAt: parsed?.expiresAt };
  } catch {
    return {};
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  let p: {
    host?: string;
    data?: string;
    publicKey?: string;
    signature?: string;
    address?: string;
  };
  try {
    p = await req.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }

  const { host = AUTH_HOST, data, publicKey, signature, address } = p;
  if (!data || !publicKey || !signature || !address) {
    return json({ error: "missing fields" }, 400);
  }
  if (!address.startsWith("3K")) {
    return json({ error: "not a Kross address" }, 400);
  }

  // Nonce must be present and unexpired before we touch the DB.
  const { nonce, expiresAt } = extractNonce(data);
  if (!nonce) return json({ error: "missing nonce" }, 400);
  if (typeof expiresAt === "number" && expiresAt < Date.now()) {
    return json({ error: "challenge expired" }, 401);
  }

  // Cryptographic verification + address binding.
  const result = await verifyAndBind({ host, data, publicKey, signature, address });
  if (!result.ok) return json({ error: result.reason ?? "verification failed" }, 401);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Consume the nonce exactly once (replay protection).
  const { data: nonceRow, error: nonceErr } = await supabase
    .from("kross_auth_nonces")
    .select("nonce, used, expires_at")
    .eq("nonce", nonce)
    .maybeSingle();

  if (nonceErr) return json({ error: `DB: ${nonceErr.message}` }, 200);
  if (!nonceRow) return json({ error: "unknown nonce" }, 401);
  if (nonceRow.used) return json({ error: "nonce already used" }, 401);
  if (new Date(nonceRow.expires_at).getTime() < Date.now()) {
    return json({ error: "nonce expired" }, 401);
  }

  const { error: markErr } = await supabase
    .from("kross_auth_nonces")
    .update({ used: true })
    .eq("nonce", nonce)
    .eq("used", false); // guard against concurrent reuse
  if (markErr) return json({ error: `DB: ${markErr.message}` }, 200);

  // Mint a session token.
  const token = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, "");
  const expiresIso = new Date(Date.now() + SESSION_TTL_MS).toISOString();

  const { error: sessErr } = await supabase.from("kross_sessions").insert({
    token,
    address,
    revoked: false,
    expires_at: expiresIso,
  });
  if (sessErr) return json({ error: `DB: ${sessErr.message}` }, 200);

  return json({ token, address, expiresAt: expiresIso });
});
