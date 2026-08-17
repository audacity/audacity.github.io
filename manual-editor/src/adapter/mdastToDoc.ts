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
import { type JsxAttr, KNOWN_FLOW, KNOWN_INLINE } from "./registry";
import { hasUIExampleVariant, uiExampleMeta } from "../uiExample/meta";

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

/**
 * Converts an mdxJsx element's `attributes` array into the flat
 * `{ name, value }[]` shape the `shortcut` PM node stores (see
 * `./registry.ts`), preserving source ORDER so the element re-serializes
 * byte-identically. Returns `null` — signalling "not round-trippable via this
 * simple shape, route to `preserved`" — if the element carries an attribute
 * expression (`attr={expr}`), a spread (`{...rest}`), or any non-string value,
 * none of which the known inline components use in this corpus but which would
 * otherwise be silently lost.
 */
function jsxAttrsToPairs(
  attributes: (MdxJsxFlowElement | MdxJsxTextElement)["attributes"],
): JsxAttr[] | null {
  const out: JsxAttr[] = [];
  for (const a of attributes) {
    if (a.type !== "mdxJsxAttribute") return null; // spread expression
    if (a.value === null || typeof a.value === "string") {
      out.push({ name: a.name, value: a.value });
    } else {
      return null; // attribute value expression
    }
  }
  return out;
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
      // A single-line admonition (`<Callout type="info">Hello there
      // </Callout>`, no blank lines around the body) parses as an inline
      // `mdxJsxTextElement` inside a paragraph rather than the block
      // `mdxJsxFlowElement` the blank-lined form produces. The editor's
      // OWN serializer emits exactly this form for an admonition whose
      // body is one paragraph (the stringifier's sole-paragraph rule), so
      // without this mapping a callout inserted in the editor became a
      // locked `preserved` block on the very next load. Map it as the
      // admonition it is; the round trip (admonition -> docToMdast ->
      // sole-paragraph stringify -> this mapping) is byte-stable.
      const soleAdmonition = mapSoleInlineAdmonition(n);
      if (soleAdmonition) return [soleAdmonition];
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

/**
 * A paragraph whose entire content is ONE inline JSX element of the
 * admonition family — the shape MDX produces for a single-line
 * `<Callout type="info">Hello there</Callout>` (an `mdxJsxTextElement`
 * inside a `paragraph`, unlike the blank-lined form's block-level
 * `mdxJsxFlowElement`). Whitespace-only text siblings around the element
 * are tolerated. Returns the mapped `admonition` PM node, or null when the
 * paragraph is anything else — including when the element's own children
 * contain inline content we can't represent (that case falls through to
 * the caller's preserve rule, keeping the fidelity guarantee).
 */
function mapSoleInlineAdmonition(n: Paragraph): PMNodeJSON | null {
  const significant = n.children.filter(
    (c) => !(c.type === "text" && (c as Text).value.trim() === ""),
  );
  if (significant.length !== 1) return null;
  const el = significant[0]!;
  if (el.type !== "mdxJsxTextElement") return null;
  const jsx = el as MdxJsxTextElement;
  const name = jsx.name;
  if (!name || !(name in KNOWN_FLOW)) return null;
  const descriptor = KNOWN_FLOW[name as keyof typeof KNOWN_FLOW];
  if (descriptor.pmType !== "admonition") return null;
  if (jsx.children.some((c) => hasUnsupportedInline(c))) return null;
  return {
    type: "admonition",
    attrs: {
      component: name,
      type: readStringAttr(jsx.attributes, "type"),
      title: readStringAttr(jsx.attributes, "title"),
    },
    content: splitInlineWithImages(jsx.children, (content) => ({
      type: "paragraph",
      content,
    })),
  };
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
    if (descriptor.pmType === "uiExample") {
      // Fidelity gate: only the exact shape the editor itself emits becomes
      // an editable node — a known component id, a known variant id, no
      // children, and no attributes beyond component/variant/interactive/
      // client:load (all simple, non-expression). Anything else routes to
      // `preserved` so hand-authored extras are never silently dropped.
      if (node.children.length > 0) return preserve(node);
      const pairs = jsxAttrsToPairs(node.attributes);
      const allowed = new Set([
        "component",
        "variant",
        "interactive",
        "client:load",
      ]);
      if (!pairs || pairs.some((p) => !allowed.has(p.name))) {
        return preserve(node);
      }
      const component = readStringAttr(node.attributes, "component");
      const variant = readStringAttr(node.attributes, "variant");
      const meta = component ? uiExampleMeta(component) : undefined;
      if (!meta || !variant || !hasUIExampleVariant(meta, variant)) {
        return preserve(node);
      }
      const interactive = pairs.some((p) => p.name === "interactive");
      return {
        type: "uiExample",
        attrs: { component, variant, interactive },
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
    case "link": {
      const link = node as Link;
      // A link with NO children (`[](url)` — an empty-text anchor, present in
      // the corpus as bare heading anchors) maps to a `link` mark applied to
      // zero inline nodes, i.e. the link is silently dropped entirely. There
      // is no valid inline PM representation for it (the mark has nothing to
      // attach to), so treat it as unsupported and route the containing
      // paragraph/heading to `preserved`, which re-emits the `[](url)`
      // verbatim rather than losing it.
      if (link.children.length === 0) return true;
      return link.children.some((c) => hasUnsupportedInline(c, true));
    }
    case "mdxJsxTextElement": {
      const el = node as MdxJsxTextElement;
      if (!(el.name && el.name in KNOWN_INLINE)) return true;
      // A known inline component (Shortcut) whose attributes can't be captured
      // as plain `{ name, value }` pairs (spread/expression attrs) can't
      // round-trip through the `shortcut` node's stored attr list, so preserve
      // the whole containing block rather than lose those attributes.
      return jsxAttrsToPairs(el.attributes) === null;
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
    case "break": {
      void (node as Break);
      const pm: PMNodeJSON = { type: "hardBreak" };
      // Carry active marks so a hard break inside emphasis/strong/link stays
      // grouped under that mark when docToMdast reconstructs the run.
      if (activeMarks.length > 0) pm.marks = activeMarks;
      return [pm];
    }
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
        const pairs = jsxAttrsToPairs(n.attributes);
        // `pairs === null` (non-serializable attrs) can't reach here: the
        // paragraph/heading's `hasUnsupportedInline` check routes such a
        // Shortcut to `preserved` before `mapInline` runs. Guard defensively
        // anyway — preserve rather than emit a lossy shortcut node.
        if (pairs === null) return [preserve(node)];
        // Store the FULL attribute list in source order (see the `shortcut`
        // schema node): this keeps Astro's valueless `client:load` directive
        // AND `keys` so `<Shortcut client:load keys="X"/>` round-trips
        // byte-identically instead of dropping `client:load`.
        const pm: PMNodeJSON = {
          type: "shortcut",
          attrs: { attributes: pairs },
        };
        // Carry active marks so a `<Shortcut>` nested inside emphasis/strong/
        // link (e.g. `**... <Shortcut .../>**`) stays grouped under that mark
        // when docToMdast reconstructs the inline run, instead of being pulled
        // out of the mark (which would reorder the `**`/`_` boundary).
        if (activeMarks.length > 0) pm.marks = activeMarks;
        return [pm];
      }
      // Unhandled here: hasUnsupportedInline should have routed the whole
      // paragraph to `preserved` before we ever reach this branch.
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
