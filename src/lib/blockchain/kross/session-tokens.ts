// src/lib/blockchain/kross/session-tokens.ts
// Server-session token helpers (separate concern from the local unlock session).
const TOKEN_KEY = "kross_session_token";
const ADDR_KEY = "kross_session_address";

const FUNCTIONS_BASE = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL ?? "";

export function getStoredToken(): string | null {
  return typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY);
}

export function getStoredAddress(): string | null {
  return typeof window === "undefined" ? null : localStorage.getItem(ADDR_KEY);
}

export function storeSession(token: string, address: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ADDR_KEY, address);
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ADDR_KEY);
}

export async function validateSession(
  token: string,
  _opts?: { force?: boolean }
): Promise<{ valid: boolean; address?: string }> {
  try {
    const res = await fetch(`${FUNCTIONS_BASE}/kross-session-validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (!res.ok) return { valid: false };
    const data = await res.json();
    return { valid: !!data.valid, address: data.address };
  } catch {
    return { valid: false };
  }
}

export async function revokeSession(token: string): Promise<void> {
  try {
    await fetch(`${FUNCTIONS_BASE}/kross-session-logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
  } catch {
    /* best-effort */
  }
}
