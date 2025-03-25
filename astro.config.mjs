import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";

import sitemap from "@astrojs/sitemap";

// https://astro.build/config
import compressor from "astro-compressor";

// https://astro.build/config
export default defineConfig({
  site: "https://www.audacityteam.org",
  integrations: [
    tailwind({
      // Example: Disable injecting a basic `base.css` import on every page.
      // Useful if you need to define and/or import your own custom `base.css`.
      applyBaseStyles: false,
    }),
    react(),
    sitemap(),
    compressor(),
  ],
  vite: {
    define: {
      "import.meta.env.BRANCH": JSON.stringify(process.env.BRANCH),
    },
    ssr: {
      noExternal: [
        "@datapunt/matomo-tracker-react",
        "@datapunt/matomo-tracker-js",
      ],
    },
    build: {
      assets: 'assets',
    },
  },
});
