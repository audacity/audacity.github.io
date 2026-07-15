import { backendFor, json } from "./_shared";
export default async (request: Request): Promise<Response> => {
  const backend = backendFor(request);
  return json(await backend.listPages());
};
