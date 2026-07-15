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
    publish: () =>
      f("/api/publish", { method: "POST" }).then((r) =>
        jsonOrThrow<PublishResult>(r),
      ),
  };
}

export const api = makeApi();
