/**
 * End-to-end proof that `asset.ts`'s default export serves bytes committed
 * by `image.ts` (via `GitHubBackend#readAsset`) through the real Netlify v2
 * handler function, backed by the dev (in-memory) backend under
 * `DEV_AUTH=1` (see `draft.test.ts`'s doc comment for the same pattern).
 */
import { expect, test } from "bun:test";
import imageHandler from "../functions/image";
import assetHandler from "../functions/asset";

async function pngFixture(width: number, height: number): Promise<Buffer> {
  const sharp = (await import("sharp")).default;
  return sharp({
    create: { width, height, channels: 3, background: { r: 10, g: 10, b: 10 } },
  })
    .png()
    .toBuffer();
}

async function uploadPng(pageSlug: string, filename: string): Promise<string> {
  const png = await pngFixture(20, 20);
  const res = await imageHandler(
    new Request("http://localhost/api/image", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        pageSlug,
        filename,
        dataBase64: png.toString("base64"),
      }),
    }),
  );
  expect(res.status).toBe(200);
  const body = (await res.json()) as { path: string };
  return body.path;
}

function assetRequest(query: string): Request {
  return new Request(`http://localhost/api/asset${query}`);
}

test("asset.ts GET: serves an uploaded image's exact bytes with PNG content-type and immutable cache headers", async () => {
  const path = await uploadPng("asset-fn-test/a", "pic.png");

  const res = await assetHandler(
    assetRequest(`?path=${encodeURIComponent(path)}`),
  );
  expect(res.status).toBe(200);
  expect(res.headers.get("content-type")).toBe("image/png");
  expect(res.headers.get("cache-control")).toBe(
    "public, max-age=31536000, immutable",
  );

  const bytes = new Uint8Array(await res.arrayBuffer());
  // Real PNG signature bytes — proves this is the actual optimized image,
  // not an empty/garbage body.
  expect(bytes[0]).toBe(0x89);
  expect(bytes[1]).toBe(0x50); // 'P'
  expect(bytes[2]).toBe(0x4e); // 'N'
  expect(bytes[3]).toBe(0x47); // 'G'
});

test("asset.ts GET: unknown path returns 404", async () => {
  const res = await assetHandler(
    assetRequest(
      `?path=${encodeURIComponent("src/assets/img/manual/asset-fn-test/nope.png")}`,
    ),
  );
  expect(res.status).toBe(404);
});

test("asset.ts GET: path outside src/assets/img/manual/ is rejected with 400", async () => {
  const res = await assetHandler(
    assetRequest(
      `?path=${encodeURIComponent("src/content/manual/basics/installing-ffmpeg.mdx")}`,
    ),
  );
  expect(res.status).toBe(400);
});

test("asset.ts GET: missing path query param returns 400", async () => {
  const res = await assetHandler(assetRequest(""));
  expect(res.status).toBe(400);
});

test("asset.ts POST is rejected with 405", async () => {
  const res = await assetHandler(
    new Request("http://localhost/api/asset?path=x", { method: "POST" }),
  );
  expect(res.status).toBe(405);
});
