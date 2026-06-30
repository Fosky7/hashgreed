// src/lib/blockchain/kross/nft-detail.ts
import { loadChainSdk } from '../loadChainSdk';
import DEPLOYED_CONFIG from './deployed.config';
import { MARKETPLACE_CONFIG } from './marketplace.config';
import { getListing, type Listing } from './marketplace-listings';
import { resolveSeed } from './resolve-seed';

const NODE_URL = DEPLOYED_CONFIG.nodeUrl;
const EXPLORER_URL = DEPLOYED_CONFIG.explorerUrl;
const CHAIN_ID = DEPLOYED_CONFIG.chainId;
const KSS_DECIMALS = DEPLOYED_CONFIG.nativeCoin.decimals;
const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs';

export interface NftAttribute {
  trait_type?: string;
  type?: string;
  key?: string;
  name?: string;
  value?: string | number | boolean | null;
  [key: string]: unknown;
}

export interface NftMetadata {
  name?: string;
  description?: string;
  image?: string;
  image_url?: string;
  imageUrl?: string;
  external_url?: string;
  animation_url?: string;
  attributes?: NftAttribute[];
  [key: string]: unknown;
}

export interface NftHistoryItem {
  id: string;
  type: number;
  timestamp: number;
  sender?: string;
  recipient?: string;
  amount?: number;
  functionName?: string;
}

export interface NftDetail {
  assetId: string;
  name: string;
  description: string;
  imageUrl: string;
  metadataUrl: string;
  metadata: NftMetadata | null;
  issuer: string;
  owner: string;
  holder: string;
  isCustodiedByMarketplace: boolean;
  listing: Listing | null;
  priceKSS: number | null;
  priceWavelets: number | null;
  listed: boolean;
  quantity: number;
  decimals: number;
  reissuable: boolean;
  issueTransactionId: string;
  explorerAssetUrl: string;
  explorerOwnerUrl: string;
  history: NftHistoryItem[];
}

export interface BuyListedNftResult {
  id: string;
  explorerUrl: string;
}

function toKSS(wavelets: number): number {
  return Number(wavelets || 0) / 10 ** KSS_DECIMALS;
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

function isMetadataLike(value: unknown): value is NftMetadata {
  return !!value && typeof value === 'object' && !Array.isArray(value);
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
  if (isMetadataLike(parsed)) {
    const candidate =
      (parsed.metadataUrl as string | undefined) ||
      (parsed.metadata_url as string | undefined) ||
      (parsed.uri as string | undefined) ||
      (parsed.url as string | undefined);
    if (candidate) return normalizeIpfsUrl(candidate);
  }

  const direct = normalizeIpfsUrl(description);
  if (direct.startsWith('http://') || direct.startsWith('https://')) {
    return direct;
  }

  return extractFirstUrl(description);
}

async function resolveMetadata(description: string): Promise<{
  metadata: NftMetadata | null;
  metadataUrl: string;
}> {
  const parsed = tryParseJson(description);
  if (isMetadataLike(parsed)) {
    return { metadata: parsed, metadataUrl: resolveMetadataUrl(description) };
  }

  const metadataUrl = resolveMetadataUrl(description);
  if (!metadataUrl) return { metadata: null, metadataUrl: '' };

  const metadata = await fetchOptionalJson<NftMetadata>(metadataUrl);
  return {
    metadata: metadata && isMetadataLike(metadata) ? metadata : null,
    metadataUrl,
  };
}

function resolveImageUrl(metadata: NftMetadata | null, description: string): string {
  const image =
    metadata?.image ||
    metadata?.image_url ||
    metadata?.imageUrl ||
    (metadata?.properties &&
    typeof metadata.properties === 'object' &&
    !Array.isArray(metadata.properties)
      ? ((metadata.properties as Record<string, unknown>).image as string | undefined)
      : undefined);

  return normalizeIpfsUrl(image) || extractFirstUrl(description);
}

function normalizeAttributes(metadata: NftMetadata | null): NftAttribute[] {
  if (!metadata?.attributes || !Array.isArray(metadata.attributes)) return [];
  return metadata.attributes.filter((item): item is NftAttribute => {
    return !!item && typeof item === 'object' && !Array.isArray(item);
  });
}

function parseDistributionOwner(distribution: unknown): string {
  if (!distribution || typeof distribution !== 'object') return '';

  const anyDistribution = distribution as any;

  if (Array.isArray(anyDistribution.items)) {
    const holder = anyDistribution.items.find((item: any) => Number(item?.balance) > 0);
    return holder?.address ?? '';
  }

  const entries = Object.entries(anyDistribution as Record<string, unknown>);
  const holder = entries.find(([, balance]) => Number(balance) > 0);
  return holder?.[0] ?? '';
}

async function fetchCurrentHolder(assetId: string): Promise<string> {
  const encodedAssetId = encodeURIComponent(assetId);

  const distribution =
    (await fetchOptionalJson<unknown>(`${NODE_URL}/assets/${encodedAssetId}/distribution`)) ||
    (await fetchOptionalJson<unknown>(
      `${NODE_URL}/assets/${encodedAssetId}/distribution/limit/100`,
    ));

  return parseDistributionOwner(distribution);
}

function txTouchesAsset(tx: any, assetId: string): boolean {
  if (!tx || typeof tx !== 'object') return false;
  if (tx.assetId === assetId) return true;

  if (Array.isArray(tx.transfers)) {
    return tx.transfers.some((transfer: any) => transfer?.assetId === assetId);
  }

  if (Array.isArray(tx.payments)) {
    return tx.payments.some((payment: any) => payment?.assetId === assetId);
  }

  if (Array.isArray(tx.payment)) {
    return tx.payment.some((payment: any) => payment?.assetId === assetId);
  }

  return false;
}

async function fetchNftHistory(assetId: string, ownerOrIssuer: string): Promise<NftHistoryItem[]> {
  if (!ownerOrIssuer) return [];

  const data = await fetchOptionalJson<any[]>(
    `${NODE_URL}/transactions/address/${ownerOrIssuer}/limit/50`,
  );

  const txs: any[] = Array.isArray(data?.[0]) ? data?.[0] : Array.isArray(data) ? data : [];

  return txs
    .filter((tx) => txTouchesAsset(tx, assetId) || tx.id === assetId)
    .slice(0, 12)
    .map((tx) => ({
      id: String(tx.id ?? ''),
      type: Number(tx.type ?? 0),
      timestamp: Number(tx.timestamp ?? 0),
      sender: tx.sender,
      recipient: tx.recipient,
      amount: typeof tx.amount === 'number' ? tx.amount : undefined,
      functionName: tx.call?.function,
    }))
    .filter((tx) => tx.id);
}

export async function fetchNftDetail(assetId: string): Promise<NftDetail> {
  const normalizedAssetId = assetId.trim();
  if (!normalizedAssetId) throw new Error('Missing NFT asset ID');

  const encodedAssetId = encodeURIComponent(normalizedAssetId);

  const [assetDetails, listing] = await Promise.all([
    fetchJson<any>(`${NODE_URL}/assets/details/${encodedAssetId}`),
    getListing(normalizedAssetId).catch(() => null),
  ]);

  const description = String(assetDetails.description ?? '');
  const { metadata, metadataUrl } = await resolveMetadata(description);

  const holder = await fetchCurrentHolder(normalizedAssetId).catch(() => '');
  const owner = listing?.seller || holder || String(assetDetails.issuer ?? '');
  const history = await fetchNftHistory(normalizedAssetId, owner || String(assetDetails.issuer ?? '')).catch(
    () => [],
  );

  const metadataName = metadata?.name ? String(metadata.name) : '';
  const metadataDescription = metadata?.description ? String(metadata.description) : '';

  const priceWavelets = listing?.priceWavelets ?? null;
  const priceKSS = typeof priceWavelets === 'number' ? toKSS(priceWavelets) : null;
  const marketplaceAddress = MARKETPLACE_CONFIG.dAppAddress;

  return {
    assetId: normalizedAssetId,
    name: metadataName || String(assetDetails.name ?? 'Untitled NFT'),
    description: metadataDescription || description || 'No description provided.',
    imageUrl: resolveImageUrl(metadata, description),
    metadataUrl,
    metadata: metadata
      ? {
          ...metadata,
          attributes: normalizeAttributes(metadata),
        }
      : null,
    issuer: String(assetDetails.issuer ?? ''),
    owner,
    holder,
    isCustodiedByMarketplace:
      !!holder &&
      !!marketplaceAddress &&
      holder.toLowerCase() === marketplaceAddress.toLowerCase(),
    listing,
    priceKSS,
    priceWavelets,
    listed: !!listing,
    quantity: Number(assetDetails.quantity ?? 0),
    decimals: Number(assetDetails.decimals ?? 0),
    reissuable: Boolean(assetDetails.reissuable),
    issueTransactionId: String(
      assetDetails.originTransactionId ?? assetDetails.issueTransaction ?? '',
    ),
    explorerAssetUrl: `${EXPLORER_URL}/assets/${normalizedAssetId}`,
    explorerOwnerUrl: owner ? `${EXPLORER_URL}/address/${owner}` : EXPLORER_URL,
    history,
  };
}

/**
 * Buy a listed NFT with native KSS through the Kross marketplace dApp.
 * Seed material is resolved only inside this blockchain SDK layer.
 */
export async function buyListedNft(assetId: string): Promise<BuyListedNftResult> {
  const normalizedAssetId = assetId.trim();
  if (!normalizedAssetId) throw new Error('Missing NFT asset ID');

  const listing = await getListing(normalizedAssetId);
  if (!listing) throw new Error('This NFT is not currently listed for sale.');
  if (!MARKETPLACE_CONFIG.dAppAddress) {
    throw new Error('Marketplace dApp address is not configured.');
  }

  const seed = await resolveSeed();

  const { broadcast, invokeScript, waitForTx } = await loadChainSdk(
    'kross',
    '@waves/waves-transactions',
  );

  const tx = invokeScript(
    {
      dApp: MARKETPLACE_CONFIG.dAppAddress,
      call: {
        function: MARKETPLACE_CONFIG.functions.buy,
        args: [{ type: 'string', value: normalizedAssetId }],
      },
      payment: [
        {
          assetId: null,
          amount: listing.priceWavelets,
        },
      ],
      chainId: CHAIN_ID,
      fee: 500000,
    },
    seed,
  );

  const result = await broadcast(tx, NODE_URL);
  await waitForTx(result.id, { apiBase: NODE_URL });

  return {
    id: result.id,
    explorerUrl: `${EXPLORER_URL}/tx/${result.id}`,
  };
}

export function formatKSS(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return value.toLocaleString(undefined, {
    maximumFractionDigits: 8,
    minimumFractionDigits: value > 0 && value < 1 ? 4 : 0,
  });
}

export function truncateKrossAddress(address?: string | null): string {
  if (!address) return 'Unknown';
  if (address.length <= 16) return address;
  return `${address.slice(0, 8)}…${address.slice(-6)}`;
}
