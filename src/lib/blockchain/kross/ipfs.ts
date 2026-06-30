// src/lib/blockchain/kross/ipfs.ts
import { FUNCTIONS_BASE } from '@/lib/supabase/client';

export interface IpfsUploadResult {
  cid: string;
  /** Canonical IPFS URI (ipfs://CID). Good for on-chain metadata. */
  ipfsUri: string;
  /** HTTP gateway URL for direct <img> display. */
  url: string;
  size: number;
  name: string;
  /** SHA-256 hex digest of the original image bytes (integrity check). */
  sha256?: string;
}

/** Attribute entry for NFT metadata (OpenSea-style). */
export interface NftAttribute {
  trait_type: string;
  value: string | number;
}

/** Standard NFT metadata pinned alongside the image. */
export interface NftMetadata {
  name: string;
  description: string;
  image: string; // ipfs:// URI of the image
  category?: string;
  attributes?: NftAttribute[];
  /** Integrity record for the underlying media. */
  imageIntegrity?: {
    algorithm: 'sha256';
    hash: string;
  };
  createdAt?: string;
}

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // 15 MB
export const ALLOWED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

/** Client-side guard so users get instant feedback before the network call. */
export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Unsupported file type. Use PNG, JPG, GIF, WEBP, or SVG.';
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return 'File too large. Maximum size is 15 MB.';
  }
  return null;
}

/**
 * Upload an image to IPFS via the secure kross-ipfs-upload edge function.
 * The Pinata JWT lives server-side only — never in the browser.
 * The response includes a SHA-256 hash of the image for integrity.
 */
export async function uploadImageToIpfs(file: File): Promise<IpfsUploadResult> {
  const localError = validateImageFile(file);
  if (localError) throw new Error(localError);

  const form = new FormData();
  form.append('file', file);

  const res = await fetch(`${FUNCTIONS_BASE}/kross-ipfs-upload`, {
    method: 'POST',
    body: form,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error ?? `Upload failed (${res.status})`);
  }
  return data as IpfsUploadResult;
}

/**
 * Pin a full NFT metadata JSON document to IPFS via the same edge function.
 * Returns the ipfs:// URI to use as the token's metadata reference when minting.
 */
export async function pinMetadataToIpfs(
  metadata: NftMetadata,
): Promise<IpfsUploadResult> {
  const res = await fetch(`${FUNCTIONS_BASE}/kross-ipfs-upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(metadata),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error ?? `Metadata pin failed (${res.status})`);
  }
  return data as IpfsUploadResult;
}

/**
 * Convenience helper: build standard NFT metadata from upload + form fields.
 */
export function buildNftMetadata(params: {
  name: string;
  description: string;
  imageIpfsUri: string;
  imageSha256?: string;
  category?: string;
  attributes?: NftAttribute[];
}): NftMetadata {
  return {
    name: params.name,
    description: params.description,
    image: params.imageIpfsUri,
    category: params.category,
    attributes: params.attributes,
    imageIntegrity: params.imageSha256
      ? { algorithm: 'sha256', hash: params.imageSha256 }
      : undefined,
    createdAt: new Date().toISOString(),
  };
}
