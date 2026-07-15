import { expect, test } from "bun:test";
import {
  signSession,
  verifySession,
  signWithPurpose,
  verifyWithPurpose,
  sessionCookie,
  clearSessionCookie,
  readSession,
  getSessionSecret,
  type Session,
} from "./_session";

const secret = "test-secret-value";
const session: Session = { token: "gho_abc123", login: "octocat" };

test("sign -> verify round-trip recovers the session", () => {
  const signed = signSession(session, secret);
  const recovered = verifySession(signed, secret);
  expect(recovered).toEqual(session);
});

test("verifySession rejects a tampered payload", () => {
  const signed = signSession(session, secret);
  const [payload, sig] = signed.split(".");
  // Flip a char in the base64url payload.
  const tamperedPayload =
    payload.slice(0, -1) + (payload.at(-1) === "A" ? "B" : "A");
  expect(verifySession(`${tamperedPayload}.${sig}`, secret)).toBeNull();
});

test("verifySession rejects a tampered signature", () => {
  const signed = signSession(session, secret);
  const [payload, sig] = signed.split(".");
  const tamperedSig = sig.slice(0, -1) + (sig.at(-1) === "A" ? "B" : "A");
  expect(verifySession(`${payload}.${tamperedSig}`, secret)).toBeNull();
});

test("verifySession rejects truncated input", () => {
  const signed = signSession(session, secret);
  expect(verifySession(signed.slice(0, 10), secret)).toBeNull();
});

test("verifySession rejects garbage input", () => {
  expect(verifySession("not-a-valid-session-value", secret)).toBeNull();
});

test("verifySession rejects empty input", () => {
  expect(verifySession("", secret)).toBeNull();
});

test("verifySession rejects input with no signature separator", () => {
  expect(verifySession("justapayloadnodot", secret)).toBeNull();
});

test("verifySession returns null for a signature made with a different secret", () => {
  const signed = signSession(session, secret);
  expect(verifySession(signed, "a-different-secret")).toBeNull();
});

test("verifySession never throws on malformed input", () => {
  const inputs = ["", ".", "..", "a.b.c", "🙂.🙃", "null", "undefined"];
  for (const input of inputs) {
    expect(() => verifySession(input, secret)).not.toThrow();
    expect(verifySession(input, secret)).toBeNull();
  }
});

test("sessionCookie sets HttpOnly, SameSite=Lax, and Path=/", () => {
  const cookie = sessionCookie("signed-value");
  expect(cookie).toContain("manual_editor_session=signed-value");
  expect(cookie).toContain("HttpOnly");
  expect(cookie).toContain("SameSite=Lax");
  expect(cookie).toContain("Path=/");
});

test("sessionCookie is Secure outside development", () => {
  const cookie = sessionCookie("signed-value", { secure: true });
  expect(cookie).toContain("Secure");
});

test("sessionCookie omits Secure when explicitly not secure", () => {
  const cookie = sessionCookie("signed-value", { secure: false });
  expect(cookie).not.toContain("Secure");
});

test("clearSessionCookie has Max-Age=0", () => {
  const cookie = clearSessionCookie();
  expect(cookie).toContain("manual_editor_session=");
  expect(cookie).toContain("Max-Age=0");
  expect(cookie).toContain("HttpOnly");
  expect(cookie).toContain("Path=/");
});

/**
 * `new Request(url, { headers: { cookie: ... } })` silently drops the
 * header here: this suite runs under happy-dom's spec-strict `Request`
 * (registered globally for all tests, see `src/app/test-setup.ts`), which
 * treats `Cookie` as a forbidden header name when set via the constructor's
 * headers init (a fetch-spec restriction meant for outgoing `fetch()`
 * calls, not for inspecting an already-received request). Setting it via
 * `.headers.set(...)` after construction isn't subject to that check and
 * matches what a real incoming Netlify Functions v2 `Request` looks like by
 * the time our handler sees it.
 */
function requestWithCookie(cookie: string): Request {
  const request = new Request("http://localhost/api/x");
  request.headers.set("cookie", cookie);
  return request;
}

test("readSession reads a signed session from a Request's Cookie header", () => {
  const signed = signSession(session, secret);
  const request = requestWithCookie(`manual_editor_session=${signed}`);
  expect(readSession(request, secret)).toEqual(session);
});

test("readSession returns null when there is no cookie header", () => {
  const request = new Request("http://localhost/api/x");
  expect(readSession(request, secret)).toBeNull();
});

test("readSession returns null when the cookie is missing from a present header", () => {
  const request = requestWithCookie("other_cookie=1");
  expect(readSession(request, secret)).toBeNull();
});

test("readSession returns null for a tampered cookie value", () => {
  const signed = signSession(session, secret);
  const request = requestWithCookie(`manual_editor_session=${signed}xxx`);
  expect(readSession(request, secret)).toBeNull();
});

// ---------------------------------------------------------------------------
// Purpose-scoped key derivation (domain separation between signing
// namespaces, e.g. the real session vs. `_oauthState.ts`'s OAuth state
// cookie — see CRITICAL fix: a value signed for one purpose must never
// verify for another, even with the same secret and payload shape).
// ---------------------------------------------------------------------------

test("signWithPurpose -> verifyWithPurpose round-trip recovers the session for the same purpose", () => {
  const signed = signWithPurpose(session, secret, "oauth-state");
  expect(verifyWithPurpose(signed, secret, "oauth-state")).toEqual(session);
});

test("signSession is equivalent to signWithPurpose(..., 'session')", () => {
  const viaSignSession = signSession(session, secret);
  expect(verifyWithPurpose(viaSignSession, secret, "session")).toEqual(session);
});

test("a value signed with purpose 'oauth-state' fails verifySession (purpose 'session')", () => {
  const stateSigned = signWithPurpose(
    { token: "some-state-value", login: "oauth-state" },
    secret,
    "oauth-state",
  );
  expect(verifySession(stateSigned, secret)).toBeNull();
});

test("a session-signed value fails verifyWithPurpose(..., 'oauth-state')", () => {
  const sessionSigned = signSession(session, secret);
  expect(verifyWithPurpose(sessionSigned, secret, "oauth-state")).toBeNull();
});

test("verifyWithPurpose rejects a value signed under a different purpose even with the correct secret", () => {
  const signed = signWithPurpose(session, secret, "purpose-a");
  expect(verifyWithPurpose(signed, secret, "purpose-b")).toBeNull();
});

test("getSessionSecret returns the dev secret in dev mode without SESSION_SECRET set", () => {
  const prevDev = process.env.DEV_AUTH;
  const prevSecret = process.env.SESSION_SECRET;
  process.env.DEV_AUTH = "1";
  delete process.env.SESSION_SECRET;
  try {
    expect(getSessionSecret()).toBeTruthy();
  } finally {
    if (prevDev === undefined) delete process.env.DEV_AUTH;
    else process.env.DEV_AUTH = prevDev;
    if (prevSecret === undefined) delete process.env.SESSION_SECRET;
    else process.env.SESSION_SECRET = prevSecret;
  }
});

test("getSessionSecret throws when SESSION_SECRET is unset and not in dev mode", () => {
  const prevDev = process.env.DEV_AUTH;
  const prevSecret = process.env.SESSION_SECRET;
  delete process.env.DEV_AUTH;
  delete process.env.SESSION_SECRET;
  try {
    expect(() => getSessionSecret()).toThrow();
  } finally {
    if (prevDev === undefined) delete process.env.DEV_AUTH;
    else process.env.DEV_AUTH = prevDev;
    if (prevSecret === undefined) delete process.env.SESSION_SECRET;
    else process.env.SESSION_SECRET = prevSecret;
  }
});

test("getSessionSecret returns the configured secret when SESSION_SECRET is set", () => {
  const prevSecret = process.env.SESSION_SECRET;
  process.env.SESSION_SECRET = "configured-secret";
  try {
    expect(getSessionSecret()).toBe("configured-secret");
  } finally {
    if (prevSecret === undefined) delete process.env.SESSION_SECRET;
    else process.env.SESSION_SECRET = prevSecret;
  }
});
