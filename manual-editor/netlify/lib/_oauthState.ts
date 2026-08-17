import { parseCookie, stringifySetCookie } from "cookie";
import {
  signWithPurpose,
  verifyWithPurpose,
  type SessionCookieOptions,
} from "./_session";

/**
 * Short-lived CSRF-protection cookie for the GitHub OAuth handshake
 * (`auth-login.ts` sets it, `auth-callback.ts` verifies it). Deliberately a
 * separate cookie from the real session (`_session.ts`'s
 * `manual_editor_session`) so a half-finished login attempt never looks like
 * a signed-in session, and so it can carry its own short `maxAge`.
 *
 * Reuses `_session.ts`'s `signWithPurpose`/`verifyWithPurpose` to sign the
 * state value (packed into the existing `{token, login}` `Session` shape
 * with a fixed `login: "oauth-state"` marker) rather than duplicating HMAC
 * signing logic here — this keeps `_session.ts`'s wire format shared.
 *
 * Critically, this signs under purpose `STATE_PURPOSE` ("oauth-state"),
 * NOT the default `"session"` purpose that `signSession`/`verifySession`
 * use. `_session.ts`'s `deriveKey` derives a distinct HMAC key per purpose,
 * so a state-cookie value signed here can never verify under
 * `verifySession`, and a real session cookie can never verify here — even
 * though both share the same `SESSION_SECRET` and the same `{token, login}`
 * payload shape. Previously this called `signSession`/`verifySession`
 * directly, which meant the state cookie's signed value verified as a valid
 * session under the SAME key: an unauthenticated caller could read the
 * `Set-Cookie: manual_editor_oauth_state=...` from their own
 * `GET /api/auth-login` response and replay that exact value as the
 * `manual_editor_session` cookie to authenticate as `{login:"oauth-state"}`.
 * The `STATE_LOGIN_MARKER` check below is kept as defense-in-depth, but the
 * purpose-scoped key is what actually closes the bypass.
 */
const STATE_COOKIE_NAME = "manual_editor_oauth_state";
const STATE_LOGIN_MARKER = "oauth-state";
const STATE_PURPOSE = "oauth-state";
const TEN_MINUTES_SECONDS = 600;

function resolveSecure(opts?: SessionCookieOptions): boolean {
  if (opts?.secure !== undefined) return opts.secure;
  const dev =
    process.env.DEV_AUTH === "1" || process.env.NODE_ENV === "development";
  return !dev;
}

/** Serializes the `Set-Cookie` header value carrying a signed, short-lived OAuth `state`. */
export function stateCookie(
  state: string,
  secret: string,
  opts?: SessionCookieOptions,
): string {
  const value = signWithPurpose(
    { token: state, login: STATE_LOGIN_MARKER },
    secret,
    STATE_PURPOSE,
  );
  return stringifySetCookie({
    name: STATE_COOKIE_NAME,
    value,
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: resolveSecure(opts),
    maxAge: TEN_MINUTES_SECONDS,
  });
}

/** Serializes a `Set-Cookie` header value that clears the OAuth state cookie. */
export function clearStateCookie(opts?: SessionCookieOptions): string {
  return stringifySetCookie({
    name: STATE_COOKIE_NAME,
    value: "",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: resolveSecure(opts),
    maxAge: 0,
  });
}

/**
 * Reads and verifies the signed OAuth state cookie from a `Request`,
 * returning the raw `state` string it carries, or `null` on any failure
 * (missing cookie, tampered value, wrong secret).
 */
export function readState(request: Request, secret: string): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  const cookies = parseCookie(header);
  const value = cookies[STATE_COOKIE_NAME];
  if (!value) return null;
  const session = verifyWithPurpose(value, secret, STATE_PURPOSE);
  return session?.login === STATE_LOGIN_MARKER ? session.token : null;
}
