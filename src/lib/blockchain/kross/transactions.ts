// src/lib/blockchain/kross/transactions.ts
const KROSS_NODE = "https://nodes.krossexplorer.com";

export interface KrossTransaction {
  id: string;
  type: number;
  timestamp: number;
  sender: string;
  recipient?: string;
  amount?: number;
  assetId?: string | null;
  fee: number;
  call?: { function: string };
}

export interface NormalizedTx {
  id: string;
  kind: "sent" | "received" | "invoke" | "other";
  counterparty?: string;
  amountKss?: number; // native KSS, decimal
  assetId?: string | null;
  functionName?: string;
  timestamp: number;
  feeKss: number;
}

const KSS_DECIMALS = 8;
const toDecimal = (v: number) => v / 10 ** KSS_DECIMALS;

/**
 * Fetch the most recent transactions for an address from the Kross node.
 */
export async function fetchRecentTransactions(
  address: string,
  limit = 15
): Promise<NormalizedTx[]> {
  const url = `${KROSS_NODE}/transactions/address/${address}/limit/${limit}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch transactions (${res.status})`);
  }
  const data = await res.json();
  // Node returns [[...txs]]
  const txs: KrossTransaction[] = Array.isArray(data?.[0]) ? data[0] : data;

  return txs.map((tx) => normalizeTx(tx, address));
}

function normalizeTx(tx: KrossTransaction, owner: string): NormalizedTx {
  const base = {
    id: tx.id,
    timestamp: tx.timestamp,
    feeKss: toDecimal(tx.fee),
    assetId: tx.assetId ?? null,
  };

  // Type 16 = InvokeScript
  if (tx.type === 16) {
    return {
      ...base,
      kind: "invoke",
      counterparty: tx.recipient,
      functionName: tx.call?.function ?? "invoke",
    };
  }

  // Type 4 = Transfer
  if (tx.type === 4 && typeof tx.amount === "number") {
    const isSender = tx.sender === owner;
    return {
      ...base,
      kind: isSender ? "sent" : "received",
      counterparty: isSender ? tx.recipient : tx.sender,
      amountKss: toDecimal(tx.amount),
    };
  }

  return { ...base, kind: "other", counterparty: tx.sender };
}
