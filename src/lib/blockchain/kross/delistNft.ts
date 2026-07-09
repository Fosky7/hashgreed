// src/lib/blockchain/kross/delistNft.ts
import { loadChainSdk } from '../loadChainSdk';
import { MARKETPLACE_CONFIG, KROSS_CONFIG } from './marketplace.config';

export async function delistNft(assetId: string, seed: string) {
  const { broadcast, invokeScript, waitForTx } = await loadChainSdk('kross');
  const nodeUrl = KROSS_CONFIG.nodeUrl;

  const tx = invokeScript(
    {
      dApp: MARKETPLACE_CONFIG.dAppAddress,
      call: {
        function: MARKETPLACE_CONFIG.functions.delist,
        args: [{ type: 'string', value: assetId }],
      },
      chainId: 'N',
      fee: 100000,
    },
    seed,
  );

  await broadcast(tx, nodeUrl);
  await waitForTx(tx.id, { apiBase: nodeUrl });
  return { id: tx.id };
}
