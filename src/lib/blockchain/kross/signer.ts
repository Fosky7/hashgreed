// src/lib/blockchain/kross/signer.ts
import { loadChainSdk } from "../loadChainSdk";
import { serializeAuthData } from "./authData";

export interface KrossSigner {
  signMessage(dataBase58: string): Promise<string>;
  getPublicKey(): Promise<string>;
  getAddress(): Promise<string>;
}

async function getManagedSeed(): Promise<string> {
  const seed = (globalThis as any).__KROSS_MANAGED_SEED__;
  if (typeof seed !== "string" || !seed) {
    throw new Error("Managed seed unavailable in signer context");
  }
  return seed;
}

export function createKrossSigner(): KrossSigner {
  return {
    async signMessage(dataBase58: string): Promise<string> {
      const { crypto } = await loadChainSdk("kross");
      const { signBytes, base58Decode, base58Encode } = crypto;
      const seed = await getManagedSeed();
      const bytes = base58Decode(dataBase58);
      const sig = signBytes(seed, bytes);
      return typeof sig === "string" ? sig : base58Encode(sig);
    },
    async getPublicKey(): Promise<string> {
      const { crypto } = await loadChainSdk("kross");
      const { publicKey } = crypto;
      return publicKey(await getManagedSeed());
    },
    async getAddress(): Promise<string> {
      const { crypto } = await loadChainSdk("kross");
      const { address } = crypto;
      return address(await getManagedSeed(), "N");
    },
  };
}

export async function signAuthData(
  signer: KrossSigner,
  host: string,
  data: string
): Promise<string> {
  const authBytes = await serializeAuthData(host, data);
  return signer.signMessage(authBytes);
}

// Convenience managed-signer singleton expected by login.ts.
export { signer } from "./signer-instance";
