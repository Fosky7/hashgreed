// src/lib/blockchain/kross/marketplace-sale.ts
import { MARKETPLACE_CONFIG } from './config';
import type { KrossSigner } from './signer';
import { getListing } from './marketplace-listings';

const MARKETPLACE_DAPP = MARKETPLACE_CONFIG.dAppAddress;

/**
 * Buy a listed NFT atomically. Reads the on-chain price, attaches exactly that
 * amount of KSS (assetId: null) as payment, matching buyNFT(assetId).
 * Contract enforces fee/royalty split, no self-buy, and exact payment.
 */
export async function buyNFT(signer: KrossSigner, assetId: string) {
  if (!MARKETPLACE_DAPP) throw new Error('Marketplace dApp address not configured');

  const listing = await getListing(assetId);
  if (!listing) throw new Error('Listing not found');
  if (listing.seller === signer.address) throw new Error('Seller cannot buy own NFT');

  return signer.invoke({
    dApp: MARKETPLACE_DAPP,
    call: { function: 'buyNFT', args: [{ type: 'string', value: assetId }] },
    payment: [{ amount: listing.priceWavelets, assetId: null }], // exact KSS price
  });
}
