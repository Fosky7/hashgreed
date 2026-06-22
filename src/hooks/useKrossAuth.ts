// src/hooks/useKrossAuth.ts
import { useCallback, useState } from "react";
import { loginWithKross } from "@/lib/blockchain/kross/auth";

const FN_BASE = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL as string;

export function useKrossAuth() {
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // async handler — awaits the async signAuthData/serializeAuthData chain
  const login = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { token, address } = await loginWithKross(FN_BASE);
      localStorage.setItem("kross_session", token);
      setAddress(address);
      return token;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { login, loading, address, error };
}
