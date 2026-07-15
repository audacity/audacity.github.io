import { clearSessionCookie } from "./_session";

/**
 * `POST /api/auth-logout` — clears the session cookie.
 *
 * `GET` (and any other method) is rejected with 405: a cross-site `<img
 * src="/api/auth-logout">`-style GET would otherwise force a visitor's
 * session to clear as a nuisance CSRF (no data is exposed or mutated
 * beyond the visitor's own sign-out, but forcing it from another origin is
 * still not something a plain top-level navigation/embed should be able to
 * do). `api.ts`'s `logout()` already sends `POST`.
 */
export default async (request: Request): Promise<Response> => {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "method not allowed" }), {
      status: 405,
      headers: { "content-type": "application/json" },
    });
  }
  // See `auth-login.ts`'s comment: `Set-Cookie` must be appended after
  // construction, not passed via the `Response` init, or spec-strict
  // runtimes (this repo's test environment) silently strip it.
  const response = new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
  response.headers.append("Set-Cookie", clearSessionCookie());
  return response;
};
