// src/lib/blockchain/kross/marketplace-admin.ts
import { KROSS_CONFIG } from './deployed.config';
import type { KrossSigner } from './signer';

const { MARKETPLACE_DAPP } = KROSS_CONFIG;

function requireDapp(): string {
  if (!MARKETPLACE_DAPP) throw new Error('Marketplace dApp address not configured');
  return MARKETPLACE_DAPP;
}

/** One-time init: caller becomes admin, sets fee wallet. init(feeWallet). */
export async function initMarketplace(signer: KrossSigner, feeWallet: string) {
  return signer.invoke({
    dApp: requireDapp(),
    call: { function: 'init', args: [{ type: 'string', value: feeWallet }] },
  });
}

/** Rotate admin. setAdmin(newAdmin). */
export async function setAdmin(signer: KrossSigner, newAdmin: string) {
  return signer.invoke({
    dApp: requireDapp(),
    call: { function: 'setAdmin', args: [{ type: 'string', value: newAdmin }] },
  });
}

/** Rotate fee wallet. setFeeWallet(feeWallet). */
export async function setFeeWallet(signer: KrossSigner, feeWallet: string) {
  return signer.invoke({
    dApp: requireDapp(),
    call: { function: 'setFeeWallet', args: [{ type: 'string', value: feeWallet }] },
  });
}

/** Set platform fee in bps (0-1000 = max 10%). setFeeBps(bps). */
export async function setFeeBps(signer: KrossSigner, bps: number) {
  if (bps < 0 || bps > 1000) throw new Error('Fee must be between 0 and 1000 bps');
  return signer.invoke({
    dApp: requireDapp(),
    call: { function: 'setFeeBps', args: [{ type: 'integer', value: bps }] },
  });
}
