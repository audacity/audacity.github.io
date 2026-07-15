/**
 * `mdastToDoc` — mdast -> ProseMirror JSON mapping.
 *
 * Half of the mdast<->ProseMirror adapter (the other half, `docToMdast`, is
 * task C3). This direction is the "load" path: parse MDX into mdast (see
 * `../mdx/pipeline`), then map that tree onto the PM JSON shape the TipTap
 * schema (`./schema.ts`) understands.
 *
 * Fidelity rule (see task brief / AGENTS.md): never silently drop content.
 * Any mdast construct this module doesn't explicitly understand becomes a
 * `preserved` node carrying the original mdast subtree verbatim, so it
 * survives an edit/save round trip even though the editor can't render it.
 */
import type {
  Blockquote,
  Break,
  Code,
  Emphasis,
  Heading,
  Image,
  InlineCode,
  Link,
  List,
  ListItem,
  Nodes as MdastNode,
  Paragraph,
  PhrasingContent,
  Root,
  RootContent,
  Strong,
  Text,
  ThematicBreak,
} from "mdast";
import type {
  MdxJsxAttribute,
  MdxJsxFlowElement,
  MdxJsxTextElement,
} from "mdast-util-mdx-jsx";
import { KNOWN_FLOW, KNOWN_INLINE } from "./registry";

/** ProseMirror's generic node/mark JSON shape (matches `prosemirror-model`'s `NodeJSON`/`Fragment` output). */
export interface PMNodeJSON {
  type: string;
  attrs?: Record<string, unknown>;
  content?: PMNodeJSON[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
}

type PMMark = { type: string; attrs?: Record<string, unknown> };

/** A yaml frontmatter mdast node, as produced by `remark-frontmatter`. */
interface YamlNode {
  type: "yaml";
  value: string;
}

function isYamlNode(node: MdastNode | RootContent): node is YamlNode {
  return node.type === "yaml";
}

/**
 * Read a simple string-valued JSX attribute off an mdxJsx element's
 * `attributes` array. Only string-valued attributes are expected for the
 * known components this adapter understands (per the task brief); attribute
 * expressions (`attr={expr}`) or spreads would need a `preserved` fallback,
 * but none of the known components use them.
 */
function readStringAttr(
  attributes: (MdxJsxFlowElement | MdxJsxTextElement)["attributes"],
  name: string,
): string | null {
  const found = attributes.find(
    (a): a is MdxJsxAttribute =>
      a.type === "mdxJsxAttribute" && a.name === name,
  );
  if (!found) return null;
  return typeof found.value === "string" ? found.value : null;
}

/** Wraps a `preserved` node carrying the given mdast node verbatim. */
function preserve(node: MdastNode | RootContent): PMNodeJSON {
  return { type: "preserved", attrs: { mdast: node } };
}

/**
 * Maps a list of mdast block-level (flow) nodes to PM block nodes.
 *
 * `mapBlock` returns an *array* (not a single node) because mapping a
 * paragraph or heading that mixes text with an inline `image` can expand
 * into several sibling PM blocks — see `splitInlineWithImages`.
 */
function mapBlocks(nodes: RootContent[]): PMNodeJSON[] {
  return nodes.flatMap(mapBlock);
}

function mapBlock(node: RootContent): PMNodeJSON[] {
  switch (node.type) {
    case "heading": {
      const n = node as Heading;
      // See the `paragraph` case below for the unsupported-inline rule;
      // headings are the other block type with phrasing children directly
      // (not wrapped in an intermediate block), so the same rule applies.
      if (n.children.some((c) => hasUnsupportedInline(c))) {
        return [preserve(node)];
      }
      return splitInlineWithImages(n.children, (content) => ({
        type: "heading",
        attrs: { level: n.depth },
        content,
      }));
    }
    case "paragraph": {
      const n = node as Paragraph;
      // RULE for inline content we can't safely represent (unknown JSX
      // like `mdxJsxTextElement`s not in KNOWN_INLINE, but also any other
      // phrasing type this module doesn't map — e.g. GFM `delete`
      // (strikethrough) or `footnoteReference`, both reachable since the
      // pipeline enables remark-gfm/remark-frontmatter): a block-level
      // `preserved` node cannot be spliced into inline content (invalid
      // per the schema — `preserved` is a block atom), and silently
      // dropping or blanking the unsupported element would lose data.
      // Instead we preserve the entire *containing paragraph* as a single
      // `preserved` block carrying the paragraph's own mdast node
      // verbatim. This trades granularity (the paragraph's other,
      // known-good text/marks also become opaque to the editor) for a
      // hard fidelity guarantee with no invalid-schema edge cases. `image`
      // is exempted (see below) because it CAN be validly represented, as
      // a sibling block. Expected to be rare in the corpus; C4's
      // golden-file test verifies no content is lost either way.
      if (n.children.some((c) => hasUnsupportedInline(c))) {
        return [preserve(node)];
      }
      // Images are a block-level atom in the schema (see mapImage's doc
      // comment), but mdast models them as phrasing content, so a
      // paragraph mixing text and an image (or a paragraph consisting
      // solely of one) is split into sibling blocks here rather than
      // nesting the image inside the paragraph's inline content.
      return splitInlineWithImages(n.children, (content) => ({
        type: "paragraph",
        content,
      }));
    }
    case "list": {
      const n = node as List;
      // GFM task lists (`- [ ] todo` / `- [x] done`) put a `checked`
      // boolean on `listItem`, but the schema has no attribute slot for it
      // (neither `bulletList`/`orderedList` nor `listItem` model checkbox
      // state). Mapping normally would silently lose which items are
      // checked, so per the fidelity rule we preserve the whole `list`
      // verbatim (mirroring how mid-document `yaml` is special-cased above)
      // rather than emit a checkbox-less bullet/ordered list.
      if (n.children.some((item) => item.checked != null)) {
        return [preserve(node)];
      }
      const pm: PMNodeJSON = {
        type: n.ordered ? "orderedList" : "bulletList",
        content: n.children.map(mapListItem),
      };
      // mdast's `List.start` only applies to ordered lists, and is only
      // meaningful when it isn't the default of 1 — e.g. a numbered
      // procedure interrupted by a paragraph/image parses as multiple
      // sibling `list` nodes with `start: 2`, `start: 3`, ... Carry it
      // through as TipTap StarterKit's `OrderedList` node defines a `start`
      // attribute (defaulting to 1) for exactly this purpose.
      if (n.ordered && n.start != null && n.start !== 1) {
        pm.attrs = { start: n.start };
      }
      return [pm];
    }
    case "code": {
      const n = node as Code;
      // Note: fenced-code `meta` (e.g. the `{1,3-5}` in ```js{1,3-5}) is
      // intentionally not preserved here — the schema has no attribute slot
      // for it and it's absent from the corpus, so mapping only `lang`/
      // `value` is a deliberate, currently-safe gap (not an oversight).
      const pm: PMNodeJSON = {
        type: "codeBlock",
        attrs: { language: n.lang ?? null },
      };
      if (n.value) pm.content = [{ type: "text", text: n.value }];
      return [pm];
    }
    case "image":
      return [mapImage(node as Image)];
    case "thematicBreak":
      void (node as ThematicBreak);
      return [{ type: "horizontalRule" }];
    case "blockquote": {
      const n = node as Blockquote;
      return [{ type: "blockquote", content: mapBlocks(n.children) }];
    }
    case "yaml":
      // A yaml node anywhere but the very first root child is not
      // frontmatter (that case is handled in mdastToDoc before we get
      // here) — preserve it so it isn't silently dropped.
      return [preserve(node)];
    case "mdxJsxFlowElement":
      return [mapFlowJsx(node as MdxJsxFlowElement)];
    default:
      return [preserve(node)];
  }
}

/**
 * `image` mdast nodes map onto the schema's `image` PM node, which is
 * block-level and atomic (see `./schema.ts`). mdast models images as
 * phrasing (inline) content, so they only ever appear as children of a
 * `paragraph` (or `heading`) node. `splitInlineWithImages` is what pulls
 * them out into their own sibling block rather than nesting them inside
 * the surrounding paragraph/heading's inline content, which the schema
 * would reject (a block-grouped atom is not valid `inline*` content).
 */
function mapImage(n: Image): PMNodeJSON {
  return {
    type: "image",
    attrs: { src: n.url, alt: n.alt ?? null, title: n.title ?? null },
  };
}

/**
 * Splits a run of phrasing children around any `image` nodes, wrapping each
 * non-image run of inline content with `wrap` and emitting each image as
 * its own sibling block in between. A paragraph/heading with no images at
 * all collapses to a single wrapped block (the common case); one consisting
 * solely of an image collapses to just the image block, dropping the empty
 * wrapper entirely.
 */
function splitInlineWithImages(
  children: PhrasingContent[],
  wrap: (content: PMNodeJSON[]) => PMNodeJSON,
): PMNodeJSON[] {
  const out: PMNodeJSON[] = [];
  let run: PhrasingContent[] = [];
  const flush = () => {
    if (run.length > 0) {
      out.push(wrap(mapInlineChildren(run)));
      run = [];
    }
  };
  for (const child of children) {
    if (child.type === "image") {
      flush();
      out.push(mapImage(child as Image));
    } else {
      run.push(child);
    }
  }
  flush();
  if (out.length === 0) out.push(wrap([]));
  return out;
}

function mapListItem(n: ListItem): PMNodeJSON {
  return { type: "listItem", content: mapBlocks(n.children) };
}

function mapFlowJsx(node: MdxJsxFlowElement): PMNodeJSON {
  const name = node.name;
  if (name && name in KNOWN_FLOW) {
    const descriptor = KNOWN_FLOW[name as keyof typeof KNOWN_FLOW];
    if (descriptor.pmType === "admonition") {
      return {
        type: "admonition",
        attrs: {
          component: name,
          type: readStringAttr(node.attributes, "type"),
          title: readStringAttr(node.attributes, "title"),
        },
        content: mapBlocks(node.children as RootContent[]),
      };
    }
    if (descriptor.pmType === "tabs") {
      return {
        type: "tabs",
        content: mapBlocks(node.children as RootContent[]),
      };
    }
    if (descriptor.pmType === "tab") {
      return {
        type: "tab",
        attrs: { label: readStringAttr(node.attributes, "label") },
        content: mapBlocks(node.children as RootContent[]),
      };
    }
  }
  return preserve(node);
}

/**
 * Whether a phrasing node (or something nested inside it) is a type
 * `mapInline` cannot turn into valid inline PM content: an unknown
 * `mdxJsxTextElement`, or any other phrasing type this module doesn't
 * explicitly map (GFM `delete`, `footnoteReference`, inline `html`, etc).
 * A top-level `image` (a direct child of the paragraph/heading) is excluded
 * — it's handled separately by `splitInlineWithImages`, which pulls it out
 * to a sibling block instead. But an `image` *nested inside a mark*
 * (`emphasis`/`strong`/`link`, e.g. `**![alt](src)**`) has no valid inline
 * representation — the schema's `image` node is a block atom, not part of
 * the `inline*` group `mapInline` builds — so it's treated as unsupported
 * here, routing the containing paragraph/heading to `preserved` instead of
 * letting `mapInline`'s image branch emit a schema-invalid inline block.
 * `inMark` tracks whether we're already recursing inside a mark; it's only
 * ever `true` for calls made from the `emphasis`/`strong`/`link` cases
 * below, never for the top-level call from `mapBlock`.
 */
function hasUnsupportedInline(node: PhrasingContent, inMark = false): boolean {
  switch (node.type) {
    case "text":
    case "inlineCode":
    case "break":
      return false;
    case "image":
      return inMark;
    case "emphasis":
    case "strong":
      return (node as Emphasis | Strong).children.some((c) =>
        hasUnsupportedInline(c, true),
      );
    case "link":
      return (node as Link).children.some((c) => hasUnsupportedInline(c, true));
    case "mdxJsxTextElement": {
      const el = node as MdxJsxTextElement;
      return !(el.name && el.name in KNOWN_INLINE);
    }
    default:
      return true;
  }
}

function mapInlineChildren(
  children: PhrasingContent[],
  activeMarks: PMMark[] = [],
): PMNodeJSON[] {
  const out: PMNodeJSON[] = [];
  for (const child of children) {
    out.push(...mapInline(child, activeMarks));
  }
  return out;
}

function mapInline(node: PhrasingContent, activeMarks: PMMark[]): PMNodeJSON[] {
  switch (node.type) {
    case "text": {
      const n = node as Text;
      const pm: PMNodeJSON = { type: "text", text: n.value };
      if (activeMarks.length > 0) pm.marks = activeMarks;
      return [pm];
    }
    case "emphasis": {
      const n = node as Emphasis;
      return mapInlineChildren(n.children, [
        ...activeMarks,
        { type: "italic" },
      ]);
    }
    case "strong": {
      const n = node as Strong;
      return mapInlineChildren(n.children, [...activeMarks, { type: "bold" }]);
    }
    case "inlineCode": {
      const n = node as InlineCode;
      return [
        {
          type: "text",
          text: n.value,
          marks: [...activeMarks, { type: "code" }],
        },
      ];
    }
    case "link": {
      const n = node as Link;
      const mark: PMMark = {
        type: "link",
        attrs: { href: n.url, title: n.title ?? null },
      };
      return mapInlineChildren(n.children, [...activeMarks, mark]);
    }
    case "break":
      void (node as Break);
      return [{ type: "hardBreak" }];
    case "image":
      // Not reachable in practice: `hasUnsupportedInline` now treats an
      // `image` nested inside a mark (e.g. `**![alt](src)**`) as
      // unsupported, so `mapBlock`'s paragraph/heading cases route the
      // whole containing block to `preserved` before `mapInlineChildren`
      // ever sees it (there's no clean inline representation for a
      // block-level atom). Kept as a defensive fallback — mapping it to the
      // image block shape favors fidelity over strict schema-validity
      // rather than silently dropping it — in case a future caller invokes
      // `mapInline` directly without that guard.
      return [mapImage(node as Image)];
    case "mdxJsxTextElement": {
      const n = node as MdxJsxTextElement;
      if (n.name && n.name in KNOWN_INLINE) {
        return [
          {
            type: "shortcut",
            attrs: { keys: readStringAttr(n.attributes, "keys") ?? "" },
          },
        ];
      }
      // Unhandled here: containsUnknownInlineJsx should have routed the
      // whole paragraph to `preserved` before we ever reach this branch.
      return [preserve(node)];
    }
    default:
      // Any other phrasing node this module doesn't model (e.g. footnote
      // references) — preserve rather than drop.
      return [preserve(node)];
  }
}

/**
 * Maps an mdast `Root` to ProseMirror `doc` JSON, splitting a leading
 * `yaml` frontmatter node out as a separate raw string.
 */
export function mdastToDoc(root: Root): {
  doc: PMNodeJSON;
  frontmatter: string | null;
} {
  const children = root.children;
  const first = children[0];
  let frontmatter: string | null = null;
  let bodyChildren = children;
  if (first && isYamlNode(first)) {
    frontmatter = first.value;
    bodyChildren = children.slice(1);
  }

  const content = mapBlocks(bodyChildren);

  return {
    doc: { type: "doc", content },
    frontmatter,
  };
}
