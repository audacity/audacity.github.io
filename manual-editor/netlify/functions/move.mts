import { requireBackend, json } from "../lib/_shared";
import type { MovePageDest } from "../../src/backend/types";

/**
 * `POST /api/move` — moves a page (and every descendant under it) to a new
 * folder via `GitHubBackend#movePage`, as a single logical operation (one
 * commit on the drafts branch for `OctokitBackend`).
 *
 * Body: `{ path: string, dest: { folder: string, order: number, section?:
 * string, sectionOrder?: number } }`. Validation failures (bad shape, a
 * cycle — moving a folder into its own descendant) all come back as 400s;
 * `movePage`'s own thrown errors (cycle guard, unknown path) are caught and
 * surfaced the same way.
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

  const { path, dest } = (body ?? {}) as { path?: unknown; dest?: unknown };
  if (typeof path !== "string" || dest == null || typeof dest !== "object") {
    return json({ error: "path (string) and dest (object) required" }, 400);
  }

  const { folder, order, section, sectionOrder } = dest as {
    folder?: unknown;
    order?: unknown;
    section?: unknown;
    sectionOrder?: unknown;
  };

  if (typeof folder !== "string" || folder.length === 0) {
    return json({ error: "dest.folder (non-empty string) required" }, 400);
  }
  if (typeof order !== "number") {
    return json({ error: "dest.order (number) required" }, 400);
  }
  if (section !== undefined && typeof section !== "string") {
    return json({ error: "dest.section must be a string when provided" }, 400);
  }
  if (sectionOrder !== undefined && typeof sectionOrder !== "number") {
    return json(
      { error: "dest.sectionOrder must be a number when provided" },
      400,
    );
  }

  const backend = requireBackend(request);
  if (backend instanceof Response) return backend;

  const validatedDest: MovePageDest = {
    folder,
    order,
    ...(section !== undefined ? { section } : {}),
    ...(sectionOrder !== undefined ? { sectionOrder } : {}),
  };

  try {
    const moves = await backend.movePage(path, validatedDest);
    return json({ moves });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return json({ error: message }, 400);
  }
};
