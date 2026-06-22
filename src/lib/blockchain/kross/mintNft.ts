// src/lib/blockchain/kross/mintNft.ts
import { loadChainSdk } from "../loadChainSdk";

const NODE_URL = "https://nodes.krossexplorer.com";
const CHAIN_ID = "N"; // Kross

/** Mint an NFT (issue with quantity 1, decimals 0, reissuable false) on Kross (KSS). */
export async function mintNft(params: {
  name: string;
  description: string;
  seed: string;
}): Promise<{ assetId: string; id: string }> {
  const { wavesTx } = await loadChainSdk("kross");
  const { issue, broadcast, waitForTx } = wavesTx;

  const tx = issue(
    {
      name: params.name,
      description: params.description,
      quantity: 1,
      decimals: 0,
      reissuable: false,
      chainId: CHAIN_ID,
      fee: 100000, // NFT issue fee on Kross
    },
    params.seed
  );

  const sent = await broadcast(tx, NODE_URL);
  await waitForTx(sent.id, { apiBase: NODE_URL });
  return { assetId: sent.id, id: sent.id };
}
