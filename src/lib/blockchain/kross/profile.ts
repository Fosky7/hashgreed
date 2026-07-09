// src/lib/blockchain/kross/profile.ts
import DEPLOYED_CONFIG from './deployed.config';
import { getListings, type Listing } from './marketplace-listings';

const NODE_URL = DEPLOYED_CONFIG.nodeUrl;
const EXPLORER_URL = DEPLOYED_CONFIG.explorerUrl;
const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs';

export interface ProfileNftAttribute {
  trait_type?: string;
  type?: string;
  key?: string;
  name?: string;
  value?: string | number | boolean | null;
  [key: string]: unknown;
}

export interface ProfileNftMetadata {
  name?: string;
  description?: string;
  image?: string;
  image_url?: string;
  imageUrl?: string;
  collection?: string | { name?: string; id?: string; slug?: string };
  collectionName?: string;
  collection_name?: string;
  category?: string;
  attributes?: ProfileNftAttribute[];
  [key: string]: unknown;
}

export interface ProfileOwnedNft {
  assetId: string;
  name: string;
  description: string;
  imageUrl: string;
  issuer: string;
  owner: string;
  isCreatedByUser: boolean;
  isListedByUser: boolean;
  collectionName: string;
  category: string;
  quantity: number;
  decimals: number;
  listing: Listing | null;
  explorerUrl: string;
}

export interface ProfileCollection {
  id: string;
  name: string;
  coverImage: string;
  itemCount: number;
  listedCount: number;
  categories: string[];
  floorPriceKSS: number | null;
  nftIds: string[];
}

export interface ProfileActivityItem {
  id: string;
  type: number;
  kind: 'sent' | 'received' | 'minted' | 'listed' | 'bought' | 'sold' | 'invoke' | 'other';
  title: string;
  description: string;
  timestamp: number;
  amountKSS?: number;
  assetId?: string | null;
  counterparty?: string;
  explorerUrl: string;
}

export interface UserProfileData {
  address: string;
  ownedNfts: ProfileOwnedNft[];
  createdCollections: ProfileCollection[];
  recentActivity: ProfileActivityItem[];
}

function normalizeIpfsUrl(value?: string | null): string {
  if (!value) return '';
  const trimmed = String(value).trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('ipfs://ipfs/')) {
    return `${IPFS_GATEWAY}/${trimmed.replace('ipfs://ipfs/', '')}`;
  }

  if (trimmed.startsWith('ipfs://')) {
    return `${IPFS_GATEWAY}/${trimmed.replace('ipfs://', '')}`;
  }

  return trimmed;
}

function extractFirstUrl(value?: string | null): string {
  if (!value) return '';
  const match = String(value).match(/(ipfs:\/\/[^\s"'<>]+|https?:\/\/[^\s"'<>]+)/i);
  return normalizeIpfsUrl(match?.[0] ?? '');
}

function tryParseJson(value?: string | null): unknown | null {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isMetadata(value: unknown): value is ProfileNftMetadata {
  return isObject(value);
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Kross node request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

async function fetchOptionalJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function resolveMetadataUrl(description: string): string {
  const parsed = tryParseJson(description);

  if (isObject(parsed)) {
    const candidate =
      (parsed.metadataUrl as string | undefined) ||
      (parsed.metadata_url as string | undefined) ||
      (parsed.uri as string | undefined) ||
      (parsed.url as string | undefined);

    if (candidate) return normalizeIpfsUrl(candidate);
  }

  const normalized = normalizeIpfsUrl(description);
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return normalized;
  }

  return extractFirstUrl(description);
}

async function resolveMetadata(description: string): Promise<ProfileNftMetadata | null> {
  const parsed = tryParseJson(description);
  if (isMetadata(parsed)) return parsed;

  const metadataUrl = resolveMetadataUrl(description);
  if (!metadataUrl) return null;

  const metadata = await fetchOptionalJson<ProfileNftMetadata>(metadataUrl);
  return isMetadata(metadata) ? metadata : null;
}

function resolveImageUrl(metadata: ProfileNftMetadata | null, description: string): string {
  const image =
    metadata?.image ||
    metadata?.image_url ||
    metadata?.imageUrl ||
    extractFirstUrl(description);

  return normalizeIpfsUrl(image);
}

function resolveCollectionName(metadata: ProfileNftMetadata | null): string {
  if (!metadata) return 'Uncategorized';

  if (typeof metadata.collection === 'string' && metadata.collection.trim()) {
    return metadata.collection.trim();
  }

  if (isObject(metadata.collection) && typeof metadata.collection.name === 'string') {
    return metadata.collection.name.trim() || 'Uncategorized';
  }

  const explicit =
    metadata.collectionName ||
    metadata.collection_name ||
    (typeof metadata.category === 'string' ? metadata.category : '');

  return explicit?.trim() || 'Uncategorized';
}

function resolveCategory(metadata: ProfileNftMetadata | null): string {
  if (!metadata) return 'NFT';

  if (typeof metadata.category === 'string' && metadata.category.trim()) {
    return metadata.category.trim();
  }

  const attrs = Array.isArray(metadata.attributes) ? metadata.attributes : [];
  const categoryAttr = attrs.find((attr) => {
    const key = String(attr.trait_type || attr.type || attr.key || attr.name || '').toLowerCase();
    return key === 'category';
  });

  if (categoryAttr?.value) return String(categoryAttr.value);

  return 'NFT';
}

function priceKSS(listing: Listing | null): number | null {
  if (!listing) return null;
  return Number(listing.priceWavelets || 0) / 1e8;
}

async function fetchAssetDetails(assetId: string): Promise<any | null> {
  return fetchOptionalJson<any>(`${NODE_URL}/assets/details/${encodeURIComponent(assetId)}`);
}

function getAssetId(asset: any): string {
  return String(asset?.assetId || asset?.id || '');
}

async function normalizeOwnedNft(
  rawAsset: any,
  address: string,
  listingsByAssetId: Map<string, Listing>,
): Promise<ProfileOwnedNft | null> {
  const initialAssetId = getAssetId(rawAsset);
  if (!initialAssetId) return null;

  const details = rawAsset?.name && rawAsset?.issuer ? rawAsset : await fetchAssetDetails(initialAssetId);
  if (!details) return null;

  const assetId = getAssetId(details) || initialAssetId;
  const description = String(details.description ?? '');
  const metadata = await resolveMetadata(description).catch(() => null);
  const listing = listingsByAssetId.get(assetId) ?? null;

  return {
    assetId,
    name: String(metadata?.name || details.name || 'Untitled NFT'),
    description: String(metadata?.description || description || 'No description provided.'),
    imageUrl: resolveImageUrl(metadata, description),
    issuer: String(details.issuer || ''),
    owner: address,
    isCreatedByUser: String(details.issuer || '').toLowerCase() === address.toLowerCase(),
    isListedByUser: !!listing && listing.seller.toLowerCase() === address.toLowerCase(),
    collectionName: resolveCollectionName(metadata),
    category: resolveCategory(metadata),
    quantity: Number(details.quantity ?? 1),
    decimals: Number(details.decimals ?? 0),
    listing,
    explorerUrl: `${EXPLORER_URL}/assets/${assetId}`,
  };
}

async function fetchOwnedNfts(address: string): Promise<ProfileOwnedNft[]> {
  const [ownedRaw, allListings] = await Promise.all([
    fetchJson<any[]>(`${NODE_URL}/assets/nft/${address}/limit/100`).catch(() => []),
    getListings().catch(() => [] as Listing[]),
  ]);

  const userListings = allListings.filter(
    (listing) => listing.seller.toLowerCase() === address.toLowerCase(),
  );

  const listingsByAssetId = new Map<string, Listing>();
  userListings.forEach((listing) => listingsByAssetId.set(listing.assetId, listing));

  const rawByAssetId = new Map<string, any>();

  if (Array.isArray(ownedRaw)) {
    ownedRaw.forEach((asset) => {
      const assetId = getAssetId(asset);
      if (assetId) rawByAssetId.set(assetId, asset);
    });
  }

  userListings.forEach((listing) => {
    if (!rawByAssetId.has(listing.assetId)) {
      rawByAssetId.set(listing.assetId, { assetId: listing.assetId });
    }
  });

  const normalized = await Promise.all(
    Array.from(rawByAssetId.values()).map((asset) =>
      normalizeOwnedNft(asset, address, listingsByAssetId),
    ),
  );

  return normalized
    .filter((item): item is ProfileOwnedNft => !!item)
    .sort((a, b) => Number(b.isListedByUser) - Number(a.isListedByUser) || a.name.localeCompare(b.name));
}

function buildCreatedCollections(address: string, nfts: ProfileOwnedNft[]): ProfileCollection[] {
  const grouped = new Map<string, ProfileOwnedNft[]>();

  nfts
    .filter((nft) => nft.issuer.toLowerCase() === address.toLowerCase())
    .forEach((nft) => {
      const key = nft.collectionName || 'Uncategorized';
      grouped.set(key, [...(grouped.get(key) ?? []), nft]);
    });

  return Array.from(grouped.entries())
    .map(([name, items]) => {
      const listedItems = items.filter((item) => item.listing);
      const floor = listedItems.length
        ? Math.min(...listedItems.map((item) => priceKSS(item.listing) ?? Number.POSITIVE_INFINITY))
        : null;

      return {
        id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'collection',
        name,
        coverImage: items.find((item) => !!item.imageUrl)?.imageUrl ?? '',
        itemCount: items.length,
        listedCount: listedItems.length,
        categories: Array.from(new Set(items.map((item) => item.category).filter(Boolean))).slice(0, 4),
        floorPriceKSS: floor === Number.POSITIVE_INFINITY ? null : floor,
        nftIds: items.map((item) => item.assetId),
      };
    })
    .sort((a, b) => b.itemCount - a.itemCount || a.name.localeCompare(b.name));
}

function nativeAmount(amount?: number): number | undefined {
  if (typeof amount !== 'number') return undefined;
  return amount / 1e8;
}

function normalizeActivity(tx: any, address: string): ProfileActivityItem | null {
  const id = String(tx?.id || '');
  if (!id) return null;

  const type = Number(tx?.type ?? 0);
  const timestamp = Number(tx?.timestamp ?? 0);
  const sender = String(tx?.sender || '');
  const recipient = String(tx?.recipient || '');
  const callFunction = String(tx?.call?.function || '');
  const lowerCall = callFunction.toLowerCase();

  let kind: ProfileActivityItem['kind'] = 'other';
  let title = 'Wallet activity';
  let description = `Transaction type ${type}`;
  let counterparty = '';

  if (type === 3) {
    kind = 'minted';
    title = 'Minted NFT / asset';
    description = 'Created a Kross asset';
  } else if (type === 4) {
    const sent = sender.toLowerCase() === address.toLowerCase();
    kind = sent ? 'sent' : 'received';
    title = sent ? 'Sent asset' : 'Received asset';
    counterparty = sent ? recipient : sender;
    description = sent ? `Sent to ${truncate(counterparty)}` : `Received from ${truncate(counterparty)}`;
  } else if (type === 16) {
    if (lowerCall.includes('list')) {
      kind = 'listed';
      title = 'Listed NFT';
      description = 'Listed an NFT on the Kross marketplace';
    } else if (lowerCall.includes('buy')) {
      kind = 'bought';
      title = 'Bought NFT';
      description = 'Bought an NFT with KSS';
    } else if (lowerCall.includes('delist') || lowerCall.includes('cancel')) {
      kind = 'invoke';
      title = 'Updated listing';
      description = 'Changed marketplace listing state';
    } else {
      kind = 'invoke';
      title = callFunction ? `Called ${callFunction}` : 'Smart contract call';
      description = 'Invoked a Kross dApp';
    }
  }

  return {
    id,
    type,
    kind,
    title,
    description,
    timestamp,
    amountKSS: nativeAmount(tx?.amount),
    assetId: tx?.assetId ?? null,
    counterparty,
    explorerUrl: `${EXPLORER_URL}/tx/${id}`,
  };
}

async function fetchRecentActivity(address: string): Promise<ProfileActivityItem[]> {
  const data = await fetchOptionalJson<any[]>(`${NODE_URL}/transactions/address/${address}/limit/40`);
  const txs: any[] = Array.isArray(data?.[0]) ? data?.[0] : Array.isArray(data) ? data : [];

  return txs
    .map((tx) => normalizeActivity(tx, address))
    .filter((item): item is ProfileActivityItem => !!item)
    .slice(0, 20);
}

export async function fetchUserProfile(address: string): Promise<UserProfileData> {
  const normalizedAddress = address.trim();
  if (!normalizedAddress || !normalizedAddress.startsWith('3K')) {
    throw new Error('A connected Kross wallet address is required.');
  }

  const [ownedNfts, recentActivity] = await Promise.all([
    fetchOwnedNfts(normalizedAddress),
    fetchRecentActivity(normalizedAddress),
  ]);

  return {
    address: normalizedAddress,
    ownedNfts,
    createdCollections: buildCreatedCollections(normalizedAddress, ownedNfts),
    recentActivity,
  };
}

export function truncate(value?: string | null, head = 8, tail = 6): string {
  if (!value) return 'Unknown';
  if (value.length <= head + tail + 1) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

export function formatKSS(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return value.toLocaleString(undefined, {
    maximumFractionDigits: 8,
    minimumFractionDigits: value > 0 && value < 1 ? 4 : 0,
  });
}
