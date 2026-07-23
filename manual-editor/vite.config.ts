import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: ".",
  plugins: [react()],
  build: { outDir: "dist", emptyOutDir: true },
  resolve: {
    // The registry chunk (repo-root src/components/manual/UIExample/…)
    // resolves @dilsonspickles/components from the ROOT node_modules, whose
    // peer react would otherwise also come from root (React 18) while the
    // editor bundles its own React 19 — two React copies break hooks.
    dedupe: ["react", "react-dom"],
  },
  server: {
    port: 5273,
    // The local dev server (dev-server.ts) proxies HTTP on :8873 but not the
    // HMR WebSocket. Point the HMR client straight at Vite's own port so it
    // doesn't try (and fail) to upgrade through the proxy — which otherwise
    // makes the page reload-loop and re-fire /api requests.
    hmr: { clientPort: 5273 },
    // Allow the dev server to serve the repo-root registry files, which
    // live outside the manual-editor Vite root.
    fs: { allow: [".."] },
  },
});
