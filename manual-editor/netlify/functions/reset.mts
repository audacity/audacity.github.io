import { requireBackend, json } from "../lib/_shared";

/**
 * `POST /api/reset` — restores a page's drafts-branch content to the
 * base-branch (published) version via `backend.resetPage`. The editor's
 * "Reset to published" header action is the only caller; it never offers
 * the action for never-published pages, so the 409 branch is
 * belt-and-braces for direct API calls.
 */
export default async (request: Request): Promise<Response> => {
  if (request.method !== "POST") {
    return json({ error: "method not allowed" }, 405);
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid JSON body" }, 400);
  }
  const { path } = (body ?? {}) as { path?: unknown };
  if (typeof path !== "string" || path.length === 0) {
    return json({ error: "path (string) required" }, 400);
  }
  const backend = requireBackend(request);
  if (backend instanceof Response) return backend;
  try {
    const restored = await backend.resetPage(path);
    return json(restored);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("never been published")) {
      return json({ error: message }, 409);
    }
    throw err;
  }
};
