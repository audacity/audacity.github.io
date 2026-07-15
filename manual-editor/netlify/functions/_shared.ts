import type { GitHubBackend } from "../../src/backend/types";
import { getBackend } from "../../src/backend/resolveBackend";

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/** Phase F fills in real session parsing; until then, dev mode yields null token. */
export function backendFor(_request: Request): GitHubBackend {
  return getBackend(null);
}
