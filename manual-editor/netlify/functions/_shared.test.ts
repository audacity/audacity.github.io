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
import { backendFor, currentSession, requireBackend } from "./_shared";
import { signSession, sessionCookie, type Session } from "./_session";
import { OctokitBackend } from "../../src/backend/octokitBackend";
import pagesHandler from "./pages";
import pageHandler from "./page";
import draftHandler from "./draft";
import publishHandler from "./publish";

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

test("backendFor forwards the session token into getBackend, which resolves an OctokitBackend outside dev mode", async () => {
  await withNonDevEnv(() => {
    const signed = signSession(session, secret);
    const cookie = sessionCookie(signed);
    const cookieValue = cookie.split(";")[0];
    const request = requestWithCookie(cookieValue);
    expect(backendFor(request)).toBeInstanceOf(OctokitBackend);
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

// ---------------------------------------------------------------------------
// requireBackend — the server-side 401 auth gate (Fix 1)
// ---------------------------------------------------------------------------
//
// Before this gate, an unauthenticated request outside dev mode reached
// `backendFor`'s `getBackend(session?.token ?? null)`, which — with no
// token — falls back to the InMemory backend (`resolveBackend.ts`). On a
// real deploy that backend's corpus directory doesn't exist, so the request
// 500s with a misleading error instead of a clean 401. `requireBackend` is
// the fix: every endpoint must call it instead of `backendFor` directly.

test("requireBackend returns a 401 Response outside dev mode with no session cookie", async () => {
  await withNonDevEnv(() => {
    const request = new Request("http://localhost/api/x");
    const result = requireBackend(request);
    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(401);
  });
});

test("requireBackend returns a 401 Response outside dev mode with an invalid session cookie", async () => {
  await withNonDevEnv(() => {
    const request = requestWithCookie(
      "manual_editor_session=not-a-valid-value",
    );
    const result = requireBackend(request);
    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(401);
  });
});

test("requireBackend resolves an OctokitBackend (not a Response) outside dev mode with a valid session cookie", async () => {
  await withNonDevEnv(() => {
    const signed = signSession(session, secret);
    const cookie = sessionCookie(signed);
    const cookieValue = cookie.split(";")[0];
    const request = requestWithCookie(cookieValue);
    const result = requireBackend(request);
    expect(result).not.toBeInstanceOf(Response);
    expect(result).toBeInstanceOf(OctokitBackend);
  });
});

test("requireBackend is unaffected by DEV_AUTH=1: no cookie still resolves the dev backend, not a 401", () => {
  // The global preload already sets DEV_AUTH=1.
  const request = new Request("http://localhost/api/x");
  const result = requireBackend(request);
  expect(result).not.toBeInstanceOf(Response);
});

// ---------------------------------------------------------------------------
// Endpoint-level 401 integration proof — one per gated handler, confirming
// `requireBackend` is actually wired into `pages.ts`/`page.ts`/`draft.ts`/
// `publish.ts` and not just unit-tested in isolation.
// ---------------------------------------------------------------------------

test("pages.ts GET returns 401 outside dev mode with no session cookie", async () => {
  await withNonDevEnv(async () => {
    const res = await pagesHandler(new Request("http://localhost/api/pages"));
    expect(res.status).toBe(401);
  });
});

test("page.ts GET returns 401 outside dev mode with no session cookie", async () => {
  await withNonDevEnv(async () => {
    const res = await pageHandler(
      new Request(
        "http://localhost/api/page?path=src/content/manual/basics/a.mdx",
      ),
    );
    expect(res.status).toBe(401);
  });
});

test("page.ts DELETE returns 401 outside dev mode with no session cookie", async () => {
  await withNonDevEnv(async () => {
    const res = await pageHandler(
      new Request(
        "http://localhost/api/page?path=src/content/manual/basics/a.mdx",
        { method: "DELETE" },
      ),
    );
    expect(res.status).toBe(401);
  });
});

test("draft.ts POST returns 401 outside dev mode with no session cookie", async () => {
  await withNonDevEnv(async () => {
    const res = await draftHandler(
      new Request("http://localhost/api/draft", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          path: "src/content/manual/basics/a.mdx",
          doc: { type: "doc", content: [] },
          frontmatter: "title: T\nsection: S",
        }),
      }),
    );
    expect(res.status).toBe(401);
  });
});

test("publish.ts POST returns 401 outside dev mode with no session cookie", async () => {
  await withNonDevEnv(async () => {
    const res = await publishHandler(
      new Request("http://localhost/api/publish", { method: "POST" }),
    );
    expect(res.status).toBe(401);
  });
});
