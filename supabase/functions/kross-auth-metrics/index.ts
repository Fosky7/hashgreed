// supabase/functions/kross-auth-metrics/index.ts
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Gate behind an admin secret so metrics aren't publicly readable.
    const adminSecret = req.headers.get("x-admin-secret");
    if (!adminSecret || adminSecret !== Deno.env.get("KROSS_ADMIN_SECRET")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")! // service role bypasses RLS
    );

    const { data, error } = await supabase
      .from("kross_auth_metrics")
      .select("*")
      .single();

    if (error) return json({ error: error.message }, 200);

    return json(data);
  } catch (e) {
    return json({ error: String(e) }, 200);
  }
});
