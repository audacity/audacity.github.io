import { Extension, type Editor } from "@tiptap/core";
import type { Node as PMNode } from "@tiptap/pm/model";
import { Plugin, PluginKey, type Transaction } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

/**
 * Notion-style multi-block selection: Cmd/Ctrl+Click toggles a top-level
 * block in/out of a working set (contiguous OR non-contiguous), Shift+
 * Cmd/Ctrl+Click fills a contiguous range from the last-toggled anchor, and
 * a floating bar (`SelectionBar.tsx`) offers batch turn-into/duplicate/
 * delete against the whole set. Everything here is a single plugin-only
 * `Extension` (no schema footprint — safe to append to `buildAppExtensions()`
 * without touching `editorExtensions.test.ts`'s parity assertion), storing
 * its selection as a ProseMirror `DecorationSet` rather than react state:
 * `DecorationSet.map(tr.mapping, tr.doc)` gives position-remapping under
 * arbitrary edits for free (type a character before a selected block and
 * the block stays highlighted, its `pos` shifted), and `.find()` naturally
 * expresses "read back the currently selected nodes."
 */

/** Plugin state: which top-level blocks are selected (as node decorations,
 * one per selected block, class `block-multiselected`) plus the position of
 * the last block a plain (non-shift) toggle landed on — the anchor a
 * subsequent Shift+Cmd/Ctrl+Click range-fills from. `lastAnchorPos` is
 * intentionally NOT touched by a range fill itself (see `apply` below):
 * repeated Shift+clicks re-fill from the same anchor, matching the familiar
 * "click one, shift-click far away" list-selection idiom rather than
 * anchoring to wherever the previous shift-click landed. */
export interface BlockSelectionState {
  decorations: DecorationSet;
  lastAnchorPos: number | null;
}

type BlockSelectionMeta =
  | { type: "toggle"; pos: number }
  | { type: "range"; from: number; to: number }
  | { type: "clear" };

export const blockSelectionPluginKey = new PluginKey<BlockSelectionState>(
  "blockSelection",
);

const SELECTED_DECORATION_ATTRS = { class: "block-multiselected" };

/** One entry per top-level `doc` child, in document order — the unit both
 * `toggle` and `range` selection operate over. Walking `doc.forEach` fresh
 * per call is cheap (this only runs on click/keyboard events, never per
 * keystroke) and avoids caching a snapshot that could drift from `tr.doc`. */
function topLevelBlocks(doc: PMNode): Array<{ pos: number; node: PMNode }> {
  const blocks: Array<{ pos: number; node: PMNode }> = [];
  doc.forEach((node, offset) => {
    blocks.push({ pos: offset, node });
  });
  return blocks;
}

/**
 * `Node.nodeAt`/`Node.resolve` both throw a `RangeError` for a position
 * outside `[0, doc.content.size]` rather than returning a falsy "not
 * found" — fine for positions this module derives itself (always in-range
 * by construction), but every helper below also accepts positions from
 * OUTSIDE callers (`toggleBlockSelected`'s `pos` argument, `meta.pos` off a
 * dispatched transaction, a stale `lastAnchorPos` after an edit shrinks the
 * doc), where "out of range" is a normal, expected input to reject
 * gracefully rather than crash on. This bounds-checks first so every other
 * function in this module can treat `nodeAt` as "returns `null` for a bad
 * position," full stop.
 */
function boundedNodeAt(doc: PMNode, pos: number): PMNode | null {
  if (pos < 0 || pos > doc.content.size) return null;
  return doc.nodeAt(pos);
}

/** Builds a decoration for a single top-level block at `pos`. */
function decorationFor(doc: PMNode, pos: number): Decoration | null {
  const node = boundedNodeAt(doc, pos);
  if (!node) return null;
  return Decoration.node(pos, pos + node.nodeSize, SELECTED_DECORATION_ATTRS);
}

/**
 * Resolves the TOP-LEVEL ancestor block start position containing `pos`
 * (`$pos.before(1)`), the same "depth-1 ancestor" ProseMirror already
 * resolves — a click deep inside a callout's paragraph or a tab's content
 * both resolve to the callout/tabs node itself, never the inner block. When
 * `pos` already sits at depth 0 (the click landed exactly on a top-level
 * atom, e.g. an `image`), `$pos.before(1)` isn't valid (there's no depth-1
 * ancestor to resolve) — `nodePos` (the position `handleClickOn` already
 * reports for the node it hit) is used instead, since in that case the hit
 * node already IS the top-level block.
 */
function resolveTopLevelPos(
  doc: PMNode,
  pos: number,
  nodePos: number,
): number | null {
  if (pos < 0 || pos > doc.content.size) return null;
  const $pos = doc.resolve(pos);
  if ($pos.depth === 0) {
    return boundedNodeAt(doc, nodePos) ? nodePos : null;
  }
  const before = $pos.before(1);
  return boundedNodeAt(doc, before) ? before : null;
}

/** Reduces `prev`/`tr`'s meta into the next plugin state. Exported for
 * direct unit testing (below the extension itself) as well as being wired
 * as the plugin's own `apply`. */
export function applyBlockSelection(
  tr: Transaction,
  prev: BlockSelectionState,
): BlockSelectionState {
  let decorations = prev.decorations.map(tr.mapping, tr.doc);
  let lastAnchorPos =
    prev.lastAnchorPos === null ? null : tr.mapping.map(prev.lastAnchorPos);
  if (lastAnchorPos !== null && !boundedNodeAt(tr.doc, lastAnchorPos)) {
    lastAnchorPos = null;
  }

  // Defensive re-validation on top of DecorationSet's own mapping: a node
  // decoration whose block was deleted is already dropped by `.map()`
  // itself, but a block that shrank/merged in a way that leaves a
  // same-sized-but-different range is re-checked here so a stale
  // decoration never lingers over content it no longer bounds exactly.
  if (tr.docChanged) {
    const stillValid: Decoration[] = [];
    for (const deco of decorations.find()) {
      const node = boundedNodeAt(tr.doc, deco.from);
      if (node && deco.to === deco.from + node.nodeSize) {
        stillValid.push(deco);
      }
    }
    decorations = DecorationSet.create(tr.doc, stillValid);
  }

  const meta = tr.getMeta(blockSelectionPluginKey) as
    | BlockSelectionMeta
    | undefined;
  if (!meta) {
    return { decorations, lastAnchorPos };
  }

  if (meta.type === "clear") {
    return { decorations: DecorationSet.empty, lastAnchorPos: null };
  }

  if (meta.type === "toggle") {
    const node = boundedNodeAt(tr.doc, meta.pos);
    if (!node) return { decorations, lastAnchorPos };
    const existing = decorations
      .find(meta.pos, meta.pos + node.nodeSize)
      .filter((deco) => deco.from === meta.pos);
    decorations =
      existing.length > 0
        ? decorations.remove(existing)
        : decorations.add(tr.doc, [decorationFor(tr.doc, meta.pos)!]);
    return { decorations, lastAnchorPos: meta.pos };
  }

  // meta.type === "range": contiguous fill between the anchor and target
  // top-level block, inclusive of both — REPLACES the current selection
  // (the familiar shift-click list-selection idiom), rather than adding a
  // second disjoint range on top of whatever was already selected.
  // `lastAnchorPos` deliberately stays as it was — see this module's
  // `BlockSelectionState` doc comment.
  const blocks = topLevelBlocks(tr.doc);
  const fromIndex = blocks.findIndex((b) => b.pos === meta.from);
  const toIndex = blocks.findIndex((b) => b.pos === meta.to);
  if (fromIndex === -1 || toIndex === -1) {
    return { decorations, lastAnchorPos };
  }
  const [lo, hi] =
    fromIndex <= toIndex ? [fromIndex, toIndex] : [toIndex, fromIndex];
  const rangeDecorations = blocks
    .slice(lo, hi + 1)
    .map(({ pos }) => decorationFor(tr.doc, pos)!);
  return {
    decorations: DecorationSet.create(tr.doc, rangeDecorations),
    lastAnchorPos,
  };
}

/** Toggles the top-level block AT `pos` (must be a valid `doc` child start —
 * callers resolve nested clicks up to depth 1 first) in/out of the selection
 * and sets it as the new range anchor. Dispatches a no-op-content
 * transaction (metadata only), so it never touches undo history for actual
 * document edits. Returns `false` (no-op) if there's no block at `pos`. */
export function toggleBlockSelected(editor: Editor, pos: number): boolean {
  const { state, view } = editor;
  if (!boundedNodeAt(state.doc, pos)) return false;
  view.dispatch(
    state.tr.setMeta(blockSelectionPluginKey, { type: "toggle", pos }),
  );
  return true;
}

/** Clears the whole selection. Returns `false` (dispatches nothing) if it
 * was already empty — callers (e.g. the Esc keymap, plain-click-to-clear)
 * rely on this to know whether they should report the key/click as
 * "handled." */
export function clearBlockSelection(editor: Editor): boolean {
  const { state, view } = editor;
  const current = blockSelectionPluginKey.getState(state);
  if (!current || current.decorations.find().length === 0) return false;
  view.dispatch(state.tr.setMeta(blockSelectionPluginKey, { type: "clear" }));
  return true;
}

/** Contiguous-fills the selection from `fromPos` to `toPos` (both top-level
 * block starts), inclusive of both ends, replacing whatever was selected
 * before. Returns `false` if either position isn't a valid top-level block
 * start in the current doc. */
export function selectBlockRange(
  editor: Editor,
  fromPos: number,
  toPos: number,
): boolean {
  const { state, view } = editor;
  const blocks = topLevelBlocks(state.doc);
  if (!blocks.some((b) => b.pos === fromPos)) return false;
  if (!blocks.some((b) => b.pos === toPos)) return false;
  view.dispatch(
    state.tr.setMeta(blockSelectionPluginKey, {
      type: "range",
      from: fromPos,
      to: toPos,
    }),
  );
  return true;
}

/** Reads the currently selected top-level blocks back out of the plugin's
 * decoration set, sorted ascending by position. The read path every batch
 * action (and the floating bar's own block count) goes through. */
export function getSelectedBlocks(
  editor: Editor,
): Array<{ node: PMNode; pos: number }> {
  const pluginState = blockSelectionPluginKey.getState(editor.state);
  if (!pluginState) return [];
  const result: Array<{ node: PMNode; pos: number }> = [];
  for (const deco of pluginState.decorations.find()) {
    const node = editor.state.doc.nodeAt(deco.from);
    if (node) result.push({ node, pos: deco.from });
  }
  result.sort((a, b) => a.pos - b.pos);
  return result;
}

/**
 * Node type names eligible for the batch "Turn into" action — deliberately
 * narrower than `blockActions.ts`'s per-block `TEXT_CONVERTIBLE_TYPES`
 * (which also allows `bulletList`/`orderedList`/`blockquote` for the
 * single-block handle menu): batch list-conversion raises its own questions
 * (does a bulleted list of 3 items convert to 3 headings, or 1?) that are
 * out of scope for v1 — see the task brief. `admonition`/`tabs`/`image`/etc.
 * are excluded outright; the bar hides "Turn into" entirely unless every
 * selected block is one of these three shapes.
 */
const BATCH_TEXT_CONVERTIBLE_TYPES = new Set([
  "paragraph",
  "heading",
  "codeBlock",
]);

/** `true` only when the selection is non-empty AND every selected block is
 * paragraph/heading/codeBlock — the condition `SelectionBar.tsx` uses to
 * decide whether to render the "Turn into" button group at all. */
export function isSelectionTextConvertible(editor: Editor): boolean {
  const blocks = getSelectedBlocks(editor);
  if (blocks.length === 0) return false;
  return blocks.every(({ node }) =>
    BATCH_TEXT_CONVERTIBLE_TYPES.has(node.type.name),
  );
}

export type TurnIntoTarget = "paragraph" | "heading2" | "heading3" | "code";

/**
 * Converts EVERY selected block to `target`'s shape, in one transaction (one
 * undo step restores all of them). Positions are read once up front from
 * `getSelectedBlocks` (pre-transaction, ascending), then applied to the
 * transaction in DESCENDING order: `setBlockType` never changes a node's
 * `nodeSize` (it swaps the block's type/attrs, not its content), so — unlike
 * `duplicate`/`delete` below — earlier positions would in fact stay valid
 * even ascending, but descending is used uniformly across all three batch
 * actions in this module so the "process high positions first" rule doesn't
 * have to be reasoned about per-action. Returns `false` (no-op, no
 * dispatch) if the selection is empty or contains a non-text-convertible
 * block — callers should gate on `isSelectionTextConvertible` first (the
 * bar does; this check is a second, cheap belt-and-braces guard).
 */
export function turnSelectedBlocksInto(
  editor: Editor,
  target: TurnIntoTarget,
): boolean {
  if (!isSelectionTextConvertible(editor)) return false;
  const blocks = getSelectedBlocks(editor);

  const { schema } = editor.state;
  const nodeType =
    target === "heading2" || target === "heading3"
      ? schema.nodes.heading
      : target === "code"
        ? schema.nodes.codeBlock
        : schema.nodes.paragraph;
  const attrs =
    target === "heading2"
      ? { level: 2 }
      : target === "heading3"
        ? { level: 3 }
        : undefined;
  if (!nodeType) return false;

  const { state, view } = editor;
  const tr = state.tr;
  const descending = [...blocks].sort((a, b) => b.pos - a.pos);
  for (const { pos, node } of descending) {
    tr.setBlockType(pos, pos + node.nodeSize, nodeType, attrs);
  }
  view.dispatch(tr);
  return true;
}

/** Inserts a copy of every selected block immediately after itself, all in
 * one transaction (one undo step). Descending order: an insert after a
 * higher-position block never shifts a lower-position block's own
 * (not-yet-processed) position, since the insert point is strictly past the
 * lower block's end. Returns `false` if the selection is empty. */
export function duplicateSelectedBlocks(editor: Editor): boolean {
  const blocks = getSelectedBlocks(editor);
  if (blocks.length === 0) return false;

  const { state, view } = editor;
  const tr = state.tr;
  const descending = [...blocks].sort((a, b) => b.pos - a.pos);
  for (const { node, pos } of descending) {
    tr.insert(pos + node.nodeSize, node);
  }
  view.dispatch(tr);
  return true;
}

/** Deletes every selected block outright, in one transaction (one undo step
 * restores all of them), then clears the (now-dangling) selection.
 * Descending order for the same reason as `duplicateSelectedBlocks`: a
 * delete at a higher position never shifts a lower, not-yet-processed
 * position. Returns `false` if the selection is empty. */
export function deleteSelectedBlocks(editor: Editor): boolean {
  const blocks = getSelectedBlocks(editor);
  if (blocks.length === 0) return false;

  const { state, view } = editor;
  const tr = state.tr;
  const descending = [...blocks].sort((a, b) => b.pos - a.pos);
  for (const { node, pos } of descending) {
    tr.delete(pos, pos + node.nodeSize);
  }
  tr.setMeta(blockSelectionPluginKey, { type: "clear" });
  view.dispatch(tr);
  return true;
}

/**
 * `BlockSelection` — the plugin-only `Extension` wiring the state reducer
 * above into a real ProseMirror plugin, plus:
 *
 * - `handleClickOn`: only acts on the `direct` call (the innermost node the
 *   click actually hit — ProseMirror also calls this once per ANCESTOR of
 *   that node with `direct: false`, which this ignores so the same click
 *   doesn't re-trigger the handler once per depth level). No modifier key
 *   clears a non-empty selection and returns `false` so the caret still
 *   places normally (a plain click both clears AND moves the cursor — it
 *   does not additionally swallow the click). Cmd/Ctrl (+ Shift for a
 *   range) is `preventDefault`ed and returns `true`: the click is fully
 *   consumed, no caret move, matching Notion's own multi-select feel.
 * - `Escape` keyboard shortcut: clears a non-empty selection (`true`,
 *   handled); a no-op, falls through (`false`), when nothing is selected.
 *
 * Composes cleanly with `Editor.tsx`'s own `editorProps` (`handlePaste`/
 * `handleDrop` for image upload): TipTap merges each extension's
 * `addProseMirrorPlugins` output as SEPARATE ProseMirror plugins, each with
 * its own `props`, rather than folding them into one shared props object —
 * `handleClickOn` living on this plugin's own `props` and `handlePaste`/
 * `handleDrop` living on the editor-level `editorProps` (itself installed as
 * yet another plugin by `@tiptap/core`) never collide; ProseMirror calls
 * every registered plugin's matching prop hook for a given event, in plugin
 * order, until one returns `true`.
 */
export const BlockSelection = Extension.create({
  name: "blockSelection",

  addProseMirrorPlugins() {
    // Captured here (rather than read as `this.editor` inside the prop
    // hooks below) since `addProseMirrorPlugins` is called with `this`
    // bound to the extension instance, but the raw `Plugin`'s `props`
    // functions are invoked directly by ProseMirror's own event dispatch —
    // not as methods of this extension — so `this` inside them is not
    // reliably the extension at all.
    const editor = this.editor;
    return [
      new Plugin<BlockSelectionState>({
        key: blockSelectionPluginKey,
        state: {
          init: () => ({
            decorations: DecorationSet.empty,
            lastAnchorPos: null,
          }),
          apply: applyBlockSelection,
        },
        props: {
          decorations(state) {
            return blockSelectionPluginKey.getState(state)?.decorations;
          },
          handleClickOn(view, pos, _node, nodePos, event, direct) {
            if (!direct) return false;

            const modifierKey = event.metaKey || event.ctrlKey;
            if (!modifierKey) {
              clearBlockSelection(editor);
              return false;
            }

            const topPos = resolveTopLevelPos(view.state.doc, pos, nodePos);
            if (topPos === null) return false;

            event.preventDefault();

            const current = blockSelectionPluginKey.getState(view.state);
            if (event.shiftKey && current?.lastAnchorPos != null) {
              view.dispatch(
                view.state.tr.setMeta(blockSelectionPluginKey, {
                  type: "range",
                  from: current.lastAnchorPos,
                  to: topPos,
                }),
              );
            } else {
              view.dispatch(
                view.state.tr.setMeta(blockSelectionPluginKey, {
                  type: "toggle",
                  pos: topPos,
                }),
              );
            }
            return true;
          },
        },
      }),
    ];
  },

  addKeyboardShortcuts() {
    return {
      Escape: () => clearBlockSelection(this.editor),
    };
  },
});

export default BlockSelection;
