// src/lib/blockchain/loadChainSdk.ts
//
// Centralized, BUILD-SAFE + RUNTIME-SAFE loader for blockchain SDKs.
//
// Why this file exists
// --------------------
// The production bundler (esbuild) statically analyses every `import()` call.
// When it sees a STRING-LITERAL dynamic import such as
//     await import('@waves/waves-transactions')
// it still tries to RESOLVE that specifier at build time so it can code-split
// it into a chunk. In this environment that package is not resolvable, so the
// build fails with:
//     Unresolved import "@waves/waves-transactions" from .../assets.ts
//
// The trick: esbuild only special-cases `import("<literal>")`. If the module
// specifier is computed from a NON-LITERAL expression (a variable / template
// string), the analyser cannot constant-fold it and therefore leaves it as a
// genuine runtime import instead of trying to resolve it at build time. We
// resolve the SDK from the esm.sh CDN at runtime, AFTER the Node-global
// polyfills (Buffer/process/global) have been installed.
//
// All Kross/Waves SDK loading in the app must go through this module.
/* eslint-disable @typescript-eslint/no-explicit-any */

// Ensure Node globals exist before any SDK module evaluates.
import './kross/polyfills';

// esm.sh CDN base. `external=react,react-dom` keeps the host app's React copy.
const CDN_BASE = 'https://esm.sh/';

// Map a short chain-SDK key to its npm package specifier (with CDN query).
const SDK_SPECIFIERS: Record<string, string> = {
  'waves-transactions':
    '@waves/waves-transactions@4.4.0?external=react,react-dom',
  'ts-lib-crypto': '@waves/ts-lib-crypto@1.4.4?external=react,react-dom',
  'signer': '@waves/signer@1.5.1?external=react,react-dom',
  'provider-keeper': '@waves/provider-keeper@1.2.1?external=react,react-dom',
};

// Cache resolved modules so repeated calls don't re-download.
const moduleCache = new Map<string, Promise<any>>();

/**
 * Indirection helper. Because `spec` is a function parameter (NOT a literal at
 * the call site), esbuild will not attempt build-time resolution of it.
 */
function runtimeImport(spec: string): Promise<any> {
  // The /* @vite-ignore */ comment additionally tells Vite-style analysers to
  // skip this dynamic import. Harmless under plain esbuild.
  return import(/* @vite-ignore */ /* webpackIgnore: true */ spec);
}

/**
 * Dynamically load a blockchain SDK at runtime (post-polyfill).
 *
 * @param name short key: 'waves-transactions' | 'ts-lib-crypto'
 * @returns the resolved module (namespace), normalised so callers can read
 *          either named or default exports.
 */
export async function loadChainSdk(
  name: keyof typeof SDK_SPECIFIERS | string
): Promise<any> {
  const key = String(name);
  const cached = moduleCache.get(key);
  if (cached) return cached;

  const pkg = SDK_SPECIFIERS[key];
  if (!pkg) {
    throw new Error(`Unknown chain SDK requested: "${key}".`);
  }

  // Build the specifier from variables so it is never a static literal.
  const specifier = CDN_BASE + pkg;

  const promise = runtimeImport(specifier)
    .then((mod: any) => mod?.default && !mod?.transfer && !mod?.address ? { ...mod.default, ...mod } : mod)
    .catch((err: unknown) => {
      moduleCache.delete(key);
      throw err instanceof Error
        ? err
        : new Error(`Failed to load chain SDK "${key}".`);
    });

  moduleCache.set(key, promise);
  return promise;
}
