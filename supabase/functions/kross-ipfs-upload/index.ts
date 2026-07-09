// supabase/functions/kross-ipfs-upload/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, json } from "../_shared/cors.ts";

const PINATA_BASE = "https://api.pinata.cloud";

/**
 * POST multipart with "image" field.
 * Returns { cid, sha256 } after pinning the image to Pinata.
 */
serve(async (req: Request): Promise<Response> => {
  // CORS pre‑flight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const form = await req.formData();
    const file = form.get("image");

    if (!(file instanceof File)) {
      return json({ error: "Missing 'image' file" }, 400);
    }

    const jwt = Deno.env.get("PINATA_JWT");
    if (!jwt) return json({ error: "Server misconfiguration" }, 500);

    const bytes = new Uint8Array(await file.arrayBuffer());

    // --- SHA‑256 (server‑side) ---
    const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const sha256 = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    // --- Pinata upload ---
    const pinataForm = new FormData();
    const blob = new Blob([bytes], { type: file.type });
    pinataForm.append("file", blob, file.name);

    const pinRes = await fetch(`${PINATA_BASE}/pinning/pinFileToIPFS`, {
      method: "POST",
      headers: { Authorization: `Bearer ${jwt}` },
      body: pinataForm,
    });

    if (!pinRes.ok) {
      const text = await pinRes.text();
      throw new Error(`Pinata error: ${text}`);
    }

    const { IpfsHash: cid } = await pinRes.json();

    return json({ cid, sha256 });
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
});
