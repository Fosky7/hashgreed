// src/hooks/useNftDetail.ts
import { useCallback, useEffect, useState } from 'react';
import { KROSS_CONFIG, fromWavelets } from '@/lib/blockchain/kross/marketplace.config';
import { getListing } from '@/lib/blockchain/kross/marketplace-listings';
import { resolveImageUrl } from '@/lib/blockchain/kross/mintNft';

const NODE_URL = KROSS_CONFIG.nodeUrl;

export interface NftAttribute {
  trait_type: string;
  value: string;
}

export interface NftDetail {
  assetId: string;
  name: string;
  description: string;
  image: string;
  attributes: NftAttribute[];
  externalUrl: string;
  issuer: string;
  /** Current owner (best-effort: issuer until transfer history says otherwise). */
  decimals: number;
  quantity: number;
  reissuable: boolean;
}

export interface OwnerEvent {
  id: string;
  type: 'mint' | 'transfer' | 'sale' | 'list';
  from?: string;
  to?: string;
  amountKss?: number;
  timestamp: number;
}

export interface ListingInfo {
  isListed: boolean;
  priceKss?: number;
  seller?: string;
}

interface UseNftDetailResult {
  nft: NftDetail | null;
  history: OwnerEvent[];
  listing: ListingInfo;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/** Parse the metadata JSON embedded in an asset's description (see mintNft). */
function parseMetadata(rawDescription: string): {
  description: string;
  image: string;
  attributes: NftAttribute[];
  externalUrl: string;
} {
  try {
    const parsed = JSON.parse(rawDescription);
    return {
      description: typeof parsed.description === 'string' ? parsed.description : '',
      image: typeof parsed.image === 'string' ? parsed.image : '',
      attributes: Array.isArray(parsed.attributes) ? parsed.attributes : [],
      externalUrl: typeof parsed.externalUrl === 'string' ? parsed.externalUrl : '',
    };
  } catch {
    // Legacy assets stored a plain text description.
    return { description: rawDescription, image: '', attributes: [], externalUrl: '' };
  }
}

export function useNftDetail(assetId: string | undefined): UseNftDetailResult {
  const [nft, setNft] = useState<NftDetail | null>(null);
  const [history, setHistory] = useState<OwnerEvent[]>([]);
  const [listing, setListing] = useState<ListingInfo>({ isListed: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!assetId) {
      setError('No asset id provided.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // 1. Asset details (name, description w/ metadata JSON, issuer, supply)
      const assetRes = await fetch(`${NODE_URL}/assets/details/${assetId}`);
      if (!assetRes.ok) throw new Error(`Asset not found (${assetRes.status})`);
      const asset = await assetRes.json();

      const meta = parseMetadata(asset.description ?? '');
      const detail: NftDetail = {
        assetId,
        name: asset.name ?? 'Unnamed NFT',
        description: meta.description,
        image: resolveImageUrl(meta.image),
        attributes: meta.attributes,
        externalUrl: meta.externalUrl,
        issuer: asset.issuer ?? '',
        decimals: asset.decimals ?? 0,
        quantity: asset.quantity ?? 1,
        reissuable: !!asset.reissuable,
      };
      setNft(detail);

      // 2. Owner / transfer history (transactions that reference this asset)
      const events = await loadHistory(assetId, asset.issuer ?? '');
      setHistory(events);

      // 3. Current marketplace listing
      try {
        const l = await getListing(assetId);
        if (l && l.priceWavelets > 0) {
          setListing({
            isListed: true,
            priceKss: fromWavelets(l.priceWavelets),
            seller: (l as any).seller ?? (l as any).owner,
          });
        } else {
          setListing({ isListed: false });
        }
      } catch {
        setListing({ isListed: false });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load NFT details.');
    } finally {
      setLoading(false);
    }
  }, [assetId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { nft, history, listing, loading, error, refresh: load };
}

/** Build a best-effort ownership timeline from the issuer's recent transfers. */
async function loadHistory(assetId: string, issuer: string): Promise<OwnerEvent[]> {
  const events: OwnerEvent[] = [];

  // Mint event derived from the issue transaction id (== assetId on Kross).
  try {
    const issueRes = await fetch(`${NODE_URL}/transactions/info/${assetId}`);
    if (issueRes.ok) {
      const issueTx = await issueRes.json();
      events.push({
        id: assetId,
        type: 'mint',
        to: issueTx.sender ?? issuer,
        timestamp: issueTx.timestamp ?? Date.now(),
      });
    }
  } catch {
    /* ignore */
  }

  // Scan recent transfers of this asset from the issuer address.
  try {
    const txRes = await fetch(
      `${NODE_URL}/transactions/address/${issuer}/limit/50`,
    );
    if (txRes.ok) {
      const data = await txRes.json();
      const txs = Array.isArray(data?.[0]) ? data[0] : data;
      for (const tx of txs) {
        if (tx.type === 4 && tx.assetId === assetId) {
          events.push({
            id: tx.id,
            type: 'transfer',
            from: tx.sender,
            to: tx.recipient,
            timestamp: tx.timestamp,
          });
        }
      }
    }
  } catch {
    /* ignore */
  }

  // Newest first.
  return events.sort((a, b) => b.timestamp - a.timestamp);
}

export default useNftDetail;
