import { expect, test } from "bun:test";
import type { MdxJsxFlowElement, MdxJsxTextElement } from "mdast-util-mdx-jsx";
import type { Code, Heading, Image, List, Paragraph, Text } from "mdast";
import { docToMdast, docToSource } from "./docToMdast";
import type { PMNodeJSON } from "./mdastToDoc";

function doc(content: PMNodeJSON[]): PMNodeJSON {
  return { type: "doc", content };
}

test("frontmatter is reattached as a leading yaml node", () => {
  const root = docToMdast(doc([]), "title: T\nsection: S");
  expect(root.children[0]).toEqual({
    type: "yaml",
    value: "title: T\nsection: S",
  });
});

test("null frontmatter means no yaml node is added", () => {
  const root = docToMdast(
    doc([{ type: "paragraph", content: [{ type: "text", text: "Body" }] }]),
    null,
  );
  expect(root.children[0]?.type).not.toBe("yaml");
  expect(root.children).toHaveLength(1);
});

test("admonition becomes an mdxJsxFlowElement with attrs, nulls omitted", () => {
  const root = docToMdast(
    doc([
      {
        type: "admonition",
        attrs: { component: "Callout", type: "tip", title: null },
        content: [
          { type: "paragraph", content: [{ type: "text", text: "hi" }] },
        ],
      },
    ]),
    null,
  );
  const el = root.children[0] as MdxJsxFlowElement;
  expect(el.type).toBe("mdxJsxFlowElement");
  expect(el.name).toBe("Callout");
  expect(el.attributes).toEqual([
    { type: "mdxJsxAttribute", name: "type", value: "tip" },
  ]);
  expect(el.children).toHaveLength(1);
  expect((el.children[0] as Paragraph).type).toBe("paragraph");
});

test("admonition with no known attrs (Notes) has an empty attributes array", () => {
  const root = docToMdast(
    doc([
      {
        type: "admonition",
        attrs: { component: "Notes", type: null, title: null },
        content: [
          { type: "paragraph", content: [{ type: "text", text: "n" }] },
        ],
      },
    ]),
    null,
  );
  const el = root.children[0] as MdxJsxFlowElement;
  expect(el.name).toBe("Notes");
  expect(el.attributes).toEqual([]);
});

test("tabs/tab become mdxJsxFlowElements, tab label omitted when null", () => {
  const root = docToMdast(
    doc([
      {
        type: "tabs",
        content: [
          {
            type: "tab",
            attrs: { label: "Windows" },
            content: [
              { type: "paragraph", content: [{ type: "text", text: "w" }] },
            ],
          },
          {
            type: "tab",
            attrs: { label: null },
            content: [
              { type: "paragraph", content: [{ type: "text", text: "m" }] },
            ],
          },
        ],
      },
    ]),
    null,
  );
  const tabsEl = root.children[0] as MdxJsxFlowElement;
  expect(tabsEl.name).toBe("Tabs");
  expect(tabsEl.attributes).toEqual([]);

  const [tab1, tab2] = tabsEl.children as MdxJsxFlowElement[];
  expect(tab1.name).toBe("Tab");
  expect(tab1.attributes).toEqual([
    { type: "mdxJsxAttribute", name: "label", value: "Windows" },
  ]);
  expect(tab2.name).toBe("Tab");
  expect(tab2.attributes).toEqual([]);
});

test("shortcut becomes an inline mdxJsxTextElement with a keys attribute", () => {
  const root = docToMdast(
    doc([
      {
        type: "paragraph",
        content: [
          { type: "text", text: "Press " },
          { type: "shortcut", attrs: { keys: "Ctrl+S" } },
          { type: "text", text: " to save." },
        ],
      },
    ]),
    null,
  );
  const paragraph = root.children[0] as Paragraph;
  const shortcut = paragraph.children[1] as MdxJsxTextElement;
  expect(shortcut.type).toBe("mdxJsxTextElement");
  expect(shortcut.name).toBe("Shortcut");
  expect(shortcut.attributes).toEqual([
    { type: "mdxJsxAttribute", name: "keys", value: "Ctrl+S" },
  ]);
  expect(shortcut.children).toEqual([]);
});

test("preserved returns the stored mdast node verbatim", () => {
  const original = {
    type: "mdxJsxFlowElement",
    name: "UIMap",
    attributes: [],
    children: [],
  };
  const root = docToMdast(
    doc([{ type: "preserved", attrs: { mdast: original } }]),
    null,
  );
  expect(root.children[0]).toBe(original as never);
});

test("ordered list with attrs.start carries start back onto mdast list", () => {
  const root = docToMdast(
    doc([
      {
        type: "orderedList",
        attrs: { start: 3 },
        content: [
          {
            type: "listItem",
            content: [
              { type: "paragraph", content: [{ type: "text", text: "three" }] },
            ],
          },
          {
            type: "listItem",
            content: [
              { type: "paragraph", content: [{ type: "text", text: "four" }] },
            ],
          },
        ],
      },
    ]),
    null,
  );
  const list = root.children[0] as List;
  expect(list.type).toBe("list");
  expect(list.ordered).toBe(true);
  expect(list.start).toBe(3);
});

test("ordered list without attrs.start defaults to start 1", () => {
  const root = docToMdast(
    doc([
      {
        type: "orderedList",
        content: [
          {
            type: "listItem",
            content: [
              { type: "paragraph", content: [{ type: "text", text: "one" }] },
            ],
          },
        ],
      },
    ]),
    null,
  );
  const list = root.children[0] as List;
  expect(list.start).toBe(1);
});

test("bulletList becomes an unordered mdast list", () => {
  const root = docToMdast(
    doc([
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [
              { type: "paragraph", content: [{ type: "text", text: "a" }] },
            ],
          },
        ],
      },
    ]),
    null,
  );
  const list = root.children[0] as List;
  expect(list.ordered).toBe(false);
});

test("codeBlock becomes a code node carrying lang and value", () => {
  const root = docToMdast(
    doc([
      {
        type: "codeBlock",
        attrs: { language: "ts" },
        content: [{ type: "text", text: "const x = 1;" }],
      },
    ]),
    null,
  );
  const code = root.children[0] as Code;
  expect(code.type).toBe("code");
  expect(code.lang).toBe("ts");
  expect(code.value).toBe("const x = 1;");
});

test("codeBlock with no language and no content", () => {
  const root = docToMdast(
    doc([{ type: "codeBlock", attrs: { language: null } }]),
    null,
  );
  const code = root.children[0] as Code;
  expect(code.lang).toBeNull();
  expect(code.value).toBe("");
});

test("heading maps depth from attrs.level", () => {
  const root = docToMdast(
    doc([
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "Title" }],
      },
    ]),
    null,
  );
  const heading = root.children[0] as Heading;
  expect(heading.type).toBe("heading");
  expect(heading.depth).toBe(2);
});

test("horizontalRule becomes thematicBreak, hardBreak becomes break", () => {
  const root = docToMdast(
    doc([
      { type: "horizontalRule" },
      {
        type: "paragraph",
        content: [
          { type: "text", text: "a" },
          { type: "hardBreak" },
          { type: "text", text: "b" },
        ],
      },
    ]),
    null,
  );
  expect(root.children[0].type).toBe("thematicBreak");
  const paragraph = root.children[1] as Paragraph;
  expect(paragraph.children[1].type).toBe("break");
});

test("blockquote recurses into children", () => {
  const root = docToMdast(
    doc([
      {
        type: "blockquote",
        content: [
          { type: "paragraph", content: [{ type: "text", text: "quoted" }] },
        ],
      },
    ]),
    null,
  );
  expect(root.children[0].type).toBe("blockquote");
});

test("a standalone image block round-trips as a paragraph containing the image", () => {
  const root = docToMdast(
    doc([
      {
        type: "image",
        attrs: { src: "/img.png", alt: "alt text", title: "T" },
      },
    ]),
    null,
  );
  const paragraph = root.children[0] as Paragraph;
  expect(paragraph.type).toBe("paragraph");
  const image = paragraph.children[0] as Image;
  expect(image).toEqual({
    type: "image",
    url: "/img.png",
    alt: "alt text",
    title: "T",
  });
});

test("bold, italic, code and link marks rebuild the right mdast wrappers", () => {
  const root = docToMdast(
    doc([
      {
        type: "paragraph",
        content: [
          { type: "text", text: "bold", marks: [{ type: "bold" }] },
          { type: "text", text: "italic", marks: [{ type: "italic" }] },
          { type: "text", text: "code", marks: [{ type: "code" }] },
          {
            type: "text",
            text: "link",
            marks: [
              { type: "link", attrs: { href: "https://x.test", title: "T" } },
            ],
          },
        ],
      },
    ]),
    null,
  );
  const paragraph = root.children[0] as Paragraph;
  const [bold, italic, code, link] = paragraph.children;

  expect(bold.type).toBe("strong");
  expect((bold as { children: Text[] }).children[0].value).toBe("bold");

  expect(italic.type).toBe("emphasis");
  expect((italic as { children: Text[] }).children[0].value).toBe("italic");

  expect(code.type).toBe("inlineCode");
  expect((code as { value: string }).value).toBe("code");

  expect(link.type).toBe("link");
  expect((link as { url: string }).url).toBe("https://x.test");
  expect((link as { title: string | null }).title).toBe("T");
  expect((link as { children: Text[] }).children[0].value).toBe("link");
});

test("a text node with both bold and italic marks nests emphasis inside strong", () => {
  const root = docToMdast(
    doc([
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "both",
            marks: [{ type: "bold" }, { type: "italic" }],
          },
        ],
      },
    ]),
    null,
  );
  const paragraph = root.children[0] as Paragraph;
  const strong = paragraph.children[0] as { type: string; children: unknown[] };
  expect(strong.type).toBe("strong");
  const emphasis = strong.children[0] as { type: string; children: Text[] };
  expect(emphasis.type).toBe("emphasis");
  expect(emphasis.children[0].value).toBe("both");
});

test("docToSource produces a formatted MDX string", async () => {
  const source = await docToSource(
    doc([
      {
        type: "heading",
        attrs: { level: 1 },
        content: [{ type: "text", text: "Title" }],
      },
      {
        type: "paragraph",
        content: [
          { type: "text", text: "Hello " },
          { type: "text", text: "world", marks: [{ type: "bold" }] },
        ],
      },
    ]),
    "title: T\nsection: S",
  );
  expect(source).toContain("---\ntitle: T\nsection: S\n---");
  expect(source).toContain("# Title");
  expect(source).toContain("**world**");
});
