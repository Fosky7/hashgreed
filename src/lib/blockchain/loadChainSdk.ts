// src/lib/blockchain/loadChainSdk.ts

/**
 * Installs Node globals (Buffer/process) required by chain SDKs, THEN
 * dynamically imports them. Importing these packages statically crashes
 * the in-browser preview because they reference Buffer/process at
 * module-eval time. Always await loadChainSdk(...) inside functions.
 */

let globalsReady: Promise<void> | null = null;

async function ensureGlobals(): Promise<void> {
  if (globalsReady) return globalsReady;
  globalsReady = (async () => {
    const g = globalThis as any;
    if (typeof g.global === "undefined") g.global = globalThis;
    if (typeof g.process === "undefined") {
      g.process = { env: {}, browser: true, version: "", nextTick: (cb: any) => setTimeout(cb, 0) };
    }
    if (typeof g.Buffer === "undefined") {
      const { Buffer } = await import("buffer");
      g.Buffer = Buffer;
    }
  })();
  return globalsReady;
}

type KrossSdk = {
  wavesTx: typeof import("@waves/waves-transactions");
  crypto: typeof import("@waves/ts-lib-crypto");
};

const cache: Record<string, any> = {};

export async function loadChainSdk(chain: "kross"): Promise<KrossSdk> {
  if (cache[chain]) return cache[chain];
  await ensureGlobals();

  switch (chain) {
    case "kross": {
      const [wavesTx, crypto] = await Promise.all([
        import("@waves/waves-transactions"),
        import("@waves/ts-lib-crypto"),
      ]);
      cache[chain] = { wavesTx, crypto } as KrossSdk;
      return cache[chain];
    }
    default:
      throw new Error(`Unsupported chain: ${chain}`);
  }
}
