import { expect, test } from "bun:test";
import { getBackend } from "./resolveBackend";

test("dev mode returns an in-memory backend that lists pages", async () => {
  process.env.DEV_AUTH = "1";
  const backend = getBackend(null);
  const pages = await backend.listPages();
  expect(pages.length).toBeGreaterThan(200);
});
