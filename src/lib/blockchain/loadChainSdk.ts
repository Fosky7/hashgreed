// src/lib/blockchain/loadChainSdk.ts

/**
 * Runtime CDN loader for blockchain SDKs.
 *
 * These packages run Node-global code (Buffer.from, process) at module
 * initialization. We therefore:
 *   1) ensure browser globals are installed BEFORE the SDK module evaluates, and
 *   2) load them from an ESM CDN at runtime using a /* @vite-ignore *​/ dynamic
 *      import so Rollup never tries to resolve the bare specifier during the
 *      production build (which previously caused "Unresolved import").
 *
 * The packages are intentionally NOT in package.json dependencies.
 */

// Pin versions for deterministic, cache-friendly CDN loads.
const CDN_VERSIONS: Record<string, string> = {
  "@waves/waves-transactions": "4.3.4",
  "@waves/ts-lib-crypto": "1.4.4-beta.1",
};

// esm.sh serves browser-ready ESM and shims most Node built-ins.
const CDN_BASE = "https://esm.sh";

// Cache resolved modules so we only fetch each package once per session.
const _moduleCache = new Map<string, Promise<any>>();

/** Ensure Buffer/process/global exist before any SDK module evaluates. */
async function ensureGlobals(): Promise<void> {
  const g = globalThis as any;

  if (typeof g.global === "undefined") g.global = g;

  if (typeof g.process === "undefined") {
    g.process = { env: {}, browser: true, version: "", nextTick: (cb: () => void) => setTimeout(cb, 0) };
  }

  if (typeof g.Buffer === "undefined") {
    const buffer = await import(/* @vite-ignore */ `${CDN_BASE}/buffer@6.0.3`);
    g.Buffer = (buffer as any).Buffer ?? (buffer as any).default?.Buffer;
  }
}

function buildCdnUrl(pkg: string): string {
  const version = CDN_VERSIONS[pkg];
  const spec = version ? `${pkg}@${version}` : pkg;
  // ?target=es2020 keeps output broadly compatible; bundle deps for fewer round-trips.
  return `${CDN_BASE}/${spec}?target=es2020&bundle`;
}

/**
 * Dynamically load a chain SDK from the CDN AFTER globals are installed.
 *
 * @param _chain  Chain key (e.g. "kross") — kept for API compatibility/logging.
 * @param pkg     The npm package name to load (e.g. "@waves/waves-transactions").
 */
export async function loadChainSdk(_chain: string, pkg: string): Promise<any> {
  const cacheKey = pkg;
  const cached = _moduleCache.get(cacheKey);
  if (cached) return cached;

  const loadPromise = (async () => {
    await ensureGlobals();
    const url = buildCdnUrl(pkg);
    try {
      // /* @vite-ignore */ tells Rollup/Vite NOT to analyze or resolve this
      // specifier at build time — it stays a true runtime import.
      const mod = await import(/* @vite-ignore */ url);
      // esm.sh may put the package on `default` for CJS interop.
      return (mod as any).default && Object.keys(mod).length === 1 ? (mod as any).default : mod;
    } catch (err) {
      _moduleCache.delete(cacheKey);
      throw new Error(
        `Failed to load "${pkg}" from CDN (${url}): ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  })();

  _moduleCache.set(cacheKey, loadPromise);
  return loadPromise;
}

export default loadChainSdk;
