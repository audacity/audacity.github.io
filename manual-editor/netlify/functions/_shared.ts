import type { GitHubBackend } from "../../src/backend/types";
import { getBackend } from "../../src/backend/resolveBackend";
import { getSessionSecret, readSession, type Session } from "./_session";

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/**
 * Resolves the signed-in session for a request, or `null` when there is
 * none — dev mode (`DEV_AUTH=1`) never has a cookie-backed session, so it
 * always reports `null` here (see `_shared.test.ts`/`resolveBackend.ts`'s
 * dev-mode `currentUser` reporting `{login:"dev", mode:"dev"}` instead).
 */
export function currentSession(request: Request): Session | null {
  if (process.env.DEV_AUTH === "1") return null;
  return readSession(request, getSessionSecret());
}

/**
 * Dev mode (`DEV_AUTH=1`): always the cached InMemory backend, no cookie
 * needed. Otherwise: read the signed session cookie (Phase F1) and pass its
 * GitHub token — which never leaves the server — to `getBackend`. With no
 * session cookie, `token` is `null`, and `getBackend(null)` currently still
 * falls back to the InMemory backend (`resolveBackend.ts`'s `devMode =
 * DEV_AUTH === "1" || !token`); that's acceptable for now but not a real
 * auth gate. Phase F3 gates the UI behind sign-in, and Phase G's
 * `OctokitBackend` will require a real token, at which point a missing
 * session becomes a hard 401 rather than a silent dev-backend fallback.
 */
export function backendFor(request: Request): GitHubBackend {
  if (process.env.DEV_AUTH === "1") return getBackend(null);
  const session = readSession(request, getSessionSecret());
  return getBackend(session?.token ?? null);
}
