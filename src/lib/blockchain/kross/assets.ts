import { massTransfer, issue, burn, reissue } from 'waves-transactions';
//
// @waves/waves-transactions evaluates Node globals at import time. We import
// it lazily (after polyfills) inside each signing function to avoid the
// boot-time crash, instead of a static top-level import.
import './polyfills';
import { KROSS_CONFIG, toWavelets } from './config';
import { isValidKrossAddress } from './sdk';
import { resolveSeed } from './resolve-seed';

async function loadTx() {
  const mod: any = await import('@waves/waves-transactions');
  return {
    issue: mod.issue ?? mod.default?.issue,
    transfer: mod.transfer ?? mod.default?.transfer,
    invokeScript: mod.invokeScript ?? mod.default?.invokeScript,
  };
}

export interface IssueResult {
  assetId: string;
  txId: string;
  explorerUrl: string;
}

async function broadcast(signedTx: unknown): Promise<any> {
  const res = await fetch(`${KROSS_CONFIG.nodeUrl}/transactions/broadcast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(signedTx),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Broadcast failed.');
  }
  return res.json();
}

/**
 * Mint an NFT on Kross (quantity 1, decimals 0, non-reissuable).
 * Fee: 0.001 KSS. Metadata (image/desc) stored in the description field.
 */
export async function createNFT(params: {
  name: string;
  description: string;
  imageUrl: string;
  password?: string;
}): Promise<IssueResult> {
  const { name, description, imageUrl, password } = params;
  if (!name.trim()) throw new Error('NFT name is required.');

  const seed = await resolveSeed(password);
  const metadata = JSON.stringify({ description, image: imageUrl });

  const signedTx = issue(
    {
      name: name.slice(0, 16),
      description: metadata.slice(0, 1000),
      quantity: 1,
      decimals: 0,
      reissuable: false,
      fee: toWavelets(KROSS_CONFIG.fees.issueNFT),
      chainId: KROSS_CONFIG.chainId,
    },
    seed
  );

  const data = await broadcast(signedTx);
  return {
    assetId: data.id,
    txId: data.id,
    explorerUrl: `${KROSS_CONFIG.explorerUrl}/tx/${data.id}`,
  };
}

/**
 * Issue a fungible token on Kross. Fee: 1 KSS.
 */
export async function createAssetToken(params: {
  name: string;
  description: string;
  quantity: number;
  decimals: number;
  reissuable: boolean;
  password?: string;
}): Promise<IssueResult> {
  const { name, description, quantity, decimals, reissuable, password } = params;
  if (!name.trim()) throw new Error('Token name is required.');
  if (quantity <= 0) throw new Error('Quantity must be greater than 0.');

  const seed = await resolveSeed(password);

  const signedTx = issue(
    {
      name: name.slice(0, 16),
      description: description.slice(0, 1000),
      quantity: Math.round(quantity * Math.pow(10, decimals)),
      decimals,
      reissuable,
      fee: toWavelets(KROSS_CONFIG.fees.issueAsset),
      chainId: KROSS_CONFIG.chainId,
    },
    seed
  );

  const data = await broadcast(signedTx);
  return {
    assetId: data.id,
    txId: data.id,
    explorerUrl: `${KROSS_CONFIG.explorerUrl}/tx/${data.id}`,
  };
}

/**
 * Transfer an NFT/token to another address. Fee: 0.001 KSS.
 */
export async function transferNFT(params: {
  recipient: string;
  assetId: string;
  password?: string;
}): Promise<{ txId: string; explorerUrl: string }> {
  const { recipient, assetId, password } = params;
  if (!isValidKrossAddress(recipient)) {
    throw new Error('Invalid recipient address (must start with 3K).');
  }
  const seed = await resolveSeed(password);

  const signedTx = transfer(
    {
      recipient,
      amount: 1,
      assetId,
      fee: toWavelets(KROSS_CONFIG.fees.transfer),
      chainId: KROSS_CONFIG.chainId,
    },
    seed
  );

  const data = await broadcast(signedTx);
  return {
    txId: data.id,
    explorerUrl: `${KROSS_CONFIG.explorerUrl}/tx/${data.id}`,
  };
}

/**
 * Invoke a marketplace dApp (list / buy). Fee: 0.005 KSS.
 * KSS payment is attached for buys.
 */
export async function invokeMarketplace(params: {
  dApp: string;
  fnName: string;
  args: Array<{ type: string; value: any }>;
  paymentKSS?: number;
  paymentAssetId?: string | null;
  password?: string;
}): Promise<{ txId: string; explorerUrl: string }> {
  const { dApp, fnName, args, paymentKSS, paymentAssetId, password } = params;
  if (!isValidKrossAddress(dApp)) {
    throw new Error('Invalid dApp address.');
  }
  const seed = await resolveSeed(password);

  const payment =
    paymentKSS && paymentKSS > 0
      ? [{ assetId: paymentAssetId ?? null, amount: toWavelets(paymentKSS) }]
      : [];

  const signedTx = invokeScript(
    {
      dApp,
      call: { function: fnName, args: args as any },
      payment,
      fee: toWavelets(KROSS_CONFIG.fees.invoke),
      chainId: KROSS_CONFIG.chainId,
    },
    seed
  );

  const data = await broadcast(signedTx);
  return {
    txId: data.id,
    explorerUrl: `${KROSS_CONFIG.explorerUrl}/tx/${data.id}`,
  };
}
