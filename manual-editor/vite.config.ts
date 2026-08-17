import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: ".",
  plugins: [react()],
  build: { outDir: "dist", emptyOutDir: true },
  resolve: {
    // Dedupe forces these packages to resolve from the EDITOR's own
    // node_modules regardless of where the importing file lives — needed
    // because the registry chunk (repo-root src/components/manual/
    // UIExample/…) would otherwise resolve from the ROOT node_modules,
    // which (a) holds React 18 while the editor bundles React 19 (two React
    // copies break hooks), and (b) doesn't exist at all on the editor's
    // Netlify site, where only manual-editor/ dependencies are installed.
    // The DS package is deduped (not aliased): dedupe goes through normal
    // package resolution, so its exports map still resolves the deep
    // subpath imports (@dilsonspickles/components/Button → dist/Button.mjs)
    // that a filesystem prefix alias would break.
    dedupe: ["react", "react-dom", "@dilsonspickles/components"],
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
