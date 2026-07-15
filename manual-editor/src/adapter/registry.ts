/**
 * Known-component registry.
 *
 * Describes the mdast MDX JSX components ("flow" = block-level, "inline" =
 * inline-level) that the mdast<->ProseMirror adapter (tasks C2/C3) knows how
 * to round-trip, and which ProseMirror node type each one maps onto.
 *
 * Anything not listed here falls back to the `preserved` node, which stores
 * the original mdast subtree verbatim so it survives an edit/save cycle
 * without being understood by the editor.
 */

export interface ComponentDescriptor {
  /** The ProseMirror node type this mdast component maps to. */
  pmType: string;
  /** Attribute names copied between the mdast JSX node and the PM node. */
  attrs: readonly string[];
}

export const KNOWN_FLOW = {
  Callout: { pmType: "admonition", attrs: ["type", "title"] },
  Notes: { pmType: "admonition", attrs: [] },
  Pitfalls: { pmType: "admonition", attrs: [] },
  BestPractices: { pmType: "admonition", attrs: [] },
  TipsAndTricks: { pmType: "admonition", attrs: [] },
  Tabs: { pmType: "tabs", attrs: [] },
  Tab: { pmType: "tab", attrs: ["label"] },
} as const satisfies Record<string, ComponentDescriptor>;

export const KNOWN_INLINE = {
  Shortcut: { pmType: "shortcut", attrs: ["keys"] },
} as const satisfies Record<string, ComponentDescriptor>;

export type KnownFlowComponent = keyof typeof KNOWN_FLOW;
export type KnownInlineComponent = keyof typeof KNOWN_INLINE;

/**
 * A single JSX attribute captured verbatim in source order. `value` is `null`
 * for a valueless/directive attribute (e.g. Astro's `client:load`, which is a
 * bare `name` with no `="..."`), or the raw string for `name="value"`.
 *
 * The `shortcut` PM node stores the FULL original attribute list in this shape
 * (not just `keys`) so `<Shortcut client:load keys="X"/>` round-trips
 * byte-identically — dropping `client:load` would break the component's Astro
 * hydration in the built manual, which is real data loss, not benign
 * formatting. `keys` stays a first-class editable value via `readShortcutKeys`.
 */
export interface JsxAttr {
  name: string;
  value: string | null;
}

/**
 * Reads the `keys` value out of a `shortcut` node's stored attribute list, for
 * the schema's `renderHTML` and any future node view that edits the shortcut.
 * Returns `""` when absent so callers always get a string.
 */
export function readShortcutKeys(attributes: readonly JsxAttr[]): string {
  return attributes.find((a) => a.name === "keys")?.value ?? "";
}

/**
 * Component names (from KNOWN_FLOW) that map onto the `admonition` PM node.
 * Useful for the adapter to know which `component` attr values are valid
 * when converting a PM `admonition` node back to mdast.
 */
export const ADMONITION_COMPONENTS = (
  Object.keys(KNOWN_FLOW) as KnownFlowComponent[]
).filter((name) => KNOWN_FLOW[name].pmType === "admonition");

/** Reverse lookup: ProseMirror node type -> the known flow component name(s) that produce it. */
export const PM_TYPE_TO_FLOW_COMPONENTS: Record<string, KnownFlowComponent[]> =
  (Object.keys(KNOWN_FLOW) as KnownFlowComponent[]).reduce<
    Record<string, KnownFlowComponent[]>
  >((acc, name) => {
    const { pmType } = KNOWN_FLOW[name];
    (acc[pmType] ??= []).push(name);
    return acc;
  }, {});
