/**
 * End-to-end proof that `reset.ts`'s default export restores a page's
 * drafts-branch content to the base-branch (published) version via the real
 * Netlify v2 handler function, backed by the dev (in-memory) backend that
 * `_shared.ts#backendFor` resolves under `DEV_AUTH=1` (see `draft.test.ts`'s
 * doc comment for the same pattern).
 *
 * Uses `basics/recording-desktop-audio.mdx` — a real corpus page untouched
 * by any other `netlify/tests/*.test.ts` file — as the seeded base page for
 * the happy-path test, since the dev backend instance is module-cached
 * across test files in the same process and reusing a path touched
 * elsewhere would make this test order-dependent.
 */
import { expect, test } from "bun:test";
import resetHandler from "../functions/reset";
import draftHandler from "../functions/draft";
import pageHandler from "../functions/page";
import { mdastToDoc } from "../../src/adapter/mdastToDoc";
import { parseMdx } from "../../src/mdx/pipeline";
import type { PageContent } from "../../src/backend/types";

const PATH = "src/content/manual/basics/recording-desktop-audio.mdx";

test("reset.ts restores drafts-branch content to base, and a subsequent read reflects it", async () => {
  const baseRes = await pageHandler(
    new Request(
      `http://localhost/api/page?path=${encodeURIComponent(PATH)}&base=1`,
    ),
  );
  expect(baseRes.status).toBe(200);
  const base = (await baseRes.json()) as PageContent;

  const { doc } = mdastToDoc(parseMdx("# Edited\n\nDrafted body.\n"));
  const draftRes = await draftHandler(
    new Request("http://localhost/api/draft", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        path: PATH,
        doc,
        frontmatter: "---\ntitle: Edited\nsection: Basics\n---\n",
      }),
    }),
  );
  expect(draftRes.status).toBe(200);

  const res = await resetHandler(
    new Request("http://localhost/api/reset", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path: PATH }),
    }),
  );
  expect(res.status).toBe(200);
  const body = (await res.json()) as PageContent;
  expect(body).toEqual({ path: PATH, source: base.source });

  const after = await pageHandler(
    new Request(`http://localhost/api/page?path=${encodeURIComponent(PATH)}`),
  );
  expect(after.status).toBe(200);
  const afterBody = (await after.json()) as PageContent;
  expect(afterBody.source).toBe(base.source);
});

test("reset.ts returns 400 when path is missing", async () => {
  const res = await resetHandler(
    new Request("http://localhost/api/reset", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    }),
  );
  expect(res.status).toBe(400);
  const body = (await res.json()) as { error: string };
  expect(body.error).toContain("path");
});

test("reset.ts returns 409 for a never-published (draft-only) page", async () => {
  const draftOnlyPath =
    "src/content/manual/reset-fn-test-never-published/page.mdx";
  const { doc } = mdastToDoc(parseMdx("New page.\n"));
  const draftRes = await draftHandler(
    new Request("http://localhost/api/draft", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        path: draftOnlyPath,
        doc,
        frontmatter: "---\ntitle: Never Published\nsection: Test\n---\n",
      }),
    }),
  );
  expect(draftRes.status).toBe(200);

  const res = await resetHandler(
    new Request("http://localhost/api/reset", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path: draftOnlyPath }),
    }),
  );
  expect(res.status).toBe(409);
  const body = (await res.json()) as { error: string };
  expect(body.error).toContain("never been published");
});

test("reset.ts GET is rejected with 405", async () => {
  const res = await resetHandler(
    new Request("http://localhost/api/reset", { method: "GET" }),
  );
  expect(res.status).toBe(405);
});
