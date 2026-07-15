/**
 * End-to-end proof that `draft.ts`'s default export actually persists on
 * the dev (in-memory) backend: POSTing `{ path, doc, frontmatter }` (the PM
 * doc JSON + serialized frontmatter shape `Editor.tsx`'s autosave sends —
 * see its doc comment for why `source` isn't assembled client-side) through
 * the real Netlify v2 handler function, then reading it back through
 * `pages.ts`'s handler (same `backendFor` -> `getBackend(null)` dev
 * singleton), and confirming `hasDraft` flips to `true` and the new title
 * (which only exists once `docToSource` has actually run on the posted
 * `doc`+`frontmatter`) is reflected.
 */
import { expect, test } from "bun:test";
import draftHandler from "./draft";
import pagesHandler from "./pages";
import { mdastToDoc } from "../../src/adapter/mdastToDoc";
import { parseMdx } from "../../src/mdx/pipeline";
import type { ManualPageMeta } from "../../src/backend/types";

async function listPages(): Promise<ManualPageMeta[]> {
  const res = await pagesHandler(new Request("http://localhost/api/pages"));
  return (await res.json()) as ManualPageMeta[];
}

test("draft.ts runs docToSource server-side and saves a draft on the dev backend, and pages.ts reflects hasDraft afterwards", async () => {
  const before = await listPages();
  const target = before.find((p) => p.slug === "basics/installing-ffmpeg");
  expect(target).toBeDefined();
  expect(target!.hasDraft).toBe(false);

  const { doc } = mdastToDoc(parseMdx("# Edited body\n\nSome edited text.\n"));

  const res = await draftHandler(
    new Request("http://localhost/api/draft", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        path: target!.path,
        doc,
        frontmatter: "---\ntitle: Edited via draft.ts\nsection: Basics\n---\n",
      }),
    }),
  );
  expect(res.status).toBe(200);
  const body = (await res.json()) as { ok: boolean };
  expect(body.ok).toBe(true);

  const after = await listPages();
  const targetAfter = after.find((p) => p.path === target!.path);
  expect(targetAfter).toBeDefined();
  expect(targetAfter!.hasDraft).toBe(true);
  expect(targetAfter!.title).toBe("Edited via draft.ts");
});

test("draft.ts returns 400 when path is missing", async () => {
  const { doc } = mdastToDoc(parseMdx("Body.\n"));
  const res = await draftHandler(
    new Request("http://localhost/api/draft", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        doc,
        frontmatter: "---\ntitle: T\nsection: S\n---\n",
      }),
    }),
  );
  expect(res.status).toBe(400);
});

test("draft.ts returns 400 when doc is missing", async () => {
  const res = await draftHandler(
    new Request("http://localhost/api/draft", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        path: "src/content/manual/x/y.mdx",
        frontmatter: "---\ntitle: T\nsection: S\n---\n",
      }),
    }),
  );
  expect(res.status).toBe(400);
});

test("draft.ts returns 400 when frontmatter is missing", async () => {
  const { doc } = mdastToDoc(parseMdx("Body.\n"));
  const res = await draftHandler(
    new Request("http://localhost/api/draft", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path: "src/content/manual/x/y.mdx", doc }),
    }),
  );
  expect(res.status).toBe(400);
});

test("draft.ts returns 400 on invalid JSON body", async () => {
  const res = await draftHandler(
    new Request("http://localhost/api/draft", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "not json",
    }),
  );
  expect(res.status).toBe(400);
});
