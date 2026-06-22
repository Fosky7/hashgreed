// supabase/functions/set-category/index.ts
// Verifies the caller owns the listing (seller in contract state) before
// writing the off-chain category. Uses the service role to bypass RLS.
import { createClient } from "jsr:@supabase/supabase-js@2";
import { verifyAuthData } from "https://esm.sh/@waves/waves-transactions@4";

const NODE = "https://nodes.krossexplorer.com";
const DAPP = "3KTJhKQUqzSMtjbteCAX79oT8PKw5pLKHko";

const VALID = new Set(["art", "photography", "music", "movies", "gaming", "digital-ip"]);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "content-type": "application/json" },
  });
}

/** Read the listing's seller from dApp state: key `seller_<assetId>`. */
async function fetchSeller(assetId: string): Promise<string | null> {
  const key = `seller_${assetId}`;
  const res = await fetch(
    `${NODE}/addresses/data/${DAPP}/${encodeURIComponent(key)}`
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`state lookup failed: ${res.status}`);
  const data = await res.json();
  return typeof data?.value === "string" ? data.value : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  let payload: {
    assetId?: string;
    category?: string;
    publicKey?: string;
    signature?: string;
    address?: string;
  };
  try {
    payload = await req.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }

  const { assetId, category, publicKey, signature, address } = payload;
  if (!assetId || !category || !publicKey || !signature || !address) {
    return json({ error: "missing fields" }, 400);
  }
  if (!VALID.has(category)) {
    return json({ error: "invalid category" }, 400);
  }

  // 1. Verify the signature binds the caller to this exact assetId+category.
  //    The client signs `kross-category:<assetId>:<category>` as authData.
  const expected = `kross-category:${assetId}:${category}`;
  let signerOk = false;
  try {
    signerOk = verifyAuthData(
      { publicKey, signature, address },
      { data: expected, host: "kross-marketplace" }
    );
  } catch {
    signerOk = false;
  }
  if (!signerOk) return json({ error: "bad signature" }, 401);

  // 2. Verify the signer is the listing's seller in contract state.
  let seller: string | null;
  try {
    seller = await fetchSeller(assetId);
  } catch (e) {
    return json({ error: `state error: ${String(e)}` }, 502);
  }
  if (!seller) return json({ error: "no active listing for asset" }, 404);
  if (seller !== address) return json({ error: "not listing owner" }, 403);

  // 3. Upsert with the service role (RLS bypassed server-side only).
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const { error } = await supabase
    .from("nft_categories")
    .upsert(
      { asset_id: assetId, category, seller: address, updated_at: new Date().toISOString() },
      { onConflict: "asset_id" }
    );
  if (error) return json({ error: error.message }, 500);

  return json({ ok: true, assetId, category });
});
