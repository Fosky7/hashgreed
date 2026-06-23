// supabase/functions/kross-session-create/index.ts
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  verifySignature,
  address as addressFromPublicKey,
} from "https://esm.sh/@waves/ts-lib-crypto@1.4.4-beta.1";
import { corsHeaders, json } from "../_shared/cors.ts";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const KROSS_CHAIN_ID = "N"; // Kross chain ID (NOT "W" — that's Waves)

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { address, publicKey, nonce, signature } = await req.json();

    if (!address || !publicKey || !nonce || !signature) {
      return json({ error: "Missing fields" }, 400);
    }
    if (!String(address).startsWith("3K")) {
      return json({ error: "Invalid Kross address" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Nonce must exist, belong to this address, be unused and unexpired.
    const { data: nonceRow, error: nonceErr } = await supabase
      .from("kross_nonces")
      .select("nonce, address, used, expires_at")
      .eq("nonce", nonce)
      .maybeSingle();

    if (nonceErr) return json({ error: `DB: ${nonceErr.message}` }, 200);
    if (!nonceRow) return json({ error: "Unknown nonce" }, 401);
    if (nonceRow.used) return json({ error: "Nonce already used" }, 401);
    if (nonceRow.address !== address) {
      return json({ error: "Nonce/address mismatch" }, 401);
    }
    if (new Date(nonceRow.expires_at).getTime() < Date.now()) {
      return json({ error: "Nonce expired" }, 401);
    }

    // 2. CRITICAL: the public key must derive the claimed Kross address.
    //    This prevents a valid signature from one key being used to claim
    //    a different account's address.
    const derived = addressFromPublicKey(publicKey, KROSS_CHAIN_ID);
    if (derived !== address) {
      return json({ error: "Public key does not match address" }, 401);
    }

    // 3. Verify the signature over the nonce bytes against the public key.
    const bytes = new TextEncoder().encode(nonce);
    const ok = verifySignature(publicKey, bytes, signature);
    if (!ok) return json({ error: "Bad signature" }, 401);

    // 4. Burn the nonce so it can't be replayed.
    await supabase
      .from("kross_nonces")
      .update({ used: true })
      .eq("nonce", nonce);

    // 5. Issue the session token.
    const token = crypto.randomUUID() + crypto.randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

    const { error: insErr } = await supabase
      .from("kross_sessions")
      .insert({ token, address, expires_at: expiresAt });

    if (insErr) return json({ error: insErr.message }, 200);

    return json({ token, address, expiresAt });
  } catch (e) {
    return json({ error: String(e) }, 200);
  }
});
