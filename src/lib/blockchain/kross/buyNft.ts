// src/lib/blockchain/kross/buyNft.ts
import { loadChainSdk } from '../loadChainSdk';
import { MARKETPLACE_CONFIG, KROSS_CONFIG } from './marketplace.config';
import type { Listing } from './marketplace-listings';

/**
 * Buy a listed NFT by paying its price in native KSS.
 *
 * Kross specifics:
 * - Native coin: KSS
 * - Chain ID: N
 * - Native payment assetId: null
 * - Invoke fee: 0.005 KSS = 500000 wavelets
 */
export async function buyNft(assetId: string, listing: Listing, seed: string) {
  if (!assetId) throw new Error('Missing NFT asset ID.');
  if (!listing) throw new Error('Missing marketplace listing.');
  if (!listing.priceWavelets || listing.priceWavelets <= 0) {
    throw new Error('Invalid listing price.');
  }

  const { broadcast, invokeScript, waitForTx } = await loadChainSdk(
    'kross',
    '@waves/waves-transactions',
  );

  const nodeUrl = KROSS_CONFIG.nodeUrl;

  const tx = invokeScript(
    {
      dApp: MARKETPLACE_CONFIG.dAppAddress,
      call: {
        function: MARKETPLACE_CONFIG.functions.buy,
        args: [{ type: 'string', value: assetId }],
      },
      payment: [{ assetId: null, amount: listing.priceWavelets }], // native KSS
      chainId: 'N',
      fee: 500000,
    },
    seed,
  );

  const result = await broadcast(tx, nodeUrl);
  await waitForTx(result.id, { apiBase: nodeUrl });

  return {
    id: result.id,
    explorerUrl: `${KROSS_CONFIG.explorerUrl}/tx/${result.id}`,
  };
}
