// supabase/functions/kross-pin-metadata/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, json } from "../_shared/cors.ts";

const PINATA_BASE = "https://api.pinata.cloud";

/**
 * POST JSON body with the metadata object.
 * Pins the JSON to Pinata and returns { cid }.
 */
serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const jwt = Deno.env.get("PINATA_JWT");
    if (!jwt) return json({ error: "Server misconfiguration" }, 500);

    const metadata = await req.json();
    const payload = JSON.stringify(metadata);

    const pinRes = await fetch(`${PINATA_BASE}/pinning/pinJSONToIPFS`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json",
      },
      body: payload,
    });

    if (!pinRes.ok) {
      const text = await pinRes.text();
      throw new Error(`Pinata error: ${text}`);
    }

    const { IpfsHash: cid } = await pinRes.json();
    return json({ cid });
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
});
