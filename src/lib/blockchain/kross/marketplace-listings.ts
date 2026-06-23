// src/lib/blockchain/kross/marketplace-listings.ts
import { KROSS_CONFIG, WAVELETS_PER_KSS, MAX_PRICE_WAVELETS } from './deployed.config';
import type { KrossSigner } from './signer';

const { NODE_URL, MARKETPLACE_DAPP } = KROSS_CONFIG;

export function kssToWavelets(amountKSS: number): number {
  return Math.round(amountKSS * WAVELETS_PER_KSS);
}
export function waveletsToKss(wavelets: number): number {
  return wavelets / WAVELETS_PER_KSS;
}

function requireDapp(): string {
  if (!MARKETPLACE_DAPP) throw new Error('Marketplace dApp address not configured');
  return MARKETPLACE_DAPP;
}

/**
 * List an NFT into escrow. Attaches exactly 1 NFT unit (assetId) as payment,
 * matching listNFT(assetId, price). Signing routed through managed signer.
 */
export async function listNFT(signer: KrossSigner, assetId: string, priceKSS: number) {
  const dApp = requireDapp();
  if (priceKSS <= 0) throw new Error('Price must be positive');
  const priceWavelets = kssToWavelets(priceKSS);
  if (priceWavelets > MAX_PRICE_WAVELETS) throw new Error('Price too high to prevent overflow');

  return signer.invoke({
    dApp,
    call: {
      function: 'listNFT',
      args: [
        { type: 'string', value: assetId },
        { type: 'integer', value: priceWavelets },
      ],
    },
    payment: [{ amount: 1, assetId }], // escrow the NFT
  });
}

/** Update price of an already-listed NFT (seller-only). */
export async function updateNFTPrice(signer: KrossSigner, assetId: string, newPriceKSS: number) {
  const dApp = requireDapp();
  if (newPriceKSS <= 0) throw new Error('Price must be positive');
  const newPriceWavelets = kssToWavelets(newPriceKSS);
  if (newPriceWavelets > MAX_PRICE_WAVELETS) throw new Error('Price too high to prevent overflow');

  return signer.invoke({
    dApp,
    call: {
      function: 'updateNFTPrice',
      args: [
        { type: 'string', value: assetId },
        { type: 'integer', value: newPriceWavelets },
      ],
    },
  });
}

/** Cancel a listing and return the escrowed NFT to the seller. */
export async function cancelListing(signer: KrossSigner, assetId: string) {
  const dApp = requireDapp();
  return signer.invoke({
    dApp,
    call: { function: 'cancelListing', args: [{ type: 'string', value: assetId }] },
  });
}

/** Creator-only: set perpetual royalty (250-500 bps). */
export async function setRoyalty(signer: KrossSigner, assetId: string, bps: number) {
  const dApp = requireDapp();
  if (bps < 250 || bps > 500) throw new Error('Royalty must be between 250 and 500 bps');
  return signer.invoke({
    dApp,
    call: {
      function: 'setRoyalty',
      args: [
        { type: 'string', value: assetId },
        { type: 'integer', value: bps },
      ],
    },
  });
}

// ---------- Read helpers (no signing) ----------

export interface Listing {
  assetId: string;
  priceWavelets: number;
  priceKSS: number;
  seller: string;
}

export async function getListing(assetId: string): Promise<Listing | null> {
  const dApp = requireDapp();
  const priceKey = `listing_${assetId}_price`;
  const sellerKey = `listing_${assetId}_seller`;

  const [priceRes, sellerRes] = await Promise.all([
    fetch(`${NODE_URL}/addresses/data/${dApp}/${priceKey}`),
    fetch(`${NODE_URL}/addresses/data/${dApp}/${sellerKey}`),
  ]);
  if (!priceRes.ok || !sellerRes.ok) return null;

  const priceData = await priceRes.json();
  const sellerData = await sellerRes.json();
  const priceWavelets = Number(priceData.value);

  return {
    assetId,
    priceWavelets,
    priceKSS: waveletsToKss(priceWavelets),
    seller: String(sellerData.value),
  };
}

export async function getAllListings(): Promise<Listing[]> {
  const dApp = requireDapp();
  const res = await fetch(`${NODE_URL}/addresses/data/${dApp}?matches=listing_.%2A_price`);
  if (!res.ok) return [];
  const entries: Array<{ key: string; value: number }> = await res.json();

  return Promise.all(
    entries.map(async (e) => {
      const assetId = e.key.replace(/^listing_/, '').replace(/_price$/, '');
      const listing = await getListing(assetId);
      return (
        listing ?? {
          assetId,
          priceWavelets: Number(e.value),
          priceKSS: waveletsToKss(Number(e.value)),
          seller: '',
        }
      );
    }),
  );
}
