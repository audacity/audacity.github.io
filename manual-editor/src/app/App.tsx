import { useEffect, useState } from "react";
import { api as defaultApi, type makeApi } from "./api";
import { Editor } from "./Editor";
import { PageList } from "./PageList";
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
    </div>
  );
}
