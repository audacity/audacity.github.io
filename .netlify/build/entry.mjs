import { renderers } from './renderers.mjs';
import { s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_CvSoi7hX.mjs';
import { manifest } from './manifest_88gFEtA8.mjs';
import { createExports } from '@astrojs/netlify/ssr-function.js';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/404.astro.mjs');
const _page1 = () => import('./pages/au4.astro.mjs');
const _page2 = () => import('./pages/blog/_slug_.astro.mjs');
const _page3 = () => import('./pages/blog.astro.mjs');
const _page4 = () => import('./pages/cla.astro.mjs');
const _page5 = () => import('./pages/cloud-saving.astro.mjs');
const _page6 = () => import('./pages/download/linux.astro.mjs');
const _page7 = () => import('./pages/download/mac.astro.mjs');
const _page8 = () => import('./pages/download/openvino.astro.mjs');
const _page9 = () => import('./pages/download/windows.astro.mjs');
const _page10 = () => import('./pages/download.astro.mjs');
const _page11 = () => import('./pages/faq.astro.mjs');
const _page12 = () => import('./pages/legal/accessibility.astro.mjs');
const _page13 = () => import('./pages/legal/cookie-policy.astro.mjs');
const _page14 = () => import('./pages/legal/privacy-notice.astro.mjs');
const _page15 = () => import('./pages/legal/vpat.astro.mjs');
const _page16 = () => import('./pages/legal.astro.mjs');
const _page17 = () => import('./pages/next.astro.mjs');
const _page18 = () => import('./pages/old-desktop-privacy-notice.astro.mjs');
const _page19 = () => import('./pages/post-download.astro.mjs');
const _page20 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["src/pages/404.astro", _page0],
    ["src/pages/au4.astro", _page1],
    ["src/pages/blog/[slug].astro", _page2],
    ["src/pages/blog.astro", _page3],
    ["src/pages/CLA.md", _page4],
    ["src/pages/cloud-saving.astro", _page5],
    ["src/pages/download/linux.astro", _page6],
    ["src/pages/download/mac.astro", _page7],
    ["src/pages/download/openvino.astro", _page8],
    ["src/pages/download/windows.astro", _page9],
    ["src/pages/download.astro", _page10],
    ["src/pages/FAQ.md", _page11],
    ["src/pages/legal/accessibility.md", _page12],
    ["src/pages/legal/cookie-policy.md", _page13],
    ["src/pages/legal/privacy-notice.md", _page14],
    ["src/pages/legal/vpat.md", _page15],
    ["src/pages/legal/index.astro", _page16],
    ["src/pages/next.astro", _page17],
    ["src/pages/old-desktop-privacy-notice.md", _page18],
    ["src/pages/post-download.astro", _page19],
    ["src/pages/index.astro", _page20]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./noop-entrypoint.mjs'),
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "middlewareSecret": "0efde65d-d270-4eb2-be88-6858199b2c2c"
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) {
	serverEntrypointModule[_start](_manifest, _args);
}

export { __astrojsSsrVirtualEntry as default, pageMap };
