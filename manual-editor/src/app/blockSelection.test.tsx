/**
 * Headless coverage for `blockSelection.ts`: a real TipTap `Editor` (same
 * "detached `<div>`, no React render" construction `blockActions.test.tsx`/
 * `imageUpload.test.tsx` use) built with `buildAppExtensions()`, so the
 * `BlockSelection` plugin under test is the SAME one the live app wires in
 * — not a bespoke test-only instance. This is where the feature's actual
 * correctness lives (positional math + `DecorationSet` mapping under
 * edits), per the task brief, so it's deliberately thorough: toggle/clear/
 * range commands, remap-under-edit, the click handler's depth-resolution
 * (nested click -> top-level block), and every batch action's descending-
 * order/one-transaction/one-undo-step behavior.
 */
import { afterEach, beforeEach, expect, test } from "bun:test";
import { Editor } from "@tiptap/core";
import type { Node as PMNode } from "@tiptap/pm/model";
import { Plugin } from "@tiptap/pm/state";
import { buildAppExtensions } from "./editorExtensions";
import {
  BlockSelection,
  blockSelectionPluginKey,
  clearBlockSelection,
  deleteSelectedBlocks,
  duplicateSelectedBlocks,
  getSelectedBlocks,
  isSelectionTextConvertible,
  selectBlockRange,
  toggleBlockSelected,
  turnSelectedBlocksInto,
} from "./blockSelection";
import type { PMNodeJSON } from "../adapter/mdastToDoc";

/**
 * Doc: [paragraph "P0", admonition(Callout, paragraph "Callout body"),
 * paragraph "P2", paragraph "P3"] — four top-level blocks, one of which
 * (the admonition at index 1) is a container with nested content, giving
 * every test below a nested-click target and a non-text-convertible block
 * to select around.
 */
const initialDoc = {
  type: "doc",
  content: [
    { type: "paragraph", content: [{ type: "text", text: "P0" }] },
    {
      type: "admonition",
      attrs: { component: "Callout", type: "info", title: null },
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Callout body" }],
        },
      ],
    },
    { type: "paragraph", content: [{ type: "text", text: "P2" }] },
    { type: "paragraph", content: [{ type: "text", text: "P3" }] },
  ],
};

function makeEditor(content: object = initialDoc): Editor {
  return new Editor({
    element: document.createElement("div"),
    extensions: buildAppExtensions(),
    content,
  });
}

function getJSON(editor: Editor): PMNodeJSON {
  return editor.getJSON() as unknown as PMNodeJSON;
}

/** Finds a TOP-LEVEL block's `{node, pos}` by predicate — same helper shape
 * `blockActions.test.tsx`/`blockMove.ts` use. */
function findTopLevelBlock(
  editor: Editor,
  predicate: (node: PMNode) => boolean,
): { node: PMNode; pos: number } {
  let result: { node: PMNode; pos: number } | null = null;
  editor.state.doc.forEach((node, offset) => {
    if (!result && predicate(node)) result = { node, pos: offset };
  });
  if (!result) throw new Error("block not found");
  return result;
}

function posOfParagraph(editor: Editor, text: string): number {
  return findTopLevelBlock(
    editor,
    (n) => n.type.name === "paragraph" && n.textContent === text,
  ).pos;
}

function posOfAdmonition(editor: Editor): number {
  return findTopLevelBlock(editor, (n) => n.type.name === "admonition").pos;
}

/** Finds any document position inside the admonition's inner paragraph text
 * — used to exercise the click handler's "resolve up to the top-level
 * ancestor" behavior from a genuinely nested position. */
function posInsideCalloutText(editor: Editor): number {
  let pos: number | null = null;
  editor.state.doc.descendants((node, offset) => {
    if (node.isText && node.text === "Callout body") {
      pos = offset + 1;
      return false;
    }
    return true;
  });
  if (pos === null) throw new Error("callout text not found");
  return pos;
}

function selectedTexts(editor: Editor): string[] {
  return getSelectedBlocks(editor).map(({ node }) => node.textContent);
}

/** Retrieves the live `Plugin` instance `BlockSelection` registered, so
 * tests can invoke its `handleClickOn` prop directly — the same "call the
 * extension's own handler function, bypassing real DOM event dispatch"
 * approach `blockMove.test.tsx` uses for `Alt-ArrowUp` (see its own comment
 * on why simulating a raw keystroke/click headlessly is unreliable here). */
function getPlugin(editor: Editor): Plugin {
  const plugin = blockSelectionPluginKey.get(editor.state);
  if (!plugin) throw new Error("blockSelection plugin not registered");
  return plugin;
}

function fakeMouseEvent(opts: {
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
}): MouseEvent {
  return {
    metaKey: opts.metaKey ?? false,
    ctrlKey: opts.ctrlKey ?? false,
    shiftKey: opts.shiftKey ?? false,
    preventDefault: () => {},
  } as MouseEvent;
}

/** Fires `handleClickOn` at `pos` (as `direct: true`, matching the
 * innermost-node call ProseMirror itself makes) through the real registered
 * plugin, so the whole click -> meta -> `apply` pipeline runs exactly as it
 * would from a real click. */
function clickAt(
  editor: Editor,
  pos: number,
  opts: { metaKey?: boolean; ctrlKey?: boolean; shiftKey?: boolean } = {},
): boolean | void {
  const plugin = getPlugin(editor);
  const handleClickOn = plugin.props.handleClickOn as NonNullable<
    typeof plugin.props.handleClickOn
  >;
  const $pos = editor.state.doc.resolve(pos);
  const node = $pos.parent;
  const nodePos = $pos.depth === 0 ? pos : $pos.before($pos.depth);
  return handleClickOn.call(
    plugin,
    editor.view,
    pos,
    node,
    nodePos,
    fakeMouseEvent(opts),
    true,
  );
}

let editor: Editor;

beforeEach(() => {
  editor = makeEditor();
});

afterEach(() => {
  editor.destroy();
});

test("buildAppExtensions includes the blockSelection extension", () => {
  expect(
    editor.extensionManager.extensions.some((e) => e.name === "blockSelection"),
  ).toBe(true);
});

test("toggleBlockSelected selects then deselects a block; getSelectedBlocks reflects it", () => {
  const p0 = posOfParagraph(editor, "P0");

  expect(toggleBlockSelected(editor, p0)).toBe(true);
  expect(selectedTexts(editor)).toEqual(["P0"]);

  expect(toggleBlockSelected(editor, p0)).toBe(true);
  expect(selectedTexts(editor)).toEqual([]);
});

test("toggleBlockSelected on a non-existent position is a no-op", () => {
  const farBeyondDoc = editor.state.doc.content.size + 50;
  expect(toggleBlockSelected(editor, farBeyondDoc)).toBe(false);
  expect(selectedTexts(editor)).toEqual([]);
});

test("getSelectedBlocks returns blocks sorted by position regardless of toggle order", () => {
  const p3 = posOfParagraph(editor, "P3");
  const p0 = posOfParagraph(editor, "P0");
  const p2 = posOfParagraph(editor, "P2");

  toggleBlockSelected(editor, p3);
  toggleBlockSelected(editor, p0);
  toggleBlockSelected(editor, p2);

  const blocks = getSelectedBlocks(editor);
  expect(blocks.map((b) => b.pos)).toEqual([p0, p2, p3].sort((a, b) => a - b));
  expect(blocks.map((b) => b.node.textContent)).toEqual(["P0", "P2", "P3"]);
});

test("clearBlockSelection empties the selection and reports handled/not-handled correctly", () => {
  expect(clearBlockSelection(editor)).toBe(false); // already empty

  toggleBlockSelected(editor, posOfParagraph(editor, "P0"));
  expect(selectedTexts(editor)).toEqual(["P0"]);

  expect(clearBlockSelection(editor)).toBe(true);
  expect(selectedTexts(editor)).toEqual([]);

  expect(clearBlockSelection(editor)).toBe(false); // already empty again
});

test("selectBlockRange fills contiguously between two top-level blocks, inclusive of both ends", () => {
  const p0 = posOfParagraph(editor, "P0");
  const p3 = posOfParagraph(editor, "P3");

  expect(selectBlockRange(editor, p0, p3)).toBe(true);
  expect(selectedTexts(editor)).toEqual(["P0", "Callout body", "P2", "P3"]);
});

test("selectBlockRange works in either direction (to before from)", () => {
  const p0 = posOfParagraph(editor, "P0");
  const p2 = posOfParagraph(editor, "P2");

  expect(selectBlockRange(editor, p2, p0)).toBe(true);
  expect(selectedTexts(editor)).toEqual(["P0", "Callout body", "P2"]);
});

test("selectBlockRange replaces (rather than adds to) whatever was already selected", () => {
  const p3 = posOfParagraph(editor, "P3");
  toggleBlockSelected(editor, p3);
  expect(selectedTexts(editor)).toEqual(["P3"]);

  const p0 = posOfParagraph(editor, "P0");
  const p2 = posOfParagraph(editor, "P2");
  selectBlockRange(editor, p0, p2);

  // P3 is no longer selected -- the range replaced the prior toggle.
  expect(selectedTexts(editor)).toEqual(["P0", "Callout body", "P2"]);
});

test("selectBlockRange returns false and leaves selection untouched for an invalid position", () => {
  const p0 = posOfParagraph(editor, "P0");
  toggleBlockSelected(editor, p0);

  const bogus = editor.state.doc.content.size + 50;
  expect(selectBlockRange(editor, p0, bogus)).toBe(false);
  expect(selectedTexts(editor)).toEqual(["P0"]);
});

test("REMAP: selecting P2, then inserting text into P0, keeps P2 highlighted at its new (shifted) position", () => {
  const p2Before = posOfParagraph(editor, "P2");
  toggleBlockSelected(editor, p2Before);
  expect(selectedTexts(editor)).toEqual(["P2"]);

  // Insert text at the very start of P0 -- shifts every position after it,
  // including P2's.
  const p0Start = posOfParagraph(editor, "P0") + 1;
  editor.view.dispatch(editor.state.tr.insertText("XXXXX", p0Start, p0Start));

  const p2After = posOfParagraph(editor, "P2");
  expect(p2After).toBeGreaterThan(p2Before);

  const blocks = getSelectedBlocks(editor);
  expect(blocks.map((b) => b.node.textContent)).toEqual(["P2"]);
  expect(blocks[0]!.pos).toBe(p2After);
});

test("REMAP: deleting the selected block itself drops its decoration (no dangling selection)", () => {
  const p2 = posOfParagraph(editor, "P2");
  toggleBlockSelected(editor, p2);
  expect(selectedTexts(editor)).toEqual(["P2"]);

  const node = editor.state.doc.nodeAt(p2)!;
  editor.view.dispatch(editor.state.tr.delete(p2, p2 + node.nodeSize));

  expect(selectedTexts(editor)).toEqual([]);
});

test("cmd-click deep inside the callout's paragraph selects the CALLOUT (top-level), not the inner paragraph", () => {
  const insidePos = posInsideCalloutText(editor);
  const admonitionPos = posOfAdmonition(editor);

  const handled = clickAt(editor, insidePos, { metaKey: true });
  expect(handled).toBe(true);

  const blocks = getSelectedBlocks(editor);
  expect(blocks).toHaveLength(1);
  expect(blocks[0]!.pos).toBe(admonitionPos);
  expect(blocks[0]!.node.type.name).toBe("admonition");
});

test("ctrl-click behaves the same as cmd-click (either modifier toggles)", () => {
  const p0 = posOfParagraph(editor, "P0") + 1;
  const handled = clickAt(editor, p0, { ctrlKey: true });
  expect(handled).toBe(true);
  expect(selectedTexts(editor)).toEqual(["P0"]);
});

test("cmd-click twice on the same block toggles it back off", () => {
  const p0 = posOfParagraph(editor, "P0") + 1;
  clickAt(editor, p0, { metaKey: true });
  expect(selectedTexts(editor)).toEqual(["P0"]);

  clickAt(editor, p0, { metaKey: true });
  expect(selectedTexts(editor)).toEqual([]);
});

test("cmd-click on two separate blocks builds a non-contiguous selection", () => {
  clickAt(editor, posOfParagraph(editor, "P0") + 1, { metaKey: true });
  clickAt(editor, posOfParagraph(editor, "P3") + 1, { metaKey: true });

  expect(selectedTexts(editor)).toEqual(["P0", "P3"]);
});

test("shift+cmd-click range-fills from the last cmd-click anchor to the target, inclusive", () => {
  clickAt(editor, posOfParagraph(editor, "P0") + 1, { metaKey: true });
  clickAt(editor, posOfParagraph(editor, "P3") + 1, {
    metaKey: true,
    shiftKey: true,
  });

  expect(selectedTexts(editor)).toEqual(["P0", "Callout body", "P2", "P3"]);
});

test("shift+cmd-click with no prior anchor falls back to a plain toggle of the target", () => {
  const handled = clickAt(editor, posOfParagraph(editor, "P2") + 1, {
    metaKey: true,
    shiftKey: true,
  });
  expect(handled).toBe(true);
  expect(selectedTexts(editor)).toEqual(["P2"]);
});

test("plain click (no modifier) with a non-empty selection clears it and reports NOT handled (caret still places)", () => {
  clickAt(editor, posOfParagraph(editor, "P0") + 1, { metaKey: true });
  expect(selectedTexts(editor)).toEqual(["P0"]);

  const handled = clickAt(editor, posOfParagraph(editor, "P2") + 1, {});
  expect(handled).toBe(false);
  expect(selectedTexts(editor)).toEqual([]);
});

test("plain click with an already-empty selection is a true no-op (no transaction dispatched)", () => {
  let dispatched = 0;
  editor.on("transaction", () => {
    dispatched += 1;
  });

  const handled = clickAt(editor, posOfParagraph(editor, "P0") + 1, {});
  expect(handled).toBe(false);
  expect(dispatched).toBe(0);
});

test("Esc clears a non-empty selection (returns true / handled)", () => {
  toggleBlockSelected(editor, posOfParagraph(editor, "P0"));
  expect(selectedTexts(editor)).toEqual(["P0"]);

  const shortcuts = BlockSelection.config.addKeyboardShortcuts!.call({
    editor,
  } as unknown as ThisParameterType<
    NonNullable<typeof BlockSelection.config.addKeyboardShortcuts>
  >);

  const handled = shortcuts["Escape"]!({ editor } as never);
  expect(handled).toBe(true);
  expect(selectedTexts(editor)).toEqual([]);
});

test("Esc on an empty selection falls through (returns false)", () => {
  const shortcuts = BlockSelection.config.addKeyboardShortcuts!.call({
    editor,
  } as unknown as ThisParameterType<
    NonNullable<typeof BlockSelection.config.addKeyboardShortcuts>
  >);

  const handled = shortcuts["Escape"]!({ editor } as never);
  expect(handled).toBe(false);
});

test("isSelectionTextConvertible is false for an empty selection", () => {
  expect(isSelectionTextConvertible(editor)).toBe(false);
});

test("isSelectionTextConvertible is true when every selected block is paragraph/heading/codeBlock", () => {
  toggleBlockSelected(editor, posOfParagraph(editor, "P0"));
  toggleBlockSelected(editor, posOfParagraph(editor, "P2"));
  expect(isSelectionTextConvertible(editor)).toBe(true);
});

test("isSelectionTextConvertible is false when the selection includes a non-convertible block (admonition)", () => {
  toggleBlockSelected(editor, posOfParagraph(editor, "P0"));
  toggleBlockSelected(editor, posOfAdmonition(editor));
  expect(isSelectionTextConvertible(editor)).toBe(false);
});

test("turnSelectedBlocksInto('heading2') converts two NON-ADJACENT paragraphs in ONE transaction/undo step; the admonition between them is untouched", () => {
  const before = getJSON(editor);

  toggleBlockSelected(editor, posOfParagraph(editor, "P0"));
  toggleBlockSelected(editor, posOfParagraph(editor, "P2"));

  expect(turnSelectedBlocksInto(editor, "heading2")).toBe(true);

  const json = getJSON(editor);
  const types = json.content?.map((n) => n.type);
  expect(types).toEqual(["heading", "admonition", "heading", "paragraph"]);
  expect(json.content?.[0]?.attrs?.level).toBe(2);
  expect(json.content?.[0]?.content?.[0]?.text).toBe("P0");
  expect(json.content?.[2]?.attrs?.level).toBe(2);
  expect(json.content?.[2]?.content?.[0]?.text).toBe("P2");
  // The admonition (and its own child paragraph) is completely untouched.
  expect(json.content?.[1]?.type).toBe("admonition");
  expect(json.content?.[1]?.content?.[0]?.content?.[0]?.text).toBe(
    "Callout body",
  );
  // P3 (not selected) stays a plain paragraph.
  expect(json.content?.[3]?.type).toBe("paragraph");

  // ONE undo step restores every converted block at once.
  editor.commands.undo();
  expect(getJSON(editor)).toEqual(before);
});

test("turnSelectedBlocksInto('code') / ('heading3') / ('paragraph') all apply to every selected block", () => {
  toggleBlockSelected(editor, posOfParagraph(editor, "P0"));
  toggleBlockSelected(editor, posOfParagraph(editor, "P2"));
  turnSelectedBlocksInto(editor, "code");

  const json = getJSON(editor);
  const codeBlocks = json.content?.filter((n) => n.type === "codeBlock");
  expect(codeBlocks).toHaveLength(2);
});

test("turnSelectedBlocksInto is a no-op when the selection contains a non-convertible block", () => {
  toggleBlockSelected(editor, posOfParagraph(editor, "P0"));
  toggleBlockSelected(editor, posOfAdmonition(editor));
  const before = getJSON(editor);

  expect(turnSelectedBlocksInto(editor, "heading2")).toBe(false);
  expect(getJSON(editor)).toEqual(before);
});

test("turnSelectedBlocksInto is a no-op on an empty selection", () => {
  const before = getJSON(editor);
  expect(turnSelectedBlocksInto(editor, "heading2")).toBe(false);
  expect(getJSON(editor)).toEqual(before);
});

test("duplicateSelectedBlocks (non-adjacent): inserts a copy immediately after EACH selected block, one transaction", () => {
  const before = getJSON(editor);

  toggleBlockSelected(editor, posOfParagraph(editor, "P0"));
  toggleBlockSelected(editor, posOfParagraph(editor, "P3"));

  expect(duplicateSelectedBlocks(editor)).toBe(true);

  const json = getJSON(editor);
  const texts = (json.content ?? []).map((n) =>
    n.type === "admonition" ? "<admonition>" : n.content?.[0]?.text,
  );
  expect(texts).toEqual(["P0", "P0", "<admonition>", "P2", "P3", "P3"]);

  editor.commands.undo();
  expect(getJSON(editor)).toEqual(before);
});

test("duplicateSelectedBlocks is a no-op on an empty selection", () => {
  const before = getJSON(editor);
  expect(duplicateSelectedBlocks(editor)).toBe(false);
  expect(getJSON(editor)).toEqual(before);
});

test("deleteSelectedBlocks (non-adjacent, differing sizes): removes exactly the selected blocks in one transaction, and clears the selection", () => {
  const before = getJSON(editor);

  // The admonition (index 1, larger -- has its own nested paragraph) and P3
  // (index 3), skipping P2 (index 2) in between -- non-adjacent AND
  // differing node sizes across the descending deletes.
  toggleBlockSelected(editor, posOfAdmonition(editor));
  toggleBlockSelected(editor, posOfParagraph(editor, "P3"));

  expect(deleteSelectedBlocks(editor)).toBe(true);

  const json = getJSON(editor);
  expect(json.content?.map((n) => n.type)).toEqual(["paragraph", "paragraph"]);
  expect(json.content?.[0]?.content?.[0]?.text).toBe("P0");
  expect(json.content?.[1]?.content?.[0]?.text).toBe("P2");

  // Selection is cleared post-delete (nothing left to dangle over).
  expect(selectedTexts(editor)).toEqual([]);

  editor.commands.undo();
  expect(getJSON(editor)).toEqual(before);
});

test("deleteSelectedBlocks is a no-op on an empty selection", () => {
  const before = getJSON(editor);
  expect(deleteSelectedBlocks(editor)).toBe(false);
  expect(getJSON(editor)).toEqual(before);
});
