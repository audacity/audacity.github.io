import { type Extensions, Node, mergeAttributes } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { type JsxAttr, readShortcutKeys } from "./registry";

/**
 * `admonition` — the PM node that `Callout`, `Notes`, `Pitfalls`,
 * `BestPractices` and `TipsAndTricks` mdast components all map onto (see
 * `registry.ts`). `component` records which one produced this node so the
 * adapter can convert back to the right mdast JSX element.
 */
const Admonition = Node.create({
  name: "admonition",
  group: "block",
  content: "block+",
  addAttributes() {
    return {
      component: {
        // No default: every admonition node must record which known
        // component (Callout/Notes/Pitfalls/...) it came from.
        default: undefined,
        isRequired: true,
        parseHTML: (element) => element.getAttribute("data-component"),
        renderHTML: (attributes) => ({
          "data-component": attributes.component,
        }),
      },
      type: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-type"),
        renderHTML: (attributes) => {
          if (!attributes.type) return {};
          return { "data-type": attributes.type };
        },
      },
      title: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-title"),
        renderHTML: (attributes) => {
          if (!attributes.title) return {};
          return { "data-title": attributes.title };
        },
      },
    };
  },
  parseHTML() {
    return [{ tag: "div[data-component]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-node-type": "admonition" }),
      0,
    ];
  },
});

/** `tabs` — container for `tab` children; maps to the `Tabs` mdast component. */
const Tabs = Node.create({
  name: "tabs",
  group: "block",
  content: "tab+",
  parseHTML() {
    return [{ tag: "div[data-tabs]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-tabs": "" }), 0];
  },
});

/** `tab` — a single labelled pane, only valid inside `tabs`. Maps to `Tab`. */
const Tab = Node.create({
  name: "tab",
  content: "block+",
  addAttributes() {
    return {
      label: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-label"),
        renderHTML: (attributes) => {
          if (!attributes.label) return {};
          return { "data-label": attributes.label };
        },
      },
    };
  },
  parseHTML() {
    return [{ tag: "div[data-tab]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-tab": "" }), 0];
  },
});

/**
 * `shortcut` — inline atom for `<Shortcut ... />`.
 *
 * Stores the component's FULL original attribute list (`attributes`, an array
 * of `{ name, value }` in source order) rather than just `keys`, so every
 * attribute — including Astro's valueless `client:load` hydration directive —
 * round-trips byte-identically through the adapter. Dropping `client:load`
 * would break the component's hydration in the built manual (real data loss),
 * so it must be preserved. `keys` is still exposed as a first-class editable
 * value for the node view via `readShortcutKeys`.
 */
const Shortcut = Node.create({
  name: "shortcut",
  group: "inline",
  inline: true,
  atom: true,
  addAttributes() {
    return {
      attributes: {
        default: [] as JsxAttr[],
        parseHTML: (element) => {
          const raw = element.getAttribute("data-attributes");
          return raw ? (JSON.parse(raw) as JsxAttr[]) : [];
        },
        renderHTML: (attributes) => ({
          "data-attributes": JSON.stringify(attributes.attributes ?? []),
        }),
      },
    };
  },
  parseHTML() {
    return [{ tag: "span[data-shortcut]" }];
  },
  renderHTML({ HTMLAttributes, node }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, { "data-shortcut": "" }),
      readShortcutKeys((node.attrs.attributes ?? []) as JsxAttr[]),
    ];
  },
});

/**
 * `preserved` — a block atom that holds an arbitrary mdast node verbatim (as
 * JSON) for any markdown construct the editor doesn't understand yet, so it
 * round-trips through an edit/save cycle unmodified. No HTML parsing: this
 * node is only ever produced by the mdast->PM side of the adapter (C2).
 */
const Preserved = Node.create({
  name: "preserved",
  group: "block",
  atom: true,
  addAttributes() {
    return {
      mdast: {
        default: null,
        rendered: false,
      },
    };
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-preserved": "" })];
  },
});

/** `image` — block atom mapping to mdast `image` nodes (`![alt](src "title")`). */
const Image = Node.create({
  name: "image",
  group: "block",
  atom: true,
  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      title: { default: null },
    };
  },
  parseHTML() {
    return [{ tag: "img[src]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["img", mergeAttributes(HTMLAttributes)];
  },
});

/**
 * Builds the full TipTap extension array for the manual editor schema.
 *
 * `StarterKit` (v3) bundles `link` (mark), `bold`, `italic`, `code` and all
 * the standard flow nodes (paragraph, heading, lists, blockquote, code
 * block, horizontal rule, hard break, ...) by default — no separate
 * `@tiptap/extension-link` install is required. It does not bundle an
 * `image` node, so one is defined here.
 */
export function buildExtensions(): Extensions {
  return [StarterKit, Admonition, Tabs, Tab, Shortcut, Preserved, Image];
}
