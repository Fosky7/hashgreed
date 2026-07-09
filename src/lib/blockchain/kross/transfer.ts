// src/lib/blockchain/kross/transfer.ts
import { loadChainSdk } from '../loadChainSdk';
import { KROSS_CONFIG } from './config';

const NODE_URL = KROSS_CONFIG.nodeUrl || 'https://nodes.krossexplorer.com';
const CHAIN_ID = 'N';

/**
 * Transfer native KSS (or a token if assetId is provided).
 *
 * @returns The broadcast result with `id` and an `explorerUrl`.
 */
export async function transferKSS(params: {
  recipient: string;
  amountKSS: number;
  password: string;        // seed phrase or session seed
  attachment?: string;
  assetId?: string | null;  // null/undefined = native KSS
}): Promise<{ id: string; explorerUrl: string }> {
  const { broadcast, transfer, waitForTx } = await loadChainSdk(
    'kross',
    '@waves/waves-transactions',
  );

  const amountWavelets = Math.round(params.amountKSS * 1e8);

  const tx = transfer(
    {
      recipient: params.recipient,
      amount: amountWavelets,
      assetId: params.assetId ?? null,
      attachment: params.attachment,
      chainId: CHAIN_ID,
      fee: 100000,
    },
    params.password,
  );

  const result = await broadcast(tx, NODE_URL);
  await waitForTx(result.id, { apiBase: NODE_URL });

  return {
    id: result.id,
    explorerUrl: `${KROSS_CONFIG.explorerUrl}/tx/${result.id}`,
  };
}

/**
 * Wait for a transaction to be confirmed on-chain.
 * Re-exported from the dynamically-loaded SDK for convenience.
 */
export async function waitForTx(txId: string): Promise<void> {
  const { waitForTx: sdkWaitForTx } = await loadChainSdk(
    'kross',
    '@waves/waves-transactions',
  );
  await sdkWaitForTx(txId, { apiBase: NODE_URL });
}
