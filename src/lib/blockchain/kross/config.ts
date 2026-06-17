// src/lib/blockchain/kross/config.ts

export const KROSS_CONFIG = {
  nodeUrl: 'https://nodes.krossexplorer.com',
  chainId: 'N',
  explorerUrl: 'https://krossexplorer.com',
  nativeCoin: 'KSS',
  decimals: 8,
  addressPrefix: '3K',
  // 1 KSS = 100,000,000 wavelets
  unit: 100_000_000,
  fees: {
    transfer: 0.001,
    massTransfer: 0.007,
    issueAsset: 1,
    issueNFT: 0.001,
    invoke: 0.005,
    setScript: 0.01,
  },
} as const;

export const toWavelets = (kss: number): number =>
  Math.round(kss * KROSS_CONFIG.unit);

export const fromWavelets = (wavelets: number): number =>
  wavelets / KROSS_CONFIG.unit;
