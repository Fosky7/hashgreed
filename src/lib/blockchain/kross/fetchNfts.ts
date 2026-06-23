// src/lib/blockchain/kross/fetchNfts.ts
import { resolveImageUrl } from "@/lib/blockchain/kross/mintNft";

const KROSS_NODE = "https://nodes.krossexplorer.com";

export interface OwnedNft {
  assetId: string;
  name: string;
  description: string;
  image: string; // resolved display url
  rawImage: string; // original (ipfs:// or https://)
  attributes: { trait_type: string; value: string }[];
  externalUrl?: string;
  issuer: string;
}

interface AssetDetail {
  assetId: string;
  issuer: string;
  name: string;
  description: string;
  quantity: number;
  decimals: number;
  reissuable: boolean;
}

/** Parse the JSON metadata we packed into the asset description field. */
function parseMeta(raw: string): Partial<OwnedNft> {
  try {
    const j = JSON.parse(raw);
    if (j && typeof j === "object" && typeof j.image === "string") {
      return {
        description: typeof j.description === "string" ? j.description : "",
        rawImage: j.image,
        image: resolveImageUrl(j.image),
        attributes: Array.isArray(j.attributes)
          ? j.attributes.filter(
              (a: any) => a?.trait_type && a?.value
            )
          : [],
        externalUrl: typeof j.externalUrl === "string" ? j.externalUrl : undefined,
      };
    }
  } catch {
    /* not JSON metadata — fall through */
  }
  return { description: raw, rawImage: "", image: "", attributes: [] };
}

/** Get the current asset balances (only assets with balance > 0) for an address. */
async function fetchAssetIds(address: string): Promise<string[]> {
  const res = await fetch(`${KROSS_NODE}/assets/balance/${address}`);
  if (!res.ok) throw new Error("Failed to load wallet assets.");
  const data = await res.json();
  const balances: any[] = Array.isArray(data?.balances) ? data.balances : [];
  return balances
    .filter((b) => Number(b.balance) > 0)
    .map((b) => b.assetId as string);
}

/** Fetch full details for a single asset. */
async function fetchAssetDetail(assetId: string): Promise<AssetDetail | null> {
  const res = await fetch(`${KROSS_NODE}/assets/details/${assetId}`);
  if (!res.ok) return null;
  const d = await res.json();
  return {
    assetId: d.assetId,
    issuer: d.issuer,
    name: d.name,
    description: d.description ?? "",
    quantity: Number(d.quantity),
    decimals: Number(d.decimals),
    reissuable: Boolean(d.reissuable),
  };
}

/**
 * Return NFTs owned by `address`. We treat an asset as an NFT when it is
 * non-divisible (decimals 0), supply 1, and non-reissuable.
 * `onlyMinted` restricts results to assets the address itself issued.
 */
export async function fetchOwnedNfts(
  address: string,
  opts: { onlyMinted?: boolean } = {}
): Promise<OwnedNft[]> {
  const ids = await fetchAssetIds(address);
  const details = await Promise.all(ids.map(fetchAssetDetail));

  const nfts: OwnedNft[] = [];
  for (const d of details) {
    if (!d) continue;
    const isNft = d.decimals === 0 && d.quantity === 1 && !d.reissuable;
    if (!isNft) continue;
    if (opts.onlyMinted && d.issuer !== address) continue;

    const meta = parseMeta(d.description);
    nfts.push({
      assetId: d.assetId,
      name: d.name,
      issuer: d.issuer,
      description: meta.description ?? "",
      image: meta.image ?? "",
      rawImage: meta.rawImage ?? "",
      attributes: meta.attributes ?? [],
      externalUrl: meta.externalUrl,
    });
  }
  return nfts;
}
