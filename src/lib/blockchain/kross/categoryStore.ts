// src/lib/blockchain/kross/categoryStore.ts
/**
 * Cross-device category index.
 *
 * Source of truth = Supabase (`nft_categories`). localStorage is a local CACHE
 * for instant, flash-free reads. Categories are off-chain only — never written
 * to the contract.
 *
 * Flow:
 *   - read():        synchronous cache snapshot (for useSyncExternalStore)
 *   - revalidate():  fetch remote, reconcile cache, notify subscribers
 *   - setCategory(): signed write via Edge Function, then update cache
 *   - clearCategory: signed/cleanup delete via Edge Function, then update cache
 */
import { supabase, FUNCTIONS_BASE } from "@/lib/supabase/client";
import { isValidCategory, type NftCategoryId } from "@/lib/blockchain/kross/categories";
import { signAuthData } from "@/lib/blockchain/kross/sdk";

const CACHE_KEY = "kross.nftCategories.cache.v2";

type CategoryMap = Record<string, NftCategoryId>;

const listeners = new Set<() => void>();
function emit() { for (const fn of listeners) fn(); }

// ---- cache layer ---------------------------------------------------------

function readCache(): CategoryMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, string>;
    const clean: CategoryMap = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (isValidCategory(v)) clean[k] = v;
    }
    return clean;
  } catch {
    return {};
  }
}

function writeCache(map: CategoryMap) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(map));
  } catch { /* ignore quota */ }
  emit();
}

// Keep a synchronous in-memory mirror so getSnapshot is cheap & stable.
let snapshot: CategoryMap = readCache();

function commit(map: CategoryMap) {
  snapshot = map;
  writeCache(map);
}

// ---- public read API -----------------------------------------------------

/** Synchronous cache snapshot (used by the React hook). */
export function read(): CategoryMap {
  return snapshot;
}

export function getCategory(assetId: string): NftCategoryId | undefined {
  return snapshot[assetId];
}

export function getAllCategories(): CategoryMap {
  return snapshot;
}

// ---- remote revalidation -------------------------------------------------

let inflight: Promise<void> | null = null;

/**
 * Fetch the full remote index and reconcile the cache. Optionally restrict to
 * a set of assetIds (the ones currently visible) to keep payloads small.
 */
export async function revalidate(assetIds?: string[]): Promise<void> {
  if (inflight) return inflight;
  inflight = (async () => {
    let query = supabase.from("nft_categories").select("asset_id, category");
    if (assetIds && assetIds.length > 0) {
      query = query.in("asset_id", assetIds);
    }
    const { data, error } = await query;
    if (error || !data) return;

    const next: CategoryMap = assetIds ? { ...snapshot } : {};
    if (assetIds) {
      // Scoped refresh: drop stale entries for the queried ids, then re-add.
      for (const id of assetIds) delete next[id];
    }
    for (const row of data) {
      if (isValidCategory(row.category)) next[row.asset_id] = row.category;
    }
    commit(next);
  })().finally(() => { inflight = null; });
  return inflight;
}

// ---- signed writes -------------------------------------------------------

async function callFn(path: string, body: Record<string, unknown>): Promise<void> {
  const res = await fetch(`${FUNCTIONS_BASE}/${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const msg = await res.json().catch(() => ({}));
    throw new Error(msg?.error || `${path} failed (${res.status})`);
  }
}

/**
 * Set a category (seller-only, enforced server-side). Signs a challenge so the
 * Edge Function can verify the caller, then optimistically updates the cache.
 */
export async function setCategory(assetId: string, category: NftCategoryId): Promise<void> {
  if (!assetId || !isValidCategory(category)) return;

  const auth = await signAuthData(`kross-category:${assetId}:${category}`, "kross-marketplace");
  await callFn("set-category", {
    assetId,
    category,
    publicKey: auth.publicKey,
    signature: auth.signature,
    address: auth.address,
  });

  commit({ ...snapshot, [assetId]: category });
}

/**
 * Clear a category. If the listing is gone (sold/cancelled) the server allows
 * cleanup without a signature; if still active it requires the seller's sig.
 */
export async function clearCategory(assetId: string, opts?: { requireAuth?: boolean }): Promise<void> {
  if (!assetId) return;

  let auth: { publicKey: string; signature: string; address: string } | null = null;
  if (opts?.requireAuth) {
    auth = await signAuthData(`kross-category-clear:${assetId}`, "kross-marketplace");
  }

  await callFn("clear-category", {
    assetId,
    ...(auth ? { publicKey: auth.publicKey, signature: auth.signature, address: auth.address } : {}),
  });

  if (assetId in snapshot) {
    const next = { ...snapshot };
    delete next[assetId];
    commit(next);
  }
}

// ---- subscription --------------------------------------------------------

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  const onStorage = (e: StorageEvent) => { if (e.key === CACHE_KEY) { snapshot = readCache(); emit(); } };
  if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(fn);
    if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
  };
}
