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
 * always reports `null` here (see `inMemoryBackend.ts`'s dev-mode
 * `currentUser` reporting `{login:"dev", mode:"dev"}` instead, which F2's
 * auth-me endpoint falls back to when `currentSession` is null).
 */
export function currentSession(request: Request): Session | null {
  if (process.env.DEV_AUTH === "1") return null;
  return readSession(request, getSessionSecret());
}

/**
 * Dev mode (`DEV_AUTH=1`): always the cached InMemory backend, no cookie
 * needed. Otherwise: read the signed session cookie (Phase F1) and pass its
 * GitHub token — which never leaves the server — to `getBackend`. With no
 * session cookie, `token` is `null`, and `getBackend(null)` would fall back
 * to the InMemory backend (`resolveBackend.ts`'s `devMode = DEV_AUTH === "1"
 * || !token`) — that fallback is why every caller MUST go through
 * `requireBackend` below rather than this function directly: it gates out
 * the no-session case with a 401 before `getBackend(null)`'s prod fallback
 * is ever reached, so this function's own no-session branch is now
 * unreachable from real request handling and only kept for the
 * `requireBackend` valid-session path (and the direct-unit-test coverage in
 * `_shared.test.ts`) to call into.
 */
export function backendFor(request: Request): GitHubBackend {
  if (process.env.DEV_AUTH === "1") return getBackend(null);
  const session = readSession(request, getSessionSecret());
  return getBackend(session?.token ?? null);
}

/**
 * The server-side auth gate every `netlify/functions/*.ts` endpoint that
 * touches a `GitHubBackend` MUST call instead of `backendFor` directly.
 *
 * Dev mode (`DEV_AUTH=1`) is unchanged: always resolves to the cached
 * InMemory backend via `backendFor`, no cookie needed.
 *
 * Outside dev mode, a missing/invalid session cookie now signals 401
 * instead of silently falling through to `getBackend(null)`'s InMemory
 * fallback — on a real deploy that fallback 500s anyway (the InMemory
 * backend's corpus directory doesn't exist in the deployed function), so
 * letting an unauthenticated request reach it was both a misleading error
 * and a latent hazard, not a real gate. Returns a `Response` (401) rather
 * than throwing so callers can do a simple
 * `if (backend instanceof Response) return backend;` without a try/catch.
 */
export function requireBackend(request: Request): GitHubBackend | Response {
  if (process.env.DEV_AUTH === "1") return backendFor(request);
  if (currentSession(request) === null) {
    return json({ error: "unauthenticated" }, 401);
  }
  return backendFor(request);
}
