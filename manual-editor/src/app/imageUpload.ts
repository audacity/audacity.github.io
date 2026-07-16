import type { Editor } from "@tiptap/core";
import type { makeApi } from "./api";

/**
 * Repo-relative prefix all manual content lives under (mirrors the same
 * local constant in `newPagePath.ts`, `treeDnd.ts`, `PageList.tsx`, `App.tsx`
 * — no shared constants module exists for it in this codebase).
 */
const MANUAL_PREFIX = "src/content/manual/";

/**
 * Derives the per-page upload folder slug from `Editor.tsx`'s `path` prop:
 * strips the `src/content/manual/` prefix and the trailing `.mdx`/`.md`
 * extension, e.g. `"src/content/manual/basics/installing-ffmpeg.mdx"` ->
 * `"basics/installing-ffmpeg"`. This is the `pageSlug` `api.uploadImage`
 * commits new images under (`src/assets/img/manual/<pageSlug>/<filename>` —
 * see `image.mts`).
 */
export function pageSlugFromPath(path: string): string {
  const rest = path.startsWith(MANUAL_PREFIX)
    ? path.slice(MANUAL_PREFIX.length)
    : path;
  return rest.replace(/\.mdx?$/, "");
}

/**
 * The paste/drop image flow: prompts for required alt text
 * (`window.prompt`, matching `linkShortcut.ts`'s ⌘K UX), uploads `file` via
 * `api.uploadImage`, and inserts an `image` node at the editor's current
 * selection carrying the returned repo-relative `src` and the trimmed alt
 * text. Called fire-and-forget from `Editor.tsx`'s `handlePaste`/
 * `handleDrop` (which must return synchronously to tell ProseMirror whether
 * the paste/drop was handled), so every path here resolves rather than
 * throws — callers that want the outcome can still `await`/`.then()` the
 * returned promise (as the tests do), but the editor wiring itself doesn't.
 *
 * - Non-image `file` (guarded by `file.type`): no-op, resolves `false` so
 *   `Editor.tsx` can fall through to default paste/drop handling (plain
 *   text, other file types, ...).
 * - Cancelled (`window.prompt` returns `null`) or blank/whitespace-only alt:
 *   no-op, resolves `false` — critically, WITHOUT uploading. Per the plan's
 *   "alt required ... cancel = no upload" constraint, the prompt gates the
 *   upload itself, not just the insert, so cancelling never leaves an
 *   orphaned committed image with no page reference.
 * - Upload/network failure: `window.alert`s a simple message (matching the
 *   app's existing no-toast-system precedent — see `App.tsx`'s inline
 *   publish-error text) and resolves `false`; no node is inserted.
 * - Success: inserts the `image` node and resolves `true`.
 */
export async function insertImageFromFile(
  editor: Editor,
  api: ReturnType<typeof makeApi>,
  pageSlug: string,
  file: File,
): Promise<boolean> {
  if (!file.type.startsWith("image/")) return false;

  // eslint-disable-next-line no-alert -- internal QA tooling, matches linkShortcut.ts's ⌘K prompt.
  const alt = window.prompt("Image description (alt text — required)", "");
  if (alt === null || alt.trim() === "") return false;

  try {
    const { path } = await api.uploadImage(pageSlug, file.name, file);
    editor
      .chain()
      .focus()
      .insertContent({
        type: "image",
        attrs: { src: path, alt: alt.trim() },
      })
      .run();
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // eslint-disable-next-line no-alert -- internal QA tooling, no toast system (see App.tsx's publish-error precedent).
    window.alert(`Image upload failed: ${message}`);
    return false;
  }
}
