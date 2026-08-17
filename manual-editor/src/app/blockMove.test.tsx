import { expect, test } from "bun:test";
import { act, render, screen, waitFor } from "@testing-library/react";
import { EditorContent, useEditor } from "@tiptap/react";
import type { Editor as TiptapEditor } from "@tiptap/core";
import { moveBlock, moveNodeAt, BlockReorder } from "./blockMove";
import { buildAppExtensions } from "./editorExtensions";
import type { PMNodeJSON } from "../adapter/mdastToDoc";

/**
 * Same cast rationale as `insertCommands.test.tsx`: `editor.getJSON()`'s
 * schema-derived type is too narrow to destructure generically here, and
 * `PMNodeJSON` is a strictly wider supertype of what it actually returns.
 */
function getJSON(editor: TiptapEditor): PMNodeJSON {
  return editor.getJSON() as unknown as PMNodeJSON;
}

/**
 * Doc: [paragraph "AAA", admonition(Callout) containing paragraph "BBB",
 * paragraph "CCC"] — built directly as PM JSON (not through
 * `mdastToDoc`/`parseMdx`) since these tests only care about top-level
 * block order/identity, not markdown round-tripping.
 */
const initialDoc = {
  type: "doc",
  content: [
    { type: "paragraph", content: [{ type: "text", text: "AAA" }] },
    {
      type: "admonition",
      attrs: { component: "Callout", type: null, title: null },
      content: [
        { type: "paragraph", content: [{ type: "text", text: "BBB" }] },
      ],
    },
    { type: "paragraph", content: [{ type: "text", text: "CCC" }] },
  ],
};

/**
 * Doc: [paragraph "AAA", bulletList with 2 items, paragraph "CCC"] — for the
 * "a multi-item list moves as one block" case.
 */
const listDoc = {
  type: "doc",
  content: [
    { type: "paragraph", content: [{ type: "text", text: "AAA" }] },
    {
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [
            { type: "paragraph", content: [{ type: "text", text: "one" }] },
          ],
        },
        {
          type: "listItem",
          content: [
            { type: "paragraph", content: [{ type: "text", text: "two" }] },
          ],
        },
      ],
    },
    { type: "paragraph", content: [{ type: "text", text: "CCC" }] },
  ],
};

/**
 * Mounts a real `useEditor` (same construction `Editor.tsx` uses).
 * `buildAppExtensions()` now includes `BlockReorder` itself (wired in Task
 * 2), so it's not appended again here — doing so used to produce a
 * "Duplicate extension names" warning from tiptap's extension manager.
 */
function TestHarness({
  content,
  onReady,
}: {
  content: object;
  onReady: (editor: TiptapEditor) => void;
}) {
  const editor = useEditor(
    {
      extensions: buildAppExtensions(),
      content,
      onCreate: ({ editor: created }) => onReady(created),
    },
    [],
  );
  return (
    <div data-testid="editor">
      <EditorContent editor={editor} />
    </div>
  );
}

async function mount(content: object) {
  let editor: TiptapEditor | null = null;
  render(
    <TestHarness
      content={content}
      onReady={(created) => {
        editor = created;
      }}
    />,
  );
  await waitFor(() => screen.getByTestId("editor"));
  await waitFor(() => expect(editor).not.toBeNull());
  return () => editor as unknown as TiptapEditor;
}

/**
 * StarterKit v3 bundles `TrailingNode`, which auto-appends an empty
 * paragraph whenever the doc's last child isn't already a paragraph — that
 * fires here whenever a move leaves `admonition`/`bulletList` as the new
 * last block, independent of `moveBlock`'s own logic. These helpers find a
 * block by its content rather than asserting on `json.content`'s exact
 * length, so the assertions describe the move itself and stay agnostic to
 * whether TrailingNode also appended its own housekeeping paragraph.
 */
function indexOfParagraphText(json: PMNodeJSON, text: string): number {
  return (json.content ?? []).findIndex(
    (n) => n.type === "paragraph" && n.content?.[0]?.text === text,
  );
}
function indexOfType(json: PMNodeJSON, type: string): number {
  return (json.content ?? []).findIndex((n) => n.type === type);
}

/** Finds the doc position of the given text and places a collapsed cursor inside it. */
function placeCursorInText(editor: TiptapEditor, text: string) {
  let pos: number | null = null;
  editor.state.doc.descendants((node, offset) => {
    if (node.isText && node.text?.includes(text)) {
      pos = offset + 1;
      return false;
    }
    return true;
  });
  if (pos === null) throw new Error(`text not found: ${text}`);
  act(() => {
    editor.commands.setTextSelection(pos as number);
  });
}

test("cursor in CCC + moveBlock(-1) swaps CCC above the admonition; cursor stays in CCC's text", async () => {
  const getEditor = await mount(initialDoc);
  const editor = getEditor();

  placeCursorInText(editor, "CCC");

  let result = false;
  act(() => {
    result = moveBlock(editor, -1);
  });
  expect(result).toBe(true);

  const json = getJSON(editor);
  expect(indexOfParagraphText(json, "AAA")).toBe(0);
  expect(indexOfParagraphText(json, "CCC")).toBe(1);
  expect(indexOfType(json, "admonition")).toBe(2);

  // cursor still inside CCC's text
  const { $from } = editor.state.selection;
  expect($from.parent.textContent).toBe("CCC");
});

test("cursor in AAA + moveBlock(-1) is a no-op at the top boundary", async () => {
  const getEditor = await mount(initialDoc);
  const editor = getEditor();

  placeCursorInText(editor, "AAA");
  const before = getJSON(editor);

  let result = true;
  act(() => {
    result = moveBlock(editor, -1);
  });
  expect(result).toBe(false);

  const after = getJSON(editor);
  expect(after).toEqual(before);
});

test("cursor in the callout's BBB paragraph + moveBlock(+1) moves the whole admonition below CCC, children intact", async () => {
  const getEditor = await mount(initialDoc);
  const editor = getEditor();

  placeCursorInText(editor, "BBB");

  let result = false;
  act(() => {
    result = moveBlock(editor, 1);
  });
  expect(result).toBe(true);

  const json = getJSON(editor);
  expect(indexOfParagraphText(json, "AAA")).toBe(0);
  expect(indexOfParagraphText(json, "CCC")).toBe(1);
  const admonitionIndex = indexOfType(json, "admonition");
  expect(admonitionIndex).toBe(2);
  const admonition = json.content?.[admonitionIndex];
  expect(admonition?.attrs?.component).toBe("Callout");
  expect(admonition?.content?.[0]?.content?.[0]?.text).toBe("BBB");
});

test("a bulletList with 2 items moves as one block", async () => {
  const getEditor = await mount(listDoc);
  const editor = getEditor();

  placeCursorInText(editor, "one");

  let result = false;
  act(() => {
    result = moveBlock(editor, -1);
  });
  expect(result).toBe(true);

  const json = getJSON(editor);
  expect(json.content?.map((n) => n.type)).toEqual([
    "bulletList",
    "paragraph",
    "paragraph",
  ]);
  const list = json.content?.[0];
  expect(list?.content?.length).toBe(2);
  expect(list?.content?.[0]?.content?.[0]?.content?.[0]?.text).toBe("one");
  expect(list?.content?.[1]?.content?.[0]?.content?.[0]?.text).toBe("two");
});

test("undo restores the original doc after a move", async () => {
  const getEditor = await mount(initialDoc);
  const editor = getEditor();

  const before = getJSON(editor);

  placeCursorInText(editor, "CCC");
  act(() => {
    moveBlock(editor, -1);
  });
  expect(getJSON(editor)).not.toEqual(before);

  act(() => {
    editor.commands.undo();
  });
  expect(getJSON(editor)).toEqual(before);
});

/**
 * Doc: [paragraph "AAA", tabs(tab["Only tab": paragraph "one", paragraph
 * "two", paragraph "three"]), paragraph "ZZZ"] — for `moveNodeAt`'s nested
 * (any-depth) coverage. The `tab`'s three paragraphs are the sibling list
 * under test; `AAA`/`tabs`/`ZZZ` are the top-level siblings that must stay
 * untouched by a nested move.
 */
const nestedDoc = {
  type: "doc",
  content: [
    { type: "paragraph", content: [{ type: "text", text: "AAA" }] },
    {
      type: "tabs",
      content: [
        {
          type: "tab",
          attrs: { label: "Only tab" },
          content: [
            { type: "paragraph", content: [{ type: "text", text: "one" }] },
            { type: "paragraph", content: [{ type: "text", text: "two" }] },
            { type: "paragraph", content: [{ type: "text", text: "three" }] },
          ],
        },
      ],
    },
    { type: "paragraph", content: [{ type: "text", text: "ZZZ" }] },
  ],
};

/** Finds the doc position of a paragraph by its text content. */
function findParagraphPos(editor: TiptapEditor, text: string): number {
  let pos: number | null = null;
  editor.state.doc.descendants((node, offset) => {
    if (
      node.type.name === "paragraph" &&
      node.textContent === text &&
      pos === null
    ) {
      pos = offset;
      return false;
    }
    return true;
  });
  if (pos === null) throw new Error(`paragraph not found: ${text}`);
  return pos;
}

test("moveNodeAt(-1) reorders two paragraphs INSIDE a tab; the tab and its top-level siblings are untouched", async () => {
  const getEditor = await mount(nestedDoc);
  const editor = getEditor();

  const twoPos = findParagraphPos(editor, "two");

  let result = false;
  act(() => {
    result = moveNodeAt(editor, twoPos, -1);
  });
  expect(result).toBe(true);

  const json = getJSON(editor);
  // Top-level structure unchanged: AAA, tabs, ZZZ, in that order.
  expect(json.content?.map((n) => n.type)).toEqual([
    "paragraph",
    "tabs",
    "paragraph",
  ]);
  expect(json.content?.[0]?.content?.[0]?.text).toBe("AAA");
  expect(json.content?.[2]?.content?.[0]?.text).toBe("ZZZ");

  // Nothing escaped the tab: still exactly one `tab`, still 3 paragraphs.
  const tabsNode = json.content?.[1];
  expect(tabsNode?.content).toHaveLength(1);
  const tab = tabsNode?.content?.[0];
  expect(tab?.type).toBe("tab");
  expect(tab?.content?.map((p) => p.content?.[0]?.text)).toEqual([
    "two",
    "one",
    "three",
  ]);
});

test("moveNodeAt boundary: the tab's FIRST paragraph can't move up (no-op), doc unchanged", async () => {
  const getEditor = await mount(nestedDoc);
  const editor = getEditor();

  const onePos = findParagraphPos(editor, "one");
  const before = getJSON(editor);

  let result = true;
  act(() => {
    result = moveNodeAt(editor, onePos, -1);
  });
  expect(result).toBe(false);
  expect(getJSON(editor)).toEqual(before);
});

test("moveNodeAt boundary: the tab's LAST paragraph can't move down (no-op), doc unchanged", async () => {
  const getEditor = await mount(nestedDoc);
  const editor = getEditor();

  const threePos = findParagraphPos(editor, "three");
  const before = getJSON(editor);

  let result = true;
  act(() => {
    result = moveNodeAt(editor, threePos, 1);
  });
  expect(result).toBe(false);
  expect(getJSON(editor)).toEqual(before);
});

test("moveNodeAt also works at the top level (nested-mode regression): same swap moveBlock would do", async () => {
  const getEditor = await mount(initialDoc);
  const editor = getEditor();

  let pos: number | null = null;
  editor.state.doc.forEach((node, offset) => {
    if (node.type.name === "admonition") pos = offset;
  });
  expect(pos).not.toBeNull();

  let result = false;
  act(() => {
    result = moveNodeAt(editor, pos as number, -1);
  });
  expect(result).toBe(true);

  const json = getJSON(editor);
  expect(indexOfType(json, "admonition")).toBe(0);
  expect(indexOfParagraphText(json, "AAA")).toBe(1);
  expect(indexOfParagraphText(json, "CCC")).toBe(2);
});

test("Alt-ArrowUp shortcut handler calls moveBlock(-1) through the real command path", async () => {
  const getEditor = await mount(initialDoc);
  const editor = getEditor();

  placeCursorInText(editor, "CCC");

  // Simulating the raw keystroke headlessly is unreliable in this
  // environment (see sl-task-2's report on `keyboardShortcut()` and
  // happy-dom's platform-flag mismatch), so invoke the extension's shortcut
  // handler directly — the same fallback used there. `moveBlock` itself
  // (the actual command logic under test) still runs through its real,
  // undispatched-transaction command path; only the keymap plumbing is
  // bypassed.
  const shortcuts = BlockReorder.config.addKeyboardShortcuts!.call({
    editor,
  } as unknown as ThisParameterType<
    NonNullable<typeof BlockReorder.config.addKeyboardShortcuts>
  >);

  let handled = false;
  act(() => {
    handled = shortcuts["Alt-ArrowUp"]({ editor } as never);
  });
  expect(handled).toBe(true);

  const json = getJSON(editor);
  expect(indexOfParagraphText(json, "AAA")).toBe(0);
  expect(indexOfParagraphText(json, "CCC")).toBe(1);
  expect(indexOfType(json, "admonition")).toBe(2);
});
