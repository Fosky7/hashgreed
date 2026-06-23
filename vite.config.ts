// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Bare specifiers that must NEVER be resolved from node_modules —
// they are loaded from a CDN at runtime via loadChainSdk().
const CDN_EXTERNALS = [
  "@waves/waves-transactions",
  "@waves/ts-lib-crypto",
];

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    exclude: CDN_EXTERNALS,
  },
  build: {
    rollupOptions: {
      external: CDN_EXTERNALS,
    },
  },
});
