/**
 * `serializeFrontmatter` — the canonical mdast-adjacent YAML frontmatter
 * writer for manual pages.
 *
 * Counterpart to `../backend/frontmatter.ts`'s `parseFrontmatter` (the
 * "read" side): this is the "write" side the `FrontmatterForm` state feeds,
 * and what D6's save path uses in place of the original raw frontmatter
 * string so metadata edits (title/section/order/etc) actually persist.
 *
 * Pure module (no React) — it belongs alongside the other structural
 * serialization in `src/adapter` even though it doesn't touch mdast/PM
 * shapes directly.
 */

/** Matches the manual content collection's schema (`src/content/config.ts` in the main repo). */
export interface FrontmatterData {
  title: string;
  description?: string;
  section: string;
  sectionOrder?: number;
  order?: number;
  draft?: boolean;
}

/** `sectionOrder`/`order` both default to 99 in the collection schema. */
const DEFAULT_ORDER = 99;

/** Leading characters that give a plain (unquoted) YAML scalar a different meaning. */
const LEADING_SPECIAL = /^[#\-?:,[\]{}&*!|>'"%@`]/;

/** A colon immediately followed by whitespace (or at end of string) starts a mapping in flow context. */
const COLON_BREAK = /:(\s|$)/;

/** `#` preceded by whitespace starts a comment even mid-scalar. */
const COMMENT_BREAK = /\s#/;

/** Scalars that would otherwise parse back as a different YAML type. */
const RESERVED_WORDS = new Set(["true", "false", "null", "~", ""]);

/** A bare integer or float would parse back as a number, not a string. */
const NUMBER_LIKE = /^-?\d+(\.\d+)?$/;

/**
 * Whether a scalar string needs quoting to round-trip as a string through
 * `parseFrontmatter`'s flat YAML reader (and, not incidentally, through any
 * real YAML parser — these are all standard "plain scalar" hazards).
 */
function needsQuoting(value: string): boolean {
  if (RESERVED_WORDS.has(value)) return true;
  if (NUMBER_LIKE.test(value)) return true;
  if (/^\s|\s$/.test(value)) return true; // leading/trailing space
  if (LEADING_SPECIAL.test(value)) return true;
  if (COLON_BREAK.test(value)) return true;
  if (COMMENT_BREAK.test(value)) return true;
  return false;
}

/** Double-quotes a scalar, escaping backslashes and embedded double quotes. */
function quote(value: string): string {
  const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `"${escaped}"`;
}

/** Renders a string scalar, quoting only when required (see `needsQuoting`). */
function scalar(value: string): string {
  return needsQuoting(value) ? quote(value) : value;
}

/**
 * Serializes `data` to a `---\n...\n---\n` YAML frontmatter block, with keys
 * in a fixed order: title, description, section, sectionOrder, order, draft.
 *
 * Omission rules (deliberately asymmetric with the schema's defaults, to
 * match how the existing corpus is hand-authored — see the task report):
 * - `title`/`section` are required by the schema and always emitted.
 * - `description` is omitted entirely when empty/undefined (most corpus
 *   files with no description simply have no line, rather than `""`).
 * - `sectionOrder`/`order` are omitted when equal to the schema default
 *   (99) and emitted as bare unquoted numbers otherwise, keeping freshly
 *   authored files as clean as hand-written ones.
 * - `draft` is omitted when false/undefined and emitted as `draft: true`
 *   only when true, matching the corpus convention where the vast majority
 *   of files have no `draft` line at all.
 */
export function serializeFrontmatter(data: FrontmatterData): string {
  const lines: string[] = [];

  lines.push(`title: ${scalar(data.title)}`);

  if (data.description) {
    lines.push(`description: ${scalar(data.description)}`);
  }

  lines.push(`section: ${scalar(data.section)}`);

  if (data.sectionOrder != null && data.sectionOrder !== DEFAULT_ORDER) {
    lines.push(`sectionOrder: ${data.sectionOrder}`);
  }

  if (data.order != null && data.order !== DEFAULT_ORDER) {
    lines.push(`order: ${data.order}`);
  }

  if (data.draft) {
    lines.push(`draft: true`);
  }

  return `---\n${lines.join("\n")}\n---\n`;
}
