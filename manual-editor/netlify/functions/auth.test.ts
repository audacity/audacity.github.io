/**
 * `src/app/test-setup.ts` preloads `DEV_AUTH=1` for the whole suite, so
 * every test here that needs the real (non-dev) OAuth path unsets
 * `DEV_AUTH` and sets `GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET`/
 * `OAUTH_REDIRECT_URI`/`SESSION_SECRET` for its own duration, restoring all
 * of them in `finally` — see `_shared.test.ts`'s `withNonDevEnv` for the
 * same pattern. Dev-mode assertions (auth-login refusing, auth-me's
 * `{login:"dev"}`) rely on that global default and don't touch env at all.
 */
import { expect, test } from "bun:test";
import loginHandler from "./auth-login";
import { makeAuthCallback } from "./auth-callback";
import logoutHandler from "./auth-logout";
import meHandler from "./auth-me";
import { verifySession } from "./_session";
import { stateCookie } from "./_oauthState";

const ENV_KEYS = [
  "DEV_AUTH",
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
  "OAUTH_REDIRECT_URI",
  "SESSION_SECRET",
] as const;

const PROD_ENV = {
  GITHUB_CLIENT_ID: "test-client-id",
  GITHUB_CLIENT_SECRET: "test-client-secret",
  OAUTH_REDIRECT_URI: "https://example.test/api/auth-callback",
  SESSION_SECRET: "test-session-secret",
};

/** Runs `fn` with `DEV_AUTH` unset and the OAuth env vars set to test values, restoring everything afterwards. */
async function withProdEnv(fn: () => void | Promise<void>): Promise<void> {
  const prev: Record<string, string | undefined> = {};
  for (const key of ENV_KEYS) prev[key] = process.env[key];
  delete process.env.DEV_AUTH;
  process.env.GITHUB_CLIENT_ID = PROD_ENV.GITHUB_CLIENT_ID;
  process.env.GITHUB_CLIENT_SECRET = PROD_ENV.GITHUB_CLIENT_SECRET;
  process.env.OAUTH_REDIRECT_URI = PROD_ENV.OAUTH_REDIRECT_URI;
  process.env.SESSION_SECRET = PROD_ENV.SESSION_SECRET;
  try {
    await fn();
  } finally {
    for (const key of ENV_KEYS) {
      if (prev[key] === undefined) delete process.env[key];
      else process.env[key] = prev[key];
    }
  }
}

function requestWithCookie(url: string, cookie: string): Request {
  const request = new Request(url);
  request.headers.set("cookie", cookie);
  return request;
}

function firstSetCookie(response: Response, name: string): string | undefined {
  const all =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : [response.headers.get("set-cookie") ?? ""];
  return all.find((c) => c.startsWith(`${name}=`));
}

// ---------------------------------------------------------------------------
// auth-login
// ---------------------------------------------------------------------------

test("auth-login refuses to run in dev mode", async () => {
  // DEV_AUTH=1 via the global preload.
  const res = await loginHandler();
  expect(res.status).toBe(400);
  const body = (await res.json()) as { error: string };
  expect(body.error).toBeTruthy();
});

test("auth-login redirects to GitHub's authorize URL with client_id, redirect_uri, scope, and state; sets a state cookie", async () => {
  await withProdEnv(async () => {
    const res = await loginHandler();
    expect(res.status).toBe(302);

    const location = res.headers.get("location");
    expect(location).toBeTruthy();
    const url = new URL(location!);
    expect(url.origin + url.pathname).toBe(
      "https://github.com/login/oauth/authorize",
    );
    expect(url.searchParams.get("client_id")).toBe(PROD_ENV.GITHUB_CLIENT_ID);
    expect(url.searchParams.get("redirect_uri")).toBe(
      PROD_ENV.OAUTH_REDIRECT_URI,
    );
    expect(url.searchParams.get("scope")).toBe("repo");
    const state = url.searchParams.get("state");
    expect(state).toBeTruthy();

    const stateCookieHeader = firstSetCookie(res, "manual_editor_oauth_state");
    expect(stateCookieHeader).toBeTruthy();
    expect(stateCookieHeader).toContain("HttpOnly");
  });
});

// ---------------------------------------------------------------------------
// auth-callback
// ---------------------------------------------------------------------------

function mockFetchSequence(responses: Array<{ ok?: boolean; body: unknown }>) {
  let call = 0;
  return (async (..._args: Parameters<typeof fetch>) => {
    const next = responses[Math.min(call, responses.length - 1)];
    call += 1;
    return new Response(JSON.stringify(next.body), {
      status: next.ok === false ? 400 : 200,
    });
  }) as typeof fetch;
}

test("auth-callback happy path: verifies state, exchanges code, sets session cookie, clears state cookie, redirects to /", async () => {
  await withProdEnv(async () => {
    const state = "test-state-value";
    const cookie = stateCookie(state, PROD_ENV.SESSION_SECRET).split(";")[0];

    const fetchImpl = mockFetchSequence([
      { body: { access_token: "gho_mocked_token" } },
      { body: { login: "octocat" } },
    ]);
    const callbackHandler = makeAuthCallback(fetchImpl);

    const request = requestWithCookie(
      `http://localhost/api/auth-callback?code=abc123&state=${state}`,
      cookie,
    );
    const res = await callbackHandler(request);

    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/");

    const sessionCookieHeader = firstSetCookie(res, "manual_editor_session");
    expect(sessionCookieHeader).toBeTruthy();
    const sessionValue = sessionCookieHeader!
      .split(";")[0]
      .split("=")
      .slice(1)
      .join("=");
    const recovered = verifySession(sessionValue, PROD_ENV.SESSION_SECRET);
    expect(recovered).toEqual({ token: "gho_mocked_token", login: "octocat" });

    // The token must never appear anywhere else in the response.
    const bodyText = await res.text();
    expect(bodyText).not.toContain("gho_mocked_token");

    const clearedStateCookie = firstSetCookie(res, "manual_editor_oauth_state");
    expect(clearedStateCookie).toBeTruthy();
    expect(clearedStateCookie).toContain("Max-Age=0");
  });
});

test("auth-callback rejects a state mismatch with 403 and sets no session cookie", async () => {
  await withProdEnv(async () => {
    const cookie = stateCookie("real-state", PROD_ENV.SESSION_SECRET).split(
      ";",
    )[0];
    const fetchImpl = mockFetchSequence([
      { body: { access_token: "should-not-be-used" } },
      { body: { login: "octocat" } },
    ]);
    const callbackHandler = makeAuthCallback(fetchImpl);

    const request = requestWithCookie(
      "http://localhost/api/auth-callback?code=abc123&state=wrong-state",
      cookie,
    );
    const res = await callbackHandler(request);

    expect(res.status).toBe(403);
    expect(firstSetCookie(res, "manual_editor_session")).toBeUndefined();
  });
});

test("auth-callback rejects a missing state cookie with 403", async () => {
  await withProdEnv(async () => {
    const fetchImpl = mockFetchSequence([{ body: {} }]);
    const callbackHandler = makeAuthCallback(fetchImpl);

    const request = new Request(
      "http://localhost/api/auth-callback?code=abc123&state=some-state",
    );
    const res = await callbackHandler(request);

    expect(res.status).toBe(403);
    expect(firstSetCookie(res, "manual_editor_session")).toBeUndefined();
  });
});

test("auth-callback returns 5xx and sets no session cookie when the user lookup succeeds but has no login", async () => {
  await withProdEnv(async () => {
    const state = "test-state-value";
    const cookie = stateCookie(state, PROD_ENV.SESSION_SECRET).split(";")[0];
    const fetchImpl = mockFetchSequence([
      { body: { access_token: "gho_mocked_token" } },
      { body: {} }, // /user response has no `login` field
    ]);
    const callbackHandler = makeAuthCallback(fetchImpl);

    const request = requestWithCookie(
      `http://localhost/api/auth-callback?code=abc123&state=${state}`,
      cookie,
    );
    const res = await callbackHandler(request);

    expect(res.status).toBeGreaterThanOrEqual(500);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBeTruthy();
    expect(firstSetCookie(res, "manual_editor_session")).toBeUndefined();
  });
});

test("auth-callback returns 5xx and sets no session cookie when the user lookup request itself fails", async () => {
  await withProdEnv(async () => {
    const state = "test-state-value";
    const cookie = stateCookie(state, PROD_ENV.SESSION_SECRET).split(";")[0];
    let call = 0;
    const fetchImpl = (async (..._args: Parameters<typeof fetch>) => {
      call += 1;
      if (call === 1) {
        return new Response(
          JSON.stringify({ access_token: "gho_mocked_token" }),
          { status: 200 },
        );
      }
      throw new Error("network down");
    }) as typeof fetch;
    const callbackHandler = makeAuthCallback(fetchImpl);

    const request = requestWithCookie(
      `http://localhost/api/auth-callback?code=abc123&state=${state}`,
      cookie,
    );
    const res = await callbackHandler(request);

    expect(res.status).toBeGreaterThanOrEqual(500);
    expect(firstSetCookie(res, "manual_editor_session")).toBeUndefined();
  });
});

test("auth-callback returns an error and sets no session cookie when the token exchange fails", async () => {
  await withProdEnv(async () => {
    const state = "test-state-value";
    const cookie = stateCookie(state, PROD_ENV.SESSION_SECRET).split(";")[0];
    const fetchImpl = mockFetchSequence([
      { ok: false, body: { error: "bad_verification_code" } },
    ]);
    const callbackHandler = makeAuthCallback(fetchImpl);

    const request = requestWithCookie(
      `http://localhost/api/auth-callback?code=bad-code&state=${state}`,
      cookie,
    );
    const res = await callbackHandler(request);

    expect(res.status).toBeGreaterThanOrEqual(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBeTruthy();
    expect(firstSetCookie(res, "manual_editor_session")).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// auth-me
// ---------------------------------------------------------------------------

test("auth-me reports the dev identity in dev mode", async () => {
  // DEV_AUTH=1 via the global preload.
  const res = await meHandler(new Request("http://localhost/api/auth-me"));
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body).toEqual({ login: "dev", mode: "dev" });
});

test("auth-me reports the login for a valid session cookie outside dev mode, without leaking the token", async () => {
  await withProdEnv(async () => {
    const { signSession, sessionCookie } = await import("./_session");
    const signed = signSession(
      { token: "gho_secret_token", login: "octocat" },
      PROD_ENV.SESSION_SECRET,
    );
    const cookie = sessionCookie(signed).split(";")[0];
    const request = requestWithCookie("http://localhost/api/auth-me", cookie);

    const res = await meHandler(request);
    expect(res.status).toBe(200);
    const bodyText = await res.text();
    expect(bodyText).not.toContain("gho_secret_token");
    expect(JSON.parse(bodyText)).toEqual({ login: "octocat", mode: "github" });
  });
});

test("auth-me returns 401 without a session cookie outside dev mode", async () => {
  await withProdEnv(async () => {
    const res = await meHandler(new Request("http://localhost/api/auth-me"));
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// SECURITY REGRESSION — auth-bypass via OAuth-state/session key reuse
// ---------------------------------------------------------------------------
//
// Previously `_oauthState.ts` signed the state cookie with the SAME
// `signSession`/`SESSION_SECRET`/`{token, login}` shape as the real session
// cookie, and the signed value didn't encode which cookie it belonged to.
// An unauthenticated caller could GET /api/auth-login, read the raw
// `Set-Cookie: manual_editor_oauth_state=<payload>.<sig>` from their OWN
// response, then replay that exact value as `Cookie:
// manual_editor_session=...` on /api/auth-me — the HMAC verified (same
// key/function) and auth-me returned 200 `{login:"oauth-state",
// mode:"github"}` instead of 401. Fixed by domain-separating the signing
// key per purpose (`_session.ts`'s `deriveKey`); this test drives the
// exploit end-to-end through the real handlers and must see a 401.
test("SECURITY: an OAuth state cookie value cannot be replayed as the session cookie to bypass auth-me", async () => {
  await withProdEnv(async () => {
    // 1. Unauthenticated caller starts the OAuth handshake and gets a
    //    signed state cookie back — exactly what a real attacker can do
    //    without ever authenticating.
    const loginRes = await loginHandler();
    const stateCookieHeader = firstSetCookie(
      loginRes,
      "manual_editor_oauth_state",
    );
    expect(stateCookieHeader).toBeTruthy();
    const stateValue = stateCookieHeader!
      .split(";")[0]
      .split("=")
      .slice(1)
      .join("=");

    // 2. Replay that exact signed value as the SESSION cookie instead.
    const request = requestWithCookie(
      "http://localhost/api/auth-me",
      `manual_editor_session=${stateValue}`,
    );

    // 3. Both the endpoint and the underlying session resolver must reject
    //    it — this is the actual gate `auth-me`/`currentSession` enforce.
    const res = await meHandler(request);
    expect(res.status).toBe(401);

    const { currentSession } = await import("./_shared");
    expect(currentSession(request)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// auth-logout
// ---------------------------------------------------------------------------

test("auth-logout clears the session cookie", async () => {
  const res = await logoutHandler();
  expect(res.status).toBe(200);
  const body = (await res.json()) as { ok: boolean };
  expect(body.ok).toBe(true);
  const cookie = firstSetCookie(res, "manual_editor_session");
  expect(cookie).toBeTruthy();
  expect(cookie).toContain("manual_editor_session=");
  expect(cookie).toContain("Max-Age=0");
});
