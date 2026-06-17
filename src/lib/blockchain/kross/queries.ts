// src/lib/blockchain/kross/queries.ts
import { KROSS_CONFIG, fromWavelets } from './config';

export interface KrossAsset {
  assetId: string;
  name: string;
  balance: number;       // human-readable
  decimals: number;
  isNFT: boolean;
}

export interface KrossTx {
  id: string;
  type: number;
  timestamp: number;
  amount: number;        // human-readable KSS for transfers
  fee: number;
  sender: string;
  recipient?: string;
  direction: 'in' | 'out' | 'self';
}

/**
 * Fetch native KSS balance (converted from wavelets).
 */
export async function getKssBalance(address: string): Promise<number> {
  const res = await fetch(
    `${KROSS_CONFIG.nodeUrl}/addresses/balance/${address}`
  );
  if (!res.ok) throw new Error('Failed to fetch KSS balance');
  const data = await res.json();
  return fromWavelets(data.balance);
}

/**
 * Fetch all token/NFT balances held by the address.
 */
export async function getAssets(address: string): Promise<KrossAsset[]> {
  const res = await fetch(
    `${KROSS_CONFIG.nodeUrl}/assets/balance/${address}`
  );
  if (!res.ok) throw new Error('Failed to fetch assets');
  const data = await res.json();
  return (data.balances ?? []).map((b: any) => {
    const decimals = b.issueTransaction?.decimals ?? 0;
    const quantity = b.issueTransaction?.quantity ?? b.balance;
    const isNFT = decimals === 0 && quantity === 1;
    return {
      assetId: b.assetId,
      name: b.issueTransaction?.name ?? 'Unknown',
      balance: b.balance / Math.pow(10, decimals),
      decimals,
      isNFT,
    };
  });
}

/**
 * Fetch recent transactions for the address.
 */
export async function getTransactions(
  address: string,
  limit = 25
): Promise<KrossTx[]> {
  const res = await fetch(
    `${KROSS_CONFIG.nodeUrl}/transactions/address/${address}/limit/${limit}`
  );
  if (!res.ok) throw new Error('Failed to fetch transactions');
  const data = await res.json();
  const list = Array.isArray(data?.[0]) ? data[0] : [];
  return list.map((tx: any): KrossTx => {
    const isOut = tx.sender === address;
    const isIn = tx.recipient === address;
    let direction: KrossTx['direction'] = 'self';
    if (isOut && !isIn) direction = 'out';
    else if (isIn && !isOut) direction = 'in';
    return {
      id: tx.id,
      type: tx.type,
      timestamp: tx.timestamp,
      amount: tx.amount ? fromWavelets(tx.amount) : 0,
      fee: fromWavelets(tx.fee ?? 0),
      sender: tx.sender,
      recipient: tx.recipient,
      direction,
    };
  });
}
