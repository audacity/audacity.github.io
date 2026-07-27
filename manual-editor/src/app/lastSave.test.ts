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

/**
 * Final-review Fix 3: `at: NaN` passes `typeof record?.at === "number"`
 * (`typeof NaN` is `"number"`) so the pre-fix check let it through, and
 * `Date.now() - NaN` is always `NaN` — never `> FRESHNESS_WINDOW_MS` — so
 * the record could never expire. `Number.isFinite` rejects `NaN` outright.
 *
 * `NaN` can't survive a real `JSON.stringify`/`JSON.parse` round-trip
 * (`JSON.stringify({ at: NaN })` serializes it as `null`, which the
 * pre-fix `typeof` check already rejected — that wouldn't exercise this
 * fix at all). `JSON.parse` is stubbed for the duration of this test so
 * `takeFresherLocalCopy` sees a genuine in-memory `at: NaN`, the same
 * shape a real malformed/corrupted record could produce.
 */
test("a record with at: NaN returns null and is pruned", () => {
  localStorage.setItem(KEY, "placeholder");
  const originalParse = JSON.parse;
  JSON.parse = (() => ({ source: "OLD", at: NaN })) as typeof JSON.parse;
  try {
    expect(takeFresherLocalCopy(PATH, "server")).toBeNull();
  } finally {
    JSON.parse = originalParse;
  }
  expect(localStorage.getItem(KEY)).toBeNull();
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
