/**
 * End-to-end proof that `publish.ts`'s default export calls through to
 * `backendFor(request).publish()` on the real Netlify v2 handler function,
 * backed by the dev (in-memory) backend under `DEV_AUTH=1` (see
 * `draft.test.ts`'s doc comment for the same pattern). Also covers the
 * method guard (only `POST` is allowed).
 */
import { expect, test } from "bun:test";
import publishHandler from "./publish";
import type { PublishResult } from "../../src/backend/types";

test("publish.ts POST returns the dev backend's fake PR result", async () => {
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
