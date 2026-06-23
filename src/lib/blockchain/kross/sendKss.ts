// src/lib/blockchain/kross/sendKss.ts
import { loadChainSdk } from "../loadChainSdk";

const NODE_URL = "https://nodes.krossexplorer.com";
const CHAIN_ID = "N"; // Kross

/** Transfer native KSS on Kross. amountKss is in whole KSS (8 decimals). */
export async function sendKss(params: {
  recipient: string;
  amountKss: number;
  seed: string;
  attachment?: string;
}): Promise<{ id: string }> {
  const { wavesTx } = await loadChainSdk("kross");
  const { transfer, broadcast, waitForTx } = wavesTx;

  const tx = transfer(
    {
      recipient: params.recipient,
      amount: Math.round(params.amountKss * 1e8), // KSS uses 8 decimals
      assetId: null, // native KSS
      attachment: params.attachment,
      chainId: CHAIN_ID,
      fee: 100000,
    },
    params.seed
  );

  const sent = await broadcast(tx, NODE_URL);
  await waitForTx(sent.id, { apiBase: NODE_URL });
  return { id: sent.id };
}
