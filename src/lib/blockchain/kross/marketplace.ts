// src/lib/blockchain/kross/marketplace.ts
//
// Marketplace transaction helpers for the Kross mainnet dApp. Mirrors the
// build/sign/broadcast pattern of transfer.ts / assets.ts. All broadcasts
// target the LIVE Kross mainnet node only.

import {
  KROSS_CONFIG,
  toBaseUnits,
  explorerTxUrl,
} from './config';
import {
  loadTransactionsSdk,
  broadcastTx,
  getSeedFromPassword,
} from './sdk';

export interface TxResult {
  id: string;
  explorerUrl: string;
}

function assertMarketplaceConfigured(): string {
  const dApp = KROSS_CONFIG.marketplaceDApp;
  if (!dApp) {
    throw new Error(
      'Marketplace dApp address is not configured. Set VITE_KROSS_MARKETPLACE_DAPP.'
    );
  }
  return dApp;
}

/**
 * Update the listed price of an already-listed NFT.
 *
 * Builds an invokeScript transaction calling `updateNFTPrice(assetId, newPrice)`
 * on the marketplace dApp, signs it with the password-derived seed, and
 * broadcasts to mainnet.
 *
 * @param assetId    The on-chain asset id of the listed NFT.
 * @param newPriceKSS The new price entered by the user, in whole KSS.
 * @param password   Wallet password used to derive the signing seed.
 */
export async function updateNFTPrice({
  assetId,
  newPriceKSS,
  password,
}: {
  assetId: string;
  newPriceKSS: number;
  password: string;
}): Promise<TxResult> {
  if (!assetId) throw new Error('Missing asset id.');
  if (!(newPriceKSS > 0)) throw new Error('New price must be greater than zero.');

  const dApp = assertMarketplaceConfigured();
  const newPriceBaseUnits = toBaseUnits(newPriceKSS);

  const seed = await getSeedFromPassword(password);
  const { invokeScript } = await loadTransactionsSdk();

  const signed = invokeScript(
    {
      dApp,
      chainId: KROSS_CONFIG.chainId,
      // Standard invokeScript fee, in base units.
      fee: toBaseUnits(KROSS_CONFIG.fees.updateNFTPrice),
      call: {
        function: 'updateNFTPrice',
        args: [
          { type: 'string', value: assetId },
          { type: 'integer', value: newPriceBaseUnits },
        ],
      },
      payment: [],
    },
    seed
  );

  const { id } = await broadcastTx(signed as Record<string, unknown>);
  return { id, explorerUrl: explorerTxUrl(id) };
}

/**
 * Poll the mainnet node until a transaction is confirmed (appears in a block)
 * or a timeout elapses. Reused by the UI to drive the 'confirming' state.
 */
export async function waitForTx(
  id: string,
  { timeoutMs = 90_000, intervalMs = 3_000 }: { timeoutMs?: number; intervalMs?: number } = {}
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${KROSS_CONFIG.nodeUrl}/transactions/info/${id}`);
      if (res.ok) {
        const body = (await res.json()) as { applicationStatus?: string };
        // Any successful info response means it is mined.
        if (!body.applicationStatus || body.applicationStatus === 'succeeded') {
          return;
        }
        throw new Error('Transaction failed on-chain.');
      }
    } catch (e) {
      // Network blips: keep polling until the deadline.
      if (e instanceof Error && e.message === 'Transaction failed on-chain.') {
        throw e;
      }
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error('Timed out waiting for transaction confirmation.');
}
