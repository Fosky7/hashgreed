// src/lib/blockchain/kross/listNft.ts
import { loadChainSdk } from "../loadChainSdk";
import { MARKETPLACE_DAPP } from "./marketplace.config";

const NODE_URL = "https://nodes.krossexplorer.com";
const CHAIN_ID = "N"; // Kross

/**
 * Escrow an NFT into the marketplace via invokeScript.
 * Contract call includes ONLY price + royalty — category is off-chain.
 */
export async function listNft(params: {
  assetId: string;
  priceKss: number;
  royaltyPercent: number;
  seed: string;
}): Promise<{ id: string }> {
  const { wavesTx } = await loadChainSdk("kross");
  const { invokeScript, broadcast, waitForTx } = wavesTx;

  const tx = invokeScript(
    {
      dApp: MARKETPLACE_DAPP,
      call: {
        function: "listNFT",
        args: [
          { type: "integer", value: Math.round(params.priceKss * 1e8) },
          { type: "integer", value: Math.round(params.royaltyPercent) },
        ],
      },
      payment: [{ assetId: params.assetId, amount: 1 }], // escrow the NFT
      chainId: CHAIN_ID,
      fee: 500000,
    },
    params.seed
  );

  const sent = await broadcast(tx, NODE_URL);
  await waitForTx(sent.id, { apiBase: NODE_URL });
  return { id: sent.id };
}
