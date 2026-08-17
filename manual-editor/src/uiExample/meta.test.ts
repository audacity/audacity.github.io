import { expect, test } from "bun:test";
import { UI_EXAMPLE_META, hasUIExampleVariant, uiExampleMeta } from "./meta";

test("entry ids are unique and non-empty", () => {
  const ids = UI_EXAMPLE_META.map((m) => m.id);
  expect(new Set(ids).size).toBe(ids.length);
  expect(ids.every((id) => id.length > 0)).toBe(true);
});

test("every entry has at least one variant with unique ids", () => {
  for (const m of UI_EXAMPLE_META) {
    expect(m.variants.length).toBeGreaterThan(0);
    const vids = m.variants.map((v) => v.id);
    expect(new Set(vids).size).toBe(vids.length);
  }
});

test("uiExampleMeta finds by id and returns undefined for unknown", () => {
  expect(uiExampleMeta("button")?.label).toBe("Button");
  expect(uiExampleMeta("nope")).toBeUndefined();
});

test("hasUIExampleVariant checks variant membership", () => {
  const button = uiExampleMeta("button")!;
  expect(hasUIExampleVariant(button, "primary")).toBe(true);
  expect(hasUIExampleVariant(button, "nope")).toBe(false);
});
