// supabase/functions/kross-session-logout/index.ts
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();
    if (!token) return json({ ok: false, error: "Missing token" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error } = await supabase
      .from("kross_sessions")
      .update({ revoked: true })
      .eq("token", token);

    if (error) return json({ ok: false, error: error.message }, 200);
    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 200);
  }
});
