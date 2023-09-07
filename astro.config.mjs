import { defineConfig } from "astro/config";

// https://astro.build/config
import tailwind from "@astrojs/tailwind";

// https://astro.build/config
import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  site: "https://audacity.github.io",
  integrations: [ tailwind({
    // Example: Disable injecting a basic `base.css` import on every page.
    // Useful if you need to define and/or import your own custom `base.css`.
    applyBaseStyles: false,
  }), react()],
  vite: {
    ssr: {
      noExternal: [
        "@datapunt/matomo-tracker-react",
        "@datapunt/matomo-tracker-js",
      ],
    },
  },
  redirects: {
    '/3.1.0-video': "https://www.youtube.com/watch?v=HpA138b-J9s"
  }
});
