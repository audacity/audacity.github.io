/**
 * End-to-end proof that `image.ts`'s default export runs the sharp
 * optimization pipeline and commits the result via `GitHubBackend#saveImage`
 * on the real Netlify v2 handler function, backed by the dev (in-memory)
 * backend under `DEV_AUTH=1` (see `draft.test.ts`'s doc comment for the same
 * pattern). Fixtures are built with real `sharp` calls (not fake bytes) so
 * the resize/re-encode assertions exercise the actual pipeline, not a mock
 * of it.
 */
import { expect, test } from "bun:test";
import imageHandler from "../functions/image";
import assetHandler from "../functions/asset";

async function pngFixture(width: number, height: number): Promise<Buffer> {
  const sharp = (await import("sharp")).default;
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 200, g: 20, b: 20 },
    },
  })
    .png()
    .toBuffer();
}

async function jpegFixture(width: number, height: number): Promise<Buffer> {
  const sharp = (await import("sharp")).default;
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 20, g: 20, b: 200 },
    },
  })
    .jpeg()
    .toBuffer();
}

function uploadRequest(body: unknown): Request {
  return new Request("http://localhost/api/image", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** Reads an uploaded asset's bytes back through the real `/api/asset` handler. */
async function readAssetBytes(path: string): Promise<Uint8Array> {
  const res = await assetHandler(
    new Request(`http://localhost/api/asset?path=${encodeURIComponent(path)}`),
  );
  expect(res.status).toBe(200);
  return new Uint8Array(await res.arrayBuffer());
}

test("image.ts POST: a real oversized PNG is resized to width 1600 and stays PNG", async () => {
  const png = await pngFixture(2000, 50);
  const res = await imageHandler(
    uploadRequest({
      pageSlug: "image-fn-test/a",
      filename: "My Diagram.png",
      dataBase64: png.toString("base64"),
    }),
  );
  expect(res.status).toBe(200);
  const body = (await res.json()) as { path: string };
  expect(body.path).toMatch(
    /^src\/assets\/img\/manual\/image-fn-test\/a\/my-diagram-[a-z0-9]{6}\.png$/,
  );

  const bytes = await readAssetBytes(body.path);
  const sharp = (await import("sharp")).default;
  const metadata = await sharp(Buffer.from(bytes)).metadata();
  expect(metadata.width).toBe(1600);
  expect(metadata.format).toBe("png");
});

test("image.ts POST: a JPEG input is converted to WebP (extension and format)", async () => {
  const jpeg = await jpegFixture(400, 300);
  const res = await imageHandler(
    uploadRequest({
      pageSlug: "image-fn-test/b",
      filename: "photo.jpg",
      dataBase64: jpeg.toString("base64"),
    }),
  );
  expect(res.status).toBe(200);
  const body = (await res.json()) as { path: string };
  expect(body.path).toMatch(/\.webp$/);

  const bytes = await readAssetBytes(body.path);
  const sharp = (await import("sharp")).default;
  const metadata = await sharp(Buffer.from(bytes)).metadata();
  expect(metadata.format).toBe("webp");
  // Under 1600 wide already — withoutEnlargement means dimensions are
  // unchanged, not upscaled.
  expect(metadata.width).toBe(400);
});

test("image.ts POST: a small PNG (already under 1600 wide) is not upscaled", async () => {
  const png = await pngFixture(200, 100);
  const res = await imageHandler(
    uploadRequest({
      pageSlug: "image-fn-test/c",
      filename: "small.png",
      dataBase64: png.toString("base64"),
    }),
  );
  expect(res.status).toBe(200);
  const body = (await res.json()) as { path: string };
  const bytes = await readAssetBytes(body.path);
  const sharp = (await import("sharp")).default;
  const metadata = await sharp(Buffer.from(bytes)).metadata();
  expect(metadata.width).toBe(200);
});

test("image.ts POST: non-image payload returns 400, not 500", async () => {
  const res = await imageHandler(
    uploadRequest({
      pageSlug: "image-fn-test/d",
      filename: "not-an-image.png",
      dataBase64: Buffer.from("this is definitely not image data").toString(
        "base64",
      ),
    }),
  );
  expect(res.status).toBe(400);
  const body = (await res.json()) as { error: string };
  expect(body.error.length).toBeGreaterThan(0);
});

test("image.ts POST: a payload over the 15MB limit returns 413 without decoding", async () => {
  // Length chosen so `length * 3/4` exceeds 15MB without actually building a
  // real (valid or invalid) image payload — the size guard runs before any
  // decode/sharp call, so the content just needs to be long enough.
  const dataBase64 = "A".repeat(21 * 1024 * 1024);
  const res = await imageHandler(
    uploadRequest({
      pageSlug: "image-fn-test/e",
      filename: "huge.png",
      dataBase64,
    }),
  );
  expect(res.status).toBe(413);
});

test("image.ts POST returns 400 when pageSlug is missing", async () => {
  const png = await pngFixture(10, 10);
  const res = await imageHandler(
    uploadRequest({ filename: "x.png", dataBase64: png.toString("base64") }),
  );
  expect(res.status).toBe(400);
});

test("image.ts POST returns 400 when filename is missing", async () => {
  const png = await pngFixture(10, 10);
  const res = await imageHandler(
    uploadRequest({
      pageSlug: "image-fn-test/f",
      dataBase64: png.toString("base64"),
    }),
  );
  expect(res.status).toBe(400);
});

test("image.ts POST returns 400 when dataBase64 is missing", async () => {
  const res = await imageHandler(
    uploadRequest({ pageSlug: "image-fn-test/g", filename: "x.png" }),
  );
  expect(res.status).toBe(400);
});

test("image.ts returns 400 on invalid JSON body", async () => {
  const res = await imageHandler(
    new Request("http://localhost/api/image", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "not json",
    }),
  );
  expect(res.status).toBe(400);
});

test("image.ts GET is rejected with 405", async () => {
  const res = await imageHandler(
    new Request("http://localhost/api/image", { method: "GET" }),
  );
  expect(res.status).toBe(405);
});
