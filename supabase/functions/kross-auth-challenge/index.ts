// supabase/functions/kross-auth-challenge/index.ts
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const HOST = "krossbuild.app";
const TTL_MS = 2 * 60 * 1000; // 2 minutes

serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const nonce = crypto.randomUUID();
  const expiresAt = Date.now() + TTL_MS;
  const data = JSON.stringify({ chain: "kross", nonce, expiresAt });

  // Persist nonce so it can be consumed exactly once (replay protection).
  await supabase.from("kross_auth_nonces").insert({
    nonce,
    expires_at: new Date(expiresAt).toISOString(),
    used: false,
  });

  return new Response(JSON.stringify({ data, host: HOST }), {
    headers: { "Content-Type": "application/json" },
  });
});
