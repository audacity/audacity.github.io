import { requireBackend, json } from "../lib/_shared";

/**
 * `POST /api/rename-section` — rewrites the `section` frontmatter field on
 * every page carrying `from` within `stream`, as a single logical operation
 * (one commit on the drafts branch for `OctokitBackend`).
 *
 * Body: `{ stream: string, from: string, to: string }`.
 *
 * Scoped by stream on purpose: section names aren't unique across the manual
 * — "new in Audacity 4" exists in both How-to and Reference — so an unscoped
 * rename would silently rewrite a group the writer wasn't looking at.
 *
 * Renaming to a name already in use is allowed: that's how two groups get
 * merged, which is a legitimate thing to want.
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

  const { stream, from, to } = (body ?? {}) as {
    stream?: unknown;
    from?: unknown;
    to?: unknown;
  };

  if (typeof stream !== "string" || stream.length === 0) {
    return json({ error: "stream (non-empty string) required" }, 400);
  }
  if (typeof from !== "string" || from.length === 0) {
    return json({ error: "from (non-empty string) required" }, 400);
  }
  if (typeof to !== "string" || to.trim().length === 0) {
    return json({ error: "to (non-empty string) required" }, 400);
  }

  const backend = requireBackend(request);
  if (backend instanceof Response) return backend;

  try {
    const paths = await backend.renameSection({ stream, from, to: to.trim() });
    return json({ paths });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return json({ error: message }, 400);
  }
};
