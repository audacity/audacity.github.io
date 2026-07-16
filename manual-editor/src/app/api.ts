import type {
  ManualPageMeta,
  MovePageDest,
  PageContent,
  PublishResult,
} from "../backend/types";

export type Me = { login: string; mode: "dev" | "github" };

export function makeApi(f: typeof fetch = fetch) {
  /**
   * On a non-ok response, prefers a JSON body's `{ error: string }` message
   * (what every `netlify/functions/*.ts` error path returns via `json({
   * error: message }, status)`) over the raw response text, so callers like
   * `App.tsx`'s publish handler can surface it directly rather than a
   * generic failure string. Falls back to the raw text — still prefixed
   * with the status — when the body isn't JSON shaped that way.
   */
  async function jsonOrThrow<T>(res: Response): Promise<T> {
    if (!res.ok) {
      const text = await res.text();
      let message = text;
      try {
        const parsed = JSON.parse(text) as { error?: unknown };
        if (typeof parsed?.error === "string") message = parsed.error;
      } catch {
        // Not JSON; use the raw text as-is.
      }
      throw new Error(`${res.status} ${message}`);
    }
    return (await res.json()) as T;
  }
  return {
    /**
     * `GET /api/auth-me`. A 401 means "no session" — a normal, expected
     * outcome for a signed-out visitor — so it resolves to `null` rather
     * than throwing. Any other non-ok status (network hiccup, 500, etc.) is
     * a real failure and throws via `jsonOrThrow`, letting `AuthGate`
     * distinguish "show the sign-in card" from "show a retry error".
     */
    me: (): Promise<Me | null> =>
      f("/api/auth-me").then((r) => {
        if (r.status === 401) return null;
        return jsonOrThrow<Me>(r);
      }),
    logout: () =>
      f("/api/auth-logout", { method: "POST" }).then((r) =>
        jsonOrThrow<{ ok: true }>(r),
      ),
    listPages: () =>
      f("/api/pages").then((r) => jsonOrThrow<ManualPageMeta[]>(r)),
    getPage: (path: string) =>
      f(`/api/page?path=${encodeURIComponent(path)}`).then((r) =>
        jsonOrThrow<PageContent>(r),
      ),
    saveDraft: (path: string, source: string) =>
      f("/api/draft", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ path, source }),
      }).then((r) => jsonOrThrow<{ ok: true }>(r)),
    /**
     * Autosave's actual save call (see `Editor.tsx`). Sends the raw PM doc
     * JSON + serialized frontmatter string rather than a pre-assembled MDX
     * `source` — `/api/draft` (`draft.ts`) runs `docToSource` itself,
     * server-side, where its Bun/Node-only Prettier + `node:path` dependency
     * is safe. Doing that assembly in the browser instead (via `saveDraft`
     * above) is NOT viable: it would pull `../mdx/normalize.ts`'s top-level
     * `node:path` usage into the client bundle, which throws immediately
     * under a real browser and blanks the whole app.
     */
    saveDraftDoc: (path: string, doc: unknown, frontmatter: string) =>
      f("/api/draft", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ path, doc, frontmatter }),
      }).then((r) => jsonOrThrow<{ ok: true }>(r)),
    publish: () =>
      f("/api/publish", { method: "POST" }).then((r) =>
        jsonOrThrow<PublishResult>(r),
      ),
    deletePage: (path: string) =>
      f(`/api/page?path=${encodeURIComponent(path)}`, {
        method: "DELETE",
      }).then((r) => jsonOrThrow<{ ok: true }>(r)),
    /** Sidebar drag & drop (see `treeDnd.ts`): batch-rewrites `order`
     * frontmatter on one or more pages via `POST /api/reorder`. */
    reorder: (updates: Array<{ path: string; order: number }>) =>
      f("/api/reorder", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ updates }),
      }).then((r) => jsonOrThrow<{ ok: true }>(r)),
    /** Sidebar drag & drop (see `treeDnd.ts`): moves a page (and its
     * descendants) to a new folder/section via `POST /api/move`. Returns
     * just the old->new path mapping — callers that need to remap
     * `activePath` (see `App.tsx`) look it up there. */
    movePage: (path: string, dest: MovePageDest) =>
      f("/api/move", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ path, dest }),
      })
        .then((r) =>
          jsonOrThrow<{ moves: Array<{ from: string; to: string }> }>(r),
        )
        .then((body) => body.moves),
  };
}

export const api = makeApi();
