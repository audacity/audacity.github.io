import { requireBackend, json } from "../lib/_shared";

/**
 * `POST /api/reorder` — batch-rewrites the `order` frontmatter field on one
 * or more pages via `GitHubBackend#reorderPages`, as a single logical
 * operation (one commit on the drafts branch for `OctokitBackend`).
 *
 * Body: `{ updates: Array<{ path: string, order: number }> }`.
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

  const { updates } = (body ?? {}) as { updates?: unknown };
  const isValidUpdate = (u: unknown): u is { path: string; order: number } =>
    typeof u === "object" &&
    u !== null &&
    typeof (u as { path?: unknown }).path === "string" &&
    typeof (u as { order?: unknown }).order === "number";

  if (!Array.isArray(updates) || !updates.every(isValidUpdate)) {
    return json(
      {
        error:
          "updates (array of {path: string, order: number}) required",
      },
      400,
    );
  }

  const backend = requireBackend(request);
  if (backend instanceof Response) return backend;

  try {
    await backend.reorderPages(updates);
    return json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return json({ error: message }, 400);
  }
};
