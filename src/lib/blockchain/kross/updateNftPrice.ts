// src/lib/blockchain/kross/updateNftPrice.ts
import { loadChainSdk } from '../loadChainSdk';
import { MARKETPLACE_CONFIG, KROSS_CONFIG } from './marketplace.config';

export async function updateNFTPrice(params: {
  assetId: string;
  newPriceKSS: number;
  password: string; // seed
}) {
  const { assetId, newPriceKSS, password } = params;
  const newPriceWavelets = Math.round(newPriceKSS * 1e8);

  const { broadcast, invokeScript, waitForTx } = await loadChainSdk('kross');
  const nodeUrl = KROSS_CONFIG.nodeUrl;

  const tx = invokeScript(
    {
      dApp: MARKETPLACE_CONFIG.dAppAddress,
      call: {
        function: MARKETPLACE_CONFIG.functions.updatePrice,
        args: [
          { type: 'string', value: assetId },
          { type: 'integer', value: newPriceWavelets },
        ],
      },
      chainId: 'N',
      fee: 100000,
    },
    password,
  );

  await broadcast(tx, nodeUrl);
  await waitForTx(tx.id, { apiBase: nodeUrl });
  return {
    id: tx.id,
    explorerUrl: `${KROSS_CONFIG.explorerUrl}/tx/${tx.id}`,
  };
}
