// src/lib/blockchain/kross/listNft.ts
import { loadChainSdk } from '../loadChainSdk';
import { MARKETPLACE_CONFIG, KROSS_CONFIG } from './marketplace.config';

export interface ListNftParams {
  assetId: string;
  priceKSS: number;
  royaltyPercent: number; // reserved for future royalty enforcement
  seed: string;
}

/**
 * Invoke the marketplace dApp's listNFT function.
 * Transfers 1 unit of the NFT asset to the dApp as deposit.
 */
export async function listNft(params: ListNftParams) {
  const { assetId, priceKSS, seed } = params;
  const priceWavelets = Math.round(priceKSS * 1e8);

  const { broadcast, invokeScript, waitForTx } = await loadChainSdk('kross');
  const nodeUrl = KROSS_CONFIG.nodeUrl;

  const tx = invokeScript(
    {
      dApp: MARKETPLACE_CONFIG.dAppAddress,
      call: {
        function: MARKETPLACE_CONFIG.functions.list,
        args: [
          { type: 'string', value: assetId },
          { type: 'integer', value: priceWavelets },
        ],
      },
      payment: [{ assetId, amount: 1 }],
      chainId: 'N',
      fee: 100000,
    },
    seed,
  );

  await broadcast(tx, nodeUrl);
  await waitForTx(tx.id, { apiBase: nodeUrl });
  return { id: tx.id };
}
