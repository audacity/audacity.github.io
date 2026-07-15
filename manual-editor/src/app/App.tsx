import { useEffect, useState } from "react";
import { api as defaultApi, type makeApi } from "./api";
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
    <div>
      <h1>Audacity Manual Editor</h1>
      {pages === null ? (
        <p>Loading…</p>
      ) : (
        <PageList
          pages={pages}
          onSelect={handleSelect}
          activePath={activePath}
        />
      )}
      {source !== null && <pre data-testid="raw-source">{source}</pre>}
    </div>
  );
}
