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
            <Editor source={source} path={activePath} />
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
