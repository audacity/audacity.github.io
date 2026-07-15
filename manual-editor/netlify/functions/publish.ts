import { requireBackend, json } from "./_shared";

/**
 * `POST /api/publish` — opens (or reuses an already-open) PR from the
 * drafts branch onto base via `GitHubBackend#publish`. The "nothing to
 * publish" case (`OctokitBackend.publish` throws a specific message for
 * it — see its doc comment) is surfaced as a 409 so the UI can distinguish
 * "no draft changes" from a genuine server error; anything else is a 500.
 */
export default async (request: Request): Promise<Response> => {
  if (request.method !== "POST") {
    return json({ error: "method not allowed" }, 405);
  }
  const backend = requireBackend(request);
  if (backend instanceof Response) return backend;
  try {
    const result = await backend.publish();
    return json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.startsWith("Nothing to publish") ? 409 : 500;
    return json({ error: message }, status);
  }
};
