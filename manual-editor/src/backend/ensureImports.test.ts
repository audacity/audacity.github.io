import { describe, expect, test } from "bun:test";
import { ensureComponentImports } from "./ensureImports";

const FM = "---\ntitle: T\nsection: S\n---\n";

describe("ensureComponentImports", () => {
  test("adds a Callout import after the frontmatter at depth 1", () => {
    const src = `${FM}\n<Callout type="info">\n\nBody\n\n</Callout>\n`;
    const out = ensureComponentImports(
      src,
      "src/content/manual/basics/page.mdx",
    );
    expect(out).toContain(
      'import Callout from "../../../components/manual/Callout.astro";',
    );
    expect(out.indexOf("---\ntitle")).toBe(0);
    expect(out.indexOf("import Callout")).toBeLessThan(out.indexOf("<Callout"));
  });

  test("deeper nesting gets more ../ segments", () => {
    const src = `${FM}\n<Notes>\n\nx\n\n</Notes>\n`;
    const out = ensureComponentImports(
      src,
      "src/content/manual/basics/sub/page.mdx",
    );
    expect(out).toContain(
      'import Notes from "../../../../components/manual/Notes.astro";',
    );
  });

  test("top-level manual page gets two ../ segments", () => {
    const src = `${FM}\n<Shortcut client:load keys="Space" />\n`;
    const out = ensureComponentImports(src, "src/content/manual/page.mdx");
    expect(out).toContain(
      'import Shortcut from "../../components/manual/Shortcut.jsx";',
    );
  });

  test("tabs pull in BOTH Tabs and Tab", () => {
    const src = `${FM}\n<Tabs>\n<Tab title="A">\n\nx\n\n</Tab>\n</Tabs>\n`;
    const out = ensureComponentImports(
      src,
      "src/content/manual/basics/page.mdx",
    );
    expect(out).toContain(
      'import Tabs from "../../../components/manual/Tabs/Tabs.astro";',
    );
    expect(out).toContain(
      'import Tab from "../../../components/manual/Tabs/Tab.astro";',
    );
  });

  test("already-imported components are left alone (no duplicate)", () => {
    const src = `${FM}\nimport Callout from "../../../components/manual/Callout.astro";\n\n<Callout type="info">\n\nx\n\n</Callout>\n`;
    const out = ensureComponentImports(
      src,
      "src/content/manual/basics/page.mdx",
    );
    expect(out).toBe(src);
  });

  test("missing import merges onto an existing import block", () => {
    const src = `${FM}\nimport Callout from "../../../components/manual/Callout.astro";\n\n<Callout type="info">\n\nx\n\n</Callout>\n\n<Shortcut client:load keys="Space" />\n`;
    const out = ensureComponentImports(
      src,
      "src/content/manual/basics/page.mdx",
    );
    const lines = out.split("\n");
    const calloutIdx = lines.findIndex((l) => l.startsWith("import Callout"));
    const shortcutIdx = lines.findIndex((l) => l.startsWith("import Shortcut"));
    expect(calloutIdx).toBeGreaterThan(-1);
    expect(shortcutIdx).toBe(calloutIdx + 1);
    // exactly one blank line still separates the import block from content
    expect(out).toContain('Shortcut.jsx";\n\n<Callout');
  });

  test("page with no components is returned unchanged", () => {
    const src = `${FM}\n## Just text\n\nHello.\n`;
    expect(
      ensureComponentImports(src, "src/content/manual/basics/page.mdx"),
    ).toBe(src);
  });

  test("plain word usage (not a JSX tag) does not trigger an import", () => {
    const src = `${FM}\nUse the Callout component for notes.\n`;
    expect(
      ensureComponentImports(src, "src/content/manual/basics/page.mdx"),
    ).toBe(src);
  });

  test("adds the UIExample import for a page using the example block", () => {
    const source =
      '---\ntitle: T\n---\n\n<UIExample component="knob" variant="default" />\n';
    const out = ensureComponentImports(
      source,
      "src/content/manual/basics/a.mdx",
    );
    expect(out).toContain(
      'import UIExample from "../../../components/manual/UIExample/UIExample";',
    );
  });
});
