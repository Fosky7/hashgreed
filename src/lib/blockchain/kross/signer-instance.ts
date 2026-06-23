// src/lib/blockchain/kross/signer-instance.ts
import { CHAIN_ID } from "./config";
import { loadCryptoSdk } from "./sdk";

/**
 * Convenience managed-signer singleton expected by login.ts.
 * Reads the unlocked session seed only inside this SDK layer.
 */
export const signer = {
  async getActiveAccount(): Promise<{ address: string; publicKey: string }> {
    const { getState } = await import("./session");
    const s = getState();
    if (!s.address || !s.publicKey) {
      throw new Error("Wallet is locked — unlock before logging in.");
    }
    return { address: s.address, publicKey: s.publicKey };
  },

  async signMessage(message: string): Promise<string> {
    const { getSessionSeed } = await import("./session");
    // Session must already be unlocked; read seed via in-memory cache.
    const seed = await getSessionSeed("");
    if (!seed) throw new Error("Wallet is locked — unlock before signing.");
    const crypto = await loadCryptoSdk();
    const bytes = crypto.stringToBytes(message);
    const sig = crypto.signBytes(seed, bytes);
    return typeof sig === "string" ? sig : crypto.base58Encode(sig);
  },

  get chainId() {
    return CHAIN_ID;
  },
};
