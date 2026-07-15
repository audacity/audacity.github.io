import { getSessionSecret } from "./_session";
import { stateCookie } from "./_oauthState";
import { json } from "./_shared";

/**
 * `GET /api/auth-login` — starts the GitHub OAuth handshake.
 *
 * Dev mode (`DEV_AUTH=1`) never does real OAuth (see `_shared.ts`'s
 * `currentSession`/`backendFor` dev short-circuits), so this refuses to
 * redirect there rather than sending a browser off to a GitHub OAuth App
 * that dev deploys have no reason to be configured for.
 *
 * All env vars (`GITHUB_CLIENT_ID`, `OAUTH_REDIRECT_URI`, and via
 * `getSessionSecret()`, `SESSION_SECRET`) are read here at request time, not
 * module scope, so tests can set them per-case.
 */
export default async (): Promise<Response> => {
  if (process.env.DEV_AUTH === "1") {
    return json({ error: "dev mode" }, 400);
  }

  const clientId = process.env.GITHUB_CLIENT_ID ?? "";
  const redirectUri = process.env.OAUTH_REDIRECT_URI ?? "";
  const secret = getSessionSecret();
  const state = crypto.randomUUID();

  const authorizeUrl = new URL("https://github.com/login/oauth/authorize");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("scope", "repo");
  authorizeUrl.searchParams.set("state", state);

  // The `Set-Cookie` header must be appended after construction, not passed
  // via the `Response` init: the Fetch spec treats `Set-Cookie` as forbidden
  // on client-constructed `Response` headers, and runtimes that enforce this
  // (e.g. this repo's test environment, happy-dom) silently strip it from
  // `init.headers`. A real Netlify Functions runtime doesn't apply that
  // restriction to the server-side response it sends over the wire, so this
  // works in both.
  const response = new Response(null, {
    status: 302,
    headers: { Location: authorizeUrl.toString() },
  });
  response.headers.append("Set-Cookie", stateCookie(state, secret));
  return response;
};
