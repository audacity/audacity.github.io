/**
 * `_shared.ts`'s `DEV_AUTH=1` short-circuit (both `currentSession` and
 * `backendFor` bypassing the cookie entirely) is exercised implicitly by
 * the rest of the suite, since `src/app/test-setup.ts` preloads
 * `DEV_AUTH=1` for every test file. What's untested is the non-dev wiring:
 * `currentSession` actually reading and verifying a signed cookie under a
 * real `SESSION_SECRET`, and `backendFor` forwarding a session's token
 * into `getBackend` (as opposed to always calling `getBackend(null)`).
 *
 * These tests unset `DEV_AUTH` and set `SESSION_SECRET` for the duration
 * of each test, then restore both in `finally` so the global preload's
 * `DEV_AUTH=1` assumption holds for every other test file regardless of
 * run order.
 */
import { expect, test } from "bun:test";
import { backendFor, currentSession } from "./_shared";
import { signSession, sessionCookie, type Session } from "./_session";

const secret = "test-secret";
const session: Session = { token: "real-token", login: "octocat" };

/**
 * See `_session.test.ts`'s `requestWithCookie` doc comment: constructing a
 * `Request` with a `cookie` header via the `headers` init silently drops it
 * under happy-dom's spec-strict `Request`, so it must be set via
 * `.headers.set(...)` after construction instead.
 */
function requestWithCookie(cookie: string): Request {
  const request = new Request("http://localhost/api/x");
  request.headers.set("cookie", cookie);
  return request;
}

/** Runs `fn` with `DEV_AUTH` unset and `SESSION_SECRET` set to `secret`, restoring both afterwards. */
async function withNonDevEnv(fn: () => void | Promise<void>): Promise<void> {
  const prevDevAuth = process.env.DEV_AUTH;
  const prevSecret = process.env.SESSION_SECRET;
  delete process.env.DEV_AUTH;
  process.env.SESSION_SECRET = secret;
  try {
    await fn();
  } finally {
    if (prevDevAuth === undefined) delete process.env.DEV_AUTH;
    else process.env.DEV_AUTH = prevDevAuth;
    if (prevSecret === undefined) delete process.env.SESSION_SECRET;
    else process.env.SESSION_SECRET = prevSecret;
  }
}

test("currentSession returns the session for a valid signed cookie outside dev mode", async () => {
  await withNonDevEnv(() => {
    const signed = signSession(session, secret);
    const cookie = sessionCookie(signed);
    const cookieValue = cookie.split(";")[0]; // "manual_editor_session=<value>"
    const request = requestWithCookie(cookieValue);
    expect(currentSession(request)).toEqual(session);
  });
});

test("currentSession returns null with no cookie outside dev mode", async () => {
  await withNonDevEnv(() => {
    const request = new Request("http://localhost/api/x");
    expect(currentSession(request)).toBeNull();
  });
});

test("currentSession returns null with an invalid cookie outside dev mode", async () => {
  await withNonDevEnv(() => {
    const request = requestWithCookie(
      "manual_editor_session=not-a-valid-value",
    );
    expect(currentSession(request)).toBeNull();
  });
});

test("backendFor forwards the session token into getBackend, which throws until Phase G wires a real backend", async () => {
  await withNonDevEnv(() => {
    const signed = signSession(session, secret);
    const cookie = sessionCookie(signed);
    const cookieValue = cookie.split(";")[0];
    const request = requestWithCookie(cookieValue);
    expect(() => backendFor(request)).toThrow(
      "Production backend not wired until Phase G",
    );
  });
});

test("backendFor falls back to the dev InMemory backend when there is no session cookie", async () => {
  await withNonDevEnv(() => {
    const request = new Request("http://localhost/api/x");
    expect(() => backendFor(request)).not.toThrow();
    expect(backendFor(request)).toBeDefined();
  });
});

test("with DEV_AUTH=1, backendFor returns the dev backend and currentSession is null regardless of cookies", () => {
  // The global preload already sets DEV_AUTH=1; assert it's on for clarity
  // and independence from that preload's specifics.
  const prevDevAuth = process.env.DEV_AUTH;
  process.env.DEV_AUTH = "1";
  try {
    const signed = signSession(session, "irrelevant-secret-in-dev-mode");
    const cookie = sessionCookie(signed);
    const cookieValue = cookie.split(";")[0];
    const request = requestWithCookie(cookieValue);

    expect(currentSession(request)).toBeNull();
    expect(() => backendFor(request)).not.toThrow();
    expect(backendFor(request)).toBeDefined();
  } finally {
    if (prevDevAuth === undefined) delete process.env.DEV_AUTH;
    else process.env.DEV_AUTH = prevDevAuth;
  }
});
