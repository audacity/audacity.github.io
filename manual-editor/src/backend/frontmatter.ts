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
    // A quoted scalar is always a string — e.g. `title: "42"` must stay the
    // string "42", not coerce to the number 42 — so type coercion below is
    // skipped once a quote is stripped.
    let wasQuoted = false;
    if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
      // Double-quoted YAML scalars support backslash escapes; unescape `\"`
      // and `\\` so a value serialized by `serializeFrontmatter` (which
      // escapes embedded quotes/backslashes when quoting is required) reads
      // back byte-identically instead of keeping the literal backslashes.
      value = value.slice(1, -1).replace(/\\(["\\])/g, "$1");
      wasQuoted = true;
    } else if (
      value.length >= 2 &&
      value.startsWith("'") &&
      value.endsWith("'")
    ) {
      value = value.slice(1, -1);
      wasQuoted = true;
    }
    if (wasQuoted) out[key] = value;
    else if (value === "true") out[key] = true;
    else if (value === "false") out[key] = false;
    else if (value !== "" && !Number.isNaN(Number(value)))
      out[key] = Number(value);
    else out[key] = value;
  }
  return out;
}
