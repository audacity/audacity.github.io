import { expect, test } from "bun:test";
import { parseMdx, stringifyMdx, roundTrip } from "./pipeline";
import { formatMdx } from "./normalize";

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

// Prettier's `mdx` parser (MDX 1 semantics) reads a line that begins with a
// JSX tag as a JSX block, so a paragraph whose continuation line starts with
// an inline component would be split in two by the editor's own format pass.
// The serializer writes that soft break as a space instead; an expression at
// the line start is not affected and keeps its break.
test("stringifyMdx writes a soft break before an inline JSX element as a space", async () => {
  const source =
    'Some text —{" "}\n<Shortcut client:load keys="esc" /> leaves it open.\n';
  const out = roundTrip(source);
  expect(out).toBe(
    'Some text —{" "} <Shortcut client:load keys="esc" /> leaves it open.\n',
  );
  // Still one paragraph once Prettier has had its say.
  expect(await formatMdx(out)).toBe(out);
  expect(parseMdx(await formatMdx(out)).children).toHaveLength(1);
});

test("stringifyMdx keeps a soft break before an expression or plain text", () => {
  const source =
    'Some text\n{" "}<Shortcut client:load keys="esc" /> leaves it open\nand more.\n';
  expect(roundTrip(source)).toBe(source);
});

test("stringifyMdx does not rewrite the tree it is given", () => {
  const tree = parseMdx(
    'Some text\n<Shortcut client:load keys="esc" /> rest.\n',
  );
  stringifyMdx(tree);
  const paragraph = tree.children[0] as { children: { value?: string }[] };
  expect(paragraph.children[0].value).toBe("Some text\n");
});

// Prettier writes a tag too long for the line with one attribute per line and
// the `>` on its own line, the children indented beneath. That form must come
// back from a round trip as itself: the blank-line plan must not mistake the
// wrapped tag's extra lines for a blank line before the first child.
test("roundTrip keeps Prettier's wrapped-tag form for a sole paragraph child", async () => {
  const source = [
    "<Callout",
    '  type="warning"',
    '  title="No focus trap, and Escape does not close this modal"',
    ">",
    "  The export modal is a plain overlay rather than the shared dialog shell, so it",
    '  has **no focus trap**. It also has **no Escape handler** —{" "}',
    '  <Shortcut client:load keys="esc" /> leaves it open.',
    "</Callout>",
    "",
  ].join("\n");
  expect(roundTrip(source)).not.toContain(">\n\n");
  expect(await formatMdx(roundTrip(source))).toBe(await formatMdx(source));
  expect(await formatMdx(source)).toBe(source);
});
