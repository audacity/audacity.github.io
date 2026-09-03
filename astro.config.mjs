import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import icon from "astro-icon";

import sitemap from "@astrojs/sitemap";

// https://astro.build/config
import compressor from "astro-compressor";
const NO_EXTERNAL = [
  "@datapunt/matomo-tracker-react",
  "@datapunt/matomo-tracker-js",
  "@dilsonspickles/components",
  "gsap",
];

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
    /*
      The manual's front door: the index was a thin chooser duplicating the
      sidebar, so arrivals land on the finished First-steps overview
      instead. Revisit if How-to and Reference mature into a real hub.
    */
    "/manual": "/manual/getting-started",
    // Metering split into two pages on 2 Sep 2026.
    "/manual/toolbar/metering": "/manual/toolbar/microphone-level",
    // The clip's anatomy folded into the section landing on 3 Sep 2026.
    "/manual/clips/the-clip": "/manual/clips",
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
    sitemap({
      /*
        /next redirects to /download and renders only an empty state, so
        listing it would submit a redirecting URL to search engines.

        Matched on the exact path, not a substring: the blog post
        "next-steps-audiocom-audacity" would otherwise be dropped with it.
      */
      filter: (page) => {
        const { pathname } = new URL(page);
        return pathname !== "/next" && pathname !== "/next/";
      },
    }),
    compressor(),
  ],
  vite: {
    define: {
      "import.meta.env.BRANCH": JSON.stringify(process.env.BRANCH),
    },
    resolve: {
      dedupe: ["react", "react-dom"],
      /*
        Vite moved noExternal from `ssr` to `resolve`. Astro 6 reads the new
        location, and without it the design system's shipped .css is handed
        to Node's ESM loader during prerender, which fails on the extension.
        Kept under `ssr` as well so the option still applies wherever the old
        key is the one being read.
      */
      noExternal: NO_EXTERNAL,
    },
    ssr: {
      noExternal: NO_EXTERNAL,
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
        "@dilsonspickles/components/TrackControlSidePanel",
        "@dilsonspickles/components/Toolbar",
        "@dilsonspickles/components/TransportButton",
        "@dilsonspickles/components/ToolButton",
        "@dilsonspickles/components/ApplicationHeader",
        "@dilsonspickles/components/ProjectToolbar",
        "@dilsonspickles/components/TimelineRuler",
        "@dilsonspickles/components/Clip",
        "@dilsonspickles/components/MasterMeter",
        "@dilsonspickles/components/SelectionToolbar",
        "@dilsonspickles/components/VerticalRuler",
        "@dilsonspickles/components/PlayheadCursor",
        "@dilsonspickles/components/TimeCode",
        "react",
        "react-dom",
      ],
    },
    build: {
      assets: "assets",
    },
  },
});
