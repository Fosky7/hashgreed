// supabase/functions/kross-session-validate/index.ts
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/cors.ts";

const SLIDING_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // extend 7d on each validate

serve(async (req) => {
  // Handle CORS preflight FIRST — this was the missing piece.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();
    if (!token) return json({ valid: false, error: "Missing token" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: row, error } = await supabase
      .from("kross_sessions")
      .select("token, address, revoked, expires_at")
      .eq("token", token)
      .maybeSingle();

    // Surface DB errors clearly instead of a generic 400.
    if (error) return json({ valid: false, error: `DB: ${error.message}` }, 200);
    if (!row) return json({ valid: false, error: "Unknown token" }, 200);
    if (row.revoked) return json({ valid: false, error: "Revoked" }, 200);
    if (new Date(row.expires_at).getTime() < Date.now()) {
      return json({ valid: false, error: "Expired" }, 200);
    }
    if (!String(row.address).startsWith("3K")) {
      return json({ valid: false, error: "Bad address" }, 200);
    }

    // Sliding expiry: bump expires_at so active users stay logged in.
    const newExpiry = new Date(Date.now() + SLIDING_WINDOW_MS).toISOString();
    await supabase
      .from("kross_sessions")
      .update({ expires_at: newExpiry })
      .eq("token", token);

    return json({ valid: true, address: row.address, expiresAt: newExpiry });
  } catch (e) {
    // Return 200 with valid:false so the client treats it as "logged out",
    // not as a network/Edge failure.
    return json({ valid: false, error: String(e) }, 200);
  }
});
