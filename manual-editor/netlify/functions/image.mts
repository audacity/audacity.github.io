import { requireBackend, json } from "../lib/_shared";
import { slugify } from "../../src/app/newPagePath";

/** Reject payloads whose base64 length implies more than this many decoded bytes. */
const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
/** Long edge cap applied to every upload — matches the plan's optimization spec. */
const MAX_WIDTH = 1600;

/** 6-char lowercase-alphanumeric collision-avoidance suffix for output filenames. */
function randomSuffix6(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 6);
}

/** Strips a trailing `.ext` (if any) from an uploaded filename, for slugifying the base name. */
function stripExtension(filename: string): string {
  return filename.replace(/\.[^./]+$/, "");
}

/**
 * `POST /api/image` — the manual editor's image-upload endpoint (Phase E).
 *
 * Body: `{ pageSlug: string, filename: string, dataBase64: string }` —
 * `dataBase64` is the raw (unprefixed — no `data:image/...;base64,` header)
 * base64 payload of the original file, produced client-side by
 * `src/app/api.ts`'s `uploadImage`.
 *
 * Pipeline (see the plan's Global Constraints): `rotate()` (bakes in EXIF
 * orientation so the output doesn't depend on a viewer respecting the tag),
 * resize to `width: 1600, withoutEnlargement: true` (never upscales a
 * smaller source), then format-specific re-encode — PNG input stays PNG
 * (`compressionLevel: 9`, still lossless), everything else becomes
 * quality-80 WebP. `sharp` is imported lazily (inside the handler, not at
 * module scope) so functions that never touch image upload don't pay for
 * loading its native binary on cold start.
 *
 * The output filename is `${slugify(originalBasename)}-${random6}.{png|webp}`
 * — slugified for URL/filesystem safety, suffixed to avoid collisions with a
 * prior upload of the same original filename, extension swapped to match
 * whatever the pipeline actually produced (not the original's extension).
 *
 * A payload that decodes to something sharp can't read (not an image, or a
 * corrupt one) surfaces as 400, never a 500 — `sharp()`'s decode failure is
 * caught explicitly rather than left to propagate.
 */
export default async (request: Request): Promise<Response> => {
  if (request.method !== "POST") {
    return json({ error: "method not allowed" }, 405);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid JSON body" }, 400);
  }

  const { pageSlug, filename, dataBase64 } = (body ?? {}) as {
    pageSlug?: unknown;
    filename?: unknown;
    dataBase64?: unknown;
  };

  if (
    typeof pageSlug !== "string" ||
    pageSlug.length === 0 ||
    typeof filename !== "string" ||
    filename.length === 0 ||
    typeof dataBase64 !== "string" ||
    dataBase64.length === 0
  ) {
    return json(
      {
        error:
          "pageSlug (string), filename (string), and dataBase64 (string) required",
      },
      400,
    );
  }

  // Size guard on the base64 length's implied decoded size, BEFORE actually
  // decoding or handing anything to sharp — cheap rejection of an oversized
  // payload without paying for the allocation/decode first.
  const approxDecodedBytes = (dataBase64.length * 3) / 4;
  if (approxDecodedBytes > MAX_UPLOAD_BYTES) {
    return json({ error: "image exceeds the 15MB upload limit" }, 413);
  }

  const backend = requireBackend(request);
  if (backend instanceof Response) return backend;

  let inputBytes: Buffer;
  try {
    inputBytes = Buffer.from(dataBase64, "base64");
  } catch {
    return json({ error: "invalid base64 payload" }, 400);
  }

  let outBuffer: Buffer;
  let outExt: "png" | "webp";
  try {
    const sharp = (await import("sharp")).default;

    const metadata = await sharp(inputBytes).metadata();
    const isPng = metadata.format === "png";

    const pipeline = sharp(inputBytes)
      .rotate()
      .resize({ width: MAX_WIDTH, withoutEnlargement: true });

    outBuffer = isPng
      ? await pipeline.png({ compressionLevel: 9 }).toBuffer()
      : await pipeline.webp({ quality: 80 }).toBuffer();
    outExt = isPng ? "png" : "webp";
  } catch (err) {
    // Anything sharp throws here (undecodable/non-image input) collapses to
    // 400 — never a 500 for bad user input.
    const message = err instanceof Error ? err.message : String(err);
    return json({ error: `invalid image: ${message}` }, 400);
  }

  const outName = `${slugify(stripExtension(filename))}-${randomSuffix6()}.${outExt}`;
  const path = await backend.saveImage(
    pageSlug,
    outName,
    new Uint8Array(outBuffer),
  );
  return json({ path });
};
