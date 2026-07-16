import { expect, test } from "bun:test";
import { rewriteFrontmatter } from "./frontmatterRewrite";
import { parseFrontmatter } from "./frontmatter";

test("patching a key leaves the body byte-identical", () => {
  const source = "---\ntitle: T\nsection: S\norder: 1\n---\n\nSome body.\n";
  const rewritten = rewriteFrontmatter(source, { order: 5 });
  const { body } = parseFrontmatter(rewritten);
  expect(body).toBe(parseFrontmatter(source).body);
  expect(body).toBe("Some body.\n");
});

test("byte-fidelity holds even when the body itself contains a `---` line", () => {
  const source =
    "---\ntitle: T\nsection: S\n---\n\nIntro.\n\n---\n\nMore after a thematic break.\n";
  const original = parseFrontmatter(source).body;
  const rewritten = rewriteFrontmatter(source, { order: 2 });
  const { body } = parseFrontmatter(rewritten);
  expect(body).toBe(original);
  expect(body).toContain("---");
});

test("only the patched key changes; other keys are preserved", () => {
  const source =
    "---\ntitle: T\ndescription: D\nsection: S\nsectionOrder: 3\norder: 1\ndraft: true\n---\n\nBody\n";
  const rewritten = rewriteFrontmatter(source, { order: 9 });
  const { data } = parseFrontmatter(rewritten);
  expect(data).toEqual({
    title: "T",
    description: "D",
    section: "S",
    sectionOrder: 3,
    order: 9,
    draft: true,
  });
});

test("an absent optional key stays absent when not patched", () => {
  const source = "---\ntitle: T\nsection: S\n---\n\nBody\n";
  const rewritten = rewriteFrontmatter(source, { order: 4 });
  const { data } = parseFrontmatter(rewritten);
  expect(data).toEqual({ title: "T", section: "S", order: 4 });
  expect(data.sectionOrder).toBeUndefined();
  expect(data.draft).toBeUndefined();
});

test("patching section and sectionOrder together", () => {
  const source = "---\ntitle: T\nsection: Old\norder: 2\n---\n\nBody\n";
  const rewritten = rewriteFrontmatter(source, {
    section: "New",
    sectionOrder: 7,
  });
  const { data } = parseFrontmatter(rewritten);
  expect(data.section).toBe("New");
  expect(data.sectionOrder).toBe(7);
  expect(data.order).toBe(2); // untouched
});

test("a file with no frontmatter gets a new block prepended, body untouched", () => {
  const source = "# Just a heading\n\nNo frontmatter here.\n";
  const rewritten = rewriteFrontmatter(source, { order: 1 });
  expect(rewritten.startsWith("---\n")).toBe(true);
  const { data, body } = parseFrontmatter(rewritten);
  expect(data.order).toBe(1);
  expect(body).toBe(source);
});

test("works the same regardless of the source file's original extension-implied shape (.md vs .mdx content)", () => {
  const mdSource = "---\ntitle: T\nsection: S\n---\n\nPlain markdown body.\n";
  const mdxSource =
    '---\ntitle: T\nsection: S\n---\n\n<CustomComponent prop="x" />\n\nMDX body.\n';
  for (const source of [mdSource, mdxSource]) {
    const rewritten = rewriteFrontmatter(source, { order: 3 });
    const { data, body } = parseFrontmatter(rewritten);
    expect(data.order).toBe(3);
    expect(body).toBe(parseFrontmatter(source).body);
  }
});
