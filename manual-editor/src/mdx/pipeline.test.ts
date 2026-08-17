import { expect, test } from "bun:test";
import { parseMdx, stringifyMdx, roundTrip } from "./pipeline";

test("parseMdx yields an mdast root with children", () => {
  const tree = parseMdx("# Hello\n\nWorld\n");
  expect(tree.type).toBe("root");
  expect(tree.children.length).toBeGreaterThan(0);
});

test("roundTrip preserves a Callout component verbatim in structure", () => {
  const source = [
    "## Heading",
    "",
    '<Callout type="info">',
    "This is **important**.",
    "</Callout>",
    "",
    "Some `code` and a [link](https://example.com).",
    "",
  ].join("\n");
  const out = roundTrip(source);
  expect(out).toContain("<Callout");
  expect(out).toContain('type="info"');
  expect(out).toContain("**important**");
  expect(out).toContain("[link](https://example.com)");
});

test("roundTrip preserves YAML frontmatter", () => {
  const source = [
    "---",
    "title: Editing audio",
    "section: Audacity Basics",
    "order: 4",
    "---",
    "",
    "Body text.",
    "",
  ].join("\n");
  const out = roundTrip(source);
  expect(out).toContain("title: Editing audio");
  expect(out).toContain("section: Audacity Basics");
});

test("stringifyMdx accepts the tree from parseMdx", () => {
  const tree = parseMdx("Plain paragraph.\n");
  expect(stringifyMdx(tree).trim()).toBe("Plain paragraph.");
});
