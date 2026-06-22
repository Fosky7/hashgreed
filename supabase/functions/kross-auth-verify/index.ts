// supabase/functions/kross-auth-verify/index.ts
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  verifySignature,
  base58Decode,
  base58Encode,
  address as deriveAddress,
} from "https://esm.sh/@waves/ts-lib-crypto@1.4.4";

const KROSS_CHAIN_ID = "N"; // Kross — addresses start with 3K
const HOST = "krossbuild.app";

/** Same serializer as the client — byte-for-byte identical. */
function serializeAuthData(host: string, data: string): string {
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
  return base58Encode(out);
}

serve(async (req) => {
  try {
    const { publicKey, signature, address, host, data } = await req.json();

    // 0) Host must match what we issued.
    if (host !== HOST) {
      return json({ error: "Bad host" }, 401);
    }

    // 1) Parse challenge + check expiry.
    const parsed = JSON.parse(data);
    if (parsed.chain !== "kross") return json({ error: "Wrong chain" }, 401);
    if (Date.now() > Number(parsed.expiresAt)) {
      return json({ error: "Challenge expired" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 2) Consume nonce exactly once (replay protection).
    const { data: row } = await supabase
      .from("kross_auth_nonces")
      .select("nonce, used")
      .eq("nonce", parsed.nonce)
      .maybeSingle();
    if (!row || row.used) return json({ error: "Nonce invalid or used" }, 401);
    await supabase
      .from("kross_auth_nonces")
      .update({ used: true })
      .eq("nonce", parsed.nonce);

    // 3) Verify signature over reconstructed bytes.
    const bytes = base58Decode(serializeAuthData(host, data));
    const ok = verifySignature(publicKey, bytes, signature);
    if (!ok) return json({ error: "Invalid signature" }, 401);

    // 4) Derive Kross address from publicKey — don't trust client-sent address.
    const derived = deriveAddress({ publicKey }, KROSS_CHAIN_ID);
    if (derived !== address || !derived.startsWith("3K")) {
      return json({ error: "Address mismatch" }, 401);
    }

    // 5) Issue session token bound to the verified Kross address.
    const token = crypto.randomUUID();
    await supabase.from("kross_sessions").insert({
      token,
      address: derived,
      created_at: new Date().toISOString(),
    });

    return json({ token, address: derived });
  } catch (e) {
    return json({ error: String(e) }, 400);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
