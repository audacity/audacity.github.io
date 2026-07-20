import { requireBackend, json } from "../lib/_shared";
export default async (request: Request): Promise<Response> => {
  const url = new URL(request.url);
  const path = url.searchParams.get("path");
  if (!path) return json({ error: "path required" }, 400);
  const backend = requireBackend(request);
  if (backend instanceof Response) return backend;
  if (request.method === "DELETE") {
    try {
      await backend.deletePage(path);
      return json({ ok: true });
    } catch {
      return json({ error: "not found" }, 404);
    }
  }
  try {
    return json(await backend.readPage(path));
  } catch {
    return json({ error: "not found" }, 404);
  }
};
