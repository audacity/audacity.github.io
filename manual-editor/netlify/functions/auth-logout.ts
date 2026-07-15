import { clearSessionCookie } from "./_session";

/** `POST /api/auth-logout` (also answers GET) — clears the session cookie. */
export default async (): Promise<Response> => {
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
