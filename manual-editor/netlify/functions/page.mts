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
  const base = url.searchParams.get("base") === "1";
  try {
    if (base) {
      const content = await backend.readBasePage(path);
      return json(content);
    }
    return json(await backend.readPage(path));
  } catch {
    return json({ error: "not found" }, 404);
  }
};
