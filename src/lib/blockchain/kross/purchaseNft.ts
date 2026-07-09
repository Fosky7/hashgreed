// src/lib/blockchain/kross/purchaseNft.ts
import { buyNft } from './buyNft';
import { getListing, type Listing } from './marketplace-listings';
import { resolveSeed } from './resolve-seed';
import { KROSS_CONFIG } from './marketplace.config';

export interface PurchaseNftResult {
  id: string;
  explorerUrl: string;
  listing: Listing;
}

/**
 * Purchase a listed NFT using the managed Kross wallet.
 *
 * Seed material is resolved only inside the Kross blockchain layer, never in UI
 * components. The UI passes only the assetId/listing.
 */
export async function purchaseListedNft(
  assetId: string,
  listingOverride?: Listing | null,
): Promise<PurchaseNftResult> {
  if (!assetId) throw new Error('Missing NFT asset ID.');

  const listing = listingOverride ?? (await getListing(assetId));
  if (!listing) {
    throw new Error('This NFT is not currently listed for sale.');
  }

  if (!listing.priceWavelets || listing.priceWavelets <= 0) {
    throw new Error('This listing has an invalid KSS price.');
  }

  const seed = await resolveSeed();
  const result = await buyNft(assetId, listing, seed);

  return {
    id: result.id,
    explorerUrl: result.explorerUrl || `${KROSS_CONFIG.explorerUrl}/tx/${result.id}`,
    listing,
  };
}
