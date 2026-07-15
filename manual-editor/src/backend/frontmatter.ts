import { parseMdx } from "../mdx/pipeline";

/**
 * Split YAML frontmatter from an MDX source. Uses the Plan 1 processor to
 * locate the frontmatter node (so this agrees with how the editor parses),
 * then parses the small, flat YAML by hand (the manual's frontmatter is only
 * scalar key: value pairs — title/description/section/sectionOrder/order/draft).
 */
export function parseFrontmatter(source: string): {
  data: Record<string, unknown>;
  body: string;
} {
  const tree = parseMdx(source);
  const first = tree.children[0];
  if (first && first.type === "yaml") {
    const yaml = (first as { value: string }).value;
    return { data: parseFlatYaml(yaml), body: stripFrontmatter(source) };
  }
  return { data: {}, body: source };
}

function stripFrontmatter(source: string): string {
  const m = source.match(/^---\n[\s\S]*?\n---\n?/);
  return m ? source.slice(m[0].length).replace(/^\n+/, "") : source;
}

function parseFlatYaml(yaml: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const raw of yaml.split("\n")) {
    const line = raw.trimEnd();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value: string = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (value === "true") out[key] = true;
    else if (value === "false") out[key] = false;
    else if (value !== "" && !Number.isNaN(Number(value)))
      out[key] = Number(value);
    else out[key] = value;
  }
  return out;
}
