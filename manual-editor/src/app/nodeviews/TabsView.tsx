import { useSyncExternalStore } from "react";
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import type { ReactNodeViewProps } from "@tiptap/react";
import {
  getActiveTabIndex,
  setActiveTabIndex,
  subscribeActiveTabIndex,
} from "./tabsActiveStore";

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

  const activeIndex = useSyncExternalStore(
    (onChange) => subscribeActiveTabIndex(editor, tabsPos, onChange),
    () => getActiveTabIndex(editor, tabsPos),
  );

  const labels: (string | null)[] = [];
  node.forEach((child) => {
    labels.push((child.attrs.label as string | null) ?? null);
  });

  // Clamp in case tabs were deleted out from under a higher active index.
  const clampedIndex = Math.min(activeIndex, Math.max(labels.length - 1, 0));

  return (
    <NodeViewWrapper
      className="tabs"
      data-testid="tabs"
      data-active-index={clampedIndex}
    >
      <div className="tabs__headers" contentEditable={false}>
        {labels.map((label, index) => (
          <button
            key={index}
            type="button"
            className="tabs__header"
            data-active={index === clampedIndex}
            onClick={() => setActiveTabIndex(editor, tabsPos, index)}
          >
            {label || `Tab ${index + 1}`}
          </button>
        ))}
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

  const activeIndex = useSyncExternalStore(
    (onChange) => subscribeActiveTabIndex(editor, tabsPos, onChange),
    () => getActiveTabIndex(editor, tabsPos),
  );

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
