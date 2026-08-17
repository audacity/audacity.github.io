/**
 * End-to-end proof that `reorder.ts`'s default export runs
 * `GitHubBackend#reorderPages` against the real Netlify v2 handler function,
 * backed by the dev (in-memory) backend under `DEV_AUTH=1` (see
 * `draft.test.ts`'s doc comment for the same pattern). Uses a path prefix
 * unique to this file — the dev backend instance is module-cached across
 * test files in the same process, so reusing paths touched elsewhere would
 * make this order-dependent.
 */
import { expect, test } from "bun:test";
import reorderHandler from "../functions/reorder";
import draftHandler from "../functions/draft";
import pagesHandler from "../functions/pages";
import { mdastToDoc } from "../../src/adapter/mdastToDoc";
import { parseMdx } from "../../src/mdx/pipeline";
import type { ManualPageMeta } from "../../src/backend/types";

const PATH_A = "src/content/manual/reorder-fn-test/a.mdx";
const PATH_B = "src/content/manual/reorder-fn-test/b.mdx";

async function createDraft(path: string, title: string): Promise<void> {
  const { doc } = mdastToDoc(parseMdx("Body.\n"));
  const res = await draftHandler(
    new Request("http://localhost/api/draft", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        path,
        doc,
        frontmatter: `---\ntitle: ${title}\nsection: ReorderFnTest\norder: 1\n---\n`,
      }),
    }),
  );
  expect(res.status).toBe(200);
}

async function listPages(): Promise<ManualPageMeta[]> {
  const res = await pagesHandler(new Request("http://localhost/api/pages"));
  return (await res.json()) as ManualPageMeta[];
}

test("reorder.ts POST rewrites order on each path in one call", async () => {
  await createDraft(PATH_A, "A");
  await createDraft(PATH_B, "B");

  const res = await reorderHandler(
    new Request("http://localhost/api/reorder", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        updates: [
          { path: PATH_A, order: 20 },
          { path: PATH_B, order: 10 },
        ],
      }),
    }),
  );
  expect(res.status).toBe(200);
  const body = (await res.json()) as { ok: boolean };
  expect(body.ok).toBe(true);

  const pages = await listPages();
  expect(pages.find((p) => p.path === PATH_A)!.order).toBe(20);
  expect(pages.find((p) => p.path === PATH_B)!.order).toBe(10);
});

test("reorder.ts POST returns 400 when updates is missing", async () => {
  const res = await reorderHandler(
    new Request("http://localhost/api/reorder", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    }),
  );
  expect(res.status).toBe(400);
});

test("reorder.ts POST returns 400 when an update entry is malformed", async () => {
  const res = await reorderHandler(
    new Request("http://localhost/api/reorder", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ updates: [{ path: PATH_A, order: "five" }] }),
    }),
  );
  expect(res.status).toBe(400);
});

test("reorder.ts POST returns 400 for an unknown path", async () => {
  const res = await reorderHandler(
    new Request("http://localhost/api/reorder", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        updates: [
          { path: "src/content/manual/reorder-fn-test/nope.mdx", order: 1 },
        ],
      }),
    }),
  );
  expect(res.status).toBe(400);
});

test("reorder.ts returns 400 on invalid JSON body", async () => {
  const res = await reorderHandler(
    new Request("http://localhost/api/reorder", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "not json",
    }),
  );
  expect(res.status).toBe(400);
});

test("reorder.ts GET is rejected with 405", async () => {
  const res = await reorderHandler(
    new Request("http://localhost/api/reorder", { method: "GET" }),
  );
  expect(res.status).toBe(405);
});
