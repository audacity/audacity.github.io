import { Extension, type Editor } from "@tiptap/core";
import type { Node as PMNode } from "@tiptap/pm/model";
import type { Transaction } from "@tiptap/pm/state";
import { NodeSelection, TextSelection } from "@tiptap/pm/state";

/**
 * Core move machinery shared by `moveBlock` (top-level, selection-based) and
 * `moveNodeAt` (any-depth, position-based). Moves the node occupying
 * `[nodeStart, nodeStart + node.nodeSize)` one slot up (`dir === -1`) or down
 * (`dir === 1`) among the SIBLING LIST given by `siblings` (a snapshot of the
 * moving node's parent's children plus each child's own `start` offset, all
 * computed in the ORIGINAL doc before any mutation) — swapping places with
 * the adjacent sibling at `siblingIndex + dir`.
 *
 * Same delete+insert+mapping approach `moveBlock` always used (see its own
 * doc comment below for the full reasoning — the walk that builds `siblings`
 * here is just that function's `doc.forEach` walk, generalized from "walk
 * `doc.content`" to "walk `parent.content`" so it works at any depth, not
 * just top-level). Returns `null` at either boundary of the sibling list (no
 * transaction produced — callers treat that as a no-op).
 */
interface SiblingEntry {
  start: number;
  end: number;
}

function findMoveTransaction(
  tr: Transaction,
  node: PMNode,
  nodeStart: number,
  siblings: SiblingEntry[],
  siblingIndex: number,
  dir: -1 | 1,
): { tr: Transaction; newNodeStart: number } | null {
  const targetIndex = siblingIndex + dir;
  if (targetIndex < 0 || targetIndex >= siblings.length) return null;
  const target = siblings[targetIndex]!;

  const nodeEnd = nodeStart + node.nodeSize;
  tr.delete(nodeStart, nodeEnd);

  const insertPosOriginal = dir === -1 ? target.start : target.end;
  const mappedInsertPos = tr.mapping.map(
    insertPosOriginal,
    dir === -1 ? -1 : 1,
  );
  tr.insert(mappedInsertPos, node);

  return { tr, newNodeStart: mappedInsertPos };
}

/**
 * `moveBlock` — moves the TOP-LEVEL block (direct child of `doc`) containing
 * the current selection one slot up (`dir === -1`) or down (`dir === 1`),
 * swapping places with the adjacent sibling. Whole subtrees move together
 * (an `admonition`'s children, a list's items, ...) since the unit of the
 * move is always a full `doc.content` child, never a node inside it.
 *
 * Position bookkeeping, in the ORIGINAL (pre-transaction) doc:
 * - `blockStart`/`blockEnd` bound the moving block (`$from.before(1)` /
 *   `$from.after(1)` — i.e. the same "depth-1 ancestor" ProseMirror already
 *   resolves for us, no manual sibling-walk needed for the block itself).
 * - the target sibling's `start`/`end` are found by walking `doc.forEach`
 *   once (cheap — this is a per-keystroke command, not a hot loop) and
 *   matching the sibling `blockIndex + dir` by its ordinal position, which
 *   also gives us the moving block's own index without a second resolve.
 *
 * The move itself is `tr.delete(blockStart, blockEnd)` then
 * `tr.insert(mappedTarget, node)`, where `mappedTarget` is computed in the
 * ORIGINAL doc as "insert right before the sibling" (moving up: the
 * sibling's own `start`) or "insert right after the sibling" (moving down:
 * the sibling's own `end`), then run through `tr.mapping.map(...)` to land
 * correctly in the POST-delete doc. Both of those original-doc positions
 * are provably outside the deleted range (the sibling never overlaps the
 * block being deleted), so the mapping is a plain offset adjustment with no
 * bias ambiguity — dir only matters for which end of the sibling we target,
 * not for how the position maps through the delete.
 *
 * Cursor restoration: the selection's offset relative to the start of the
 * moving block's content is captured before the transaction, then
 * re-applied at `newBlockStart + offset` (clamped to the block's own
 * content size) after the insert, so e.g. a cursor mid-word in a moved
 * paragraph stays mid-word rather than jumping to the block's start.
 * `NodeSelection`s of a whole top-level block are restored the same way
 * (re-select the moved node), since there's no "offset inside" to speak of.
 *
 * Deliberately kept top-level/selection-based even though `moveNodeAt` below
 * generalizes the same machinery to any depth: this is the Alt+Up/Down
 * KEYBOARD path (`BlockReorder`), where "reorder the page's own structure"
 * is the only thing a caret position can unambiguously mean — a cursor deep
 * inside a `tab`/`admonition` body doesn't tell you whether the user wants
 * to reorder within that container or hop the whole container itself. The
 * block-handle menu (`blockActions.ts`), by contrast, always has an explicit
 * `pos` the user physically pointed at (whatever the handle is hovering),
 * which is exactly what `moveNodeAt` needs and disambiguates for free — see
 * `getBlockActions`'s move-up/move-down there.
 */
export function moveBlock(editor: Editor, dir: -1 | 1): boolean {
  const { state } = editor;
  const { doc, selection } = state;
  const $from = selection.$from;

  let blockStart: number;
  let cursorOffset: number | null;

  if ($from.depth === 0) {
    // No block ancestor to resolve via before(1)/after(1) — only valid when
    // the selection is itself a NodeSelection of a top-level block (e.g. a
    // whole image/list selected via "select node"). Anything else (empty
    // doc edge cases) is a no-op.
    if (!(selection instanceof NodeSelection)) return false;
    blockStart = selection.from;
    cursorOffset = null;
  } else {
    blockStart = $from.before(1);
    cursorOffset = $from.pos - blockStart - 1;
  }

  const node = doc.nodeAt(blockStart);
  if (!node) return false;

  // Find this block's ordinal index among doc.content, and every sibling's
  // own start/end, in one walk over the top-level children.
  let blockIndex = -1;
  const siblings: SiblingEntry[] = [];
  doc.forEach((child, offset, index) => {
    siblings.push({ start: offset, end: offset + child.nodeSize });
    if (offset === blockStart) blockIndex = index;
  });
  if (blockIndex === -1) return false;

  const tr = state.tr;
  const result = findMoveTransaction(
    tr,
    node,
    blockStart,
    siblings,
    blockIndex,
    dir,
  );
  if (!result) return false;

  const newBlockStart = result.newNodeStart;
  if (cursorOffset === null) {
    tr.setSelection(NodeSelection.create(tr.doc, newBlockStart));
  } else {
    const contentSize = node.content.size;
    const clampedOffset = Math.max(0, Math.min(cursorOffset, contentSize));
    const pos = newBlockStart + 1 + clampedOffset;
    tr.setSelection(TextSelection.near(tr.doc.resolve(pos)));
  }

  editor.view.dispatch(tr);
  return true;
}

/**
 * `moveNodeAt` — moves the node AT `pos` one slot up (`dir === -1`) or down
 * (`dir === 1`) among its own SIBLINGS within its parent, at ANY depth (a
 * top-level block, a paragraph inside a `tab`, a paragraph inside an
 * `admonition`, ...). Generalizes `moveBlock`'s delete+insert+mapping
 * machinery (see that function's doc comment for the full mechanics) from
 * "siblings = `doc.content`" to "siblings = the resolved node's own
 * parent's content" — `state.doc.resolve(pos)` gives that parent for free
 * via `$pos.parent`/`$pos.before(depth)`, no special-casing for depth 0 vs
 * deeper needed beyond what `resolve` already does.
 *
 * Used by the block-handle context menu (`blockActions.ts`), where `pos`
 * always comes from the drag handle's own `onNodeChange` — including in
 * `nested` mode, where it can be a node at any depth (see `Editor.tsx`). Not
 * currently reachable via any keyboard shortcut (Alt+Up/Down stays wired to
 * `moveBlock` — see that function's doc comment for why the two are kept
 * deliberately separate rather than one subsuming the other).
 *
 * Boundary (first/last child of its parent) is a no-op (`false`), same as
 * `moveBlock`. Selection afterward: re-selects the moved node as a whole
 * (`NodeSelection`) rather than trying to restore a caret offset — every
 * current caller (the handle menu) triggers this from a menu click, not
 * from an active text cursor inside the node, so "the moved node is now
 * selected" is the more useful post-move state (mirrors `duplicateAction`'s
 * choice to select the new copy, in the same file).
 */
export function moveNodeAt(editor: Editor, pos: number, dir: -1 | 1): boolean {
  const { state } = editor;
  const { doc } = state;

  const node = doc.nodeAt(pos);
  if (!node) return false;

  const $pos = doc.resolve(pos);
  const parent = $pos.parent;
  const parentStart = $pos.start($pos.depth);

  let nodeIndex = -1;
  const siblings: SiblingEntry[] = [];
  parent.forEach((child, offset, index) => {
    const start = parentStart + offset;
    siblings.push({ start, end: start + child.nodeSize });
    if (start === pos) nodeIndex = index;
  });
  if (nodeIndex === -1) return false;

  const tr = state.tr;
  const result = findMoveTransaction(tr, node, pos, siblings, nodeIndex, dir);
  if (!result) return false;

  tr.setSelection(NodeSelection.create(tr.doc, result.newNodeStart));
  editor.view.dispatch(tr);
  return true;
}

/**
 * `BlockReorder` — Alt+ArrowUp/Down keyboard shortcuts wired to `moveBlock`.
 * Not included in `buildAppExtensions()` here (Task 2 wires it into the live
 * editor); tests add it to the extension list explicitly.
 */
export const BlockReorder = Extension.create({
  name: "blockReorder",

  addKeyboardShortcuts() {
    return {
      "Alt-ArrowUp": () => moveBlock(this.editor, -1),
      "Alt-ArrowDown": () => moveBlock(this.editor, 1),
    };
  },
});

export default BlockReorder;
