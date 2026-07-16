import { useEffect, useRef, useSyncExternalStore } from "react";
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import type { ReactNodeViewProps } from "@tiptap/react";
import {
  getActiveTabIndex,
  getActiveTabSnapshot,
  notifyActiveTabIndex,
  resolveActiveTabIndex,
  setActiveTabIndex,
  subscribeActiveTabIndex,
} from "./tabsActiveStore";

/**
 * Appends a new `tab` node — `{ attrs: { label: "New tab" }, content:
 * [paragraph] }` — at the END of the `tabs` node starting at `tabsPos`, in
 * one transaction, then activates it via `tabsActiveStore` so the newly
 * added tab is immediately visible (matching what a user clicking "+" would
 * expect — see the header's own new tab appearing selected, not silently
 * added behind the current one).
 *
 * Insert position: `tabsPos + tabsNode.nodeSize - 1` — one position before
 * the `tabs` node's own closing token, i.e. right after its last child,
 * same "insert just inside the end" math `duplicateAction`/`moveNodeAt` (in
 * `blockActions.ts`/`blockMove.ts`) use elsewhere for sibling-relative
 * inserts, just anchored to the container's own end instead of another
 * sibling's start/end.
 */
function addTab(editor: ReactNodeViewProps["editor"], tabsPos: number): void {
  const { state } = editor;
  const tabsNode = state.doc.nodeAt(tabsPos);
  if (!tabsNode) return;

  const paragraphType = state.schema.nodes.paragraph;
  const tabType = state.schema.nodes.tab;
  if (!paragraphType || !tabType) return;

  const newTab = tabType.create({ label: "New tab" }, paragraphType.create());
  const insertPos = tabsPos + tabsNode.nodeSize - 1;

  const tr = state.tr.insert(insertPos, newTab);
  editor.view.dispatch(tr);

  setActiveTabIndex(editor, tabsPos, tabsNode.childCount);
}

/**
 * Removes the `tab` child at `tabIndex` from the `tabs` node at `tabsPos`,
 * in one transaction (so one undo restores it). Two cases:
 *
 * - More than one tab left after removal: delete just that child (range
 *   computed from `tabsPos` + the summed `nodeSize` of its earlier
 *   siblings, same "walk children to find a target's range" math the
 *   existing tab-deletion regression test in `nodeviews.test.tsx` uses),
 *   then move the shared active index (`tabsActiveStore`) to the nearest
 *   surviving neighbor. `resolveActiveTabIndex(tabIndex, newChildCount)`
 *   already computes exactly that: it clamps `tabIndex` — now a "hole" —
 *   down to the last valid index, which lands on the tab that slid into
 *   the removed one's spot (same index) when one did, or the previous tab
 *   when the removed tab was last. Always follows with
 *   `notifyActiveTabIndex` (not just `setActiveTabIndex`, which no-ops
 *   when the NUMBER doesn't change) because "same index" is exactly the
 *   common case here — a later sibling sliding into the removed tab's own
 *   index — and that neighbor's separately-mounted `TabView` still needs
 *   telling to re-render (see that function's doc comment).
 * - Exactly one tab left: delete the WHOLE `tabs` node instead of leaving
 *   an empty group — the schema requires `tab+`, so a tabs block with zero
 *   tabs isn't a representable (or useful) document state, and "remove the
 *   last tab" reads as "remove this tab strip" to the user anyway. No
 *   confirmation prompt: it's a single dispatch, so one Cmd+Z undoes the
 *   whole thing exactly like removing any other tab.
 */
function removeTab(
  editor: ReactNodeViewProps["editor"],
  tabsPos: number,
  tabIndex: number,
): void {
  const { state } = editor;
  const tabsNode = state.doc.nodeAt(tabsPos);
  if (!tabsNode) return;
  if (tabIndex < 0 || tabIndex >= tabsNode.childCount) return;

  if (tabsNode.childCount <= 1) {
    const tr = state.tr.delete(tabsPos, tabsPos + tabsNode.nodeSize);
    editor.view.dispatch(tr);
    return;
  }

  let childPos = tabsPos + 1;
  for (let i = 0; i < tabIndex; i++) {
    childPos += tabsNode.child(i).nodeSize;
  }
  const childNode = tabsNode.child(tabIndex);

  const tr = state.tr.delete(childPos, childPos + childNode.nodeSize);
  editor.view.dispatch(tr);

  const newChildCount = tabsNode.childCount - 1;
  setActiveTabIndex(
    editor,
    tabsPos,
    resolveActiveTabIndex(tabIndex, newChildCount),
  );
  notifyActiveTabIndex(editor, tabsPos);
}

/**
 * Node view for the `tabs` block node (maps to the `Tabs` mdast component;
 * see `registry.ts`). Renders one clickable header per child `tab`, showing
 * its `label` attr (falling back to "Tab N"), and shows only the selected
 * panel's content.
 *
 * ProseMirror renders every child `tab` node view into this node's
 * `contentDOM` regardless of which one is "selected" — node views have no
 * built-in way to hide a child from the document flow, and `tabs`/`tab` are
 * still fully editable (unlike `admonition`, this container has no spare
 * attribute to stash the active index on: adding one would mean the PM doc
 * itself changes whenever a user merely *looks* at a different tab, and
 * would need a matching attr on the pure adapter schema for no round-trip
 * benefit). So which tab is active lives in `tabsActiveStore` (see that
 * module's doc comment for why — `TabsView` and each `TabView` mount as
 * separate React roots with no Context between them) rather than in this
 * component's own React state, read here via `useSyncExternalStore` so a
 * header click re-renders both this header row AND every sibling `TabView`.
 */
export function TabsView({ node, editor, getPos }: ReactNodeViewProps) {
  const tabsPos = getPos() ?? -1;
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Subscribes on the combined index+revision snapshot (not the raw index)
  // so a forced `notifyActiveTabIndex` (see `removeTab` and that function's
  // own doc comment) reliably re-renders this component even on the
  // "removal lands a neighbor on the very same index" coincidence, where
  // the raw index alone wouldn't look changed. `activeIndex` itself is then
  // read separately via `getActiveTabIndex` — the snapshot string above
  // exists purely to drive the subscription, not to branch on.
  useSyncExternalStore(
    (onChange) => subscribeActiveTabIndex(editor, tabsPos, onChange),
    () => getActiveTabSnapshot(editor, tabsPos),
  );
  const activeIndex = getActiveTabIndex(editor, tabsPos);

  const labels: (string | null)[] = [];
  node.forEach((child) => {
    labels.push((child.attrs.label as string | null) ?? null);
  });

  // Clamp in case tabs were deleted out from under a higher active index.
  const clampedIndex = resolveActiveTabIndex(activeIndex, labels.length);

  // `TabView` compares its own sibling index against the RAW (un-clamped)
  // store value, not this component's local `clampedIndex` (the two mount as
  // separate React roots with no shared state but the store itself — see
  // `tabsActiveStore`'s doc comment). If a tab is deleted while a later tab
  // was active, the store keeps pointing past the end until something writes
  // the clamped value back, which otherwise leaves every `TabView` computing
  // "not me" and the whole body blank even though a header shows selected.
  // Write the clamp back here so the store — and therefore every subscribed
  // `TabView` — agrees with the header row. Guarded to only fire when
  // actually out of range so it can't loop (`setActiveTabIndex` itself is
  // also a no-op when the value doesn't change).
  useEffect(() => {
    if (labels.length > 0 && clampedIndex !== activeIndex) {
      setActiveTabIndex(editor, tabsPos, clampedIndex);
    }
  }, [activeIndex, clampedIndex, editor, tabsPos, labels.length]);

  // Dispatches the insert (see `addTab` above) and, on a best-effort basis,
  // focuses the new tab's label input once its `TabView` node view has
  // mounted (a separate React root — see this file's top doc comment — so
  // there's no ref to it available synchronously; `requestAnimationFrame`
  // gives ProseMirror's own view update + React's node-view mount a turn to
  // finish first). Falls back silently to "just the panel activates" (the
  // task's documented minimum) if the input isn't found, e.g. under
  // `requestAnimationFrame`-less test environments.
  function handleAddTab() {
    addTab(editor, tabsPos);
    requestAnimationFrame(() => {
      const inputs =
        wrapperRef.current?.querySelectorAll<HTMLInputElement>(
          ".tab__label-input",
        );
      const lastInput = inputs?.[inputs.length - 1];
      lastInput?.focus();
      lastInput?.select();
    });
  }

  return (
    <NodeViewWrapper
      ref={wrapperRef}
      className="tabs"
      data-testid="tabs"
      data-active-index={clampedIndex}
    >
      <div className="tabs__headers" contentEditable={false}>
        {labels.map((label, index) => {
          const isActive = index === clampedIndex;
          return (
            <div key={index} className="tabs__header-group">
              <button
                type="button"
                className="tabs__header"
                data-active={isActive}
                onClick={() => setActiveTabIndex(editor, tabsPos, index)}
              >
                {label || `Tab ${index + 1}`}
              </button>
              {/* Only the active header shows the close ("×") button —
                  browser-tab style: a sibling of the header button (never
                  nested inside it — a <button> can't validly contain
                  another), rendered only for the tab currently in view, and
                  a no-op unless clicked (`stopPropagation` on both
                  `mouseDown` and `click`, same guard `TabView`'s own
                  `.tab__label-input` uses) so it never bubbles into the
                  header's own activation `onClick` or a PM selection. */}
              {isActive && (
                <button
                  type="button"
                  className="tabs__remove"
                  data-testid="tabs-remove-tab"
                  aria-label="Remove tab"
                  title="Remove tab"
                  onMouseDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    removeTab(editor, tabsPos, index);
                  }}
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
        <button
          type="button"
          className="tabs__add"
          data-testid="tabs-add-tab"
          title="Add tab"
          onClick={handleAddTab}
        >
          +
        </button>
      </div>
      <NodeViewContent className="tabs__body" />
    </NodeViewWrapper>
  );
}

/**
 * Node view for a single `tab` pane (maps to the `Tab` mdast component).
 * The label is editable via a plain input bound to the `label` attr; the
 * block content is editable via `NodeViewContent`, same pattern as
 * `AdmonitionView`.
 *
 * Visibility: resolves its own `getPos()` to find its parent `tabs` node's
 * position and its own index among sibling tabs (plain ProseMirror position
 * math — see `tabsActiveStore`'s doc comment for why position, not DOM
 * proximity, is used), reads the shared active index for that parent via
 * `useSyncExternalStore`, and hides itself with CSS
 * (`.tab[data-active="false"]`) when it isn't the selected one.
 */
export function TabView({
  node,
  editor,
  getPos,
  updateAttributes,
}: ReactNodeViewProps) {
  const pos = getPos();
  let tabsPos = -1;
  let myIndex = -1;
  if (typeof pos === "number") {
    const $pos = editor.state.doc.resolve(pos);
    tabsPos = $pos.before($pos.depth);
    myIndex = $pos.index();
  }

  // See `TabsView`'s identical comment above: subscribes on the combined
  // snapshot so a forced notify (post-removal, same-index neighbor) isn't
  // masked by `useSyncExternalStore`'s own unchanged-index short-circuit.
  useSyncExternalStore(
    (onChange) => subscribeActiveTabIndex(editor, tabsPos, onChange),
    () => getActiveTabSnapshot(editor, tabsPos),
  );
  const activeIndex = getActiveTabIndex(editor, tabsPos);

  const active = myIndex === activeIndex;
  const label = (node.attrs.label as string | null) ?? "";

  return (
    <NodeViewWrapper className="tab" data-testid="tab" data-active={active}>
      <div className="tab__header" contentEditable={false}>
        <input
          className="tab__label-input"
          aria-label="Tab label"
          type="text"
          value={label}
          placeholder="Tab label"
          onMouseDown={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
          onChange={(event) =>
            updateAttributes({ label: event.target.value || null })
          }
        />
      </div>
      <NodeViewContent className="tab__body" />
    </NodeViewWrapper>
  );
}

export default TabsView;
