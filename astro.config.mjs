import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import icon from "astro-icon";

import sitemap from "@astrojs/sitemap";

// https://astro.build/config
import compressor from "astro-compressor";
export default defineConfig({
  site: "https://www.audacityteam.org",
  /*
    English only for the Audacity 4 release. fr/de/es and their fallback map
    live on the i18n/main branch; widening this array and restoring the
    dictionaries in src/i18n/index.ts is all that's needed to bring them back.
  */
  /*
    The getting-started path and the how-to index moved inside the manual so
    readers keep the sidebar, search and stream switcher. These keep any
    existing links working.
  */
  redirects: {
    "/learn": "/manual/getting-started",
    "/tutorials": "/manual/how-to",
  },
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [
    tailwind({
      // Example: Disable injecting a basic `base.css` import on every page.
      // Useful if you need to define and/or import your own custom `base.css`.
      applyBaseStyles: false,
    }),
    react(),
    mdx(),
    icon({
      include: {
        "fa6-brands": ["apple", "windows", "linux"],
      },
    }),
    sitemap(),
    compressor(),
  ],
  vite: {
    define: {
      "import.meta.env.BRANCH": JSON.stringify(process.env.BRANCH),
    },
    resolve: {
      dedupe: ["react", "react-dom"],
    },
    ssr: {
      noExternal: [
        "@datapunt/matomo-tracker-react",
        "@datapunt/matomo-tracker-js",
        "@dilsonspickles/components",
        "gsap",
      ],
    },
    optimizeDeps: {
      /*
        react/react-dom must be pre-bundled alongside the design system, not
        just the package on its own. Left out, ThemeProvider inside
        @dilsonspickles/components resolves a second, null React and throws
        "Cannot read properties of null (reading 'useMemo')" during hydration,
        which takes down every island on /about that uses it.
      */
      include: [
        "@dilsonspickles/components",
        // Deep-subpath island imports must be pre-bundled in the SAME
        // optimize pass as react. A subpath first discovered while the dev
        // server is running lands in a second pass with its own React copy,
        // and every island on the page dies on "null useState" — add new
        // interactive-island subpaths here BEFORE starting the server.
        "@dilsonspickles/components/TrackControlPanel",
        "@dilsonspickles/components/Toolbar",
        "@dilsonspickles/components/TransportButton",
        "@dilsonspickles/components/ToolButton",
        "@dilsonspickles/components/ApplicationHeader",
        "@dilsonspickles/components/ProjectToolbar",
        "@dilsonspickles/components/TimelineRuler",
        "@dilsonspickles/components/Clip",
        "react",
        "react-dom",
      ],
    },
    build: {
      assets: "assets",
    },
  },
});
