import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import remarkMdx from "remark-mdx";
import remarkGfm from "remark-gfm";
import remarkFrontmatter from "remark-frontmatter";
import { mdxJsxToMarkdown } from "mdast-util-mdx-jsx";
import type { Handle } from "mdast-util-to-markdown";
import type { Root } from "mdast";

/**
 * The stock `mdast-util-mdx-jsx` stringify handler for a JSX *flow* element
 * (e.g. `<Notes>…</Notes>`). We wrap, rather than replace, it so all of its
 * attribute/quote/indent logic is preserved verbatim.
 */
const baseFlowHandler = mdxJsxToMarkdown().handlers!
  .mdxJsxFlowElement as Handle;

/** Minimal shape of the mdast position data we read off a node. */
interface WithPosition {
  position?: { start: { line: number }; end: { line: number } };
}

/**
 * The line a JSX flow element's OPENING TAG ends on.
 *
 * mdast records only where the element starts. Prettier writes a tag too long
 * for the line with one attribute per line and the `>` on a line of its own:
 *
 *     <Callout
 *       type="warning"
 *       title="No focus trap, and Escape does not close this modal"
 *     >
 *       The export modal is a plain overlay …
 *     </Callout>
 *
 * Measured from the element's start, that tag's first child looked three
 * lines away — as if a blank line separated them — so the round trip wrote
 * the blank lines in, Prettier then read the children as markdown rather
 * than as the JSX block it had formatted, and the file never round-tripped
 * (`accessibility/modals-and-menus.mdx`, `demo/uishot-test.mdx`,
 * 2026-10-26). The attributes carry positions: when the last one sits on a
 * later line than the element's start, the tag is in that wrapped form and
 * its `>` is on the line after.
 */
function openingTagEndLine(node: {
  attributes?: WithPosition[];
  position?: WithPosition["position"];
}): number {
  const start = node.position?.start.line ?? 0;
  let lastAttributeLine = start;
  for (const attribute of node.attributes ?? []) {
    const line = attribute.position?.end.line;
    if (line !== undefined && line > lastAttributeLine)
      lastAttributeLine = line;
  }
  return lastAttributeLine > start ? lastAttributeLine + 1 : start;
}

/**
 * Decide whether a JSX flow element's block children were separated from the
 * opening/closing tags by a blank line in the source, so we can reproduce it.
 *
 * `mdast-util-mdx-jsx` discards this separation on stringify, which is the
 * root cause of the corruption below. When source positions are available
 * (the round-trip case), we read them directly: a >= 2 line gap between the
 * tag and the adjacent child means a blank line was present. For synthesized
 * trees with no position (e.g. content freshly built by the editor), we fall
 * back to a structural rule: anything other than a single lone paragraph
 * gets separated, so lists never risk being flattened.
 */
function blankLinePlan(node: {
  children: WithPosition[];
  attributes?: WithPosition[];
  position?: WithPosition["position"];
}): { lead: boolean; trail: boolean } {
  const children = node.children;
  const first = children[0];
  const last = children[children.length - 1];
  const np = node.position;
  const fp = first?.position;
  const lp = last?.position;

  if (np && fp && lp) {
    return {
      lead: fp.start.line - openingTagEndLine(node) >= 2,
      trail: np.end.line - lp.end.line >= 2,
    };
  }

  const soleParagraph =
    children.length === 1 && (first as { type?: string }).type === "paragraph";
  return { lead: !soleParagraph, trail: !soleParagraph };
}

/**
 * Custom stringify handler for JSX flow elements that restores the blank-line
 * separation between block-level children and the opening/closing tags.
 *
 * Why this exists: `mdast-util-mdx-jsx` serializes a flow element's block
 * children flush against the tags and drops the blank lines the source had:
 *
 *     <Notes>
 *       - Item one.
 *       - Item two.
 *     </Notes>
 *
 * When the editor's write path then re-formats that output with Prettier
 * (`parser: "mdx"`), Prettier no longer recognizes the `-` lines as a list
 * and reflows every item into a single run-on paragraph with literal "- "
 * embedded mid-line — real content corruption on save. Running Prettier
 * *directly* on the original source keeps the list, because the source has
 * the blank lines, and Prettier preserves (does not canonicalize) that
 * separation. So reproducing the source's separation makes the editor's
 * write path agree with a plain Prettier pass.
 *
 * We re-introduce exactly what Prettier needs: a blank line after the opening
 * tag and before the closing tag, but only where the source had one (see
 * `blankLinePlan`). Indentation is left untouched (Prettier canonicalizes it
 * on its own). This only fires for flow elements whose opening tag is a
 * single line (always true for this corpus, where `printWidth` is unbounded
 * so attributes never wrap) and that have serialized block children.
 */
const mdxJsxFlowElementWithBlankLines: Handle = (node, parent, state, info) => {
  const value = baseFlowHandler(node, parent, state, info);

  // `node` is loosely typed (`any`) via `Handle`; read the fields we need.
  const name: string = node.name ?? "";
  const children: WithPosition[] = node.children ?? [];
  if (children.length === 0) return value;

  const closeTag = `</${name}>`;
  // Self-closing elements and any unexpected shape: leave untouched.
  if (!value.endsWith(closeTag)) return value;

  const firstNewline = value.indexOf("\n");
  // No newline => inline single-line serialization, nothing to separate.
  if (firstNewline === -1) return value;

  // Guard: only act when the opening tag occupies exactly the first line
  // (i.e. it ends with `>`). If attributes ever wrapped onto their own
  // lines, the first newline would fall mid-tag and we must not touch it.
  const firstLine = value.slice(0, firstNewline);
  if (!firstLine.trimEnd().endsWith(">")) return value;

  const { lead, trail } = blankLinePlan(node);
  if (!lead && !trail) return value;

  let out = value;

  // 1. Blank line after the opening tag.
  if (lead) {
    out = `${firstLine}\n${out.slice(firstNewline)}`;
  }

  // 2. Blank line before the closing tag. The serialization ends with
  //    `\n<indent></Name>`; turn that single newline into a blank line,
  //    preserving whatever indentation preceded the closing tag.
  if (trail) {
    const beforeClose = out.slice(0, out.length - closeTag.length);
    const lastNewline = beforeClose.lastIndexOf("\n");
    if (lastNewline !== -1) {
      const closingIndent = beforeClose.slice(lastNewline + 1);
      out = `${beforeClose.slice(0, lastNewline)}\n\n${closingIndent}${closeTag}`;
    }
  }

  return out;
};

/**
 * A unified processor configured to both PARSE and STRINGIFY the manual's
 * MDX dialect: GitHub-flavored markdown + MDX (JSX components + ESM) + YAML
 * frontmatter. The same processor instance is used for both directions so the
 * micromark/toMarkdown extensions registered by each plugin apply to parse and
 * stringify alike.
 */
export function createProcessor() {
  return unified()
    .use(remarkParse)
    .use(remarkStringify, {
      bullet: "-",
      emphasis: "_",
      strong: "*",
      rule: "-",
      fences: true,
      // Override the JSX-flow handler so nested block children (esp. lists)
      // stay blank-line separated and survive Prettier's re-format pass.
      // This is applied *after* remark-mdx registers its own handler, so it
      // wins (see mdast-util-to-markdown `configure`).
      handlers: {
        mdxJsxFlowElement: mdxJsxFlowElementWithBlankLines,
      },
    })
    .use(remarkFrontmatter, ["yaml"])
    .use(remarkGfm)
    .use(remarkMdx);
}

export function parseMdx(source: string): Root {
  return createProcessor().parse(source) as Root;
}

/** Minimal shape of an mdast node for the walk below. */
interface WalkNode {
  type: string;
  value?: string;
  children?: WalkNode[];
}

/**
 * Write the soft line break before an inline JSX element as a space.
 *
 * Why: the editor's write path runs its output through Prettier
 * (`formatMdx`), and Prettier's `mdx` parser keeps MDX 1 semantics — a line
 * that BEGINS with a JSX tag starts a JSX block, even in the middle of a
 * paragraph. A paragraph stringified as
 *
 *     It also has **no Escape handler** —{" "}
 *     <Shortcut client:load keys="esc" /> leaves it open.
 *
 * therefore comes back from Prettier with a blank line before `<Shortcut`:
 * one paragraph has become two — a real content change on a save that was
 * only asked to open the page (`accessibility/modals-and-menus.mdx`,
 * 2026-10-26). remark itself is fine (the tag continues the paragraph, as
 * MDX 2 reads it); only Prettier's reading differs, so the serializer never
 * hands it that shape. A soft break and a space render identically, so the
 * break before an inline JSX element becomes a space. Expressions
 * (`{" "}`) and text at line start are left alone: Prettier reads them as
 * paragraph content.
 */
function joinSoftBreaksBeforeInlineJsx(node: WalkNode): void {
  const children = node.children;
  if (!children) return;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    const next = children[i + 1];
    if (
      child.type === "text" &&
      typeof child.value === "string" &&
      child.value.endsWith("\n") &&
      next?.type === "mdxJsxTextElement"
    ) {
      child.value = `${child.value.slice(0, -1)} `;
    }
    joinSoftBreaksBeforeInlineJsx(child);
  }
}

export function stringifyMdx(tree: Root): string {
  // Clone so the caller's tree (the adapter's, or a parse the caller may
  // still inspect) is not rewritten under it.
  const copy = structuredClone(tree) as Root & WalkNode;
  joinSoftBreaksBeforeInlineJsx(copy);
  return createProcessor().stringify(copy);
}

export function roundTrip(source: string): string {
  return stringifyMdx(parseMdx(source));
}
