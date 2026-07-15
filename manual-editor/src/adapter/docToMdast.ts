/**
 * `docToMdast` / `docToSource` — ProseMirror JSON -> mdast mapping, and the
 * full fidelity-safe write path built on top of it.
 *
 * The inverse of `mdastToDoc` (task C2, see `./mdastToDoc.ts`). Where C2 is
 * the "load" path (MDX source -> mdast -> PM doc JSON), this is the "save"
 * path (PM doc JSON -> mdast -> MDX source). It mirrors C2's type and
 * attribute decisions so a load/save cycle round-trips: known PM node types
 * rebuild the exact mdast shape C2 derived them from (attrs.start back onto
 * `List.start`, mark nesting inverted consistently, JSX attributes rebuilt
 * with nulls omitted), and `preserved` nodes return their stored mdast
 * subtree completely unchanged — the fidelity guarantee for anything the
 * editor doesn't understand.
 */
import type {
  BlockContent,
  Break,
  Code,
  DefinitionContent,
  Emphasis,
  Heading,
  Image,
  InlineCode,
  Link,
  List,
  ListItem,
  Paragraph,
  PhrasingContent,
  Root,
  RootContent,
  Strong,
  Text,
  ThematicBreak,
  Yaml,
} from "mdast";
import type {
  MdxJsxAttribute,
  MdxJsxFlowElement,
  MdxJsxTextElement,
} from "mdast-util-mdx-jsx";
import { formatMdx } from "../mdx/normalize";
import { stringifyMdx } from "../mdx/pipeline";
import { KNOWN_FLOW } from "./registry";
import type { PMNodeJSON } from "./mdastToDoc";

type PMMark = { type: string; attrs?: Record<string, unknown> };

/** Reads a `Record<string, unknown>` value, defaulting to `{}` for missing attrs. */
function attrsOf(node: PMNodeJSON): Record<string, unknown> {
  return node.attrs ?? {};
}

/**
 * Builds an mdast JSX attribute list from a PM node's attrs, in the order
 * given by `names` (which comes from the registry's `ComponentDescriptor`,
 * matching how C2 read them). Attrs that are `null`/absent are omitted
 * entirely rather than written out as `attr={null}` or `attr=""` — this is
 * what makes `<Notes>` (no known attrs) and a `<Callout type="tip">` with no
 * `title` round-trip without inventing attributes that weren't in the
 * source.
 */
function buildJsxAttributes(
  names: readonly string[],
  attrs: Record<string, unknown>,
): MdxJsxAttribute[] {
  const out: MdxJsxAttribute[] = [];
  for (const name of names) {
    const value = attrs[name];
    if (value == null) continue;
    out.push({ type: "mdxJsxAttribute", name, value: String(value) });
  }
  return out;
}

/**
 * Maps a run of PM block-level nodes back to mdast block content. Named
 * "back" (not `mapBlocks`) to keep it visually distinct from C2's
 * same-named-but-opposite-direction helper when both modules are open side
 * by side.
 */
function mapBlocksBack(nodes: PMNodeJSON[]): RootContent[] {
  return nodes.map(mapBlockBack);
}

/** Same as `mapBlocksBack`, but typed for the narrower `BlockContent | DefinitionContent` slots (blockquote/listItem/JSX children). Every branch of `mapBlockBack` only ever produces node types that are valid there. */
function mapBlockChildren(
  nodes: PMNodeJSON[],
): (BlockContent | DefinitionContent)[] {
  return mapBlocksBack(nodes) as (BlockContent | DefinitionContent)[];
}

/**
 * `spread: false` on both the list and each item is a deliberate,
 * currently-safe simplification (in the same spirit as C2's documented gap
 * for fenced-code `meta`): the PM schema has no attribute slot for mdast's
 * loose/tight list distinction, so it can't be carried through a load/save
 * cycle. Defaulting to tight (no blank lines between items) matches every
 * list in the manual corpus and is what `mdast-util-to-markdown` itself
 * assumes when `spread` is left unset only for *some* joins — leaving it
 * unset entirely makes it fall back to inserting blank lines between list
 * items, which is wrong for this corpus. See docToMdast.test.ts's
 * `docToSource` coverage and the manual corpus spot-check referenced in the
 * task report for how this was found.
 */
function mapListItemBack(node: PMNodeJSON): ListItem {
  return {
    type: "listItem",
    spread: false,
    children: mapBlockChildren(node.content ?? []),
  };
}

/**
 * `image` is a block-level atom in the PM schema (see `./schema.ts`), but
 * mdast's `image` node is phrasing (inline) content — it can only legally
 * appear as a paragraph's child, never as a bare block sibling (a bare
 * `Image` RootContent stringifies with no blank-line separation from its
 * neighbors, running text together; verified against `stringifyMdx`). C2's
 * `splitInlineWithImages` collapses "a paragraph consisting solely of an
 * image" down to a bare `image` PM block; this re-wraps it in a
 * single-child paragraph, which is exactly what remark-parse itself
 * produces for a standalone `![alt](src)` line — the precise inverse.
 */
function mapImageBack(node: PMNodeJSON): Paragraph {
  const attrs = attrsOf(node);
  const image: Image = {
    type: "image",
    url: attrs.src as string,
    alt: (attrs.alt as string | null | undefined) ?? null,
    title: (attrs.title as string | null | undefined) ?? null,
  };
  return { type: "paragraph", children: [image] };
}

function mapBlockBack(node: PMNodeJSON): RootContent {
  switch (node.type) {
    case "heading": {
      const attrs = attrsOf(node);
      const heading: Heading = {
        type: "heading",
        depth: (attrs.level as Heading["depth"] | undefined) ?? 1,
        children: mapInlineChildrenBack(node.content ?? []),
      };
      return heading;
    }
    case "paragraph": {
      const paragraph: Paragraph = {
        type: "paragraph",
        children: mapInlineChildrenBack(node.content ?? []),
      };
      return paragraph;
    }
    case "blockquote":
      return {
        type: "blockquote",
        children: mapBlockChildren(node.content ?? []),
      };
    case "bulletList":
      return {
        type: "list",
        ordered: false,
        spread: false,
        children: (node.content ?? []).map(mapListItemBack),
      };
    case "orderedList": {
      const attrs = attrsOf(node);
      const start = typeof attrs.start === "number" ? attrs.start : 1;
      const list: List = {
        type: "list",
        ordered: true,
        start,
        spread: false,
        children: (node.content ?? []).map(mapListItemBack),
      };
      return list;
    }
    case "codeBlock": {
      const attrs = attrsOf(node);
      const code: Code = {
        type: "code",
        lang: (attrs.language as string | null | undefined) ?? null,
        value: node.content?.[0]?.text ?? "",
      };
      return code;
    }
    case "image":
      return mapImageBack(node);
    case "horizontalRule": {
      const rule: ThematicBreak = { type: "thematicBreak" };
      return rule;
    }
    case "admonition": {
      const attrs = attrsOf(node);
      const component = attrs.component as string;
      const descriptor = KNOWN_FLOW[component as keyof typeof KNOWN_FLOW];
      const el: MdxJsxFlowElement = {
        type: "mdxJsxFlowElement",
        name: component,
        attributes: buildJsxAttributes(descriptor?.attrs ?? [], attrs),
        children: mapBlockChildren(node.content ?? []),
      };
      return el;
    }
    case "tabs": {
      const el: MdxJsxFlowElement = {
        type: "mdxJsxFlowElement",
        name: "Tabs",
        attributes: [],
        children: mapBlockChildren(node.content ?? []),
      };
      return el;
    }
    case "tab": {
      const attrs = attrsOf(node);
      const el: MdxJsxFlowElement = {
        type: "mdxJsxFlowElement",
        name: "Tab",
        attributes: buildJsxAttributes(["label"], attrs),
        children: mapBlockChildren(node.content ?? []),
      };
      return el;
    }
    case "preserved":
      // Fidelity guarantee: return the stored mdast subtree verbatim, no
      // reconstruction. See module doc comment.
      return attrsOf(node).mdast as RootContent;
    default:
      throw new Error(`docToMdast: unknown block PM node type "${node.type}"`);
  }
}

function mapInlineChildrenBack(nodes: PMNodeJSON[]): PhrasingContent[] {
  return nodes.map(mapInlineBack);
}

function mapInlineBack(node: PMNodeJSON): PhrasingContent {
  switch (node.type) {
    case "text":
      return textToPhrasing(node);
    case "hardBreak": {
      const brk: Break = { type: "break" };
      return brk;
    }
    case "shortcut": {
      const attrs = attrsOf(node);
      const el: MdxJsxTextElement = {
        type: "mdxJsxTextElement",
        name: "Shortcut",
        attributes: [
          {
            type: "mdxJsxAttribute",
            name: "keys",
            value: (attrs.keys as string) ?? "",
          },
        ],
        children: [],
      };
      return el;
    }
    default:
      throw new Error(`docToMdast: unknown inline PM node type "${node.type}"`);
  }
}

/**
 * Rebuilds a single mark-bearing PM text node into its mdast phrasing
 * subtree. Mirrors C2's `mapInline`/`hasUnsupportedInline` design in
 * reverse: C2 flattens `emphasis > strong > text` (etc.) into one PM text
 * leaf whose `marks` array records the marks outer-to-inner (see C2's
 * `mapInline` "emphasis"/"strong"/"link" cases, which each *append* to
 * `activeMarks` as they recurse inward). To invert that, marks are applied
 * back onto the leaf from innermost (last in the array) to outermost
 * (first), which reconstructs the same nesting order — `[bold, italic]` on
 * the PM side becomes `strong > emphasis > text`, exactly the shape
 * `**_text_**` parses to.
 *
 * `code` is handled separately from the wrapping marks: C2's "inlineCode"
 * case doesn't recurse further (an inline code span has no marks *inside*
 * it), it just appends a `code` mark onto whatever `activeMarks` were
 * already active and stops. So a `code` mark identifies the *leaf itself*
 * as an `inlineCode` node (not a `text` node wrapped in something), and any
 * other marks alongside it (e.g. `**\`code\`**` -> `[bold, code]`) still
 * wrap that leaf normally.
 */
function textToPhrasing(node: PMNodeJSON): PhrasingContent {
  const marks: PMMark[] = node.marks ?? [];
  const hasCode = marks.some((m) => m.type === "code");
  const wrapMarks = marks.filter((m) => m.type !== "code");

  let leaf: PhrasingContent;
  if (hasCode) {
    const inlineCode: InlineCode = {
      type: "inlineCode",
      value: node.text ?? "",
    };
    leaf = inlineCode;
  } else {
    const text: Text = { type: "text", value: node.text ?? "" };
    leaf = text;
  }

  for (let i = wrapMarks.length - 1; i >= 0; i--) {
    leaf = applyWrapMark(wrapMarks[i]!, leaf);
  }
  return leaf;
}

function applyWrapMark(mark: PMMark, child: PhrasingContent): PhrasingContent {
  switch (mark.type) {
    case "bold": {
      const strong: Strong = { type: "strong", children: [child] };
      return strong;
    }
    case "italic": {
      const emphasis: Emphasis = { type: "emphasis", children: [child] };
      return emphasis;
    }
    case "link": {
      const attrs = mark.attrs ?? {};
      const link: Link = {
        type: "link",
        url: attrs.href as string,
        title: (attrs.title as string | null | undefined) ?? null,
        children: [child],
      };
      return link;
    }
    default:
      throw new Error(`docToMdast: unknown mark type "${mark.type}"`);
  }
}

/**
 * Maps ProseMirror `doc` JSON back to an mdast `Root`, reattaching the raw
 * frontmatter string (if any) as a leading `yaml` node — the inverse of
 * `mdastToDoc` splitting it out.
 */
export function docToMdast(doc: PMNodeJSON, frontmatter: string | null): Root {
  const children: RootContent[] = [];
  if (frontmatter != null) {
    const yaml: Yaml = { type: "yaml", value: frontmatter };
    children.push(yaml);
  }
  children.push(...mapBlocksBack(doc.content ?? []));
  return { type: "root", children };
}

/**
 * The full fidelity-safe write path: PM doc JSON -> mdast -> MDX source,
 * normalized with the repo's Prettier config so editor output matches
 * hand-authored files.
 */
export function docToSource(
  doc: PMNodeJSON,
  frontmatter: string | null,
): Promise<string> {
  return formatMdx(stringifyMdx(docToMdast(doc, frontmatter)));
}
