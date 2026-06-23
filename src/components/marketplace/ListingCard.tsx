// src/components/marketplace/ListingCard.tsx
// FIX: KROSS_CONFIG lives in config.ts, not deployed.config.ts (read-only).
import { KROSS_CONFIG, formatKSS } from "@/lib/blockchain/kross/config";

// ... rest of the component unchanged.
// Use KROSS_CONFIG.explorerUrl / KROSS_CONFIG.nativeCoin.symbol as before.
