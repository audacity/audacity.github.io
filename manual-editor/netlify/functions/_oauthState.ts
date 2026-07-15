import { parseCookie, stringifySetCookie } from "cookie";
import {
  signSession,
  verifySession,
  type SessionCookieOptions,
} from "./_session";

/**
 * Short-lived CSRF-protection cookie for the GitHub OAuth handshake
 * (`auth-login.ts` sets it, `auth-callback.ts` verifies it). Deliberately a
 * separate cookie from the real session (`_session.ts`'s
 * `manual_editor_session`) so a half-finished login attempt never looks like
 * a signed-in session, and so it can carry its own short `maxAge`.
 *
 * Reuses `_session.ts`'s `signSession`/`verifySession` to sign the state
 * value (packed into the existing `{token, login}` `Session` shape with a
 * fixed `login: "oauth-state"` marker) rather than duplicating HMAC signing
 * logic here — this keeps `_session.ts` itself unchanged.
 */
const STATE_COOKIE_NAME = "manual_editor_oauth_state";
const STATE_LOGIN_MARKER = "oauth-state";
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
  const value = signSession(
    { token: state, login: STATE_LOGIN_MARKER },
    secret,
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
  const session = verifySession(value, secret);
  return session?.login === STATE_LOGIN_MARKER ? session.token : null;
}
