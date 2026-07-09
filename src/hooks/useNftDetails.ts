// src/hooks/useNftDetails.ts
import { useEffect, useState, useCallback } from 'react';
import { KROSS_CONFIG } from '@/lib/blockchain/kross/marketplace.config';

const NODE_URL = KROSS_CONFIG.nodeUrl;
const GATEWAY = 'https://ipfs.io/ipfs/';

export interface NftAttribute {
  trait_type: string;
  value: string | number;
}

export interface NftMetadata {
  name?: string;
  description?: string;
  image?: string;
  attributes?: NftAttribute[];
}

export interface NftTransfer {
  id: string;
  type: number;
  kind: 'issue' | 'transfer' | 'invoke' | 'other';
  sender?: string;
  recipient?: string;
  timestamp: number;
}

export interface NftDetails {
  assetId: string;
  name: string;
  description: string;
  imageUrl: string;
  issuer: string;
  owner: string;
  decimals: number;
  quantity: number;
  reissuable: boolean;
  metadata: NftMetadata | null;
  transfers: NftTransfer[];
}

/** Normalize an ipfs:// URI (or raw CID) to an HTTP gateway URL. */
function resolveIpfs(uri: string | undefined | null): string {
  if (!uri) return '';
  if (uri.startsWith('ipfs://')) return GATEWAY + uri.slice('ipfs://'.length);
  if (/^[a-zA-Z0-9]{46,}$/.test(uri) && !uri.startsWith('http')) {
    return GATEWAY + uri;
  }
  return uri;
}

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
}

/** Fetch the asset's core on-chain details from the Kross node. */
async function fetchAssetDetails(assetId: string) {
  return fetchJson(`${NODE_URL}/assets/details/${assetId}?full=true`);
}

/** Try to resolve current owner by inspecting recent transfer history. */
function deriveOwner(issuer: string, transfers: NftTransfer[]): string {
  // The most recent transfer recipient is the current holder of a 1/1 NFT.
  const lastTransfer = transfers.find(
    (t) => t.kind === 'transfer' && t.recipient,
  );
  return lastTransfer?.recipient ?? issuer;
}

function classifyTx(type: number): NftTransfer['kind'] {
  if (type === 3) return 'issue';
  if (type === 4) return 'transfer';
  if (type === 16) return 'invoke';
  return 'other';
}

/** Fetch transactions referencing this asset (best-effort from node). */
async function fetchAssetTransfers(assetId: string): Promise<NftTransfer[]> {
  try {
    const data = await fetchJson(
      `${NODE_URL}/assets/${assetId}/distribution/transactions/limit/50`,
    ).catch(() => null);

    // Fallback: the node distribution endpoint varies; if unavailable, return [].
    if (!data) return [];

    const raw: any[] = Array.isArray(data?.[0]) ? data[0] : data?.items ?? [];
    return raw
      .filter((tx) => tx && tx.id)
      .map((tx) => ({
        id: tx.id,
        type: tx.type,
        kind: classifyTx(tx.type),
        sender: tx.sender,
        recipient: tx.recipient,
        timestamp: tx.timestamp,
      }));
  } catch {
    return [];
  }
}

export function useNftDetails(assetId: string | undefined) {
  const [details, setDetails] = useState<NftDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!assetId) return;
    setLoading(true);
    setError(null);
    try {
      const asset = await fetchAssetDetails(assetId);

      // The issue transaction is the first historical event.
      const issueTransfer: NftTransfer = {
        id: assetId,
        type: 3,
        kind: 'issue',
        sender: asset.issuer,
        recipient: asset.issuer,
        timestamp: asset.issueTimestamp ?? Date.now(),
      };

      const transfers = await fetchAssetTransfers(assetId);
      const history = [...transfers];
      if (!history.some((t) => t.kind === 'issue')) history.push(issueTransfer);
      history.sort((a, b) => b.timestamp - a.timestamp);

      // Parse embedded metadata. Kross asset description may hold a JSON blob
      // or an ipfs:// URI pointing at the metadata JSON.
      let metadata: NftMetadata | null = null;
      const rawDesc: string = asset.description ?? '';
      if (rawDesc.startsWith('ipfs://') || rawDesc.startsWith('http')) {
        metadata = await fetchJson(resolveIpfs(rawDesc)).catch(() => null);
      } else if (rawDesc.trim().startsWith('{')) {
        try {
          metadata = JSON.parse(rawDesc);
        } catch {
          metadata = null;
        }
      }

      const imageUrl = resolveIpfs(metadata?.image) || resolveIpfs(rawDesc);
      const owner = deriveOwner(asset.issuer, history);

      setDetails({
        assetId,
        name: metadata?.name ?? asset.name ?? 'Unnamed NFT',
        description: metadata?.description ?? (metadata ? '' : rawDesc),
        imageUrl,
        issuer: asset.issuer,
        owner,
        decimals: asset.decimals ?? 0,
        quantity: asset.quantity ?? 1,
        reissuable: !!asset.reissuable,
        metadata,
        transfers: history,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load NFT details.');
    } finally {
      setLoading(false);
    }
  }, [assetId]);

  useEffect(() => {
    load();
  }, [load]);

  return { details, loading, error, reload: load };
}

export default useNftDetails;
