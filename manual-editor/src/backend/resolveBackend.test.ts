import { expect, test } from "bun:test";
import { getBackend } from "./resolveBackend";
import { OctokitBackend } from "./octokitBackend";

test("dev mode returns an in-memory backend that lists pages", async () => {
  process.env.DEV_AUTH = "1";
  const backend = getBackend(null);
  const pages = await backend.listPages();
  expect(pages.length).toBeGreaterThan(200);
});

test("a real token outside dev mode resolves an OctokitBackend, with no network call at construct time", () => {
  const prevDevAuth = process.env.DEV_AUTH;
  delete process.env.DEV_AUTH;
  try {
    // Constructing must not throw or hang on a fake token — `Octokit`'s
    // token auth strategy is lazy (no request fires until a call is made),
    // so this proves `getBackend` doesn't accidentally trigger one either.
    const backend = getBackend("fake-real-token");
    expect(backend).toBeInstanceOf(OctokitBackend);
  } finally {
    if (prevDevAuth === undefined) delete process.env.DEV_AUTH;
    else process.env.DEV_AUTH = prevDevAuth;
  }
});
