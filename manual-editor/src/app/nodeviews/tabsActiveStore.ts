import type { Editor } from "@tiptap/core";

/**
 * Cross-node-view shared state for "which tab is active" per `tabs` node.
 *
 * `TabsView` (the tab headers) and `TabView` (each panel) are two DIFFERENT
 * node types, so `ReactNodeViewRenderer` mounts each as its own independent
 * React root — ProseMirror inserts a `tab` node view's root DOM element
 * directly as a child of the `tabs` node view's raw `contentDOM`, with no
 * React tree (and so no React Context) connecting the two. They need a
 * shared place to read/write "the active index for this specific `tabs`
 * node" that isn't React state or Context.
 *
 * This module is that shared place: a small external store (read via
 * React's `useSyncExternalStore`, see `TabsView`/`TabView`) keyed by the
 * `tabs` node's ProseMirror position and scoped per `Editor` instance (a
 * `WeakMap`, so it's naturally discarded when a page's editor is torn down
 * — see `Editor.tsx`, which builds a fresh `Editor` per page/`path`).
 *
 * Position, not the PM `Node` object itself, is the key: editing anything
 * inside a `tabs` node produces a brand new (immutable) `tabs` `Node`
 * object on every keystroke, but `getPos()` for an existing node view keeps
 * returning that same node's *current* position across such edits (per
 * `ReactNodeViewRenderer`'s own doc comment on why `getPos()` "is always
 * current") — so position survives content edits in a way object identity
 * doesn't, and is exactly what both node views can independently recompute
 * (`TabsView` via its own `getPos()`, `TabView` via resolving its own
 * `getPos()` and reading `$pos.before($pos.depth)` for its parent's).
 */
interface TabActiveEntry {
  index: number;
  listeners: Set<() => void>;
}

const editorStores = new WeakMap<Editor, Map<number, TabActiveEntry>>();

function storeFor(editor: Editor): Map<number, TabActiveEntry> {
  let store = editorStores.get(editor);
  if (!store) {
    store = new Map();
    editorStores.set(editor, store);
  }
  return store;
}

function entryFor(editor: Editor, tabsPos: number): TabActiveEntry {
  const store = storeFor(editor);
  let entry = store.get(tabsPos);
  if (!entry) {
    entry = { index: 0, listeners: new Set() };
    store.set(tabsPos, entry);
  }
  return entry;
}

/** Reads the active tab index for the `tabs` node starting at `tabsPos` (defaults to 0). */
export function getActiveTabIndex(editor: Editor, tabsPos: number): number {
  return entryFor(editor, tabsPos).index;
}

/**
 * Resolves the effective active index for a `tabs` node that currently has
 * `childCount` live `tab` children, clamping a possibly-stale `storedIndex`
 * (e.g. a later tab was active and then deleted) down to the last valid
 * child index. Returns `-1` when there are no children left to select.
 *
 * Pure and store-independent so it's cheap to unit test in isolation from
 * the store/React wiring — see `nodeviews.test.tsx`.
 */
export function resolveActiveTabIndex(
  storedIndex: number,
  childCount: number,
): number {
  if (childCount <= 0) return -1;
  return Math.min(storedIndex, childCount - 1);
}

/** Sets the active tab index for the `tabs` node starting at `tabsPos` and notifies subscribers. */
export function setActiveTabIndex(
  editor: Editor,
  tabsPos: number,
  index: number,
): void {
  const entry = entryFor(editor, tabsPos);
  if (entry.index === index) return;
  entry.index = index;
  entry.listeners.forEach((listener) => listener());
}

/** Subscribes to active-index changes for the `tabs` node starting at `tabsPos`. */
export function subscribeActiveTabIndex(
  editor: Editor,
  tabsPos: number,
  listener: () => void,
): () => void {
  const entry = entryFor(editor, tabsPos);
  entry.listeners.add(listener);
  return () => {
    entry.listeners.delete(listener);
  };
}
