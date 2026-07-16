/**
 * Headless coverage for `TabEnterGuard` (`./tabKeymap.ts`): invokes its
 * `addKeyboardShortcuts()` "Enter" handler directly against a real TipTap
 * `Editor` built from `buildAppExtensions()` — same "detached `<div>`, no
 * React render" construction `blockActions.test.tsx` uses, and the same
 * "call the extension's shortcut handler directly rather than simulate a
 * raw keystroke" fallback `blockMove.test.tsx`'s Alt-ArrowUp test documents
 * (headless keyboard-event simulation is unreliable in this environment).
 */
import { expect, test } from "bun:test";
import { Editor } from "@tiptap/core";
import { TextSelection } from "@tiptap/pm/state";
import { buildAppExtensions } from "./editorExtensions";
import { TabEnterGuard } from "./tabKeymap";
import type { PMNodeJSON } from "../adapter/mdastToDoc";

/** Doc: [tabs(tab["Windows": paragraph "hi"], tab["macOS": empty paragraph]), paragraph "outside"] */
const initialDoc = {
  type: "doc",
  content: [
    {
      type: "tabs",
      content: [
        {
          type: "tab",
          attrs: { label: "Windows" },
          content: [
            { type: "paragraph", content: [{ type: "text", text: "hi" }] },
          ],
        },
        {
          type: "tab",
          attrs: { label: "macOS" },
          content: [{ type: "paragraph" }],
        },
      ],
    },
    { type: "paragraph", content: [{ type: "text", text: "outside" }] },
  ],
};

function makeEditor(): Editor {
  return new Editor({
    element: document.createElement("div"),
    extensions: buildAppExtensions(),
    content: initialDoc,
  });
}

function getJSON(editor: Editor): PMNodeJSON {
  return editor.getJSON() as unknown as PMNodeJSON;
}

/** Invokes the guard's own "Enter" handler directly, same pattern
 * `blockMove.test.tsx` uses for `BlockReorder`'s "Alt-ArrowUp". */
function pressEnter(editor: Editor): boolean {
  const shortcuts = TabEnterGuard.config.addKeyboardShortcuts!.call({
    editor,
  } as unknown as ThisParameterType<
    NonNullable<typeof TabEnterGuard.config.addKeyboardShortcuts>
  >);
  return shortcuts["Enter"]!({ editor } as never);
}

function tabsChild(json: PMNodeJSON) {
  return json.content!.find((n) => n.type === "tabs")!;
}

test("cursor at end of empty paragraph inside a tab: guard swallows Enter, tab count and content unchanged", () => {
  const editor = makeEditor();

  // Second tab's paragraph is empty (content: [{type:"paragraph"}]) — place
  // the cursor inside it.
  let emptyParaPos: number | null = null;
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === "paragraph" && node.content.size === 0) {
      emptyParaPos = pos + 1;
      return false;
    }
    return true;
  });
  if (emptyParaPos === null) throw new Error("empty paragraph not found");
  editor.view.dispatch(
    editor.state.tr.setSelection(
      TextSelection.near(editor.state.doc.resolve(emptyParaPos)),
    ),
  );

  const before = getJSON(editor);
  const handled = pressEnter(editor);
  expect(handled).toBe(true);

  const after = getJSON(editor);
  expect(after).toEqual(before);
  expect(tabsChild(after).content).toHaveLength(2);
  // No new `tab` node materialized anywhere in the doc.
  let tabCount = 0;
  editor.state.doc.descendants((node) => {
    if (node.type.name === "tab") tabCount += 1;
  });
  expect(tabCount).toBe(2);
});

test("Enter in a non-empty paragraph inside a tab: default splitBlock still runs, tab count unchanged", () => {
  const editor = makeEditor();

  // "hi" paragraph in the first tab — put the cursor mid-text (non-empty
  // textblock), which the guard must NOT swallow.
  let pos: number | null = null;
  editor.state.doc.descendants((node, offset) => {
    if (node.isText && node.text === "hi") {
      pos = offset + 1;
      return false;
    }
    return true;
  });
  if (pos === null) throw new Error("text not found");
  editor.view.dispatch(
    editor.state.tr.setSelection(
      TextSelection.near(editor.state.doc.resolve(pos)),
    ),
  );

  const handled = pressEnter(editor);
  expect(handled).toBe(false);

  // Falling through to the real "Enter" command chain (not exercised by
  // this direct-call test, since only the guard's own handler runs here) —
  // confirm the guard itself made no doc changes and correctly declined.
  let tabCount = 0;
  editor.state.doc.descendants((node) => {
    if (node.type.name === "tab") tabCount += 1;
  });
  expect(tabCount).toBe(2);

  // Exercise the real command chain end-to-end via `editor.commands` (same
  // default Enter path TipTap's core `Keymap` extension wires up) to confirm
  // a non-empty paragraph inside a tab splits normally and stays inside the
  // same tab.
  editor.commands.first(({ commands }) => [
    () => commands.newlineInCode(),
    () => commands.createParagraphNear(),
    () => commands.liftEmptyBlock(),
    () => commands.splitBlock(),
  ]);
  const json = getJSON(editor);
  expect(tabsChild(json).content).toHaveLength(2);
  const firstTab = tabsChild(json).content![0]!;
  expect(firstTab.type).toBe("tab");
  expect(firstTab.content?.length).toBeGreaterThanOrEqual(2);
});

test("Enter outside any tab is unaffected (guard returns false)", () => {
  const editor = makeEditor();

  let pos: number | null = null;
  editor.state.doc.descendants((node, offset) => {
    if (node.isText && node.text === "outside") {
      pos = offset + 1;
      return false;
    }
    return true;
  });
  if (pos === null) throw new Error("text not found");
  editor.view.dispatch(
    editor.state.tr.setSelection(
      TextSelection.near(editor.state.doc.resolve(pos)),
    ),
  );

  expect(pressEnter(editor)).toBe(false);
});

test("Enter at the end of an empty top-level paragraph (no tab ancestor) is unaffected", () => {
  const editor = new Editor({
    element: document.createElement("div"),
    extensions: buildAppExtensions(),
    content: { type: "doc", content: [{ type: "paragraph" }] },
  });

  editor.commands.setTextSelection(1);
  expect(pressEnter(editor)).toBe(false);
});
