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
import { type JsxAttr, KNOWN_FLOW } from "./registry";
import type { PMNodeJSON } from "./mdastToDoc";

const ASSET_REPO_PREFIX = "src/assets/img/manual/";

/**
 * Converts a repo-relative image path (`src/assets/img/manual/…`) to a
 * path relative to the MDX file's directory. Astro/Rollup requires relative
 * or public-URL image paths in MDX; a bare `src/assets/…` is treated as a
 * module specifier and fails at build time if the file isn't on the exact
 * branch being built — e.g. on the base branch before a drafts PR is merged.
 *
 * Example: page at `src/content/manual/basics/foo.mdx`, image at
 * `src/assets/img/manual/basics/foo/shot.webp` →
 * `../../../assets/img/manual/basics/foo/shot.webp`.
 */
function assetRepoPathToRelative(pagePath: string, imagePath: string): string {
  const pageDir = pagePath.slice(0, pagePath.lastIndexOf("/"));
  const fromParts = pageDir.split("/");
  const toParts = imagePath.split("/");
  let common = 0;
  while (
    common < fromParts.length &&
    common < toParts.length &&
    fromParts[common] === toParts[common]
  ) {
    common++;
  }
  const ups = fromParts
    .slice(common)
    .map(() => "..")
    .join("/");
  const rest = toParts.slice(common).join("/");
  return ups ? `${ups}/${rest}` : rest;
}

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
function mapBlocksBack(nodes: PMNodeJSON[], pagePath?: string): RootContent[] {
  return nodes.map((n) => mapBlockBack(n, pagePath));
}

/** Same as `mapBlocksBack`, but typed for the narrower `BlockContent | DefinitionContent` slots (blockquote/listItem/JSX children). Every branch of `mapBlockBack` only ever produces node types that are valid there. */
function mapBlockChildren(
  nodes: PMNodeJSON[],
  pagePath?: string,
): (BlockContent | DefinitionContent)[] {
  return mapBlocksBack(nodes, pagePath) as (BlockContent | DefinitionContent)[];
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
function mapListItemBack(node: PMNodeJSON, pagePath?: string): ListItem {
  return {
    type: "listItem",
    spread: false,
    children: mapBlockChildren(node.content ?? [], pagePath),
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
function mapImageBack(node: PMNodeJSON, pagePath?: string): Paragraph {
  const attrs = attrsOf(node);
  let url = attrs.src as string;
  if (
    pagePath &&
    typeof url === "string" &&
    url.startsWith(ASSET_REPO_PREFIX)
  ) {
    url = assetRepoPathToRelative(pagePath, url);
  }
  const image: Image = {
    type: "image",
    url,
    alt: (attrs.alt as string | null | undefined) ?? null,
    title: (attrs.title as string | null | undefined) ?? null,
  };
  return { type: "paragraph", children: [image] };
}

function mapBlockBack(node: PMNodeJSON, pagePath?: string): RootContent {
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
        children: mapBlockChildren(node.content ?? [], pagePath),
      };
    case "bulletList":
      return {
        type: "list",
        ordered: false,
        spread: false,
        children: (node.content ?? []).map((n) => mapListItemBack(n, pagePath)),
      };
    case "orderedList": {
      const attrs = attrsOf(node);
      const start = typeof attrs.start === "number" ? attrs.start : 1;
      const list: List = {
        type: "list",
        ordered: true,
        start,
        spread: false,
        children: (node.content ?? []).map((n) => mapListItemBack(n, pagePath)),
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
      return mapImageBack(node, pagePath);
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
        children: mapBlockChildren(node.content ?? [], pagePath),
      };
      return el;
    }
    case "tabs": {
      const el: MdxJsxFlowElement = {
        type: "mdxJsxFlowElement",
        name: "Tabs",
        attributes: [],
        children: mapBlockChildren(node.content ?? [], pagePath),
      };
      return el;
    }
    case "tab": {
      const attrs = attrsOf(node);
      const el: MdxJsxFlowElement = {
        type: "mdxJsxFlowElement",
        name: "Tab",
        attributes: buildJsxAttributes(["label"], attrs),
        children: mapBlockChildren(node.content ?? [], pagePath),
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

/**
 * Rebuilds a run of PM inline nodes into mdast phrasing content, restoring the
 * mark NESTING that C2 flattened away.
 *
 * C2 (`mdastToDoc`) flattens `strong > emphasis > text` — and, crucially, a
 * *mark that wraps several siblings* like `strong > [inlineCode, text,
 * inlineCode]` (`**\`x\`, \`y\`**`) — into a flat list of PM leaves, each
 * carrying the same `marks` array recorded outer-to-inner (C2's
 * "emphasis"/"strong"/"link" cases each *append* to `activeMarks` as they
 * recurse inward, so index 0 is the outermost mark). Marks are also carried
 * onto non-text atoms (`hardBreak`, `shortcut`) so they stay inside their
 * wrapping mark.
 *
 * A naive per-leaf inversion would wrap EACH leaf in its own `strong`/`link`,
 * turning `**\`x\`, \`y\`**` into `**\`x\`****, ****\`y\`**` — reordered,
 * over-escaped, not byte-identical. Instead we group: at each nesting depth,
 * consecutive leaves sharing the same mark (same type AND attrs) are wrapped
 * together under a single mdast node, then we recurse one level deeper. This
 * is the exact inverse of C2's flattening and reproduces the source's mark
 * structure — one `strong` around all four code spans, one `link` around a
 * multi-word label, etc.
 *
 * `code` is NOT a wrapping level: C2's "inlineCode" case appends a `code` mark
 * onto the leaf and stops (an inline code span has no marks *inside* it), so
 * `code` identifies the leaf itself as an `inlineCode` node. It's filtered out
 * of the wrapping marks and consulted only when building the leaf.
 */
function mapInlineChildrenBack(nodes: PMNodeJSON[]): PhrasingContent[] {
  return buildInlineRun(nodes, 0);
}

/** The wrapping (non-`code`) marks of a PM inline node, outermost first. */
function wrapMarksOf(node: PMNodeJSON): PMMark[] {
  return (node.marks ?? []).filter((m) => m.type !== "code");
}

/** Stable identity for a mark (type + attrs) so runs group by exact equality. */
function markKey(mark: PMMark): string {
  return `${mark.type}:${JSON.stringify(mark.attrs ?? null)}`;
}

/**
 * Groups `nodes` (all of which already share the same marks at indices
 * `0..depth-1`) by the mark at `depth`: each maximal run of consecutive nodes
 * with the same `depth`-th wrapping mark is wrapped under one mdast node and
 * recursed into at `depth + 1`; nodes with no mark at `depth` become leaves.
 */
function buildInlineRun(nodes: PMNodeJSON[], depth: number): PhrasingContent[] {
  const out: PhrasingContent[] = [];
  let i = 0;
  while (i < nodes.length) {
    const marks = wrapMarksOf(nodes[i]!);
    if (marks.length <= depth) {
      out.push(inlineLeaf(nodes[i]!));
      i++;
      continue;
    }
    const mark = marks[depth]!;
    const key = markKey(mark);
    let j = i + 1;
    while (j < nodes.length) {
      const m = wrapMarksOf(nodes[j]!);
      if (m.length <= depth || markKey(m[depth]!) !== key) break;
      j++;
    }
    const children = buildInlineRun(nodes.slice(i, j), depth + 1);
    out.push(wrapMark(mark, children));
    i = j;
  }
  return out;
}

/** Builds the innermost mdast leaf for a PM inline node (no wrapping marks left). */
function inlineLeaf(node: PMNodeJSON): PhrasingContent {
  switch (node.type) {
    case "text": {
      const hasCode = (node.marks ?? []).some((m) => m.type === "code");
      if (hasCode) {
        const inlineCode: InlineCode = {
          type: "inlineCode",
          value: node.text ?? "",
        };
        return inlineCode;
      }
      const text: Text = { type: "text", value: node.text ?? "" };
      return text;
    }
    case "hardBreak": {
      const brk: Break = { type: "break" };
      return brk;
    }
    case "shortcut":
      return shortcutBack(node);
    default:
      throw new Error(`docToMdast: unknown inline PM node type "${node.type}"`);
  }
}

/**
 * Rebuilds a `shortcut` PM node into its `<Shortcut ... />` mdast element,
 * re-emitting the stored attribute list in its original order (see C2's
 * `jsxAttrsToPairs` and the `shortcut` schema node) so every attribute —
 * including Astro's valueless `client:load` directive (value `null`) — is
 * reproduced byte-identically. `value: null` stringifies as a bare valueless
 * attribute; a string stringifies as `name="value"`.
 */
function shortcutBack(node: PMNodeJSON): MdxJsxTextElement {
  const pairs = (attrsOf(node).attributes as JsxAttr[] | undefined) ?? [];
  return {
    type: "mdxJsxTextElement",
    name: "Shortcut",
    attributes: pairs.map((p) => ({
      type: "mdxJsxAttribute",
      name: p.name,
      value: p.value,
    })),
    children: [],
  };
}

/** Wraps a run of phrasing children under a single mdast mark node. */
function wrapMark(mark: PMMark, children: PhrasingContent[]): PhrasingContent {
  switch (mark.type) {
    case "bold": {
      const strong: Strong = { type: "strong", children };
      return strong;
    }
    case "italic": {
      const emphasis: Emphasis = { type: "emphasis", children };
      return emphasis;
    }
    case "link": {
      const attrs = mark.attrs ?? {};
      const link: Link = {
        type: "link",
        url: attrs.href as string,
        title: (attrs.title as string | null | undefined) ?? null,
        children,
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
export function docToMdast(
  doc: PMNodeJSON,
  frontmatter: string | null,
  pagePath?: string,
): Root {
  const children: RootContent[] = [];
  if (frontmatter != null) {
    const yaml: Yaml = { type: "yaml", value: frontmatter };
    children.push(yaml);
  }
  children.push(...mapBlocksBack(doc.content ?? [], pagePath));
  return { type: "root", children };
}

/**
 * The full fidelity-safe write path: PM doc JSON -> mdast -> MDX source,
 * normalized with the repo's Prettier config so editor output matches
 * hand-authored files.
 *
 * `pagePath` is the repo-relative path of the MDX file being saved
 * (e.g. `"src/content/manual/basics/foo.mdx"`). When provided, any
 * `src/assets/img/manual/…` image URLs stored in the PM doc are rewritten
 * to paths relative to that file before serialization, so Astro can resolve
 * them during `astro build` without Rollup import errors.
 */
export function docToSource(
  doc: PMNodeJSON,
  frontmatter: string | null,
  pagePath?: string,
): Promise<string> {
  return formatMdx(stringifyMdx(docToMdast(doc, frontmatter, pagePath)));
}
