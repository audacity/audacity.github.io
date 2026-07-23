import type { Editor } from "@tiptap/core";
import type { JsxAttr } from "../adapter/registry";

/**
 * The five mdast components that map onto the `admonition` PM node (see
 * `registry.ts`'s `KNOWN_FLOW`). Only `Callout` carries a meaningful `type`;
 * the rest render as a static heading (`AdmonitionView`), so their insert
 * just needs the bare `component` name. Used by `slash/slashItems.ts` (its
 * own labels, distinct from these component names).
 */
export type AdmonitionComponent =
  | "Callout"
  | "Notes"
  | "Pitfalls"
  | "TipsAndTricks"
  | "BestPractices";

/**
 * Default attributes for a freshly inserted `<Shortcut />`: `client:load`
 * first (so it hydrates in the built Astro manual, matching real corpus
 * usage) then a placeholder `keys` the author immediately overtypes via
 * `ShortcutView`'s click-to-edit. Order matches how the adapter round-trips
 * source attribute order (see `registry.ts`'s `JsxAttr` doc comment).
 */
const DEFAULT_SHORTCUT_ATTRIBUTES: JsxAttr[] = [
  { name: "client:load", value: null },
  { name: "keys", value: "Ctrl+K" },
];

/**
 * Inserts an `admonition` node with an empty starter paragraph so it's
 * immediately editable. `component` selects which known-flow component the
 * node round-trips to; `type` is only meaningful for `Callout`.
 */
export function insertAdmonition(
  editor: Editor,
  component: AdmonitionComponent,
  type?: string,
) {
  editor
    .chain()
    .focus()
    .insertContent({
      type: "admonition",
      attrs: { component, type: type ?? null, title: null },
      content: [{ type: "paragraph" }],
    })
    .run();
}

/** Inserts a `tabs` node with three starter tabs (Windows/macOS/Linux), each with an empty paragraph. */
export function insertTabs(editor: Editor) {
  editor
    .chain()
    .focus()
    .insertContent({
      type: "tabs",
      content: [
        {
          type: "tab",
          attrs: { label: "Windows" },
          content: [{ type: "paragraph" }],
        },
        {
          type: "tab",
          attrs: { label: "macOS" },
          content: [{ type: "paragraph" }],
        },
        {
          type: "tab",
          attrs: { label: "Linux" },
          content: [{ type: "paragraph" }],
        },
      ],
    })
    .run();
}

/** Inserts a `shortcut` atom with the default `client:load` + placeholder `keys` attributes. */
export function insertShortcut(editor: Editor) {
  editor
    .chain()
    .focus()
    .insertContent({
      type: "shortcut",
      attrs: { attributes: DEFAULT_SHORTCUT_ATTRIBUTES },
    })
    .run();
}

/** Turns the current block into a plain paragraph. */
export function setParagraph(editor: Editor) {
  editor.chain().focus().setParagraph().run();
}

/** Turns the current block into a heading of the given level (non-toggling: always sets it). */
export function setHeading(editor: Editor, level: 2 | 3) {
  editor.chain().focus().setHeading({ level }).run();
}

/** Toggles the current block into/out of a bulleted list. */
export function toggleBulletList(editor: Editor) {
  editor.chain().focus().toggleBulletList().run();
}

/** Toggles the current block into/out of a numbered list. */
export function toggleOrderedList(editor: Editor) {
  editor.chain().focus().toggleOrderedList().run();
}

/** Turns the current block into a code block. */
export function setCodeBlock(editor: Editor) {
  editor.chain().focus().setCodeBlock().run();
}

/**
 * Inserts a curated design-system example block (`uiExample` node) with the
 * given component id and variant id (callers pass the entry's first —
 * default — variant), static by default. See `../uiExample/meta.ts`.
 */
export function insertUIExample(
  editor: Editor,
  component: string,
  variant: string,
) {
  editor
    .chain()
    .focus()
    .insertContent({
      type: "uiExample",
      attrs: { component, variant, interactive: false },
    })
    .run();
}
