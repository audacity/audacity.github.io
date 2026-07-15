import { expect, test } from "bun:test";
import { parseMdx } from "../mdx/pipeline";
import { mdastToDoc } from "./mdastToDoc";

test("Callout with nested list becomes an admonition containing a bulletList", () => {
  const { doc } = mdastToDoc(
    parseMdx('<Callout type="tip">\n\n- one\n- two\n\n</Callout>\n'),
  );
  const admon = doc.content!.find((n) => n.type === "admonition")!;
  expect(admon.attrs!.component).toBe("Callout");
  expect(admon.attrs!.type).toBe("tip");
  expect(admon.content!.some((n) => n.type === "bulletList")).toBe(true);
});

test("unknown JSX becomes a preserved node carrying its mdast", () => {
  const { doc } = mdastToDoc(parseMdx('<UIMap id="toolbar" />\n'));
  const pres = doc.content!.find((n) => n.type === "preserved")!;
  const mdast = pres.attrs!.mdast as { name: string };
  expect(mdast.name).toBe("UIMap");
});

test("frontmatter is split out, not placed in the doc", () => {
  const { doc, frontmatter } = mdastToDoc(
    parseMdx("---\ntitle: T\nsection: S\n---\n\nBody\n"),
  );
  expect(frontmatter).toContain("title: T");
  expect(JSON.stringify(doc)).not.toContain("title: T");
});

test("no leading yaml node means frontmatter is null", () => {
  const { frontmatter } = mdastToDoc(parseMdx("Body only\n"));
  expect(frontmatter).toBeNull();
});

test("bold, italic, code and link marks map correctly", () => {
  const { doc } = mdastToDoc(
    parseMdx(
      'A **bold** and _italic_ and `code` and [link](https://x.test "T").\n',
    ),
  );
  const paragraph = doc.content!.find((n) => n.type === "paragraph")!;
  const bold = paragraph.content!.find((n) => n.text === "bold")!;
  expect(bold.marks).toEqual([{ type: "bold" }]);

  const italic = paragraph.content!.find((n) => n.text === "italic")!;
  expect(italic.marks).toEqual([{ type: "italic" }]);

  const code = paragraph.content!.find((n) => n.text === "code")!;
  expect(code.marks).toEqual([{ type: "code" }]);

  const link = paragraph.content!.find((n) => n.text === "link")!;
  expect(link.marks).toEqual([
    { type: "link", attrs: { href: "https://x.test", title: "T" } },
  ]);
});

test("a paragraph mixing text and an image splits into sibling blocks", () => {
  const { doc } = mdastToDoc(
    parseMdx('Before text\n\n![alt text](/img.png "T")\n\nAfter text\n'),
  );
  // Standalone image paragraph unwraps to a bare image block, not nested
  // inside a paragraph's inline content (image is a block-level atom).
  const types = doc.content!.map((n) => n.type);
  expect(types).toEqual(["paragraph", "image", "paragraph"]);
  const image = doc.content!.find((n) => n.type === "image")!;
  expect(image.attrs).toEqual({ src: "/img.png", alt: "alt text", title: "T" });
});

test("a paragraph with unsupported inline content (GFM strikethrough) is preserved whole", () => {
  const { doc } = mdastToDoc(parseMdx("Some ~~struck~~ text.\n"));
  const pres = doc.content!.find((n) => n.type === "preserved")!;
  const mdast = pres.attrs!.mdast as { type: string };
  expect(mdast.type).toBe("paragraph");
  expect(doc.content!.some((n) => n.type === "paragraph")).toBe(false);
});

test("inline Shortcut becomes an inline shortcut atom", () => {
  const { doc } = mdastToDoc(
    parseMdx('Press <Shortcut keys="Ctrl+S" /> to save.\n'),
  );
  const paragraph = doc.content!.find((n) => n.type === "paragraph")!;
  const shortcut = paragraph.content!.find((n) => n.type === "shortcut")!;
  expect(shortcut.attrs).toEqual({ keys: "Ctrl+S" });
});
