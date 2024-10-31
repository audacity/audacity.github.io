import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";

import sitemap from "@astrojs/sitemap";

// https://astro.build/config
import compressor from "astro-compressor";

// https://astro.build/config
export default defineConfig({
  site: "https://www.audacityteam.org",
  integrations: [tailwind({
    // Example: Disable injecting a basic `base.css` import on every page.
    // Useful if you need to define and/or import your own custom `base.css`.
    applyBaseStyles: false
  }), react(), sitemap(), compressor()],
  vite: {
    ssr: {
      noExternal: ["@datapunt/matomo-tracker-react", "@datapunt/matomo-tracker-js"]
    }
  },
  redirects: {
    '/3.1.0-video': "https://www.youtube.com/watch?v=HpA138b-J9s",
    '/3.2.0-video': "https://www.youtube.com/watch?v=DTRnDNR9LR8",
    "/3.4.0-video": "https://www.youtube.com/watch?v=xgdYuSHdkso",
    "/3.5.0-video": "https://www.youtube.com/watch?v=qEAZv_o0HuQ",
    "/3.6.0-video": "https://www.youtube.com/watch?v=f5TXPUOFH6A",
    "/3.7.0-video": "https://www.youtube.com/watch?v=f5TXPUOFH6A",
    '/realtime-video': "https://www.youtube.com/watch?v=DTRnDNR9LR8",
    '/errors': "https://support.audacityteam.org/troubleshooting/error-codes",
    '/nightly': "/beta",
    '/help/faq': "https://manual.audacityteam.org/man/faq.html",
    '/download/plug-ins/': "https://plugins.audacityteam.org/",
    '/help/documentation/': "https://support.audacityteam.org/",
    '/gitbook-plugins': "https://app.gitbook.com/invite/-MhmG2mhIIHTtQPuHV_k/kY9XD8X03nb2bluFgolK",
    '/devserver': "https://discord.gg/N3XKxzTrq3",
    "/dev": "https://audacity.gitbook.io/dev/",
    '/gitbook-access': "https://app.gitbook.com/invite/-MhmG2mhIIHTtQPuHV_k/acNI2LAF6LtdJW06t4Hc",
    "/about": "/FAQ#team--news",
    "/about/desktop-privacy-notice/": "/desktop-privacy-notice/",
    "/about/desktop-privacy-policy/": "/desktop-privacy-notice/",
    "/desktop-privacy-policy/": "/desktop-privacy-notice/",
    "/about/license/": "https://github.com/audacity/audacity/blob/master/LICENSE.txt",
    "/about/citations-screenshots-and-permissions/": "https://github.com/audacity/audacity/blob/master/LICENSE.txt",
    "/about/credits/": "https://github.com/audacity/audacity/graphs/contributors",
    "/about/features/": "/FAQ#features",
    "/about/features/recording/": "/FAQ#features",
    "/about/features/export-and-import/": "/FAQ#what-audio-file-formats-are-compatible-with-audacity",
    "/about/features/sound-quality/": "/FAQ#what-audio-quality-is-compatible-with-audacity",
    "/about/features/plug-ins/": "https://plugins.audacityteam.org/",
    "/about/features/editing/": "/FAQ#features",
    "/about/features/effects/": "/FAQ#features",
    "/about/features/accessibility/": "/FAQ#features",
    "/about/features/analysis/": "/FAQ#features",
    "/about/screenshots/": "/FAQ#features",
    "/about/nyquist/": "https://audacity.gitbook.io/dev/scripting/creating-your-own-nyquist-plugins",
    "/about/news/": "/blog",
    "/download/online-safety-when-downloading/": "/FAQ#is-audacity-safe-to-download",
    "/download/source/": "/download",
    "/download/legacy-windows/": "/download/windows",
    "/download/legacy-mac/": "/download/mac",
    "/help/": "https://support.audacityteam.org/",
    "/contact/": "/FAQ#i-have-a-question-or-issue-with-audacity-is-there-a-support-team-i-can-contact",
    "/community/": "https://support.audacityteam.org/community/contributing",
    "/community/users/": "https://support.audacityteam.org/community/contributing",
    "/community/developers/": "https://audacity.gitbook.io/dev",
    "/community/translators/": "https://support.audacityteam.org/community/contributing/translating",
    "/copyright/": "https://github.com/audacity/audacity/blob/master/LICENSE.txt",
    "/Setup-Exit-Codes/": "https://support.audacityteam.org/troubleshooting/error-codes/installation-exit-codes",
    "/cla": "/CLA",
    "/)" : "/",
    "/changelog": "https://support.audacityteam.org/additional-resources/changelog",
    "/au4win": "https://nightly.link/audacity/audacity/workflows/au4_build_windows/master",
    "/au4mac": "https://nightly.link/audacity/audacity/workflows/au4_build_macos/",
    "/au4lin": "https://nightly.link/audacity/audacity/workflows/au4_build_linux/master",
    "/survey": "https://po415hli6k2.typeform.com/hub-audacity",
    "/audacitypromo": "https://www.youtube.com/watch?v=Lb7jx4wdXXE&mtm_campaign=audacityapp&mtm_content=welcomescreen_video",
    "/mh-whatsnew": "https://www.musehub.com/plugin/polyspectral-mbc?utm_source=au&utm_medium=mh-whats-new&utm_campaign=polyspectral_page",
    "/mh-effectmenu":"https://musehub.com/plugins?utm_source=au&utm_medium=mh-effectmenu&utm_campaign=mh_plugins",
    "/mh-rtepanel":"https://musehub.com/plugins?utm_source=au&utm_medium=mh-rtepanel&utm_campaign=mh_plugins",
    "/mh-pluginmanager":"https://musehub.com/plugins?utm_source=au&utm_medium=mh-pluginmanager&utm_campaign=mh_plugins"
  }
});
