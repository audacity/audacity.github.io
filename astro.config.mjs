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
    '/3.1.0-video': "https://www.youtube.com/watch?v=HpA138b-J9s",
    '/3.2.0-video': "https://www.youtube.com/watch?v=DTRnDNR9LR8",
    '/realtime-video': "https://www.youtube.com/watch?v=DTRnDNR9LR8",
    '/errors': "https://support.audacityteam.org/troubleshooting/error-codes",
    '/nightly': "https://nightly.link/audacity/audacity/workflows/build/master",
    '/help/faq': "https://manual.audacityteam.org/man/faq.html",
    '/download/plug-ins/': "https://plugins.audacityteam.org/",
    '/help/documentation/': "https://support.audacityteam.org/",
    '/gitbook-plugins': "https://app.gitbook.com/invite/-MhmG2mhIIHTtQPuHV_k/kY9XD8X03nb2bluFgolK",
    '/devserver': "https://discord.gg/N3XKxzTrq3",
    '/gitbook-access': "https://app.gitbook.com/invite/-MhmG2mhIIHTtQPuHV_k/acNI2LAF6LtdJW06t4Hc"
  }
});
