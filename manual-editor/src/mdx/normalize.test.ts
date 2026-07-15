import { expect, test } from "bun:test";
import { formatMdx } from "./normalize";

test("formatMdx normalizes list markers and is idempotent", async () => {
  const messy = "*   item one\n*   item two\n";
  const once = await formatMdx(messy);
  const twice = await formatMdx(once);
  expect(once).toBe(twice); // idempotent
  expect(once).toContain("- item one"); // repo prettier normalizes bullets
});

test("formatMdx preserves an MDX component", async () => {
  const source = '<Callout type="tip">\n  Hello\n</Callout>\n';
  const out = await formatMdx(source);
  expect(out).toContain("<Callout");
  expect(out).toContain('type="tip"');
});
