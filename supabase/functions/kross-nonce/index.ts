// supabase/functions/kross-nonce/index.ts
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { address } = await req.json();
    if (!address || !String(address).startsWith("3K")) {
      return json({ error: "Invalid Kross address" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Random, single-use nonce the wallet must sign to prove key ownership.
    const nonce = `Kross login: ${crypto.randomUUID()} @ ${Date.now()}`;

    const { error } = await supabase
      .from("kross_nonces")
      .insert({ nonce, address });

    if (error) return json({ error: error.message }, 200);
    return json({ nonce });
  } catch (e) {
    return json({ error: String(e) }, 200);
  }
});
