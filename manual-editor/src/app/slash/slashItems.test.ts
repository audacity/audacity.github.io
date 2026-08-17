import { expect, test } from "bun:test";
import { filterSlashItems, SLASH_ITEMS } from "./slashItems";
import { UI_EXAMPLE_META } from "../../uiExample/meta";

const EXPECTED_IDS = [
  "text",
  "heading-2",
  "heading-3",
  "bulleted-list",
  "numbered-list",
  "code-block",
  "image",
  "callout",
  "note",
  "pitfall",
  "tip",
  "best-practice",
  "tabs",
  "shortcut",
  ...UI_EXAMPLE_META.map((meta) => `ui-${meta.id}`),
];

test("registry contains all required items with unique ids", () => {
  expect(SLASH_ITEMS).toHaveLength(EXPECTED_IDS.length);
  expect(SLASH_ITEMS.map((item) => item.id).sort()).toEqual(
    [...EXPECTED_IDS].sort(),
  );
  expect(new Set(SLASH_ITEMS.map((item) => item.id)).size).toBe(
    EXPECTED_IDS.length,
  );
});

test("basic-block items are in the 'Basic blocks' group and manual-block items are in 'Manual blocks'", () => {
  const basicBlockIds = [
    "text",
    "heading-2",
    "heading-3",
    "bulleted-list",
    "numbered-list",
    "code-block",
    "image",
  ];
  const manualBlockIds = [
    "callout",
    "note",
    "pitfall",
    "tip",
    "best-practice",
    "tabs",
    "shortcut",
  ];

  for (const id of basicBlockIds) {
    const item = SLASH_ITEMS.find((i) => i.id === id);
    expect(item?.group).toBe("Basic blocks");
  }
  for (const id of manualBlockIds) {
    const item = SLASH_ITEMS.find((i) => i.id === id);
    expect(item?.group).toBe("Manual blocks");
  }
});

test("every item has at least one keyword and a non-empty label", () => {
  for (const item of SLASH_ITEMS) {
    expect(item.label.length).toBeGreaterThan(0);
    expect(item.keywords.length).toBeGreaterThan(0);
    expect(typeof item.run).toBe("function");
  }
});

test("filterSlashItems('call') matches Callout", () => {
  const results = filterSlashItems("call");
  expect(results.map((r) => r.id)).toContain("callout");
});

test("filterSlashItems('') returns every item in the registry's declared group order", () => {
  const results = filterSlashItems("");
  expect(results).toEqual(SLASH_ITEMS);
  // Guard the "group order preserved" contract explicitly: every 'Basic
  // blocks' item's index precedes every 'Manual blocks' item's index.
  const basicIndexes = results
    .map((item, index) => (item.group === "Basic blocks" ? index : -1))
    .filter((index) => index !== -1);
  const lastBasicIndex = basicIndexes[basicIndexes.length - 1];
  const firstManualIndex = results.findIndex(
    (item) => item.group === "Manual blocks",
  );
  expect(lastBasicIndex).toBeLessThan(firstManualIndex);
});

test("filterSlashItems('   ') (whitespace-only) also returns every item", () => {
  expect(filterSlashItems("   ")).toEqual(SLASH_ITEMS);
});

test("filterSlashItems('zzz') (no match) returns an empty array", () => {
  expect(filterSlashItems("zzz")).toEqual([]);
});

test("filterSlashItems is case-insensitive", () => {
  expect(filterSlashItems("CALLOUT").map((r) => r.id)).toEqual(["callout"]);
});

test("filterSlashItems('warning') matches Callout via its keyword list", () => {
  const results = filterSlashItems("warning");
  expect(results.map((r) => r.id)).toEqual(["callout"]);
});

test("filterSlashItems('tab') matches Tabs via label", () => {
  const results = filterSlashItems("tab");
  expect(results.map((r) => r.id)).toContain("tabs");
});

test("filterSlashItems('screenshot') and filterSlashItems('img') both match Image via its keyword list", () => {
  expect(filterSlashItems("screenshot").map((r) => r.id)).toEqual(["image"]);
  expect(filterSlashItems("img").map((r) => r.id)).toEqual(["image"]);
});

test("every curated UI example appears in the Audacity UI group", () => {
  for (const meta of UI_EXAMPLE_META) {
    const item = SLASH_ITEMS.find((i) => i.id === `ui-${meta.id}`);
    expect(item).toBeDefined();
    expect(item!.group).toBe("Audacity UI");
    expect(item!.label).toBe(meta.label);
  }
});

test("filtering by a UI example keyword finds it", () => {
  const hits = filterSlashItems("knob");
  expect(hits.some((i) => i.id === "ui-knob")).toBe(true);
});
