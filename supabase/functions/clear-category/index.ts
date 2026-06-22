// supabase/functions/clear-category/index.ts
// Deletes a category mapping. Allowed if caller is the seller, OR if the
// listing no longer exists in state (sold/cancelled — anyone can clean it up).
import { createClient } from "jsr:@supabase/supabase-js@2";

const NODE = "https://nodes.krossexplorer.com";
const DAPP = "3KTJhKQUqzSMtjbteCAX79oT8PKw5pLKHko";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "content-type": "application/json" } });

async function fetchSeller(assetId: string): Promise<string | null> {
  const res = await fetch(`${NODE}/addresses/data/${DAPP}/${encodeURIComponent(`seller_${assetId}`)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`state ${res.status}`);
  const data = await res.json();
  return typeof data?.value === "string" ? data.value : null;
}

/**
 * Verify a Kross auth signature. The SDK is imported DYNAMICALLY (not at
 * module top-level) so the Node-global init code only runs when actually
 * needed — mirroring the front-end loadChainSdk pattern.
 */
async function verifyKrossSignature(params: {
  publicKey: string;
  signature: string;
  address: string;
  data: string;
}): Promise<boolean> {
  const { verifyAuthData } = await import("npm:@waves/waves-transactions@4.3.4");
  try {
    return verifyAuthData(
      { publicKey: params.publicKey, signature: params.signature, address: params.address },
      { data: params.data, host: "kross-marketplace" },
    );
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  let p: { assetId?: string; publicKey?: string; signature?: string; address?: string };
  try { p = await req.json(); } catch { return json({ error: "invalid json" }, 400); }
  const { assetId, publicKey, signature, address } = p;
  if (!assetId) return json({ error: "missing assetId" }, 400);

  // If the listing is gone (sold/cancelled), allow cleanup with no auth.
  let seller: string | null;
  try { seller = await fetchSeller(assetId); } catch (e) { return json({ error: String(e) }, 502); }

  if (seller) {
    // Listing still active → require seller signature to remove.
    if (!publicKey || !signature || !address) return json({ error: "auth required" }, 401);
    const expected = `kross-category-clear:${assetId}`;
    const ok = await verifyKrossSignature({ publicKey, signature, address, data: expected });
    if (!ok) return json({ error: "bad signature" }, 401);
    if (seller !== address) return json({ error: "not listing owner" }, 403);
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { error } = await supabase.from("nft_categories").delete().eq("asset_id", assetId);
  if (error) return json({ error: error.message }, 500);
  return json({ ok: true, assetId });
});
