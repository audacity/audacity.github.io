import { requireBackend, json } from "./_shared";
export default async (request: Request): Promise<Response> => {
  const backend = requireBackend(request);
  if (backend instanceof Response) return backend;
  return json(await backend.listPages());
};
