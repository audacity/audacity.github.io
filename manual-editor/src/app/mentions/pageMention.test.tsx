/**
 * Coverage for Task 3's `@` page-mention machinery: the context registry,
 * `filterPages`, a real insertion end-to-end (headless editor + the live
 * `suggestion.items`/`suggestion.command` pair `buildAppExtensions()` wires
 * up — same "test the command path directly" approach
 * `slash/slashIntegration.test.tsx` uses, since happy-dom can't drive real
 * DOM selection/composition events through ProseMirror's suggestion plugin;
 * that live-popup/live-trigger behavior is browser-verified separately per
 * the task brief), and the `PageMentionMenuList` popup component (mirroring
 * `slash/SlashMenu.test.tsx`).
 */
import { expect, test } from "bun:test";
import { createRef } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { Editor } from "@tiptap/core";
import type { Range } from "@tiptap/core";
import type { Node as PMNode } from "@tiptap/pm/model";
import { buildAppExtensions } from "../editorExtensions";
import type { PMNodeJSON } from "../../adapter/mdastToDoc";
import type { ManualPageMeta } from "../../backend/types";
import {
  filterPages,
  getPageContext,
  registerPageContext,
  type PageMentionOptions,
} from "./pageMention";
import {
  PageMentionMenuList,
  type PageMentionMenuListHandle,
  type PageMentionSelection,
} from "./PageMentionMenu";

function makePage(overrides: Partial<ManualPageMeta>): ManualPageMeta {
  return {
    slug: "basics/installing-ffmpeg",
    path: "src/content/manual/basics/installing-ffmpeg.mdx",
    title: "Installing FFmpeg",
    section: "Basics",
    sectionOrder: 1,
    order: 1,
    draft: false,
    hasDraft: false,
    ...overrides,
  };
}

const PAGES: ManualPageMeta[] = [
  makePage({
    slug: "basics/installing-ffmpeg",
    title: "Installing FFmpeg",
    section: "Basics",
  }),
  makePage({
    slug: "basics/installing-audacity",
    path: "src/content/manual/basics/installing-audacity.mdx",
    title: "Installing Audacity",
    section: "Basics",
  }),
  makePage({
    slug: "effects/noise-reduction",
    path: "src/content/manual/effects/noise-reduction.mdx",
    title: "Noise Reduction",
    section: "Effects",
  }),
  makePage({
    slug: "effects/normalize",
    path: "src/content/manual/effects/normalize.mdx",
    title: "Normalize",
    section: "Effects",
  }),
  makePage({
    slug: "recording/basics",
    path: "src/content/manual/recording/basics.mdx",
    title: "Recording Basics",
    section: "Recording",
  }),
  makePage({
    slug: "recording/multi-track",
    path: "src/content/manual/recording/multi-track.mdx",
    title: "Multi-track Recording",
    section: "Recording",
  }),
  makePage({
    slug: "export/mp3",
    path: "src/content/manual/export/mp3.mdx",
    title: "Exporting MP3",
    section: "Export",
  }),
  makePage({
    slug: "export/wav",
    path: "src/content/manual/export/wav.mdx",
    title: "Exporting WAV",
    section: "Export",
  }),
  makePage({
    slug: "export/flac",
    path: "src/content/manual/export/flac.mdx",
    title: "Exporting FLAC",
    section: "Export",
  }),
];

function makeEditor(): Editor {
  return new Editor({
    element: document.createElement("div"),
    extensions: buildAppExtensions(),
    content: "<p>hello</p>",
  });
}

/** Locates the doc-position range of the first occurrence of `needle` in a text node. */
function findTextRange(doc: PMNode, needle: string): Range {
  let found: Range | null = null;
  doc.descendants((node, pos) => {
    if (found) return false;
    if (!node.isText || !node.text) return true;
    const idx = node.text.indexOf(needle);
    if (idx === -1) return true;
    found = { from: pos + idx, to: pos + idx + needle.length };
    return false;
  });
  if (!found) throw new Error(`"${needle}" not found in document`);
  return found;
}

function getPageMentionSuggestion(editor: Editor) {
  const extension = editor.extensionManager.extensions.find(
    (e) => e.name === "pageMention",
  );
  if (!extension) throw new Error("pageMention extension not registered");
  return (extension.options as PageMentionOptions).suggestion;
}

/** Finds every `text` node in `json` carrying a `link` mark, flattened depth-first. */
function linkedTextNodes(
  json: PMNodeJSON,
): Array<{ text: string; href: unknown }> {
  const found: Array<{ text: string; href: unknown }> = [];
  if (json.type === "text" && json.marks?.some((m) => m.type === "link")) {
    const link = json.marks.find((m) => m.type === "link");
    found.push({ text: json.text ?? "", href: link?.attrs?.href });
  }
  for (const child of json.content ?? []) found.push(...linkedTextNodes(child));
  return found;
}

/** Finds every plain (unmarked) `text` node in `json`, flattened depth-first. */
function unmarkedTextNodes(json: PMNodeJSON): string[] {
  const found: string[] = [];
  if (
    json.type === "text" &&
    (!json.marks || json.marks.length === 0) &&
    json.text
  ) {
    found.push(json.text);
  }
  for (const child of json.content ?? [])
    found.push(...unmarkedTextNodes(child));
  return found;
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

test("registerPageContext + getPageContext round-trip the same array for a given editor", () => {
  const editor = makeEditor();
  expect(getPageContext(editor)).toBeUndefined();

  registerPageContext(editor, PAGES);
  expect(getPageContext(editor)).toBe(PAGES);

  editor.destroy();
});

test("registering again for the same editor replaces the previously-registered list", () => {
  const editor = makeEditor();
  const firstList = [PAGES[0]!];
  const secondList = [PAGES[1]!, PAGES[2]!];

  registerPageContext(editor, firstList);
  expect(getPageContext(editor)).toBe(firstList);

  registerPageContext(editor, secondList);
  expect(getPageContext(editor)).toBe(secondList);
  expect(getPageContext(editor)).not.toBe(firstList);

  editor.destroy();
});

test("getPageContext returns undefined for an editor that was never registered", () => {
  const editor = makeEditor();
  expect(getPageContext(editor)).toBeUndefined();
  editor.destroy();
});

// ---------------------------------------------------------------------------
// filterPages
// ---------------------------------------------------------------------------

test("filterPages matches by title", () => {
  const results = filterPages(PAGES, "ffmpeg");
  expect(results.map((p) => p.slug)).toEqual(["basics/installing-ffmpeg"]);
});

test("filterPages matches by slug even when the title doesn't contain the query", () => {
  const results = filterPages(PAGES, "effects/");
  expect(results.map((p) => p.slug).sort()).toEqual(
    ["effects/noise-reduction", "effects/normalize"].sort(),
  );
});

test("filterPages is case-insensitive", () => {
  const results = filterPages(PAGES, "FFMPEG");
  expect(results.map((p) => p.slug)).toEqual(["basics/installing-ffmpeg"]);
});

test("filterPages ranks title matches ahead of slug-only matches", () => {
  const pages: ManualPageMeta[] = [
    makePage({ slug: "abc/export", title: "Something Else", section: "S" }),
    makePage({ slug: "xyz", title: "Export options", section: "S" }),
  ];
  const results = filterPages(pages, "export");
  expect(results.map((p) => p.slug)).toEqual(["xyz", "abc/export"]);
});

test("filterPages caps results at 8", () => {
  const results = filterPages(PAGES, "");
  expect(PAGES.length).toBeGreaterThan(8);
  expect(results.length).toBe(8);
});

test("filterPages with an empty/whitespace-only query returns the first N pages, unfiltered", () => {
  const emptyResults = filterPages(PAGES, "");
  expect(emptyResults).toEqual(PAGES.slice(0, 8));

  const whitespaceResults = filterPages(PAGES, "   ");
  expect(whitespaceResults).toEqual(PAGES.slice(0, 8));
});

test("filterPages with no match returns an empty array", () => {
  expect(filterPages(PAGES, "zzz-no-such-page")).toEqual([]);
});

// ---------------------------------------------------------------------------
// Insertion (real suggestion.items/command path against buildAppExtensions())
// ---------------------------------------------------------------------------

test("buildAppExtensions() registers pageMention configured with char '@'", () => {
  const editor = makeEditor();
  const suggestion = getPageMentionSuggestion(editor);
  expect(suggestion.char).toBe("@");
  expect(suggestion.allowSpaces).toBe(false);
  editor.destroy();
});

test("typing @instal and choosing Installing FFmpeg replaces the query with a linked text run + trailing plain space", () => {
  const editor = makeEditor();
  registerPageContext(editor, PAGES);

  editor.commands.focus("end");
  editor.commands.insertContent("@instal");

  const suggestion = getPageMentionSuggestion(editor);
  const items = suggestion.items?.({
    query: "instal",
    editor,
    signal: new AbortController().signal,
  });
  const itemList = Array.isArray(items) ? items : [];
  expect(itemList.map((p) => p.slug)).toEqual([
    "basics/installing-ffmpeg",
    "basics/installing-audacity",
  ]);

  const range = findTextRange(editor.state.doc, "@instal");
  suggestion.command?.({
    editor,
    range,
    props: { page: itemList[0]! } as PageMentionSelection,
  });

  const json = editor.getJSON() as unknown as PMNodeJSON;
  const serialized = JSON.stringify(json);

  // The "@instal" query text is gone entirely...
  expect(serialized.includes("@instal")).toBe(false);

  // ...replaced by a link-marked "Installing FFmpeg" text run pointing at
  // the corpus' internal-link convention...
  const linked = linkedTextNodes(json);
  expect(linked).toHaveLength(1);
  expect(linked[0]!.text).toBe("Installing FFmpeg");
  expect(linked[0]!.href).toBe("/manual/basics/installing-ffmpeg");

  // ...followed by a plain (NOT link-marked) trailing space.
  expect(unmarkedTextNodes(json)).toContain(" ");

  editor.destroy();
});

test("mention insertion works inside a tab body", () => {
  const editor = new Editor({
    element: document.createElement("div"),
    extensions: buildAppExtensions(),
    content: {
      type: "doc",
      content: [
        {
          type: "tabs",
          content: [
            {
              type: "tab",
              attrs: { label: "Windows" },
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "@instal" }],
                },
              ],
            },
            {
              type: "tab",
              attrs: { label: "macOS" },
              content: [{ type: "paragraph" }],
            },
          ],
        },
      ],
    },
  });
  registerPageContext(editor, PAGES);

  const suggestion = getPageMentionSuggestion(editor);
  const range = findTextRange(editor.state.doc, "@instal");
  const page = PAGES.find((p) => p.slug === "basics/installing-ffmpeg")!;
  suggestion.command?.({ editor, range, props: { page } });

  const json = editor.getJSON() as unknown as PMNodeJSON;
  const linked = linkedTextNodes(json);
  expect(linked).toHaveLength(1);
  expect(linked[0]!.text).toBe("Installing FFmpeg");
  expect(linked[0]!.href).toBe("/manual/basics/installing-ffmpeg");

  editor.destroy();
});

test("mention insertion works inside a callout (admonition) body", () => {
  const editor = new Editor({
    element: document.createElement("div"),
    extensions: buildAppExtensions(),
    content: {
      type: "doc",
      content: [
        {
          type: "admonition",
          attrs: { component: "Callout", type: "info", title: null },
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "@instal" }],
            },
          ],
        },
      ],
    },
  });
  registerPageContext(editor, PAGES);

  const suggestion = getPageMentionSuggestion(editor);
  const range = findTextRange(editor.state.doc, "@instal");
  const page = PAGES.find((p) => p.slug === "basics/installing-ffmpeg")!;
  suggestion.command?.({ editor, range, props: { page } });

  const json = editor.getJSON() as unknown as PMNodeJSON;
  const linked = linkedTextNodes(json);
  expect(linked).toHaveLength(1);
  expect(linked[0]!.text).toBe("Installing FFmpeg");
  expect(linked[0]!.href).toBe("/manual/basics/installing-ffmpeg");

  editor.destroy();
});

test("suggestion.items returns [] when no page context is registered for the editor", () => {
  const editor = makeEditor();
  const suggestion = getPageMentionSuggestion(editor);
  const items = suggestion.items?.({
    query: "",
    editor,
    signal: new AbortController().signal,
  });
  expect(items).toEqual([]);
  editor.destroy();
});

// ---------------------------------------------------------------------------
// PageMentionMenuList component
// ---------------------------------------------------------------------------

function fakeKeyDown(
  key: string,
): Parameters<PageMentionMenuListHandle["onKeyDown"]>[0] {
  return {
    view: {} as never,
    range: { from: 0, to: 0 },
    event: new KeyboardEvent("keydown", { key }),
  };
}

test("renders every page's row with title + muted section/slug line", () => {
  render(<PageMentionMenuList items={PAGES.slice(0, 3)} command={() => {}} />);

  expect(screen.getByTestId("page-mention-menu")).toBeDefined();
  for (const page of PAGES.slice(0, 3)) {
    expect(screen.getByTestId(`page-mention-${page.slug}`)).toBeDefined();
  }
  expect(screen.getByText("Installing FFmpeg")).toBeDefined();
  expect(screen.getByText("Basics · basics/installing-ffmpeg")).toBeDefined();
});

test("shows a 'No results' row when items is empty", () => {
  render(<PageMentionMenuList items={[]} command={() => {}} />);
  expect(screen.getByTestId("page-mention-menu-empty")).toBeDefined();
  expect(screen.getByText("No results")).toBeDefined();
});

test("clicking a row invokes command with that page", () => {
  const command = ((_selection: PageMentionSelection) => {}) as (
    selection: PageMentionSelection,
  ) => void;
  const calls: PageMentionSelection[] = [];
  render(
    <PageMentionMenuList
      items={PAGES.slice(0, 3)}
      command={(selection) => {
        calls.push(selection);
        command(selection);
      }}
    />,
  );

  fireEvent.click(screen.getByTestId(`page-mention-${PAGES[1]!.slug}`));

  expect(calls).toHaveLength(1);
  expect(calls[0]!.page.slug).toBe(PAGES[1]!.slug);
});

test("the first row is active by default", () => {
  render(<PageMentionMenuList items={PAGES.slice(0, 3)} command={() => {}} />);
  const firstItem = screen.getByTestId(`page-mention-${PAGES[0]!.slug}`);
  expect(firstItem.className).toContain("is-active");
});

test("ArrowDown advances the active row, and Enter selects it via the exposed onKeyDown handle", () => {
  const calls: PageMentionSelection[] = [];
  const ref = createRef<PageMentionMenuListHandle>();
  render(
    <PageMentionMenuList
      ref={ref}
      items={PAGES.slice(0, 3)}
      command={(selection) => calls.push(selection)}
    />,
  );

  act(() => {
    ref.current?.onKeyDown(fakeKeyDown("ArrowDown"));
  });

  const secondItem = screen.getByTestId(`page-mention-${PAGES[1]!.slug}`);
  expect(secondItem.className).toContain("is-active");

  act(() => {
    ref.current?.onKeyDown(fakeKeyDown("Enter"));
  });

  expect(calls).toHaveLength(1);
  expect(calls[0]!.page.slug).toBe(PAGES[1]!.slug);
});

test("ArrowUp from the first row wraps to the last row", () => {
  const items = PAGES.slice(0, 3);
  const calls: PageMentionSelection[] = [];
  const ref = createRef<PageMentionMenuListHandle>();
  render(
    <PageMentionMenuList
      ref={ref}
      items={items}
      command={(selection) => calls.push(selection)}
    />,
  );

  act(() => {
    ref.current?.onKeyDown(fakeKeyDown("ArrowUp"));
  });

  const lastItem = items[items.length - 1]!;
  expect(
    screen.getByTestId(`page-mention-${lastItem.slug}`).className,
  ).toContain("is-active");

  act(() => {
    ref.current?.onKeyDown(fakeKeyDown("Enter"));
  });

  expect(calls[0]!.page.slug).toBe(lastItem.slug);
});

test("Escape is reported as handled but does not select anything", () => {
  const calls: PageMentionSelection[] = [];
  const ref = createRef<PageMentionMenuListHandle>();
  render(
    <PageMentionMenuList
      ref={ref}
      items={PAGES.slice(0, 3)}
      command={(selection) => calls.push(selection)}
    />,
  );

  let handled: boolean | undefined;
  act(() => {
    handled = ref.current?.onKeyDown(fakeKeyDown("Escape"));
  });

  expect(handled).toBe(true);
  expect(calls).toHaveLength(0);
});

test("the active row resets to the first item whenever the items list changes (e.g. a new query)", () => {
  const items = PAGES.slice(0, 3);
  const ref = createRef<PageMentionMenuListHandle>();
  const { rerender } = render(
    <PageMentionMenuList ref={ref} items={items} command={() => {}} />,
  );

  act(() => {
    ref.current?.onKeyDown(fakeKeyDown("ArrowDown"));
  });
  expect(
    screen.getByTestId(`page-mention-${items[1]!.slug}`).className,
  ).toContain("is-active");

  const filtered = [items[2]!];
  rerender(
    <PageMentionMenuList ref={ref} items={filtered} command={() => {}} />,
  );

  expect(
    screen.getByTestId(`page-mention-${filtered[0]!.slug}`).className,
  ).toContain("is-active");
});
