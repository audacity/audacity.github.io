/**
 * Headless coverage for `blockActions.ts`'s `getBlockActions`: a real TipTap
 * `Editor` (same "detached `<div>`, no React render" construction
 * `imageUpload.test.tsx` uses — this exercises the pure action-list/run
 * logic directly, not `Editor.tsx`'s click wiring, which is covered by
 * `editor-mount.test.tsx`-style browser verification per the task brief)
 * over a fixed doc: [paragraph, heading2, image, admonition(Callout)].
 */
import { afterEach, beforeEach, expect, test } from "bun:test";
import { Editor } from "@tiptap/core";
import type { Node as PMNode } from "@tiptap/pm/model";
import { buildAppExtensions } from "./editorExtensions";
import { getBlockActions, type BlockAction } from "./blockActions";
import type { PMNodeJSON } from "../adapter/mdastToDoc";

const initialDoc = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [{ type: "text", text: "Para text" }],
    },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Heading text" }],
    },
    {
      type: "image",
      attrs: { src: "foo.png", alt: "original alt", title: null },
    },
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

/** Finds a TOP-LEVEL block's `{node, pos}` by predicate — same "walk
 * `doc.forEach` once" approach `blockMove.ts`'s own `moveBlock` uses. */
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

function actionIds(actions: BlockAction[]): string[] {
  return actions.map((a) => a.id);
}

/**
 * StarterKit v3 bundles `TrailingNode`, which appends an empty paragraph
 * whenever the doc's last top-level child isn't already a paragraph — that
 * fires here after ANY dispatched transaction against `initialDoc` (whose
 * last child is `admonition`), independent of what the transaction under
 * test actually changed (see `blockMove.test.tsx`'s identical note). These
 * two helpers find a block by type/content rather than asserting on
 * `json.content`'s exact length, so "delete"/"move" assertions describe the
 * action itself and stay agnostic to whether TrailingNode also appended its
 * own housekeeping paragraph after the original four blocks.
 */
function indexOfType(json: PMNodeJSON, type: string): number {
  return (json.content ?? []).findIndex((n) => n.type === type);
}
function indexOfParagraphText(json: PMNodeJSON, text: string): number {
  return (json.content ?? []).findIndex(
    (n) => n.type === "paragraph" && n.content?.[0]?.text === text,
  );
}

function findAction(actions: BlockAction[], id: string): BlockAction {
  const action = actions.find((a) => a.id === id);
  if (!action) throw new Error(`action not found: ${id}`);
  return action;
}

let originalPrompt: typeof window.prompt;

beforeEach(() => {
  originalPrompt = window.prompt;
});

afterEach(() => {
  window.prompt = originalPrompt;
});

test("paragraph: every transform except turn-text, plus the four common actions", () => {
  const editor = makeEditor();
  const { node, pos } = findTopLevelBlock(
    editor,
    (n) => n.type.name === "paragraph",
  );
  const actions = getBlockActions(editor, node, pos);
  const ids = actionIds(actions);

  expect(ids).toContain("turn-h2");
  expect(ids).toContain("turn-h3");
  expect(ids).toContain("turn-bullet");
  expect(ids).toContain("turn-numbered");
  expect(ids).toContain("turn-code");
  expect(ids).not.toContain("turn-text");

  expect(ids).not.toContain("edit-alt");

  expect(ids).toContain("duplicate");
  expect(ids).toContain("move-up");
  expect(ids).toContain("move-down");
  expect(ids).toContain("delete");

  expect(actions.find((a) => a.id === "delete")?.group).toBe("danger");
});

test("heading level 2: every transform except turn-h2, keeps turn-h3", () => {
  const editor = makeEditor();
  const { node, pos } = findTopLevelBlock(
    editor,
    (n) => n.type.name === "heading",
  );
  const ids = actionIds(getBlockActions(editor, node, pos));

  expect(ids).toContain("turn-text");
  expect(ids).toContain("turn-h3");
  expect(ids).toContain("turn-bullet");
  expect(ids).toContain("turn-numbered");
  expect(ids).toContain("turn-code");
  expect(ids).not.toContain("turn-h2");
});

test("image: edit-alt plus the four common actions, no transform rows", () => {
  const editor = makeEditor();
  const { node, pos } = findTopLevelBlock(
    editor,
    (n) => n.type.name === "image",
  );
  const actions = getBlockActions(editor, node, pos);
  const ids = actionIds(actions);

  expect(ids).toContain("edit-alt");
  expect(actions.find((a) => a.id === "edit-alt")?.group).toBe("edit");
  expect(ids).toContain("duplicate");
  expect(ids).toContain("move-up");
  expect(ids).toContain("move-down");
  expect(ids).toContain("delete");

  for (const id of [
    "turn-text",
    "turn-h2",
    "turn-h3",
    "turn-bullet",
    "turn-numbered",
    "turn-code",
  ]) {
    expect(ids).not.toContain(id);
  }
});

test("admonition (callout): only the four common actions — no transform, no edit-alt", () => {
  const editor = makeEditor();
  const { node, pos } = findTopLevelBlock(
    editor,
    (n) => n.type.name === "admonition",
  );
  const ids = actionIds(getBlockActions(editor, node, pos));

  expect(ids).toEqual(
    expect.arrayContaining(["duplicate", "move-up", "move-down", "delete"]),
  );
  expect(ids).toHaveLength(4);
});

test("duplicate inserts an identical sibling (JSON equal) directly after the original", () => {
  const editor = makeEditor();
  const { node, pos } = findTopLevelBlock(
    editor,
    (n) => n.type.name === "paragraph",
  );
  const actions = getBlockActions(editor, node, pos);
  findAction(actions, "duplicate").run(editor);

  const json = getJSON(editor);
  expect(json.content?.[0]?.type).toBe("paragraph");
  expect(json.content?.[1]?.type).toBe("paragraph");
  expect(json.content?.[0]).toEqual(json.content?.[1]);
  // Every other original block is still present, shifted down by one.
  expect(json.content?.[2]?.type).toBe("heading");
  expect(json.content?.[3]?.type).toBe("image");
  expect(json.content?.[4]?.type).toBe("admonition");
});

test("delete removes exactly that block", () => {
  const editor = makeEditor();
  const { node, pos } = findTopLevelBlock(
    editor,
    (n) => n.type.name === "heading",
  );
  const actions = getBlockActions(editor, node, pos);
  findAction(actions, "delete").run(editor);

  const json = getJSON(editor);
  expect(json.content?.some((n) => n.type === "heading")).toBe(false);
  expect(indexOfParagraphText(json, "Para text")).toBe(0);
  expect(indexOfType(json, "image")).toBe(1);
  expect(indexOfType(json, "admonition")).toBe(2);
});

test("move-down on the paragraph swaps it with the heading; move-up swaps it back", () => {
  const editor = makeEditor();
  const paraBlock = findTopLevelBlock(
    editor,
    (n) => n.type.name === "paragraph",
  );
  findAction(
    getBlockActions(editor, paraBlock.node, paraBlock.pos),
    "move-down",
  ).run(editor);

  let json = getJSON(editor);
  expect(indexOfType(json, "heading")).toBe(0);
  expect(indexOfParagraphText(json, "Para text")).toBe(1);
  expect(indexOfType(json, "image")).toBe(2);
  expect(indexOfType(json, "admonition")).toBe(3);

  const movedParaBlock = findTopLevelBlock(
    editor,
    (n) => n.type.name === "paragraph" && n.textContent === "Para text",
  );
  findAction(
    getBlockActions(editor, movedParaBlock.node, movedParaBlock.pos),
    "move-up",
  ).run(editor);

  json = getJSON(editor);
  expect(indexOfParagraphText(json, "Para text")).toBe(0);
  expect(indexOfType(json, "heading")).toBe(1);
  expect(indexOfType(json, "image")).toBe(2);
  expect(indexOfType(json, "admonition")).toBe(3);
});

test("turn-h2 on a paragraph converts it to a level-2 heading, text preserved", () => {
  const editor = makeEditor();
  const { node, pos } = findTopLevelBlock(
    editor,
    (n) => n.type.name === "paragraph",
  );
  findAction(getBlockActions(editor, node, pos), "turn-h2").run(editor);

  const json = getJSON(editor);
  expect(json.content?.[0]?.type).toBe("heading");
  expect(json.content?.[0]?.attrs?.level).toBe(2);
  expect(json.content?.[0]?.content?.[0]?.text).toBe("Para text");
});

test("edit-alt with a mocked prompt updates attrs.alt", () => {
  window.prompt = (() => "a screenshot of the mixer") as typeof window.prompt;

  const editor = makeEditor();
  const { node, pos } = findTopLevelBlock(
    editor,
    (n) => n.type.name === "image",
  );
  findAction(getBlockActions(editor, node, pos), "edit-alt").run(editor);

  const json = getJSON(editor);
  const image = json.content?.find((n) => n.type === "image");
  expect(image?.attrs?.alt).toBe("a screenshot of the mixer");
});

test("edit-alt with a null prompt (cancel) leaves attrs.alt unchanged", () => {
  window.prompt = (() => null) as typeof window.prompt;

  const editor = makeEditor();
  const { node, pos } = findTopLevelBlock(
    editor,
    (n) => n.type.name === "image",
  );
  findAction(getBlockActions(editor, node, pos), "edit-alt").run(editor);

  const json = getJSON(editor);
  const image = json.content?.find((n) => n.type === "image");
  expect(image?.attrs?.alt).toBe("original alt");
});

/**
 * Nested-pos coverage: `getBlockActions`/its actions must work identically
 * for a block INSIDE a `tab`/`admonition` body, not just a top-level doc
 * child — this is what the drag handle's `nested` mode (`Editor.tsx`) now
 * hands them (a `pos` at any depth). Doc: [paragraph, tabs(tab["Only tab":
 * paragraph "one", paragraph "two", heading "Three"])].
 */
const nestedDoc = {
  type: "doc",
  content: [
    { type: "paragraph", content: [{ type: "text", text: "top" }] },
    {
      type: "tabs",
      content: [
        {
          type: "tab",
          attrs: { label: "Only tab" },
          content: [
            { type: "paragraph", content: [{ type: "text", text: "one" }] },
            { type: "paragraph", content: [{ type: "text", text: "two" }] },
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Three" }],
            },
          ],
        },
      ],
    },
  ],
};

/** Finds a node ANYWHERE in the doc (any depth) by predicate, mirroring what
 * the drag handle's `nested` mode hands `getBlockActions` — unlike
 * `findTopLevelBlock` above, which only walks `doc.content`. */
function findNodeAt(
  editor: Editor,
  predicate: (node: PMNode) => boolean,
): { node: PMNode; pos: number } {
  let result: { node: PMNode; pos: number } | null = null;
  editor.state.doc.descendants((node, pos) => {
    if (!result && predicate(node)) {
      result = { node, pos };
      return false;
    }
    return true;
  });
  if (!result) throw new Error("node not found");
  return result;
}

function tabOf(json: PMNodeJSON) {
  const tabsNode = json.content?.find((n) => n.type === "tabs");
  return tabsNode?.content?.[0];
}

test("getBlockActions on a nested paragraph pos (inside a tab) returns move/duplicate/delete/turn-into", () => {
  const editor = makeEditor(nestedDoc);
  const { node, pos } = findNodeAt(
    editor,
    (n) => n.type.name === "paragraph" && n.textContent === "one",
  );
  const ids = actionIds(getBlockActions(editor, node, pos));

  expect(ids).toContain("turn-h2");
  expect(ids).toContain("duplicate");
  expect(ids).toContain("move-up");
  expect(ids).toContain("move-down");
  expect(ids).toContain("delete");
});

test("duplicate on a nested paragraph pos inserts the copy INSIDE the same tab, top-level doc shape untouched", () => {
  const editor = makeEditor(nestedDoc);
  const { node, pos } = findNodeAt(
    editor,
    (n) => n.type.name === "paragraph" && n.textContent === "one",
  );
  findAction(getBlockActions(editor, node, pos), "duplicate").run(editor);

  const json = getJSON(editor);
  expect(json.content?.[0]?.type).toBe("paragraph");
  expect(json.content?.[1]?.type).toBe("tabs");
  const tab = tabOf(json);
  expect(tab?.content?.map((n) => n.content?.[0]?.text ?? n.type)).toEqual([
    "one",
    "one",
    "two",
    "Three",
  ]);
});

test("delete on a nested paragraph pos removes only that paragraph, from within the tab", () => {
  const editor = makeEditor(nestedDoc);
  const { node, pos } = findNodeAt(
    editor,
    (n) => n.type.name === "paragraph" && n.textContent === "two",
  );
  findAction(getBlockActions(editor, node, pos), "delete").run(editor);

  const json = getJSON(editor);
  expect(json.content?.[0]?.type).toBe("paragraph");
  expect(json.content?.[1]?.type).toBe("tabs");
  const tab = tabOf(json);
  expect(tab?.content?.map((n) => n.content?.[0]?.text ?? n.type)).toEqual([
    "one",
    "Three",
  ]);
});

test("move-down/move-up on a nested paragraph pos reorders WITHIN the tab, nothing escapes it", () => {
  const editor = makeEditor(nestedDoc);
  const oneBlock = findNodeAt(
    editor,
    (n) => n.type.name === "paragraph" && n.textContent === "one",
  );
  findAction(
    getBlockActions(editor, oneBlock.node, oneBlock.pos),
    "move-down",
  ).run(editor);

  let json = getJSON(editor);
  expect(json.content?.[0]?.type).toBe("paragraph");
  expect(json.content?.[1]?.type).toBe("tabs");
  let tab = tabOf(json);
  expect(tab?.content?.map((n) => n.content?.[0]?.text ?? n.type)).toEqual([
    "two",
    "one",
    "Three",
  ]);

  const movedOneBlock = findNodeAt(
    editor,
    (n) => n.type.name === "paragraph" && n.textContent === "one",
  );
  findAction(
    getBlockActions(editor, movedOneBlock.node, movedOneBlock.pos),
    "move-up",
  ).run(editor);

  json = getJSON(editor);
  tab = tabOf(json);
  expect(tab?.content?.map((n) => n.content?.[0]?.text ?? n.type)).toEqual([
    "one",
    "two",
    "Three",
  ]);
});

test("turn-h2 on a nested paragraph (inside a tab) converts it to a heading, still inside the tab", () => {
  const editor = makeEditor(nestedDoc);
  const { node, pos } = findNodeAt(
    editor,
    (n) => n.type.name === "paragraph" && n.textContent === "two",
  );
  findAction(getBlockActions(editor, node, pos), "turn-h2").run(editor);

  const json = getJSON(editor);
  expect(json.content?.[0]?.type).toBe("paragraph");
  expect(json.content?.[1]?.type).toBe("tabs");
  const tab = tabOf(json);
  const converted = tab?.content?.find((n) => n.content?.[0]?.text === "two");
  expect(converted?.type).toBe("heading");
  expect(converted?.attrs?.level).toBe(2);
});
