import { getSessionSecret, signSession, sessionCookie } from "./_session";
import { readState, clearStateCookie } from "./_oauthState";
import { json } from "./_shared";

interface GitHubTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface GitHubUserResponse {
  login?: string;
}

/**
 * `GET /api/auth-callback?code=&state=` — finishes the GitHub OAuth
 * handshake: verifies the CSRF `state`, exchanges `code` for an access
 * token, resolves the GitHub login, and mints the real session cookie.
 *
 * The GitHub token never appears in a response body or redirect URL — it is
 * exchanged server-side and immediately packed into the httpOnly session
 * cookie (`_session.ts`'s `signSession`/`sessionCookie`).
 *
 * `fetchImpl` is injected (default: global `fetch`) so tests can mock both
 * GitHub calls without a network dependency; the default export is the
 * factory applied with no override, which is what Netlify actually invokes.
 */
export function makeAuthCallback(fetchImpl: typeof fetch = fetch) {
  return async (request: Request): Promise<Response> => {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    const secret = getSessionSecret();
    const expectedState = readState(request, secret);

    if (!code || !state || !expectedState || expectedState !== state) {
      return json({ error: "invalid or missing state" }, 403);
    }

    const clientId = process.env.GITHUB_CLIENT_ID ?? "";
    const clientSecret = process.env.GITHUB_CLIENT_SECRET ?? "";
    const redirectUri = process.env.OAUTH_REDIRECT_URI ?? "";

    let tokenData: GitHubTokenResponse;
    try {
      const tokenRes = await fetchImpl(
        "https://github.com/login/oauth/access_token",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            code,
            redirect_uri: redirectUri,
          }),
        },
      );
      tokenData = (await tokenRes.json()) as GitHubTokenResponse;
    } catch {
      return json({ error: "token exchange failed" }, 502);
    }

    if (!tokenData.access_token) {
      return json({ error: "token exchange failed" }, 502);
    }

    let userData: GitHubUserResponse;
    try {
      const userRes = await fetchImpl("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          Accept: "application/vnd.github+json",
        },
      });
      userData = (await userRes.json()) as GitHubUserResponse;
    } catch {
      return json({ error: "user lookup failed" }, 502);
    }

    if (!userData.login) {
      return json({ error: "user lookup failed" }, 502);
    }

    const sessionValue = signSession(
      { token: tokenData.access_token, login: userData.login },
      secret,
    );

    // See `auth-login.ts`'s comment: `Set-Cookie` must be appended after
    // construction, not passed via the `Response` init, or spec-strict
    // runtimes (this repo's test environment) silently strip it.
    const response = new Response(null, {
      status: 302,
      headers: { Location: "/" },
    });
    response.headers.append("Set-Cookie", sessionCookie(sessionValue));
    response.headers.append("Set-Cookie", clearStateCookie());
    return response;
  };
}

export default makeAuthCallback();
