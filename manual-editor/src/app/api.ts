import type {
  ManualPageMeta,
  PageContent,
  PublishResult,
} from "../backend/types";

export function makeApi(f: typeof fetch = fetch) {
  async function jsonOrThrow<T>(res: Response): Promise<T> {
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    return (await res.json()) as T;
  }
  return {
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
  };
}

export const api = makeApi();
