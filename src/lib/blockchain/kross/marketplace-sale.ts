// src/lib/blockchain/kross/marketplace-sale.ts
import { KROSS_CONFIG, MARKETPLACE_CONFIG, MARKETPLACE_PARAMS } from './marketplace.config';
import type { KrossSigner } from './signer';
import { getListing } from './marketplace-listings';

const NODE_URL = KROSS_CONFIG.nodeUrl;

function requireDapp(): string {
  if (!MARKETPLACE_CONFIG.dAppAddress) {
    throw new Error('Marketplace dApp address not configured');
  }
  return MARKETPLACE_CONFIG.dAppAddress;
}

/**
 * Buy a listed NFT by paying its price in native KSS.
 * The dApp settles seller proceeds, creator royalty, and platform fee
 * (see MARKETPLACE_PARAMS) and transfers the NFT to the buyer.
 */
export async function buyNFT(
  signer: KrossSigner,
  assetId: string,
): Promise<{ id: string }> {
  const listing = await getListing(assetId);
  if (!listing) throw new Error('This NFT is not currently listed for sale');
  if (listing.priceWavelets <= 0) throw new Error('Invalid listing price');

  // Pay the full price in native KSS (assetId: null => unit in RIDE).
  return signer.invoke({
    dApp: requireDapp(),
    call: {
      function: MARKETPLACE_CONFIG.functions.buy,
      args: [{ type: 'string', value: assetId }],
    },
    payment: [{ assetId: MARKETPLACE_CONFIG.nativeAssetId, amount: listing.priceWavelets }],
  });
}

/** Expose fee/royalty parameters for UI quoting. */
export function getSettlementParams() {
  return {
    feeBasisPoints: MARKETPLACE_PARAMS.feeBasisPoints,
    royaltyBasisPoints: MARKETPLACE_PARAMS.royaltyBasisPoints,
    feeWalletAddress: MARKETPLACE_PARAMS.feeWalletAddress,
    explorerUrl: KROSS_CONFIG.explorerUrl,
  };
}
