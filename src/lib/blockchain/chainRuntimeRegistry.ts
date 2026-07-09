// ============================================================
// CHAIN RUNTIME REGISTRY  (Fixes #2 + #7)
// ============================================================
// Single source of truth for HOW each supported blockchain's SDK must be
// loaded and what runtime environment it needs to initialize without
// crashing — in production AND in the in-browser preview sandbox.
//
// The persistent class of bug this prevents: blockchain SDKs touch Node
// globals (Buffer / process / global) and WASM during *module
// initialization*. If those globals are missing, the module throws BEFORE
// any app code runs ("Cannot read properties of undefined (reading 'from')",
// "Entry module never executed"). That can never be fixed by app-level
// runtime patches — it must be fixed at the import/runtime layer.
//
// Every consumer (async loader, preview bundler, Vite config, smoke tests,
// the SDK lint rule, and Kross Engine's error classifier) reads from THIS
// registry so a new chain only has to be described in one place.
// ============================================================

import type { ChainType } from '@/types/blockchain';

/** A Node-style global that an SDK expects to exist before it initializes. */
export type RuntimeGlobal = 'Buffer' | 'process' | 'global' | 'crypto';

export interface ChainRuntimeManifest {
  /** Canonical chain family id (matches ChainType). */
  chain: ChainType | 'litecoin' | 'dogecoin' | 'aptos' | 'sui';
  /** Human label for diagnostics. */
  label: string;
  /** The npm package(s) whose import-time code touches Node globals. */
  sdkPackages: string[];
  /**
   * MUST be dynamically imported (never statically) so the runtime globals
   * below can be installed before the SDK's module body executes.
   */
  dynamicImportRequired: boolean;
  /** Globals that must exist on globalThis before the SDK is imported. */
  requiredGlobals: RuntimeGlobal[];
  /** Polyfill module ids the preview sandbox must inject before imports. */
  previewPolyfills: string[];
  /** Polyfill module ids vite-plugin-node-polyfills must shim in prod. */
  vitePolyfills: string[];
  /** True when the SDK loads a .wasm binary at init (needs fetch+instantiate). */
  needsWasm: boolean;
  /** Address format, for capability-aware generation. */
  addressFormat: string;
  /** Signer model used by the chain. */
  signerType: 'seed-phrase' | 'private-key' | 'keypair' | 'wallet-extension';
  /** Canonical mainnet block explorer. */
  explorerUrl: string;
}

// Buffer + process + global are needed by virtually every crypto SDK; we list
// them explicitly per chain so the manifest stays self-documenting and a chain
// that ever drops the requirement can do so without affecting others.
const NODE_CRYPTO_GLOBALS: RuntimeGlobal[] = ['Buffer', 'process', 'global'];

export const CHAIN_RUNTIME_REGISTRY: Record<string, ChainRuntimeManifest> = {
  kross: {
    chain: 'kross',
    label: 'Kross Blockchain',
    sdkPackages: ['@waves/waves-transactions', '@waves/ts-lib-crypto'],
    dynamicImportRequired: true,
    requiredGlobals: NODE_CRYPTO_GLOBALS,
    previewPolyfills: ['buffer', 'process'],
    vitePolyfills: ['buffer', 'process'],
    needsWasm: false,
    addressFormat: 'base58, starts with 3K (chainId N)',
    signerType: 'seed-phrase',
    explorerUrl: 'https://krossexplorer.com',
  },
  waves: {
    chain: 'waves',
    label: 'Waves',
    sdkPackages: ['@waves/waves-transactions', '@waves/ts-lib-crypto'],
    dynamicImportRequired: true,
    requiredGlobals: NODE_CRYPTO_GLOBALS,
    previewPolyfills: ['buffer', 'process'],
    vitePolyfills: ['buffer', 'process'],
    needsWasm: false,
    addressFormat: 'base58 (chainId W)',
    signerType: 'seed-phrase',
    explorerUrl: 'https://wavesexplorer.com',
  },
  evm: {
    chain: 'evm',
    label: 'EVM (Ethereum, BSC, Polygon, Avalanche, Arbitrum, …)',
    sdkPackages: ['ethers'],
    dynamicImportRequired: true,
    requiredGlobals: ['Buffer', 'process', 'global'],
    previewPolyfills: ['buffer', 'process'],
    vitePolyfills: ['buffer', 'process'],
    needsWasm: false,
    addressFormat: 'hex (EIP-55 checksum, 0x…)',
    signerType: 'seed-phrase',
    explorerUrl: 'https://etherscan.io',
  },
  solana: {
    chain: 'solana',
    label: 'Solana',
    sdkPackages: ['@solana/web3.js', 'bip39', 'bs58', 'micro-ed25519-hdkey'],
    dynamicImportRequired: true,
    requiredGlobals: NODE_CRYPTO_GLOBALS,
    previewPolyfills: ['buffer', 'process'],
    vitePolyfills: ['buffer', 'process'],
    needsWasm: false,
    addressFormat: 'base58 ed25519 public key',
    signerType: 'keypair',
    explorerUrl: 'https://explorer.solana.com',
  },
  bitcoin: {
    chain: 'bitcoin',
    label: 'Bitcoin',
    sdkPackages: ['bitcoinjs-lib', 'bip32', 'bip39', 'ecpair', 'tiny-secp256k1'],
    dynamicImportRequired: true,
    requiredGlobals: NODE_CRYPTO_GLOBALS,
    previewPolyfills: ['buffer', 'process'],
    vitePolyfills: ['buffer', 'process'],
    needsWasm: true, // tiny-secp256k1 loads a wasm binary
    addressFormat: 'bech32 / base58 (taproot, segwit, legacy)',
    signerType: 'seed-phrase',
    explorerUrl: 'https://mempool.space',
  },
  litecoin: {
    chain: 'litecoin',
    label: 'Litecoin',
    sdkPackages: ['bitcoinjs-lib', 'bip32', 'bip39', 'ecpair', 'tiny-secp256k1'],
    dynamicImportRequired: true,
    requiredGlobals: NODE_CRYPTO_GLOBALS,
    previewPolyfills: ['buffer', 'process'],
    vitePolyfills: ['buffer', 'process'],
    needsWasm: true,
    addressFormat: 'bech32 / base58 (ltc1…, L…)',
    signerType: 'seed-phrase',
    explorerUrl: 'https://litecoinspace.org',
  },
  dogecoin: {
    chain: 'dogecoin',
    label: 'Dogecoin',
    sdkPackages: ['bitcoinjs-lib', 'bip32', 'bip39', 'ecpair', 'tiny-secp256k1'],
    dynamicImportRequired: true,
    requiredGlobals: NODE_CRYPTO_GLOBALS,
    previewPolyfills: ['buffer', 'process'],
    vitePolyfills: ['buffer', 'process'],
    needsWasm: true,
    addressFormat: 'base58 (D…)',
    signerType: 'seed-phrase',
    explorerUrl: 'https://dogechain.info',
  },
  cosmos: {
    chain: 'cosmos',
    label: 'Cosmos',
    sdkPackages: ['@cosmjs/proto-signing', '@cosmjs/stargate'],
    dynamicImportRequired: true,
    requiredGlobals: NODE_CRYPTO_GLOBALS,
    previewPolyfills: ['buffer', 'process'],
    vitePolyfills: ['buffer', 'process'],
    needsWasm: false,
    addressFormat: 'bech32 (cosmos1…)',
    signerType: 'seed-phrase',
    explorerUrl: 'https://www.mintscan.io/cosmos',
  },
  tron: {
    chain: 'tron',
    label: 'Tron',
    sdkPackages: ['tronweb', 'bip32', 'bip39', 'tiny-secp256k1'],
    dynamicImportRequired: true,
    requiredGlobals: NODE_CRYPTO_GLOBALS,
    previewPolyfills: ['buffer', 'process'],
    vitePolyfills: ['buffer', 'process'],
    needsWasm: true,
    addressFormat: 'base58check (T…)',
    signerType: 'seed-phrase',
    explorerUrl: 'https://tronscan.org',
  },
  ton: {
    chain: 'ton',
    label: 'TON',
    sdkPackages: ['tonweb', 'tonweb-mnemonic'],
    dynamicImportRequired: true,
    requiredGlobals: NODE_CRYPTO_GLOBALS,
    previewPolyfills: ['buffer', 'process'],
    vitePolyfills: ['buffer', 'process'],
    needsWasm: false,
    addressFormat: 'base64url (EQ…/UQ…)',
    signerType: 'seed-phrase',
    explorerUrl: 'https://tonscan.org',
  },
  aptos: {
    chain: 'aptos',
    label: 'Aptos',
    sdkPackages: ['@aptos-labs/ts-sdk', 'bip39'],
    dynamicImportRequired: true,
    requiredGlobals: NODE_CRYPTO_GLOBALS,
    previewPolyfills: ['buffer', 'process'],
    vitePolyfills: ['buffer', 'process'],
    needsWasm: false,
    addressFormat: 'hex (0x…, 32 bytes)',
    signerType: 'keypair',
    explorerUrl: 'https://explorer.aptoslabs.com',
  },
  sui: {
    chain: 'sui',
    label: 'Sui',
    sdkPackages: ['@mysten/sui/keypairs/ed25519', '@mysten/sui/utils'],
    dynamicImportRequired: true,
    requiredGlobals: NODE_CRYPTO_GLOBALS,
    previewPolyfills: ['buffer', 'process'],
    vitePolyfills: ['buffer', 'process'],
    needsWasm: false,
    addressFormat: 'hex (0x…, 32 bytes)',
    signerType: 'keypair',
    explorerUrl: 'https://suiscan.xyz',
  },
  cardano: {
    chain: 'cardano',
    label: 'Cardano',
    sdkPackages: ['@stricahq/bip32ed25519', '@stricahq/typhonjs', 'bip39'],
    dynamicImportRequired: true,
    requiredGlobals: NODE_CRYPTO_GLOBALS,
    previewPolyfills: ['buffer', 'process'],
    vitePolyfills: ['buffer', 'process'],
    needsWasm: false,
    addressFormat: 'bech32 (addr1…)',
    signerType: 'seed-phrase',
    explorerUrl: 'https://cardanoscan.io',
  },
};

/** Map a ChainType (incl. 'move') to the concrete runtime manifest key. */
export function manifestKeyForChainType(
  type: ChainType,
  chainId?: string,
): string {
  if (type === 'move') {
    // 'move' covers both Sui and Aptos; disambiguate by chain id when possible.
    if (chainId && /apt/i.test(chainId)) return 'aptos';
    if (chainId && /sui/i.test(chainId)) return 'sui';
    return 'sui';
  }
  return type;
}

export function getChainRuntime(key: string): ChainRuntimeManifest | null {
  return CHAIN_RUNTIME_REGISTRY[key] ?? null;
}

/** All npm packages that MUST be dynamically imported, across every chain. */
export function allDynamicSdkPackages(): string[] {
  const set = new Set<string>();
  for (const m of Object.values(CHAIN_RUNTIME_REGISTRY)) {
    if (m.dynamicImportRequired) m.sdkPackages.forEach((p) => set.add(p));
  }
  return Array.from(set).sort();
}

// ============================================================
// STATIC-IMPORT GUARD  (Fix #3 — build validation gate)
// ============================================================
// Single source of truth for which bare specifiers may NEVER be imported
// statically by generated apps. Static `import`/`export … from` of any chain
// SDK is hoisted and evaluated before the runtime globals (Buffer/process/
// global) exist, so the module crashes at import time and the entry never
// runs. The ONLY sanctioned path is dynamic `await import(...)` via
// loadChainSdk(). This list is derived from the registry so adding a chain
// automatically extends the guard to all consumers (preview bundler build
// gate, smoke tests, and — kept in sync — the ESLint rule).

/** Exact bare specifiers banned from static import, across all 19 chains. */
export function staticImportBannedSpecifiers(): string[] {
  return allDynamicSdkPackages();
}

/** Specifier prefixes banned from static import (covers subpath imports). */
export const STATIC_IMPORT_BANNED_PREFIXES: string[] = ['@mysten/sui'];

function isBannedSpecifier(spec: string, banned: Set<string>): boolean {
  if (banned.has(spec)) return true;
  return STATIC_IMPORT_BANNED_PREFIXES.some(
    (p) => spec === p || spec.startsWith(p + '/'),
  );
}

export interface StaticSdkImportViolation {
  file: string;
  line: number;
  specifier: string;
}

// Matches `import … from "<spec>"`, side-effect `import "<spec>"`, and
// `export … from "<spec>"`. Dynamic `import("<spec>")` is intentionally NOT
// matched (that's the sanctioned loader path).
const STATIC_IMPORT_RE =
  /(?:^|\n)\s*(?:import\b[^;\n]*?\bfrom\s*|import\s+|export\b[^;\n]*?\bfrom\s*)["']([^"']+)["']/g;

/**
 * Scan generated source files for static imports of any registered chain SDK
 * across all 19 supported chains. Returns every violation so the build gate can
 * block with a precise, import-time diagnostic instead of shipping a preview
 * that dies with "Entry module never executed".
 */
export function scanForStaticChainSdkImports(
  files: { path: string; content: string }[],
): StaticSdkImportViolation[] {
  const banned = new Set(staticImportBannedSpecifiers());
  const violations: StaticSdkImportViolation[] = [];

  for (const file of files) {
    if (!/\.(t|j)sx?$/.test(file.path)) continue;
    // The sanctioned loader is the one place allowed to name these packages.
    if (/src[\\/]lib[\\/]blockchain[\\/]loadChainSdk\.ts$/.test(file.path)) continue;
    const content = file.content ?? '';
    if (!content) continue;

    STATIC_IMPORT_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = STATIC_IMPORT_RE.exec(content)) !== null) {
      const spec = match[1];
      if (!isBannedSpecifier(spec, banned)) continue;
      const line = content.slice(0, match.index).split('\n').length;
      violations.push({ file: file.path, line, specifier: spec });
    }
  }

  return violations;
}

/** Union of every preview polyfill required by any supported chain. */
export function allPreviewPolyfills(): string[] {
  const set = new Set<string>();
  for (const m of Object.values(CHAIN_RUNTIME_REGISTRY)) {
    m.previewPolyfills.forEach((p) => set.add(p));
  }
  return Array.from(set).sort();
}

/** Union of every required runtime global across all supported chains. */
export function allRequiredGlobals(): RuntimeGlobal[] {
  const set = new Set<RuntimeGlobal>();
  for (const m of Object.values(CHAIN_RUNTIME_REGISTRY)) {
    m.requiredGlobals.forEach((g) => set.add(g));
  }
  return Array.from(set);
}

// ============================================================
// PER-NETWORK CAPABILITY LAYER  (all 19 supported networks)
// ============================================================
// The 12 entries above describe RUNTIME families (one per SDK + polyfill
// profile). But KrossBuild supports 19 distinct NETWORK deployments — 7 of them
// share the EVM runtime, 2 share the Cosmos runtime, and Sui/Aptos each have
// their own. Capabilities like explorer URL, numeric/string chainId, and the
// address format/bech32 prefix differ PER NETWORK even when the runtime is
// shared. This layer keys those per-network truths by the `id` used in
// src/config/chains.ts, while pointing back to a runtime family so the
// import/preview/polyfill rules stay DRY and identical to the family manifest.

export interface ChainNetwork {
  /** Matches SUPPORTED_CHAINS[].id in src/config/chains.ts. */
  id: string;
  /** Display name. */
  name: string;
  /** Runtime family key into CHAIN_RUNTIME_REGISTRY. */
  runtime: string;
  /** Network chain id (numeric for EVM, string for Cosmos/Aptos, etc.). */
  chainId?: number | string;
  /** This network's own block explorer (overrides the family default). */
  explorerUrl: string;
  /** Network-specific address format / bech32 prefix. */
  addressFormat: string;
}

export const CHAIN_NETWORKS: Record<string, ChainNetwork> = {
  'kross-mainnet': { id: 'kross-mainnet', name: 'Kross Blockchain', runtime: 'kross', chainId: 'N', explorerUrl: 'https://krossexplorer.com', addressFormat: 'base58, starts with 3K (chainId N)' },
  'waves-mainnet': { id: 'waves-mainnet', name: 'Waves', runtime: 'waves', chainId: 'W', explorerUrl: 'https://wavesexplorer.com', addressFormat: 'base58 (chainId W)' },

  // ── EVM family (7 networks, one ethers runtime) ──
  'ethereum-mainnet': { id: 'ethereum-mainnet', name: 'Ethereum', runtime: 'evm', chainId: 1, explorerUrl: 'https://etherscan.io', addressFormat: 'hex EIP-55 (0x…)' },
  'bsc-mainnet': { id: 'bsc-mainnet', name: 'BNB Smart Chain', runtime: 'evm', chainId: 56, explorerUrl: 'https://bscscan.com', addressFormat: 'hex EIP-55 (0x…)' },
  'polygon-mainnet': { id: 'polygon-mainnet', name: 'Polygon', runtime: 'evm', chainId: 137, explorerUrl: 'https://polygonscan.com', addressFormat: 'hex EIP-55 (0x…)' },
  'avalanche-mainnet': { id: 'avalanche-mainnet', name: 'Avalanche C-Chain', runtime: 'evm', chainId: 43114, explorerUrl: 'https://snowtrace.io', addressFormat: 'hex EIP-55 (0x…)' },
  'arbitrum-mainnet': { id: 'arbitrum-mainnet', name: 'Arbitrum One', runtime: 'evm', chainId: 42161, explorerUrl: 'https://arbiscan.io', addressFormat: 'hex EIP-55 (0x…)' },
  'optimism-mainnet': { id: 'optimism-mainnet', name: 'Optimism', runtime: 'evm', chainId: 10, explorerUrl: 'https://optimistic.etherscan.io', addressFormat: 'hex EIP-55 (0x…)' },
  'base-mainnet': { id: 'base-mainnet', name: 'Base', runtime: 'evm', chainId: 8453, explorerUrl: 'https://basescan.org', addressFormat: 'hex EIP-55 (0x…)' },

  'solana-mainnet': { id: 'solana-mainnet', name: 'Solana', runtime: 'solana', chainId: 'mainnet-beta', explorerUrl: 'https://explorer.solana.com', addressFormat: 'base58 ed25519 public key' },
  'tron-mainnet': { id: 'tron-mainnet', name: 'TRON', runtime: 'tron', chainId: 'mainnet', explorerUrl: 'https://tronscan.org', addressFormat: 'base58check (T…)' },
  'ton-mainnet': { id: 'ton-mainnet', name: 'The Open Network', runtime: 'ton', chainId: '-239', explorerUrl: 'https://tonscan.org', addressFormat: 'base64url (EQ…/UQ…)' },

  // ── Cosmos family (2 networks, one @cosmjs runtime, distinct prefixes) ──
  'cosmos-mainnet': { id: 'cosmos-mainnet', name: 'Cosmos Hub', runtime: 'cosmos', chainId: 'cosmoshub-4', explorerUrl: 'https://www.mintscan.io/cosmos', addressFormat: 'bech32 (cosmos1…)' },
  'osmosis-mainnet': { id: 'osmosis-mainnet', name: 'Osmosis', runtime: 'cosmos', chainId: 'osmosis-1', explorerUrl: 'https://www.mintscan.io/osmosis', addressFormat: 'bech32 (osmo1…)' },
  'neutron-mainnet': { id: 'neutron-mainnet', name: 'Neutron', runtime: 'cosmos', chainId: 'neutron-1', explorerUrl: 'https://www.mintscan.io/neutron', addressFormat: 'bech32 (neutron1…)' },
  'juno-mainnet': { id: 'juno-mainnet', name: 'Juno', runtime: 'cosmos', chainId: 'juno-1', explorerUrl: 'https://www.mintscan.io/juno', addressFormat: 'bech32 (juno1…)' },
  'archway-mainnet': { id: 'archway-mainnet', name: 'Archway', runtime: 'cosmos', chainId: 'archway-1', explorerUrl: 'https://www.mintscan.io/archway', addressFormat: 'bech32 (archway1…)' },

  // ── Move family (Sui + Aptos, separate runtimes) ──
  'sui-mainnet': { id: 'sui-mainnet', name: 'Sui', runtime: 'sui', chainId: 'mainnet', explorerUrl: 'https://suiscan.xyz', addressFormat: 'hex (0x…, 32 bytes)' },
  'aptos-mainnet': { id: 'aptos-mainnet', name: 'Aptos', runtime: 'aptos', chainId: 1, explorerUrl: 'https://explorer.aptoslabs.com', addressFormat: 'hex (0x…, 32 bytes)' },

  // ── UTXO family (bitcoinjs-lib runtime, distinct network params) ──
  'bitcoin-mainnet': { id: 'bitcoin-mainnet', name: 'Bitcoin', runtime: 'bitcoin', chainId: 'bitcoin', explorerUrl: 'https://blockstream.info', addressFormat: 'bech32/base58 (bc1…, 1…, 3…)' },
  'dogecoin-mainnet': { id: 'dogecoin-mainnet', name: 'Dogecoin', runtime: 'dogecoin', chainId: 'dogecoin', explorerUrl: 'https://dogechain.info', addressFormat: 'base58 (D…)' },
  'litecoin-mainnet': { id: 'litecoin-mainnet', name: 'Litecoin', runtime: 'litecoin', chainId: 'litecoin', explorerUrl: 'https://litecoinspace.org', addressFormat: 'bech32/base58 (ltc1…, L…)' },
};

/** The canonical list of all 19 supported network ids. */
export function getAllNetworkIds(): string[] {
  return Object.keys(CHAIN_NETWORKS);
}

/** Resolve a network id to its capabilities + runtime manifest. */
export function resolveNetwork(
  id: string,
): { network: ChainNetwork; runtime: ChainRuntimeManifest } | null {
  const network = CHAIN_NETWORKS[id];
  if (!network) return null;
  const runtime = getChainRuntime(network.runtime);
  if (!runtime) return null;
  return { network, runtime };
}

/** Map a config chain `type` (+ optional id) to a runtime family key. */
export function runtimeKeyForNetworkId(id: string): string | null {
  return CHAIN_NETWORKS[id]?.runtime ?? null;
}

