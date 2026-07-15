import { useEffect, useState } from "react";
import { api as defaultApi, type makeApi, type Me } from "./api";
import { Editor } from "./Editor";
import { PageList } from "./PageList";
import { NewPageDialog } from "./NewPageDialog";
import type { ManualPageMeta } from "../backend/types";

const MANUAL_PREFIX = "src/content/manual/";

/**
 * Strips the content-collection path prefix/extension to recover the slug —
 * mirrors `PageList.tsx`'s `activeSlugFromPath` (kept local rather than
 * shared since both are small and independently testable).
 */
function activeSlugFromPath(activePath: string | null): string | null {
  if (!activePath) return null;
  let slug = activePath;
  if (slug.startsWith(MANUAL_PREFIX)) {
    slug = slug.slice(MANUAL_PREFIX.length);
  }
  slug = slug.replace(/\.mdx?$/, "");
  return slug;
}

export function App({
  api = defaultApi,
  user,
}: {
  /** Injectable for tests; defaults to the real fetch-backed client. */
  api?: ReturnType<typeof makeApi>;
  /**
   * Supplied by `AuthGate` (see `main.tsx`) once `/api/auth-me` resolves;
   * optional here so `App.test.tsx`'s direct `<App/>` renders (no
   * `AuthGate` involved) are unaffected. `undefined` simply renders the
   * top-bar actions empty, same as before this prop existed.
   */
  user?: Me;
} = {}) {
  const [pages, setPages] = useState<ManualPageMeta[] | null>(null);
  const [activePath, setActivePath] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);
  // `undefined` = dialog closed; `null` = open for a new top-level page;
  // a `ManualPageMeta` = open for a new child of that page.
  const [dialogParent, setDialogParent] = useState<
    ManualPageMeta | null | undefined
  >(undefined);

  function openNewPage(parent: ManualPageMeta | null) {
    setDialogParent(parent);
  }

  // Signs the session out and reloads: simplest way back to `AuthGate`'s
  // sign-in card, since a fresh full-page load re-mounts `AuthGate` and
  // re-runs its `/api/auth-me` check from scratch (now 401, cookie cleared).
  function handleSignOut() {
    api.logout().then(() => {
      window.location.reload();
    });
  }

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
    setDialogParent(undefined);
  }

  // After a successful `Editor` header delete: the deleted page is gone, so
  // clear the editor back to the placeholder view and re-fetch the page list
  // (same "always re-fetch rather than patch locally" reasoning as
  // `handleDraftSaved` above — the backend's listing already reflects the
  // deletion by the time `onDeleted` fires).
  function handleDeleted() {
    setSource(null);
    setActivePath(null);
    api.listPages().then(setPages);
  }

  // The active page's children, derived from the flat page list: any other
  // page whose slug is nested under the active page's slug. Passed to
  // `Editor` to gate the header's delete action (deleting a parent would
  // orphan its children in the tree).
  const activeSlug = activeSlugFromPath(activePath);
  const hasChildren =
    activeSlug !== null &&
    (pages?.some(
      (p) => p.slug !== activeSlug && p.slug.startsWith(activeSlug + "/"),
    ) ??
      false);

  // Unique section names across the loaded page list, in first-seen order —
  // offered to `FrontmatterForm` as autocomplete for the Section field so an
  // edit can reuse an existing section instead of retyping it.
  const sections = pages ? [...new Set(pages.map((p) => p.section))] : [];

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <h1 className="app-topbar__title">Audacity Manual Editor</h1>
        <div className="app-topbar__actions">
          {user ? (
            <div className="auth-badge">
              <span
                className="auth-badge__login"
                data-testid="auth-badge-login"
              >
                {user.login}
              </span>
              <button
                type="button"
                className="auth-badge__signout"
                data-testid="auth-signout"
                onClick={handleSignOut}
              >
                Sign out
              </button>
            </div>
          ) : null}
        </div>
      </header>
      <div className="app-body">
        <aside className="app-sidebar">
          <button
            type="button"
            className="app-sidebar__new-page-button"
            data-testid="new-page-button"
            disabled={pages === null}
            onClick={() => openNewPage(null)}
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
              onAddSubpage={(p) => openNewPage(p)}
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
              onAddSubpage={() => {
                const meta = pages?.find((p) => p.path === activePath);
                if (meta) openNewPage(meta);
              }}
              hasChildren={hasChildren}
              onDeleted={handleDeleted}
            />
          ) : (
            <p className="app-main__placeholder">
              Select a page from the list to start editing.
            </p>
          )}
        </main>
      </div>
      {dialogParent !== undefined && pages !== null ? (
        <NewPageDialog
          pages={pages}
          parent={dialogParent ?? undefined}
          onCreate={handleCreatePage}
          onCancel={() => setDialogParent(undefined)}
        />
      ) : null}
    </div>
  );
}
