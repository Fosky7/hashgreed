// src/lib/blockchain/kross/mintNft.ts
import { CHAIN_ID, FEES, explorerTxUrl } from './config';
import { broadcastTx, loadTransactionsSdk } from './sdk';

/** Resolve common NFT metadata image URLs into directly renderable URLs. */
export function resolveImageUrl(url: string): string {
  const clean = String(url ?? '').trim();
  if (!clean) return '';
  if (clean.startsWith('ipfs://')) return `https://ipfs.io/ipfs/${clean.slice('ipfs://'.length)}`;
  return clean;
}

/** Mint an NFT (issue with quantity 1, decimals 0, reissuable false) on Kross (KSS). */
export async function mintNft(params: {
  name: string;
  description: string;
  seed: string;
}): Promise<{ assetId: string; id: string; explorerUrl: string }> {
  const { issue } = await loadTransactionsSdk();

  const tx = issue(
    {
      name: params.name,
      description: params.description,
      quantity: 1,
      decimals: 0,
      reissuable: false,
      chainId: CHAIN_ID,
      fee: FEES.ISSUE_NFT,
    },
    params.seed,
  );

  const sent = await broadcastTx(tx);
  const id = String((sent as { id?: string }).id ?? '');
  if (!id) throw new Error('Kross node did not return a transaction id.');
  return { assetId: id, id, explorerUrl: explorerTxUrl(id) };
}
