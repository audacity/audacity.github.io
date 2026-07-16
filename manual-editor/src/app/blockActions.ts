import type { Editor } from "@tiptap/core";
import type { Node as PMNode } from "@tiptap/pm/model";
import { NodeSelection, TextSelection } from "@tiptap/pm/state";
import { moveBlock } from "./blockMove";
import {
  setCodeBlock,
  setHeading,
  setParagraph,
  toggleBulletList,
  toggleOrderedList,
} from "./insertCommands";

/**
 * A single row in the block-handle context menu (`HandleMenu.tsx`). `group`
 * controls both the menu's visual section (separators between groups) and
 * declaration order below is chosen to match the menu's rendered order:
 * transform, edit, move, danger (danger — currently just `delete` — is
 * styled red and always sits last, matching Notion's convention of putting
 * the destructive action furthest from the pointer's rest position).
 */
export interface BlockAction {
  id: string;
  label: string;
  group: "move" | "transform" | "edit" | "danger";
  run(editor: Editor): void;
}

/** Node type names whose content is plain flow (a paragraph's worth of text
 * at heart) and therefore eligible for the "Turn into ..." transform
 * actions below. `blockquote` is included even though there's no
 * "turn-blockquote" action (no such transform exists in `insertCommands`) —
 * it just means a blockquote's menu offers every transform unconditionally,
 * same as any other convertible block whose current shape isn't one of the
 * six offered targets. */
const TEXT_CONVERTIBLE_TYPES = new Set([
  "paragraph",
  "heading",
  "bulletList",
  "orderedList",
  "codeBlock",
  "blockquote",
]);

interface TransformDef {
  id: string;
  label: string;
  /** True when `node` is already this shape — that action is omitted (no
   * "turn into what it already is"). */
  matchesCurrent(node: PMNode): boolean;
  transform(editor: Editor): void;
}

/**
 * Declared in the menu's intended left-to-right/top-to-bottom reading order.
 * Each entry pairs a "turn into ..." menu row with the existing
 * `insertCommands` transform it delegates to, plus the predicate that
 * decides whether the current block already IS that shape (in which case
 * the row is omitted — see `getBlockActions` below).
 */
const TRANSFORM_DEFS: TransformDef[] = [
  {
    id: "turn-text",
    label: "Turn into text",
    matchesCurrent: (node) => node.type.name === "paragraph",
    transform: (editor) => setParagraph(editor),
  },
  {
    id: "turn-h2",
    label: "Turn into Heading 2",
    matchesCurrent: (node) =>
      node.type.name === "heading" && node.attrs.level === 2,
    transform: (editor) => setHeading(editor, 2),
  },
  {
    id: "turn-h3",
    label: "Turn into Heading 3",
    matchesCurrent: (node) =>
      node.type.name === "heading" && node.attrs.level === 3,
    transform: (editor) => setHeading(editor, 3),
  },
  {
    id: "turn-bullet",
    label: "Turn into bulleted list",
    matchesCurrent: (node) => node.type.name === "bulletList",
    transform: (editor) => toggleBulletList(editor),
  },
  {
    id: "turn-numbered",
    label: "Turn into numbered list",
    matchesCurrent: (node) => node.type.name === "orderedList",
    transform: (editor) => toggleOrderedList(editor),
  },
  {
    id: "turn-code",
    label: "Turn into code block",
    matchesCurrent: (node) => node.type.name === "codeBlock",
    transform: (editor) => setCodeBlock(editor),
  },
];

/**
 * Places a `TextSelection` just inside the block at `pos` (`pos + 1`,
 * resolved and snapped to the nearest valid text position via
 * `TextSelection.near` — safe even for a container block like `blockquote`
 * whose first child, not the block itself, holds the caret) before running
 * `transform` against the live editor. Mirrors how a user would place their
 * cursor in the block manually before using the old floating toolbar's
 * equivalent buttons.
 */
function transformAction(
  pos: number,
  transform: (editor: Editor) => void,
): (editor: Editor) => void {
  return (editor) => {
    const { state } = editor;
    const clamped = Math.max(0, Math.min(pos + 1, state.doc.content.size));
    const tr = state.tr.setSelection(
      TextSelection.near(state.doc.resolve(clamped)),
    );
    editor.view.dispatch(tr);
    transform(editor);
  };
}

/** Selects the block at `pos` as a whole-node selection, then delegates the
 * actual reordering to `moveBlock` (a no-op at the doc's top/bottom edge). */
function moveAction(pos: number, dir: -1 | 1): (editor: Editor) => void {
  return (editor) => {
    editor.commands.setNodeSelection(pos);
    moveBlock(editor, dir);
  };
}

/** Inserts a straight copy of `node` immediately after itself in a single
 * transaction, then selects the new copy (the more useful of the two
 * plausible post-duplicate selections — it's the block the user is now
 * looking at having just created). */
function duplicateAction(node: PMNode, pos: number): (editor: Editor) => void {
  return (editor) => {
    const { state } = editor;
    const insertPos = pos + node.nodeSize;
    const tr = state.tr.insert(insertPos, node);
    tr.setSelection(NodeSelection.create(tr.doc, insertPos));
    editor.view.dispatch(tr);
  };
}

/** Deletes the block outright, in one transaction. */
function deleteAction(node: PMNode, pos: number): (editor: Editor) => void {
  return (editor) => {
    editor.view.dispatch(editor.state.tr.delete(pos, pos + node.nodeSize));
  };
}

/**
 * Builds the action list for the block-handle context menu, given the
 * currently-hovered top-level block (`node`) and its document position
 * (`pos`) — both as reported by `@tiptap/extension-drag-handle-react`'s
 * `onNodeChange` callback (see `Editor.tsx`).
 *
 * Every top-level block gets `duplicate`/`move-up`/`move-down`/`delete`.
 * Text-convertible blocks (paragraph, heading, list, code block, blockquote)
 * additionally get the "turn into ..." transforms that don't match their
 * current shape. `image` additionally gets `edit-alt`. Everything else
 * (admonition/tabs/preserved/shortcut) gets only the common four — their own
 * editing lives in their node views, not this menu.
 *
 * `editor` itself isn't read here (each action's own `run` closes over
 * `node`/`pos` and receives the live editor when it actually executes) but
 * is kept in the signature since the actions this returns are themselves
 * decided by the currently mounted editor's schema/state in the general
 * case, and every call site already has it at hand.
 */
export function getBlockActions(
  _editor: Editor,
  node: PMNode,
  pos: number,
): BlockAction[] {
  const actions: BlockAction[] = [];

  if (TEXT_CONVERTIBLE_TYPES.has(node.type.name)) {
    for (const def of TRANSFORM_DEFS) {
      if (def.matchesCurrent(node)) continue;
      actions.push({
        id: def.id,
        label: def.label,
        group: "transform",
        run: transformAction(pos, def.transform),
      });
    }
  }

  if (node.type.name === "image") {
    actions.push({
      id: "edit-alt",
      label: "Edit alt text",
      group: "edit",
      run: (liveEditor) => {
        const currentAlt =
          typeof node.attrs.alt === "string" ? node.attrs.alt : "";
        const value = window.prompt("Image description (alt text)", currentAlt);
        if (value === null) return;
        const tr = liveEditor.state.tr.setNodeMarkup(pos, undefined, {
          ...node.attrs,
          alt: value.trim(),
        });
        liveEditor.view.dispatch(tr);
      },
    });
  }

  actions.push({
    id: "duplicate",
    label: "Duplicate",
    group: "edit",
    run: duplicateAction(node, pos),
  });

  actions.push({
    id: "move-up",
    label: "Move up",
    group: "move",
    run: moveAction(pos, -1),
  });
  actions.push({
    id: "move-down",
    label: "Move down",
    group: "move",
    run: moveAction(pos, 1),
  });

  actions.push({
    id: "delete",
    label: "Delete",
    group: "danger",
    run: deleteAction(node, pos),
  });

  return actions;
}
