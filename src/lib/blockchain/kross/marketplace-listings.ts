// src/lib/blockchain/kross/marketplace-listings.ts
import { KROSS_CONFIG, WAVELETS_PER_KSS, MAX_PRICE_WAVELETS, MARKETPLACE_CONFIG } from './marketplace.config';
import type { KrossSigner } from './signer';

export interface Listing {
  assetId: string;
  seller: string;
  priceKSS: number;
  priceWavelets: number;
  name?: string;
  category?: string;
  royaltyBp?: number;
  active: boolean;
}

const NODE_URL = KROSS_CONFIG.nodeUrl;

function requireDapp(): string {
  if (!MARKETPLACE_CONFIG.dAppAddress) {
    throw new Error('Marketplace dApp address not configured');
  }
  return MARKETPLACE_CONFIG.dAppAddress;
}

function priceToWavelets(priceKSS: number): number {
  if (!Number.isFinite(priceKSS) || priceKSS <= 0) {
    throw new Error('Price must be a positive number of KSS');
  }
  const wavelets = Math.round(priceKSS * WAVELETS_PER_KSS);
  if (wavelets > MAX_PRICE_WAVELETS) {
    throw new Error('Price exceeds maximum allowed value');
  }
  return wavelets;
}

/** Escrow + list an NFT for sale. Category is off-chain; only price is on-chain. */
export async function listNFT(
  signer: KrossSigner,
  assetId: string,
  priceKSS: number,
): Promise<{ id: string }> {
  return signer.invoke({
    dApp: requireDapp(),
    call: {
      function: MARKETPLACE_CONFIG.functions.list,
      args: [{ type: 'integer', value: priceToWavelets(priceKSS) }],
    },
    payment: [{ assetId, amount: 1 }],
  });
}

/** Update the price of an existing listing (owner-only on-chain). */
export async function updateNFTPrice(
  signer: KrossSigner,
  assetId: string,
  newPriceKSS: number,
): Promise<{ id: string }> {
  return signer.invoke({
    dApp: requireDapp(),
    call: {
      function: MARKETPLACE_CONFIG.functions.updateNFTPrice,
      args: [
        { type: 'string', value: assetId },
        { type: 'integer', value: priceToWavelets(newPriceKSS) },
      ],
    },
  });
}

/** Cancel/delist a listing and return the escrowed NFT to the seller. */
export async function cancelListing(
  signer: KrossSigner,
  assetId: string,
): Promise<{ id: string }> {
  return signer.invoke({
    dApp: requireDapp(),
    call: {
      function: MARKETPLACE_CONFIG.functions.cancel,
      args: [{ type: 'string', value: assetId }],
    },
  });
}

/** Set creator royalty in basis points (0–1000 = max 10%). */
export async function setRoyalty(
  signer: KrossSigner,
  assetId: string,
  bps: number,
): Promise<{ id: string }> {
  if (bps < 0 || bps > 1000) throw new Error('Royalty must be between 0 and 1000 bps');
  return signer.invoke({
    dApp: requireDapp(),
    call: {
      function: 'setRoyalty',
      args: [
        { type: 'string', value: assetId },
        { type: 'integer', value: Math.round(bps) },
      ],
    },
  });
}

interface RawDataEntry {
  key: string;
  type: string;
  value: string | number | boolean;
}

/** Read all active listings from the dApp's data storage. */
export async function getAllListings(): Promise<Listing[]> {
  const dApp = requireDapp();
  const res = await fetch(`${NODE_URL}/addresses/data/${dApp}`);
  if (!res.ok) throw new Error(`Failed to load listings (${res.status})`);
  const entries: RawDataEntry[] = await res.json();

  const byAsset = new Map<string, Partial<Listing>>();
  const ensure = (assetId: string) => {
    let l = byAsset.get(assetId);
    if (!l) {
      l = { assetId, active: false };
      byAsset.set(assetId, l);
    }
    return l;
  };

  for (const e of entries) {
    const priceMatch = e.key.match(/^(.+)_price$/);
    if (priceMatch && typeof e.value === 'number') {
      const l = ensure(priceMatch[1]);
      l.priceWavelets = e.value;
      l.priceKSS = e.value / WAVELETS_PER_KSS;
      l.active = e.value > 0;
      continue;
    }
    const sellerMatch = e.key.match(/^(.+)_seller$/);
    if (sellerMatch && typeof e.value === 'string') {
      ensure(sellerMatch[1]).seller = e.value;
      continue;
    }
    const royaltyMatch = e.key.match(/^(.+)_royalty$/);
    if (royaltyMatch && typeof e.value === 'number') {
      ensure(royaltyMatch[1]).royaltyBp = e.value;
    }
  }

  return Array.from(byAsset.values())
    .filter((l): l is Listing => !!l.assetId && !!l.active && typeof l.priceWavelets === 'number')
    .map((l) => ({
      assetId: l.assetId!,
      seller: l.seller ?? '',
      priceWavelets: l.priceWavelets!,
      priceKSS: l.priceKSS ?? l.priceWavelets! / WAVELETS_PER_KSS,
      royaltyBp: l.royaltyBp,
      active: true,
    }));
}

/** Read a single listing by assetId. Returns null when not actively listed. */
export async function getListing(assetId: string): Promise<Listing | null> {
  const all = await getAllListings();
  return all.find((l) => l.assetId === assetId) ?? null;
}
