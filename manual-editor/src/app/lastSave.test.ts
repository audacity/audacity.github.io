import { beforeEach, expect, test } from "bun:test";
import {
  clearLastSave,
  recordLastSave,
  takeFresherLocalCopy,
} from "./lastSave";

const PATH = "src/content/manual/x/y.mdx";
const KEY = `manual-editor:lastSave:${PATH}`;

beforeEach(() => {
  localStorage.clear();
});

test("a fresh record differing from the server copy is returned", () => {
  recordLastSave(PATH, "NEWER");
  expect(takeFresherLocalCopy(PATH, "older-server-copy")).toBe("NEWER");
});

test("a record identical to the server copy returns null (server caught up)", () => {
  recordLastSave(PATH, "SAME");
  expect(takeFresherLocalCopy(PATH, "SAME")).toBeNull();
});

test("an expired record returns null and is pruned", () => {
  localStorage.setItem(
    KEY,
    JSON.stringify({ source: "OLD", at: Date.now() - 121_000 }),
  );
  expect(takeFresherLocalCopy(PATH, "server")).toBeNull();
  expect(localStorage.getItem(KEY)).toBeNull();
});

test("a malformed record returns null and is pruned", () => {
  localStorage.setItem(KEY, "{not json");
  expect(takeFresherLocalCopy(PATH, "server")).toBeNull();
});

test("clearLastSave removes the record", () => {
  recordLastSave(PATH, "X");
  clearLastSave(PATH);
  expect(localStorage.getItem(KEY)).toBeNull();
  expect(takeFresherLocalCopy(PATH, "server")).toBeNull();
});

test("no record returns null", () => {
  expect(takeFresherLocalCopy(PATH, "server")).toBeNull();
});
