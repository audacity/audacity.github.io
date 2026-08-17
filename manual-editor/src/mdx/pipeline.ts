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
      lead: fp.start.line - np.start.line >= 2,
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

export function stringifyMdx(tree: Root): string {
  return createProcessor().stringify(tree);
}

export function roundTrip(source: string): string {
  return stringifyMdx(parseMdx(source));
}
