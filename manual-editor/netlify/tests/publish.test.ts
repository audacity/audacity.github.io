/**
 * End-to-end proof that `publish.ts`'s default export calls through to
 * `backendFor(request).publish()` on the real Netlify v2 handler function,
 * backed by the dev (in-memory) backend under `DEV_AUTH=1` (see
 * `draft.test.ts`'s doc comment for the same pattern). Also covers the
 * method guard (only `POST` is allowed).
 */
import { expect, test } from "bun:test";
import publishHandler from "../functions/publish";
import draftHandler from "../functions/draft";
import type { PublishResult } from "../../src/backend/types";

test("publish.ts POST returns the dev backend's fake PR result", async () => {
  // The dev backend now mirrors OctokitBackend: publishing with zero staged
  // changes is a 409 ("Nothing to publish"). Stage a draft first so the
  // happy path is exercised.
  const draftRes = await draftHandler(
    new Request("http://localhost/api/draft", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        path: "src/content/manual/publish-fn-test/page.mdx",
        doc: { type: "doc", content: [{ type: "paragraph" }] },
        frontmatter: "title: Publish Fn Test\nsection: Test",
      }),
    }),
  );
  expect(draftRes.status).toBe(200);

  const res = await publishHandler(
    new Request("http://localhost/api/publish", { method: "POST" }),
  );
  expect(res.status).toBe(200);
  const body = (await res.json()) as PublishResult;
  expect(body.prUrl).toMatch(/^memory:\/\/pr\/\d+$/);
  expect(typeof body.prNumber).toBe("number");
});

test("publish.ts GET is rejected with 405", async () => {
  const res = await publishHandler(
    new Request("http://localhost/api/publish", { method: "GET" }),
  );
  expect(res.status).toBe(405);
});

test("publish.ts POST with nothing staged returns 409 Nothing to publish", async () => {
  // The previous test's publish cleared all drafts on the shared cached dev
  // backend, so this exercises the empty case deterministically after it.
  const res = await publishHandler(
    new Request("http://localhost/api/publish", { method: "POST" }),
  );
  expect(res.status).toBe(409);
  const body = (await res.json()) as { error: string };
  expect(body.error).toContain("Nothing to publish");
});
