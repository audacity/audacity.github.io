/**
 * End-to-end proof that `page.ts`'s default export supports `DELETE` on the
 * real Netlify v2 handler function, backed by the dev (in-memory) backend
 * that `_shared.ts#backendFor` resolves under `DEV_AUTH=1`. Creates a
 * throwaway draft-only page via `draft.ts` (the same handler `draft.test.ts`
 * exercises) under a path unique to this file — the dev backend instance is
 * module-cached across test files in the same process, so reusing a path
 * touched elsewhere would make this test order-dependent.
 */
import { expect, test } from "bun:test";
import pageHandler from "./page";
import draftHandler from "./draft";
import { mdastToDoc } from "../../src/adapter/mdastToDoc";
import { parseMdx } from "../../src/mdx/pipeline";

const PATH = "src/content/manual/basics/page-delete-test.mdx";

test("page.ts DELETE removes the page; a subsequent GET 404s", async () => {
  const { doc } = mdastToDoc(parseMdx("Body.\n"));
  const createRes = await draftHandler(
    new Request("http://localhost/api/draft", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        path: PATH,
        doc,
        frontmatter: "---\ntitle: Delete Me\nsection: Basics\n---\n",
      }),
    }),
  );
  expect(createRes.status).toBe(200);

  const getBefore = await pageHandler(
    new Request(`http://localhost/api/page?path=${encodeURIComponent(PATH)}`),
  );
  expect(getBefore.status).toBe(200);

  const deleteRes = await pageHandler(
    new Request(`http://localhost/api/page?path=${encodeURIComponent(PATH)}`, {
      method: "DELETE",
    }),
  );
  expect(deleteRes.status).toBe(200);
  const body = (await deleteRes.json()) as { ok: boolean };
  expect(body.ok).toBe(true);

  const getAfter = await pageHandler(
    new Request(`http://localhost/api/page?path=${encodeURIComponent(PATH)}`),
  );
  expect(getAfter.status).toBe(404);
});

test("page.ts DELETE returns 400 when path is missing", async () => {
  const res = await pageHandler(
    new Request("http://localhost/api/page", { method: "DELETE" }),
  );
  expect(res.status).toBe(400);
});

test("page.ts DELETE returns 404 for an unknown path", async () => {
  const res = await pageHandler(
    new Request(
      "http://localhost/api/page?path=src/content/manual/nope-nope.mdx",
      { method: "DELETE" },
    ),
  );
  expect(res.status).toBe(404);
});
