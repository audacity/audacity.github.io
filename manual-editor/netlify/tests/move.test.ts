/**
 * End-to-end proof that `move.ts`'s default export runs
 * `GitHubBackend#movePage` against the real Netlify v2 handler function,
 * backed by the dev (in-memory) backend under `DEV_AUTH=1` (see
 * `draft.test.ts`'s doc comment for the same pattern). Uses a path prefix
 * unique to this file — the dev backend instance is module-cached across
 * test files in the same process, so reusing paths touched elsewhere would
 * make this order-dependent.
 */
import { expect, test } from "bun:test";
import moveHandler from "../functions/move";
import draftHandler from "../functions/draft";
import pagesHandler from "../functions/pages";
import { mdastToDoc } from "../../src/adapter/mdastToDoc";
import { parseMdx } from "../../src/mdx/pipeline";
import type { ManualPageMeta } from "../../src/backend/types";

async function createDraft(
  path: string,
  title: string,
  section = "MoveFnTest",
): Promise<void> {
  const { doc } = mdastToDoc(parseMdx("Body.\n"));
  const res = await draftHandler(
    new Request("http://localhost/api/draft", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        path,
        doc,
        frontmatter: `---\ntitle: ${title}\nsection: ${section}\norder: 1\n---\n`,
      }),
    }),
  );
  expect(res.status).toBe(200);
}

async function listPages(): Promise<ManualPageMeta[]> {
  const res = await pagesHandler(new Request("http://localhost/api/pages"));
  return (await res.json()) as ManualPageMeta[];
}

test("move.ts POST moves a single page: old path gone, new path listed with the new order", async () => {
  const OLD = "src/content/manual/move-fn-test-1/page.mdx";
  const NEW = "src/content/manual/move-fn-test-1-dest/page.mdx";
  await createDraft(OLD, "Movable");

  const res = await moveHandler(
    new Request("http://localhost/api/move", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        path: OLD,
        dest: { folder: "move-fn-test-1-dest", order: 5 },
      }),
    }),
  );
  expect(res.status).toBe(200);
  const body = (await res.json()) as {
    moves: Array<{ from: string; to: string }>;
  };
  expect(body.moves).toEqual([{ from: OLD, to: NEW }]);

  const pages = await listPages();
  expect(pages.find((p) => p.path === OLD)).toBeUndefined();
  const moved = pages.find((p) => p.path === NEW);
  expect(moved).toBeDefined();
  expect(moved!.order).toBe(5);
});

test("move.ts POST moves a page's descendants along with it", async () => {
  const PARENT = "src/content/manual/move-fn-test-2/page.mdx";
  const CHILD = "src/content/manual/move-fn-test-2/page/child.mdx";
  await createDraft(PARENT, "Parent");
  await createDraft(CHILD, "Child");

  const res = await moveHandler(
    new Request("http://localhost/api/move", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        path: PARENT,
        dest: { folder: "move-fn-test-2-dest", order: 1 },
      }),
    }),
  );
  expect(res.status).toBe(200);
  const body = (await res.json()) as {
    moves: Array<{ from: string; to: string }>;
  };
  expect(body.moves).toEqual([
    { from: PARENT, to: "src/content/manual/move-fn-test-2-dest/page.mdx" },
    {
      from: CHILD,
      to: "src/content/manual/move-fn-test-2-dest/page/child.mdx",
    },
  ]);

  const pages = await listPages();
  expect(pages.find((p) => p.path === PARENT)).toBeUndefined();
  expect(pages.find((p) => p.path === CHILD)).toBeUndefined();
  expect(
    pages.find(
      (p) => p.path === "src/content/manual/move-fn-test-2-dest/page.mdx",
    ),
  ).toBeDefined();
  expect(
    pages.find(
      (p) => p.path === "src/content/manual/move-fn-test-2-dest/page/child.mdx",
    ),
  ).toBeDefined();
});

test("move.ts POST returns 400 for a cycle (moving into own descendant folder)", async () => {
  const PATH = "src/content/manual/move-fn-test-3/page.mdx";
  await createDraft(PATH, "Cyclic");

  const res = await moveHandler(
    new Request("http://localhost/api/move", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        path: PATH,
        dest: { folder: "move-fn-test-3/page/deeper", order: 1 },
      }),
    }),
  );
  expect(res.status).toBe(400);
  const body = (await res.json()) as { error: string };
  expect(body.error.length).toBeGreaterThan(0);
});

test("move.ts POST returns 400 when dest.folder is missing", async () => {
  const res = await moveHandler(
    new Request("http://localhost/api/move", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        path: "src/content/manual/move-fn-test-4/page.mdx",
        dest: { order: 1 },
      }),
    }),
  );
  expect(res.status).toBe(400);
});

test("move.ts POST returns 400 when path is missing", async () => {
  const res = await moveHandler(
    new Request("http://localhost/api/move", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ dest: { folder: "x", order: 1 } }),
    }),
  );
  expect(res.status).toBe(400);
});

test("move.ts POST returns 400 for an unknown path", async () => {
  const res = await moveHandler(
    new Request("http://localhost/api/move", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        path: "src/content/manual/move-fn-test-nope.mdx",
        dest: { folder: "somewhere", order: 1 },
      }),
    }),
  );
  expect(res.status).toBe(400);
});

test("move.ts returns 400 on invalid JSON body", async () => {
  const res = await moveHandler(
    new Request("http://localhost/api/move", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "not json",
    }),
  );
  expect(res.status).toBe(400);
});

test("move.ts GET is rejected with 405", async () => {
  const res = await moveHandler(
    new Request("http://localhost/api/move", { method: "GET" }),
  );
  expect(res.status).toBe(405);
});
