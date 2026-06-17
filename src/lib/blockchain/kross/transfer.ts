// src/lib/blockchain/kross/transfer.ts
import { transfer } from '@waves/waves-transactions';
import { KROSS_CONFIG, toWavelets } from './config';
import { isValidKrossAddress } from './sdk';
import { resolveSeed } from './resolve-seed';

export interface TransferResult {
  id: string;
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
    throw new Error(err.message || 'Transaction broadcast failed.');
  }
  return res.json();
}

/**
 * Transfer native KSS. Uses session seed when password omitted.
 */
export async function transferKSS(params: {
  recipient: string;
  amountKSS: number;
  password?: string; // optional — falls back to unlocked session
  attachment?: string;
  assetId?: string | null;
}): Promise<TransferResult> {
  const { recipient, amountKSS, password, attachment, assetId } = params;

  if (!isValidKrossAddress(recipient)) {
    throw new Error('Invalid Kross recipient address (must start with 3K).');
  }
  if (amountKSS <= 0) {
    throw new Error('Amount must be greater than 0.');
  }

  const seed = await resolveSeed(password);

  const signedTx = transfer(
    {
      recipient,
      amount: toWavelets(amountKSS),
      assetId: assetId ?? null,
      attachment: attachment || undefined,
      fee: toWavelets(KROSS_CONFIG.fees.transfer),
      chainId: KROSS_CONFIG.chainId,
    },
    seed
  );

  const data = await broadcast(signedTx);
  return {
    id: data.id,
    explorerUrl: `${KROSS_CONFIG.explorerUrl}/tx/${data.id}`,
  };
}

export async function waitForTx(id: string, timeoutMs = 60000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const res = await fetch(`${KROSS_CONFIG.nodeUrl}/transactions/info/${id}`);
    if (res.ok) return true;
    await new Promise((r) => setTimeout(r, 3000));
  }
  return false;
}
