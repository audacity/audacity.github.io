import { backendFor, json } from "./_shared";
export default async (request: Request): Promise<Response> => {
  const url = new URL(request.url);
  const path = url.searchParams.get("path");
  if (!path) return json({ error: "path required" }, 400);
  const backend = backendFor(request);
  try {
    return json(await backend.readPage(path));
  } catch {
    return json({ error: "not found" }, 404);
  }
};
