import { Extension, type Editor } from "@tiptap/core";
import { NodeSelection, TextSelection } from "@tiptap/pm/state";

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
  const blockEnd = blockStart + node.nodeSize;

  // Find this block's ordinal index among doc.content, and the target
  // sibling at index + dir, in one walk over the top-level children.
  let blockIndex = -1;
  let targetStart = -1;
  let targetEnd = -1;
  doc.forEach((child, offset, index) => {
    if (offset === blockStart) blockIndex = index;
  });
  if (blockIndex === -1) return false;
  const targetIndex = blockIndex + dir;
  if (targetIndex < 0 || targetIndex >= doc.childCount) return false;
  doc.forEach((child, offset, index) => {
    if (index === targetIndex) {
      targetStart = offset;
      targetEnd = offset + child.nodeSize;
    }
  });

  const tr = state.tr;
  tr.delete(blockStart, blockEnd);

  const insertPosOriginal = dir === -1 ? targetStart : targetEnd;
  const mappedInsertPos = tr.mapping.map(
    insertPosOriginal,
    dir === -1 ? -1 : 1,
  );
  tr.insert(mappedInsertPos, node);

  const newBlockStart = mappedInsertPos;
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
