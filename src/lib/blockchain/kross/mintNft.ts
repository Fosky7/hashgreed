// src/lib/blockchain/kross/mintNft.ts
import { CHAIN_ID, FEES, explorerTxUrl } from './config';
import { broadcastTx, loadTransactionsSdk } from './sdk';

/** NFT metadata accepted by the mint form / mintNft(). */
export interface NftMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: Array<{ trait_type: string; value: string }>;
  externalUrl?: string;
}

/** Validate an image URL / IPFS link before minting. */
export function isValidImageInput(input: string): boolean {
  const v = String(input ?? '').trim();
  if (!v) return false;
  return v.startsWith('https://') || v.startsWith('ipfs://');
}

/** Resolve common NFT metadata image URLs into directly renderable URLs. */
export function resolveImageUrl(url: string): string {
  const clean = String(url ?? '').trim();
  if (!clean) return '';
  if (clean.startsWith('ipfs://')) return `https://ipfs.io/ipfs/${clean.slice('ipfs://'.length)}`;
  return clean;
}

/** Mint an NFT (issue with quantity 1, decimals 0, reissuable false) on Kross (KSS). */
export async function mintNft(
  meta: NftMetadata,
): Promise<{ assetId: string; id: string; name: string; explorerUrl: string }> {
  if (!meta.name || meta.name.trim().length < 4) {
    throw new Error('NFT name must be at least 4 characters.');
  }
  if (!isValidImageInput(meta.image)) {
    throw new Error('A valid image URL (https:// or ipfs://) is required.');
  }

  const { getSessionSeed } = await import('./session');
  const seed = await getSessionSeed('');
  if (!seed) throw new Error('Wallet is locked — unlock to mint.');

  const { issue } = await loadTransactionsSdk();

  // Embed full metadata JSON in the asset description so explorers/marketplaces
  // can render the NFT (image, attributes, external URL).
  const description = JSON.stringify({
    description: meta.description ?? '',
    image: meta.image.trim(),
    attributes: meta.attributes ?? [],
    externalUrl: meta.externalUrl ?? '',
  }).slice(0, 1000);

  const tx = issue(
    {
      name: meta.name.trim(),
      description,
      quantity: 1,
      decimals: 0,
      reissuable: false,
      chainId: CHAIN_ID,
      fee: FEES.ISSUE_NFT,
    },
    seed,
  );

  const sent = await broadcastTx(tx);
  const id = String((sent as { id?: string }).id ?? '');
  if (!id) throw new Error('Kross node did not return a transaction id.');
  return { assetId: id, id, name: meta.name.trim(), explorerUrl: explorerTxUrl(id) };
}
