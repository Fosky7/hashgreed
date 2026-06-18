// @waves/waves-transactions evaluates Node globals at import time AND is not
// resolvable at build time in this environment. We therefore NEVER import it
// here — not even via a literal `import('@waves/waves-transactions')`, which
// esbuild still tries to resolve statically (the cause of the
// "Unresolved import" build error). All loading is routed through the
// centralized runtime loader, which builds the specifier from a non-literal
// expression so the bundler leaves it as a true runtime import.
import './polyfills';
import { loadChainSdk } from '../loadChainSdk';
import { KROSS_CONFIG, toWavelets } from './config';
import { isValidKrossAddress } from './sdk';
import { resolveSeed } from './resolve-seed';

async function loadTx() {
  const mod: any = await loadChainSdk('waves-transactions');
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

  const { issue } = await loadTx();
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

  const { issue } = await loadTx();
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

  const { transfer } = await loadTx();
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

  const { invokeScript } = await loadTx();
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
