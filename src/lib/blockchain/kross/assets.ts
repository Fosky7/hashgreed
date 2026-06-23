// src/lib/blockchain/kross/assets.ts
// Kross mainnet asset + marketplace transaction helpers.
// All SDK access stays behind the dynamic Kross loader so Vite never bundles
// the heavy transaction SDK at build time.
import './polyfills';
import { FEES, KROSS_CONFIG, explorerTxUrl, toWavelets } from './config';
import { broadcastTx, loadTransactionsSdk } from './sdk';
import { resolveSeed } from './resolve-seed';

export interface TxResult {
  id: string;
  txId: string;
  explorerUrl: string;
}

export interface NftMintResult extends TxResult {
  assetId: string;
}

export interface CreateNftInput {
  name: string;
  description?: string;
  imageUrl?: string;
  password?: string;
}

export interface CreateAssetTokenInput {
  name: string;
  description?: string;
  quantity: number;
  decimals?: number;
  reissuable?: boolean;
  password?: string;
}

export interface InvokeMarketplaceInput {
  dApp: string;
  fnName: string;
  args?: Array<{ type: string; value: string | number | boolean }>;
  paymentKSS?: number;
  paymentAmount?: number;
  paymentWavelets?: number;
  paymentAssetId?: string | null;
  password?: string;
}

function assertName(name: string): string {
  const clean = String(name ?? '').trim();
  if (!clean) throw new Error('Name is required.');
  if (clean.length > 16) throw new Error('Kross asset names must be 16 characters or fewer.');
  return clean;
}

function normalizeDescription(description?: string): string {
  return String(description ?? '').trim().slice(0, 1000);
}

function nftMetadata(input: CreateNftInput): string {
  const image = String(input.imageUrl ?? '').trim();
  const description = normalizeDescription(input.description);
  if (!image) return description;
  return JSON.stringify({ description, image });
}

async function signAndBroadcastIssue(params: Record<string, unknown>, password?: string): Promise<TxResult> {
  const seed = await resolveSeed(password);
  const { issue } = await loadTransactionsSdk();
  const signed = issue(params, seed);
  const sent = await broadcastTx(signed);
  const id = String((sent as { id?: string }).id ?? '');
  if (!id) throw new Error('Kross node did not return a transaction id.');
  return { id, txId: id, explorerUrl: explorerTxUrl(id) };
}

/** Mint an NFT: quantity 1, decimals 0, non-reissuable, live Kross mainnet. */
export async function createNFT(input: CreateNftInput): Promise<NftMintResult> {
  const tx = await signAndBroadcastIssue(
    {
      name: assertName(input.name),
      description: nftMetadata(input),
      quantity: 1,
      decimals: 0,
      reissuable: false,
      chainId: KROSS_CONFIG.chainId,
      fee: FEES.ISSUE_NFT,
    },
    input.password,
  );
  return { ...tx, assetId: tx.id };
}

/** Issue a fungible Kross asset/token on live mainnet. */
export async function createAssetToken(input: CreateAssetTokenInput): Promise<TxResult> {
  const decimals = Math.max(0, Math.min(8, Number(input.decimals ?? 0)));
  const quantity = Number(input.quantity);
  if (!Number.isFinite(quantity) || quantity <= 0) throw new Error('Quantity must be greater than zero.');
  const scaledQuantity = Math.round(quantity * Math.pow(10, decimals));

  return signAndBroadcastIssue(
    {
      name: assertName(input.name),
      description: normalizeDescription(input.description),
      quantity: scaledQuantity,
      decimals,
      reissuable: Boolean(input.reissuable),
      chainId: KROSS_CONFIG.chainId,
      fee: FEES.ISSUE_ASSET,
    },
    input.password,
  );
}

/** Invoke the configured Kross marketplace dApp with optional native/NFT payment. */
export async function invokeMarketplace(input: InvokeMarketplaceInput): Promise<TxResult> {
  const dApp = String(input.dApp ?? '').trim();
  const fnName = String(input.fnName ?? '').trim();
  if (!dApp) throw new Error('Marketplace dApp address is not configured.');
  if (!fnName) throw new Error('Marketplace function name is required.');

  const seed = await resolveSeed(input.password);
  const { invokeScript } = await loadTransactionsSdk();

  const payment: Array<{ amount: number; assetId: string | null }> = [];
  if (typeof input.paymentKSS === 'number' && input.paymentKSS > 0) {
    payment.push({ amount: toWavelets(input.paymentKSS), assetId: null });
  } else {
    const amount = Number(input.paymentWavelets ?? input.paymentAmount ?? 0);
    if (Number.isFinite(amount) && amount > 0) {
      payment.push({ amount: Math.round(amount), assetId: input.paymentAssetId ?? null });
    }
  }

  const signed = invokeScript(
    {
      dApp,
      call: { function: fnName, args: input.args ?? [] },
      payment,
      chainId: KROSS_CONFIG.chainId,
      fee: FEES.INVOKE_SCRIPT,
    },
    seed,
  );

  const sent = await broadcastTx(signed);
  const id = String((sent as { id?: string }).id ?? '');
  if (!id) throw new Error('Kross node did not return a transaction id.');
  return { id, txId: id, explorerUrl: explorerTxUrl(id) };
}
