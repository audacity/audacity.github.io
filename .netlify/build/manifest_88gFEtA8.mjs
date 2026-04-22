import '@astrojs/internal-helpers/path';
import '@astrojs/internal-helpers/remote';
import 'piccolore';
import { N as NOOP_MIDDLEWARE_HEADER, k as decodeKey } from './chunks/astro/server_EtV21oL_.mjs';
import 'clsx';
import 'es-module-lexer';
import 'html-escaper';

const NOOP_MIDDLEWARE_FN = async (_ctx, next) => {
  const response = await next();
  response.headers.set(NOOP_MIDDLEWARE_HEADER, "true");
  return response;
};

const codeToStatusMap = {
  // Implemented from IANA HTTP Status Code Registry
  // https://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  PAYMENT_REQUIRED: 402,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  NOT_ACCEPTABLE: 406,
  PROXY_AUTHENTICATION_REQUIRED: 407,
  REQUEST_TIMEOUT: 408,
  CONFLICT: 409,
  GONE: 410,
  LENGTH_REQUIRED: 411,
  PRECONDITION_FAILED: 412,
  CONTENT_TOO_LARGE: 413,
  URI_TOO_LONG: 414,
  UNSUPPORTED_MEDIA_TYPE: 415,
  RANGE_NOT_SATISFIABLE: 416,
  EXPECTATION_FAILED: 417,
  MISDIRECTED_REQUEST: 421,
  UNPROCESSABLE_CONTENT: 422,
  LOCKED: 423,
  FAILED_DEPENDENCY: 424,
  TOO_EARLY: 425,
  UPGRADE_REQUIRED: 426,
  PRECONDITION_REQUIRED: 428,
  TOO_MANY_REQUESTS: 429,
  REQUEST_HEADER_FIELDS_TOO_LARGE: 431,
  UNAVAILABLE_FOR_LEGAL_REASONS: 451,
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
  HTTP_VERSION_NOT_SUPPORTED: 505,
  VARIANT_ALSO_NEGOTIATES: 506,
  INSUFFICIENT_STORAGE: 507,
  LOOP_DETECTED: 508,
  NETWORK_AUTHENTICATION_REQUIRED: 511
};
Object.entries(codeToStatusMap).reduce(
  // reverse the key-value pairs
  (acc, [key, value]) => ({ ...acc, [value]: key }),
  {}
);

function sanitizeParams(params) {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => {
      if (typeof value === "string") {
        return [key, value.normalize().replace(/#/g, "%23").replace(/\?/g, "%3F")];
      }
      return [key, value];
    })
  );
}
function getParameter(part, params) {
  if (part.spread) {
    return params[part.content.slice(3)] || "";
  }
  if (part.dynamic) {
    if (!params[part.content]) {
      throw new TypeError(`Missing parameter: ${part.content}`);
    }
    return params[part.content];
  }
  return part.content.normalize().replace(/\?/g, "%3F").replace(/#/g, "%23").replace(/%5B/g, "[").replace(/%5D/g, "]");
}
function getSegment(segment, params) {
  const segmentPath = segment.map((part) => getParameter(part, params)).join("");
  return segmentPath ? "/" + segmentPath : "";
}
function getRouteGenerator(segments, addTrailingSlash) {
  return (params) => {
    const sanitizedParams = sanitizeParams(params);
    let trailing = "";
    if (addTrailingSlash === "always" && segments.length) {
      trailing = "/";
    }
    const path = segments.map((segment) => getSegment(segment, sanitizedParams)).join("") + trailing;
    return path || "/";
  };
}

function deserializeRouteData(rawRouteData) {
  return {
    route: rawRouteData.route,
    type: rawRouteData.type,
    pattern: new RegExp(rawRouteData.pattern),
    params: rawRouteData.params,
    component: rawRouteData.component,
    generate: getRouteGenerator(rawRouteData.segments, rawRouteData._meta.trailingSlash),
    pathname: rawRouteData.pathname || void 0,
    segments: rawRouteData.segments,
    prerender: rawRouteData.prerender,
    redirect: rawRouteData.redirect,
    redirectRoute: rawRouteData.redirectRoute ? deserializeRouteData(rawRouteData.redirectRoute) : void 0,
    fallbackRoutes: rawRouteData.fallbackRoutes.map((fallback) => {
      return deserializeRouteData(fallback);
    }),
    isIndex: rawRouteData.isIndex,
    origin: rawRouteData.origin
  };
}

function deserializeManifest(serializedManifest) {
  const routes = [];
  for (const serializedRoute of serializedManifest.routes) {
    routes.push({
      ...serializedRoute,
      routeData: deserializeRouteData(serializedRoute.routeData)
    });
    const route = serializedRoute;
    route.routeData = deserializeRouteData(serializedRoute.routeData);
  }
  const assets = new Set(serializedManifest.assets);
  const componentMetadata = new Map(serializedManifest.componentMetadata);
  const inlinedScripts = new Map(serializedManifest.inlinedScripts);
  const clientDirectives = new Map(serializedManifest.clientDirectives);
  const serverIslandNameMap = new Map(serializedManifest.serverIslandNameMap);
  const key = decodeKey(serializedManifest.key);
  return {
    // in case user middleware exists, this no-op middleware will be reassigned (see plugin-ssr.ts)
    middleware() {
      return { onRequest: NOOP_MIDDLEWARE_FN };
    },
    ...serializedManifest,
    assets,
    componentMetadata,
    inlinedScripts,
    clientDirectives,
    routes,
    serverIslandNameMap,
    key
  };
}

const manifest = deserializeManifest({"hrefRoot":"file:///Users/alexdawsonsmac/Documents/Audacity/Website/astro-audacity/","cacheDir":"file:///Users/alexdawsonsmac/Documents/Audacity/Website/astro-audacity/node_modules/.astro/","outDir":"file:///Users/alexdawsonsmac/Documents/Audacity/Website/astro-audacity/dist/","srcDir":"file:///Users/alexdawsonsmac/Documents/Audacity/Website/astro-audacity/src/","publicDir":"file:///Users/alexdawsonsmac/Documents/Audacity/Website/astro-audacity/public/","buildClientDir":"file:///Users/alexdawsonsmac/Documents/Audacity/Website/astro-audacity/dist/","buildServerDir":"file:///Users/alexdawsonsmac/Documents/Audacity/Website/astro-audacity/.netlify/build/","adapterName":"@astrojs/netlify","routes":[{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"page","component":"_server-islands.astro","params":["name"],"segments":[[{"content":"_server-islands","dynamic":false,"spread":false}],[{"content":"name","dynamic":true,"spread":false}]],"pattern":"^\\/_server-islands\\/([^/]+?)\\/?$","prerender":false,"isIndex":false,"fallbackRoutes":[],"route":"/_server-islands/[name]","origin":"internal","_meta":{"trailingSlash":"ignore"}}},{"file":"404.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/404","isIndex":false,"type":"page","pattern":"^\\/404\\/?$","segments":[[{"content":"404","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/404.astro","pathname":"/404","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"au4/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/au4","isIndex":false,"type":"page","pattern":"^\\/au4\\/?$","segments":[[{"content":"au4","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/au4.astro","pathname":"/au4","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"blog/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/blog","isIndex":false,"type":"page","pattern":"^\\/blog\\/?$","segments":[[{"content":"blog","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/blog.astro","pathname":"/blog","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"CLA/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/cla","isIndex":false,"type":"page","pattern":"^\\/CLA\\/?$","segments":[[{"content":"CLA","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/CLA.md","pathname":"/CLA","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"cloud-saving/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/cloud-saving","isIndex":false,"type":"page","pattern":"^\\/cloud-saving\\/?$","segments":[[{"content":"cloud-saving","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/cloud-saving.astro","pathname":"/cloud-saving","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"download/linux/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/download/linux","isIndex":false,"type":"page","pattern":"^\\/download\\/linux\\/?$","segments":[[{"content":"download","dynamic":false,"spread":false}],[{"content":"linux","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/download/linux.astro","pathname":"/download/linux","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"download/mac/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/download/mac","isIndex":false,"type":"page","pattern":"^\\/download\\/mac\\/?$","segments":[[{"content":"download","dynamic":false,"spread":false}],[{"content":"mac","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/download/mac.astro","pathname":"/download/mac","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"download/openvino/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/download/openvino","isIndex":false,"type":"page","pattern":"^\\/download\\/openvino\\/?$","segments":[[{"content":"download","dynamic":false,"spread":false}],[{"content":"openvino","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/download/openvino.astro","pathname":"/download/openvino","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"download/windows/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/download/windows","isIndex":false,"type":"page","pattern":"^\\/download\\/windows\\/?$","segments":[[{"content":"download","dynamic":false,"spread":false}],[{"content":"windows","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/download/windows.astro","pathname":"/download/windows","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"download/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/download","isIndex":false,"type":"page","pattern":"^\\/download\\/?$","segments":[[{"content":"download","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/download.astro","pathname":"/download","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"FAQ/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/faq","isIndex":false,"type":"page","pattern":"^\\/FAQ\\/?$","segments":[[{"content":"FAQ","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/FAQ.md","pathname":"/FAQ","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"legal/accessibility/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/legal/accessibility","isIndex":false,"type":"page","pattern":"^\\/legal\\/accessibility\\/?$","segments":[[{"content":"legal","dynamic":false,"spread":false}],[{"content":"accessibility","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/legal/accessibility.md","pathname":"/legal/accessibility","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"legal/cookie-policy/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/legal/cookie-policy","isIndex":false,"type":"page","pattern":"^\\/legal\\/cookie-policy\\/?$","segments":[[{"content":"legal","dynamic":false,"spread":false}],[{"content":"cookie-policy","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/legal/cookie-policy.md","pathname":"/legal/cookie-policy","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"legal/privacy-notice/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/legal/privacy-notice","isIndex":false,"type":"page","pattern":"^\\/legal\\/privacy-notice\\/?$","segments":[[{"content":"legal","dynamic":false,"spread":false}],[{"content":"privacy-notice","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/legal/privacy-notice.md","pathname":"/legal/privacy-notice","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"legal/vpat/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/legal/vpat","isIndex":false,"type":"page","pattern":"^\\/legal\\/vpat\\/?$","segments":[[{"content":"legal","dynamic":false,"spread":false}],[{"content":"vpat","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/legal/vpat.md","pathname":"/legal/vpat","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"legal/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/legal","isIndex":true,"type":"page","pattern":"^\\/legal\\/?$","segments":[[{"content":"legal","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/legal/index.astro","pathname":"/legal","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"next/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/next","isIndex":false,"type":"page","pattern":"^\\/next\\/?$","segments":[[{"content":"next","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/next.astro","pathname":"/next","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"old-desktop-privacy-notice/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/old-desktop-privacy-notice","isIndex":false,"type":"page","pattern":"^\\/old-desktop-privacy-notice\\/?$","segments":[[{"content":"old-desktop-privacy-notice","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/old-desktop-privacy-notice.md","pathname":"/old-desktop-privacy-notice","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"post-download/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/post-download","isIndex":false,"type":"page","pattern":"^\\/post-download\\/?$","segments":[[{"content":"post-download","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/post-download.astro","pathname":"/post-download","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/","isIndex":true,"type":"page","pattern":"^\\/$","segments":[],"params":[],"component":"src/pages/index.astro","pathname":"/","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}}],"site":"https://www.audacityteam.org","base":"/","trailingSlash":"ignore","compressHTML":true,"componentMetadata":[["\u0000astro:content",{"propagation":"in-tree","containsHead":false}],["/Users/alexdawsonsmac/Documents/Audacity/Website/astro-audacity/src/components/homepage/BlogPosts.astro",{"propagation":"in-tree","containsHead":false}],["/Users/alexdawsonsmac/Documents/Audacity/Website/astro-audacity/src/pages/index.astro",{"propagation":"in-tree","containsHead":true}],["\u0000@astro-page:src/pages/index@_@astro",{"propagation":"in-tree","containsHead":false}],["\u0000@astrojs-ssr-virtual-entry",{"propagation":"in-tree","containsHead":false}],["/Users/alexdawsonsmac/Documents/Audacity/Website/astro-audacity/src/pages/blog.astro",{"propagation":"in-tree","containsHead":true}],["\u0000@astro-page:src/pages/blog@_@astro",{"propagation":"in-tree","containsHead":false}],["/Users/alexdawsonsmac/Documents/Audacity/Website/astro-audacity/src/pages/blog/[slug].astro",{"propagation":"in-tree","containsHead":true}],["\u0000@astro-page:src/pages/blog/[slug]@_@astro",{"propagation":"in-tree","containsHead":false}],["/Users/alexdawsonsmac/Documents/Audacity/Website/astro-audacity/src/pages/download/linux.astro",{"propagation":"none","containsHead":true}],["/Users/alexdawsonsmac/Documents/Audacity/Website/astro-audacity/src/pages/download/mac.astro",{"propagation":"none","containsHead":true}],["/Users/alexdawsonsmac/Documents/Audacity/Website/astro-audacity/src/pages/download/windows.astro",{"propagation":"none","containsHead":true}],["/Users/alexdawsonsmac/Documents/Audacity/Website/astro-audacity/src/pages/CLA.md",{"propagation":"none","containsHead":true}],["/Users/alexdawsonsmac/Documents/Audacity/Website/astro-audacity/src/pages/FAQ.md",{"propagation":"none","containsHead":true}],["/Users/alexdawsonsmac/Documents/Audacity/Website/astro-audacity/src/pages/legal/accessibility.md",{"propagation":"none","containsHead":true}],["/Users/alexdawsonsmac/Documents/Audacity/Website/astro-audacity/src/pages/legal/index.astro",{"propagation":"none","containsHead":true}],["/Users/alexdawsonsmac/Documents/Audacity/Website/astro-audacity/src/pages/legal/cookie-policy.md",{"propagation":"none","containsHead":true}],["/Users/alexdawsonsmac/Documents/Audacity/Website/astro-audacity/src/pages/legal/privacy-notice.md",{"propagation":"none","containsHead":true}],["/Users/alexdawsonsmac/Documents/Audacity/Website/astro-audacity/src/pages/legal/vpat.md",{"propagation":"none","containsHead":true}],["/Users/alexdawsonsmac/Documents/Audacity/Website/astro-audacity/src/pages/old-desktop-privacy-notice.md",{"propagation":"none","containsHead":true}],["/Users/alexdawsonsmac/Documents/Audacity/Website/astro-audacity/src/pages/404.astro",{"propagation":"none","containsHead":true}],["/Users/alexdawsonsmac/Documents/Audacity/Website/astro-audacity/src/pages/au4.astro",{"propagation":"none","containsHead":true}],["/Users/alexdawsonsmac/Documents/Audacity/Website/astro-audacity/src/pages/cloud-saving.astro",{"propagation":"none","containsHead":true}],["/Users/alexdawsonsmac/Documents/Audacity/Website/astro-audacity/src/pages/download.astro",{"propagation":"none","containsHead":true}],["/Users/alexdawsonsmac/Documents/Audacity/Website/astro-audacity/src/pages/download/openvino.astro",{"propagation":"none","containsHead":true}],["/Users/alexdawsonsmac/Documents/Audacity/Website/astro-audacity/src/pages/next.astro",{"propagation":"none","containsHead":true}],["/Users/alexdawsonsmac/Documents/Audacity/Website/astro-audacity/src/pages/post-download.astro",{"propagation":"none","containsHead":true}]],"renderers":[],"clientDirectives":[["idle","(()=>{var l=(n,t)=>{let i=async()=>{await(await n())()},e=typeof t.value==\"object\"?t.value:void 0,s={timeout:e==null?void 0:e.timeout};\"requestIdleCallback\"in window?window.requestIdleCallback(i,s):setTimeout(i,s.timeout||200)};(self.Astro||(self.Astro={})).idle=l;window.dispatchEvent(new Event(\"astro:idle\"));})();"],["load","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).load=e;window.dispatchEvent(new Event(\"astro:load\"));})();"],["media","(()=>{var n=(a,t)=>{let i=async()=>{await(await a())()};if(t.value){let e=matchMedia(t.value);e.matches?i():e.addEventListener(\"change\",i,{once:!0})}};(self.Astro||(self.Astro={})).media=n;window.dispatchEvent(new Event(\"astro:media\"));})();"],["only","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).only=e;window.dispatchEvent(new Event(\"astro:only\"));})();"],["visible","(()=>{var a=(s,i,o)=>{let r=async()=>{await(await s())()},t=typeof i.value==\"object\"?i.value:void 0,c={rootMargin:t==null?void 0:t.rootMargin},n=new IntersectionObserver(e=>{for(let l of e)if(l.isIntersecting){n.disconnect(),r();break}},c);for(let e of o.children)n.observe(e)};(self.Astro||(self.Astro={})).visible=a;window.dispatchEvent(new Event(\"astro:visible\"));})();"]],"entryModules":{"\u0000noop-middleware":"_noop-middleware.mjs","\u0000virtual:astro:actions/noop-entrypoint":"noop-entrypoint.mjs","\u0000@astro-page:src/pages/404@_@astro":"pages/404.astro.mjs","\u0000@astro-page:src/pages/au4@_@astro":"pages/au4.astro.mjs","\u0000@astro-page:src/pages/blog/[slug]@_@astro":"pages/blog/_slug_.astro.mjs","\u0000@astro-page:src/pages/blog@_@astro":"pages/blog.astro.mjs","\u0000@astro-page:src/pages/CLA@_@md":"pages/cla.astro.mjs","\u0000@astro-page:src/pages/cloud-saving@_@astro":"pages/cloud-saving.astro.mjs","\u0000@astro-page:src/pages/download/linux@_@astro":"pages/download/linux.astro.mjs","\u0000@astro-page:src/pages/download/mac@_@astro":"pages/download/mac.astro.mjs","\u0000@astro-page:src/pages/download/openvino@_@astro":"pages/download/openvino.astro.mjs","\u0000@astro-page:src/pages/download/windows@_@astro":"pages/download/windows.astro.mjs","\u0000@astro-page:src/pages/download@_@astro":"pages/download.astro.mjs","\u0000@astro-page:src/pages/FAQ@_@md":"pages/faq.astro.mjs","\u0000@astro-page:src/pages/legal/accessibility@_@md":"pages/legal/accessibility.astro.mjs","\u0000@astro-page:src/pages/legal/cookie-policy@_@md":"pages/legal/cookie-policy.astro.mjs","\u0000@astro-page:src/pages/legal/privacy-notice@_@md":"pages/legal/privacy-notice.astro.mjs","\u0000@astro-page:src/pages/legal/vpat@_@md":"pages/legal/vpat.astro.mjs","\u0000@astro-page:src/pages/legal/index@_@astro":"pages/legal.astro.mjs","\u0000@astro-page:src/pages/next@_@astro":"pages/next.astro.mjs","\u0000@astro-page:src/pages/old-desktop-privacy-notice@_@md":"pages/old-desktop-privacy-notice.astro.mjs","\u0000@astro-page:src/pages/post-download@_@astro":"pages/post-download.astro.mjs","\u0000@astro-page:src/pages/index@_@astro":"pages/index.astro.mjs","\u0000@astrojs-ssr-virtual-entry":"entry.mjs","\u0000@astro-renderers":"renderers.mjs","\u0000@astrojs-ssr-adapter":"_@astrojs-ssr-adapter.mjs","\u0000@astrojs-manifest":"manifest_88gFEtA8.mjs","/Users/alexdawsonsmac/Documents/Audacity/Website/astro-audacity/node_modules/astro/node_modules/unstorage/drivers/netlify-blobs.mjs":"chunks/netlify-blobs_DM36vZAS.mjs","/Users/alexdawsonsmac/Documents/Audacity/Website/astro-audacity/.astro/content-assets.mjs":"chunks/content-assets_DNh-KfsI.mjs","\u0000astro:assets":"chunks/_astro_assets_B2GfK_hc.mjs","/Users/alexdawsonsmac/Documents/Audacity/Website/astro-audacity/.astro/content-modules.mjs":"chunks/content-modules_Dz-S_Wwv.mjs","\u0000astro:data-layer-content":"chunks/_astro_data-layer-content_C-Bwpa-W.mjs","/Users/alexdawsonsmac/Documents/Audacity/Website/astro-audacity/src/components/button/JoinAudioDotComButton":"_astro/JoinAudioDotComButton.ZhfbgHoG.js","/Users/alexdawsonsmac/Documents/Audacity/Website/astro-audacity/src/components/accordion/ChecksumAccordion":"_astro/ChecksumAccordion.DWeTkayN.js","/Users/alexdawsonsmac/Documents/Audacity/Website/astro-audacity/src/components/button/DownloadButton":"_astro/DownloadButton.DP3dYDm9.js","/Users/alexdawsonsmac/Documents/Audacity/Website/astro-audacity/src/components/video/SplitFeaturedVideo":"_astro/SplitFeaturedVideo.FS6jP2XN.js","/Users/alexdawsonsmac/Documents/Audacity/Website/astro-audacity/src/components/banner/CookieConsent":"_astro/CookieConsent.d5OVpdCy.js","/Users/alexdawsonsmac/Documents/Audacity/Website/astro-audacity/src/components/button/PlatformDownloadMuseHubButton":"_astro/PlatformDownloadMuseHubButton.06uPqydI.js","/Users/alexdawsonsmac/Documents/Audacity/Website/astro-audacity/src/components/card/DownloadCard":"_astro/DownloadCard.CdXPZm8D.js","/Users/alexdawsonsmac/Documents/Audacity/Website/astro-audacity/src/layouts/BaseLayout.astro?astro&type=script&index=0&lang.ts":"_astro/BaseLayout.astro_astro_type_script_index_0_lang.DYOX2kXF.js","/Users/alexdawsonsmac/Documents/Audacity/Website/astro-audacity/src/layouts/BaseLayout.astro?astro&type=script&index=1&lang.ts":"_astro/BaseLayout.astro_astro_type_script_index_1_lang.BXl1_4-Q.js","/Users/alexdawsonsmac/Documents/Audacity/Website/astro-audacity/src/components/footer/Footer.astro?astro&type=script&index=0&lang.ts":"_astro/Footer.astro_astro_type_script_index_0_lang.CBYk0hZJ.js","/Users/alexdawsonsmac/Documents/Audacity/Website/astro-audacity/src/components/button/DownloadMuseHubButton":"_astro/DownloadMuseHubButton.DNRqe89E.js","/Users/alexdawsonsmac/Documents/Audacity/Website/astro-audacity/src/components/navigation/NavigationReact":"_astro/NavigationReact.XDxODgCQ.js","/Users/alexdawsonsmac/Documents/Audacity/Website/astro-audacity/src/components/banner/PromoBanner":"_astro/PromoBanner.CzgQphT4.js","@astrojs/react/client.js":"_astro/client.DY9ip2SK.js","/Users/alexdawsonsmac/Documents/Audacity/Website/astro-audacity/src/components/video/FeaturedVideo":"_astro/FeaturedVideo.BCBLH5Nr.js","/Users/alexdawsonsmac/Documents/Audacity/Website/astro-audacity/src/components/button/SplitDownloadButton":"_astro/SplitDownloadButton.BcpI8CNm.js","/Users/alexdawsonsmac/Documents/Audacity/Website/astro-audacity/src/components/button/SplitDownloadButton.jsx":"_astro/SplitDownloadButton.BgwQT9hp.js","astro:scripts/before-hydration.js":""},"inlinedScripts":[["/Users/alexdawsonsmac/Documents/Audacity/Website/astro-audacity/src/layouts/BaseLayout.astro?astro&type=script&index=0&lang.ts","const d={getItem:e=>document.cookie.split(\";\").map(t=>t.split(\"=\")).reduce((t,[n,c])=>({...t,[n.trim()]:c}),{})[e],setItem:(e,o)=>{document.cookie=`${e}=${o}; expires=${new Date(new Date().getTime()+31536e6).toGMTString()}; path=/ `}},i=d,a=\"audacity_consent\",p=()=>!i.getItem(a),r=()=>i.setItem(a,!0),m=()=>i.setItem(a,!1);window.addEventListener(\"load\",function(){const e=document.getElementById(\"consent-popup\"),o=document.getElementById(\"accept\"),t=document.getElementById(\"reject\"),n=s=>{s.preventDefault(),r(),e.classList.add(\"hide\"),typeof _paq<\"u\"&&_paq.push([\"setCookieConsentGiven\"])},c=s=>{s.preventDefault(),m(),e.classList.add(\"hide\")};o.addEventListener(\"click\",n),t.addEventListener(\"click\",c),p()&&setTimeout(()=>{e.classList.remove(\"hide\")},2e3)});"],["/Users/alexdawsonsmac/Documents/Audacity/Website/astro-audacity/src/layouts/BaseLayout.astro?astro&type=script&index=1&lang.ts","const a=n=>{const t=`; ${document.cookie}`.split(`; ${n}=`);if(t.length===2)return t.pop().split(\";\").shift()},i=\"unknown-branch\";var e=window._paq=window._paq||[];e.push([\"setCustomDimension\",1,i]);e.push([\"trackPageView\"]);e.push([\"enableLinkTracking\"]);e.push([\"requireCookieConsent\"]);(function(){var n=\"https://matomo.audacityteam.org/\";e.push([\"setTrackerUrl\",n+\"matomo.php\"]),e.push([\"setSiteId\",\"2\"]);var o=document,t=o.createElement(\"script\"),s=o.getElementsByTagName(\"script\")[0];t.async=!0,t.src=n+\"matomo.js\",s.parentNode.insertBefore(t,s)})();a(\"audacity_consent\")===\"true\"&&e.push([\"setCookieConsentGiven\"]);"],["/Users/alexdawsonsmac/Documents/Audacity/Website/astro-audacity/src/components/footer/Footer.astro?astro&type=script&index=0&lang.ts","const e=document.querySelector(\"#copyright\");e&&(e.textContent=new Date().getFullYear().toString());"]],"assets":["/_astro/audacity-audiocom-promo.chglPHC-.png","/_astro/Audacity_Logo.DK8H7nvr.svg","/_astro/yt.DOBMQUE6.svg","/_astro/HeroBannerImage.BT1jp_L7.webp","/_astro/audiocom-background.DjlUrwQl.webp","/_astro/audiocom-placeholder.iAWItg7n.webp","/_astro/audiocom_wordmark_offwhite_transparentbg.Db7gSpo-.svg","/_astro/Windows.DaI-n6q-.svg","/_astro/macOS.BPvzFWQj.svg","/_astro/Linux.DHufNEua.svg","/_astro/audacity-3.3.eEn8eAZY.webp","/_astro/audacity-3.4.CoP59xwV.webp","/_astro/audacity-0.8.BLUesJEs.png","/_astro/audacity-3.6.juZEHCyN.webp","/_astro/introducing-musehub.VxdNdSg8.webp","/_astro/audacity-3.5.BN-j6x6w.webp","/_astro/default-cover.C8O2aOE9.webp","/_astro/our-new-website.DX4Zn409.webp","/_astro/spectrogram.DBHcWLQf.png","/_astro/openvino-logo.g7zKvwM-.webp","/_astro/signika-latin-wght-normal.bLA4Dcei.woff2","/_astro/signika-vietnamese-wght-normal.BW2yw0Vl.woff2","/_astro/signika-latin-ext-wght-normal.cpNNfbyE.woff2","/_astro/linux.P9xwIqXC.css","/VPAT.pdf","/_headers","/_redirects","/apple-touch-icon.png","/favicon.ico","/favicon.svg","/robots.txt","/fonts/MusescoreIcon.woff2","/_astro/ChecksumAccordion.DWeTkayN.js","/_astro/CookieConsent.d5OVpdCy.js","/_astro/DownloadButton.DP3dYDm9.js","/_astro/DownloadCard.CdXPZm8D.js","/_astro/DownloadMuseHubButton.DNRqe89E.js","/_astro/FeaturedVideo.BCBLH5Nr.js","/_astro/JoinAudioDotComButton.ZhfbgHoG.js","/_astro/NavigationReact.XDxODgCQ.js","/_astro/PlatformDownloadMuseHubButton.06uPqydI.js","/_astro/PromoBanner.CzgQphT4.js","/_astro/SplitDownloadButton.BcpI8CNm.js","/_astro/SplitDownloadButton.BgwQT9hp.js","/_astro/SplitFeaturedVideo.FS6jP2XN.js","/_astro/audacityReleases.DrBvuwEV.js","/_astro/client.DY9ip2SK.js","/_astro/index.yBjzXJbu.js","/_astro/index.yGrMsBkE.js","/_astro/jsx-runtime.D3GSbgeI.js","/_astro/matomo.BvNOQAiQ.js","/_astro/platform.COvO0OnZ.js","/_astro/selectWeightedItem.DZoShCAD.js","/_astro/useDetectOS.ljRF2BaX.js","/404.html","/au4/index.html","/blog/index.html","/CLA/index.html","/cloud-saving/index.html","/download/linux/index.html","/download/mac/index.html","/download/openvino/index.html","/download/windows/index.html","/download/index.html","/FAQ/index.html","/legal/accessibility/index.html","/legal/cookie-policy/index.html","/legal/privacy-notice/index.html","/legal/vpat/index.html","/legal/index.html","/next/index.html","/old-desktop-privacy-notice/index.html","/post-download/index.html","/index.html"],"buildFormat":"directory","checkOrigin":true,"allowedDomains":[],"actionBodySizeLimit":1048576,"serverIslandNameMap":[],"key":"AqtXB4cYzAlgVfYCd2Mb3YA0x3R0tkbEmGh6y5APvag=","sessionConfig":{"driver":"netlify-blobs","options":{"name":"astro-sessions","consistency":"strong"}}});
if (manifest.sessionConfig) manifest.sessionConfig.driverModule = () => import('./chunks/netlify-blobs_DM36vZAS.mjs');

export { manifest };
