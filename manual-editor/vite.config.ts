import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: ".",
  plugins: [react()],
  build: { outDir: "dist", emptyOutDir: true },
  server: {
    port: 5273,
    // The local dev server (dev-server.ts) proxies HTTP on :8873 but not the
    // HMR WebSocket. Point the HMR client straight at Vite's own port so it
    // doesn't try (and fail) to upgrade through the proxy — which otherwise
    // makes the page reload-loop and re-fire /api requests.
    hmr: { clientPort: 5273 },
  },
});
