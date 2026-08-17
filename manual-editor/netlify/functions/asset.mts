import { requireBackend, json } from "../lib/_shared";

/**
 * The only tree new uploads (and any other manual image) may live under —
 * mirrors `saveImage`'s hardcoded `src/assets/img/manual/<slug>/<filename>`
 * path shape in both backends. Anything outside this prefix is rejected
 * before ever reaching `readAsset`, so this endpoint can't be used as a
 * generic repo-file proxy.
 */
const ASSET_PREFIX = "src/assets/img/manual/";

const CONTENT_TYPES: Record<string, string> = {
  png: "image/png",
  webp: "image/webp",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
};

function contentTypeFor(path: string): string {
  const ext = path.slice(path.lastIndexOf(".") + 1).toLowerCase();
  return CONTENT_TYPES[ext] ?? "application/octet-stream";
}

/**
 * `GET /api/asset?path=<repo-relative path>` — serves a manual image's raw
 * bytes so the editor can display newly uploaded images (which have
 * repo-relative `src/assets/img/manual/...` paths that resolve to nothing in
 * the browser) through a same-origin proxy. Existing corpus images that
 * already use absolute URLs bypass this endpoint entirely and render
 * directly — see the node-view mapping in Task 2.
 *
 * Gated the same as every other read in this app (`requireBackend`) — see
 * `pages.ts`'s doc comment for why reads aren't exempt from the auth gate.
 *
 * `Cache-Control` is long-lived and `immutable`: every upload gets a fresh,
 * randomly-suffixed filename (see `image.mts`), so a given path's bytes
 * never change once served.
 */
export default async (request: Request): Promise<Response> => {
  if (request.method !== "GET") {
    return json({ error: "method not allowed" }, 405);
  }

  const url = new URL(request.url);
  const path = url.searchParams.get("path");
  if (!path) return json({ error: "path required" }, 400);
  if (!path.startsWith(ASSET_PREFIX)) {
    return json(
      { error: `path must be under ${ASSET_PREFIX}` },
      400,
    );
  }

  const backend = requireBackend(request);
  if (backend instanceof Response) return backend;

  let bytes: Uint8Array;
  try {
    bytes = await backend.readAsset(path);
  } catch {
    return json({ error: "not found" }, 404);
  }

  // `.slice()` (rather than passing `bytes` directly) sidesteps a TS
  // lib.dom typing mismatch: `Uint8Array<ArrayBufferLike>` (what
  // `readAsset` returns — its backing buffer type isn't statically known to
  // be a plain `ArrayBuffer`) isn't assignable to `BodyInit`/`BlobPart`
  // under the generic-`Uint8Array` typings shipped with this TypeScript
  // version, even though a real `Response`/`Blob` accepts any `Uint8Array`
  // as a body at runtime. `TypedArray#slice()` always allocates a fresh
  // plain `ArrayBuffer`, so its return type is the `Uint8Array<ArrayBuffer>`
  // both `BodyInit` and `BlobPart` want.
  return new Response(bytes.slice(), {
    status: 200,
    headers: {
      "content-type": contentTypeFor(path),
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
};
