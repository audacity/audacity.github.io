import { useEffect, useState } from "react";
import { api as defaultApi, type makeApi } from "./api";
import { Editor } from "./Editor";
import { PageList } from "./PageList";
import { NewPageDialog } from "./NewPageDialog";
import type { ManualPageMeta } from "../backend/types";

export function App({
  api = defaultApi,
}: {
  /** Injectable for tests; defaults to the real fetch-backed client. */
  api?: ReturnType<typeof makeApi>;
} = {}) {
  const [pages, setPages] = useState<ManualPageMeta[] | null>(null);
  const [activePath, setActivePath] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [newPageDialogOpen, setNewPageDialogOpen] = useState(false);

  useEffect(() => {
    api.listPages().then(setPages);
  }, [api]);

  function handleSelect(path: string) {
    setActivePath(path);
    setSource(null);
    api.getPage(path).then((page) => setSource(page.source));
  }

  // After a successful autosave (see `Editor`'s debounce effect), re-fetch
  // the page list so the sidebar's `hasDraft` ● dot reflects the new draft.
  // Simplest-correct: the in-memory dev backend already recomputes
  // `hasDraft` on every `listPages()` call, so a re-fetch is always right
  // rather than trying to keep a locally-patched copy in sync.
  function handleDraftSaved(_path: string) {
    api.listPages().then(setPages);
  }

  // `NewPageDialog`'s submit handler: writes an empty draft doc at the
  // composed path, re-fetches the page list (so the new draft-only page
  // shows up in the sidebar per Task 1's `hasDraft`/draft-listing work),
  // then opens it in the editor the same way clicking a sidebar entry does.
  async function handleCreatePage({
    path,
    frontmatter,
  }: {
    path: string;
    frontmatter: string;
  }) {
    const emptyDoc = { type: "doc", content: [{ type: "paragraph" }] };
    await api.saveDraftDoc(path, emptyDoc, frontmatter);
    const fresh = await api.listPages();
    setPages(fresh);
    handleSelect(path);
    setNewPageDialogOpen(false);
  }

  // Unique section names across the loaded page list, in first-seen order —
  // offered to `FrontmatterForm` as autocomplete for the Section field so an
  // edit can reuse an existing section instead of retyping it.
  const sections = pages ? [...new Set(pages.map((p) => p.section))] : [];

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <h1 className="app-topbar__title">Audacity Manual Editor</h1>
        <div className="app-topbar__actions" />
      </header>
      <div className="app-body">
        <aside className="app-sidebar">
          <button
            type="button"
            className="app-sidebar__new-page-button"
            data-testid="new-page-button"
            disabled={pages === null}
            onClick={() => setNewPageDialogOpen(true)}
          >
            + New page
          </button>
          {pages === null ? (
            <p className="app-sidebar__loading">Loading…</p>
          ) : (
            <PageList
              pages={pages}
              onSelect={handleSelect}
              activePath={activePath}
            />
          )}
        </aside>
        <main className="app-main">
          {source !== null && activePath !== null ? (
            <Editor
              source={source}
              path={activePath}
              sections={sections}
              api={api}
              onDraftSaved={handleDraftSaved}
            />
          ) : (
            <p className="app-main__placeholder">
              Select a page from the list to start editing.
            </p>
          )}
        </main>
      </div>
      {newPageDialogOpen && pages !== null ? (
        <NewPageDialog
          pages={pages}
          onCreate={handleCreatePage}
          onCancel={() => setNewPageDialogOpen(false)}
        />
      ) : null}
    </div>
  );
}
