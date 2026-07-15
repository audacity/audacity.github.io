import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import remarkMdx from "remark-mdx";
import remarkGfm from "remark-gfm";
import remarkFrontmatter from "remark-frontmatter";
import type { Root } from "mdast";

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
