/**
 * Pure path/slug helpers backing `NewPageDialog` — no React, no I/O, so
 * they're trivially unit-testable and reusable from the dialog's live
 * preview as well as its submit handler.
 */

/** All manual content lives under this repo-relative prefix. */
const MANUAL_PREFIX = "src/content/manual/";

/**
 * Slugifies a single path/title segment: NFKD-normalizes and strips
 * combining marks (so accented Latin characters fold to their plain
 * equivalent, e.g. "é" -> "e"), lowercases, replaces runs of anything
 * outside `[a-z0-9-]` with a single "-", then trims leading/trailing "-".
 * Falls back to `"page"` if the result would otherwise be empty (e.g. a
 * title that's entirely non-Latin punctuation/symbols).
 */
/** Unicode "Combining Diacritical Marks" block (U+0300-U+036F). */
const COMBINING_MARKS = /[\u0300-\u036f]/g;

export function slugify(input: string): string {
  const folded = input
    .normalize("NFKD")
    .replace(COMBINING_MARKS, "")
    .toLowerCase();
  const slug = folded
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || "page";
}

/**
 * Composes the repo-relative `.mdx` path for a new page. `folder` may be
 * nested (e.g. "audio-editing/effects"); each `/`-separated segment is
 * slugified independently and the `/` separators are preserved. Empty
 * segments (e.g. from a leading/trailing/doubled "/") are dropped.
 */
export function buildNewPagePath(folder: string, title: string): string {
  const folderSlug = folder
    .split("/")
    .map((segment) => slugify(segment))
    .filter((segment) => segment.length > 0)
    .join("/");
  const titleSlug = slugify(title);
  return `${MANUAL_PREFIX}${folderSlug}/${titleSlug}.mdx`;
}

/**
 * Extracts a page path's folder — the segment between `src/content/manual/`
 * and the file's basename — or `null` if the path isn't under that prefix
 * or has no folder (a file directly under `manual/`).
 */
function folderOf(path: string): string | null {
  if (!path.startsWith(MANUAL_PREFIX)) return null;
  const rest = path.slice(MANUAL_PREFIX.length);
  const lastSlash = rest.lastIndexOf("/");
  if (lastSlash === -1) return null;
  return rest.slice(0, lastSlash);
}

/** Unique folder prefixes present across `pages`, in first-seen order. */
export function existingFolders(pages: { path: string }[]): string[] {
  const folders = new Set<string>();
  for (const page of pages) {
    const folder = folderOf(page.path);
    if (folder !== null) folders.add(folder);
  }
  return [...folders];
}

/**
 * The next `order` value for a new page in `folder`: one past the current
 * max `order` among pages already in that folder, or `1` if the folder is
 * empty/unused.
 */
export function nextOrder(
  pages: { path: string; order: number }[],
  folder: string,
): number {
  const orders = pages
    .filter((page) => folderOf(page.path) === folder)
    .map((page) => page.order);
  if (orders.length === 0) return 1;
  return Math.max(...orders) + 1;
}

/**
 * The `sectionOrder` already in use for `section` (so a new page in an
 * existing section sorts alongside its siblings instead of resetting to the
 * schema default), or `undefined` if `section` doesn't exist yet.
 */
export function sectionOrderFor(
  pages: { section: string; sectionOrder: number }[],
  section: string,
): number | undefined {
  return pages.find((page) => page.section === section)?.sectionOrder;
}
