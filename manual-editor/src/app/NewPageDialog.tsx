import { useState, type FormEvent } from "react";
import type { ManualPageMeta } from "../backend/types";
import { serializeFrontmatter } from "../adapter/frontmatterSerialize";
import {
  buildNewPagePath,
  existingFolders,
  nextOrder,
  sectionOrderFor,
  slugify,
  slugifyFolder,
} from "./newPagePath";

const SECTION_LIST_ID = "new-page-dialog-sections";
const LOCATION_LIST_ID = "new-page-dialog-locations";

/**
 * Modal form for creating a brand-new manual page. Mounted by `App.tsx`
 * behind the `+ New page` button; `pages` (the already-loaded page list)
 * supplies section/folder autocomplete, the next `order`/`sectionOrder` to
 * seed, and the collision check against every existing page path.
 *
 * On a valid submit, calls `onCreate({ path, frontmatter })` with a fully
 * composed repo-relative `.mdx` path and a `serializeFrontmatter` string —
 * the same shape `App.handleCreatePage` hands straight to
 * `api.saveDraftDoc`. Does not perform any I/O itself.
 */
export function NewPageDialog({
  pages,
  onCreate,
  onCancel,
}: {
  pages: ManualPageMeta[];
  onCreate: (result: { path: string; frontmatter: string }) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [section, setSection] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState<string | null>(null);

  const sections = [...new Set(pages.map((p) => p.section))];
  const folders = existingFolders(pages);

  // An unfilled Location falls back to the section's own slug, so a page in
  // a brand-new section lands in a same-named folder without the writer
  // having to type it twice. Slugify once here so the same canonical folder
  // is used both for the composed path and for `nextOrder`'s lookup below —
  // otherwise a raw, unslugified Location (e.g. "Audio Editing") would fail
  // to match the slugified folders already present in `pages`.
  const folderSlug = slugifyFolder(location.trim() || section);
  const path = buildNewPagePath(folderSlug, title);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedSection = section.trim();

    if (!trimmedTitle || !trimmedSection) {
      setError("Title and section are required.");
      return;
    }
    if (pages.some((p) => p.path === path)) {
      setError(`A page already exists at ${path}.`);
      return;
    }

    const frontmatter = serializeFrontmatter({
      title: trimmedTitle,
      section: trimmedSection,
      order: nextOrder(pages, folderSlug),
      sectionOrder: sectionOrderFor(pages, trimmedSection),
    });
    setError(null);
    onCreate({ path, frontmatter });
  }

  return (
    <div className="new-page-dialog__backdrop">
      <div
        className="new-page-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-page-dialog-heading"
        data-testid="new-page-dialog"
      >
        <h2 id="new-page-dialog-heading">New page</h2>
        <form onSubmit={handleSubmit}>
          <div className="new-page-dialog__field">
            <label htmlFor="new-page-title">Title</label>
            <input
              id="new-page-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="new-page-dialog__field">
            <label htmlFor="new-page-section">Section</label>
            <input
              id="new-page-section"
              type="text"
              required
              list={SECTION_LIST_ID}
              value={section}
              onChange={(e) => setSection(e.target.value)}
            />
            <datalist id={SECTION_LIST_ID}>
              {sections.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>

          <div className="new-page-dialog__field">
            <label htmlFor="new-page-location">Location</label>
            <input
              id="new-page-location"
              type="text"
              list={LOCATION_LIST_ID}
              placeholder={slugify(section)}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <datalist id={LOCATION_LIST_ID}>
              {folders.map((f) => (
                <option key={f} value={f} />
              ))}
            </datalist>
          </div>

          <p
            className="new-page-dialog__preview"
            data-testid="new-page-path-preview"
          >
            {path}
          </p>

          {error ? (
            <p
              className="new-page-dialog__error"
              role="alert"
              data-testid="new-page-error"
            >
              {error}
            </p>
          ) : null}

          <div className="new-page-dialog__actions">
            <button type="button" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit">Create</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewPageDialog;
