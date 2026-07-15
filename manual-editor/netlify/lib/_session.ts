import { createHmac, timingSafeEqual } from "node:crypto";
import { parseCookie, stringifySetCookie } from "cookie";

/** A signed-in editor session: the GitHub token (server-side only) and login. */
export type Session = { token: string; login: string };

const COOKIE_NAME = "manual_editor_session";
const SEVEN_DAYS_SECONDS = 60 * 60 * 24 * 7;

/** A fixed, non-secret value used only when DEV_AUTH=1 and no real secret is configured. */
const DEV_MODE_SECRET = "manual-editor-dev-mode-secret-not-for-production";

/**
 * Resolves the HMAC secret used to sign/verify session cookies.
 *
 * Dev mode (`DEV_AUTH=1`) never needs a real secret — it returns a fixed
 * value so local development works without any setup. Outside dev mode,
 * `SESSION_SECRET` must be set; its absence is a deploy-config error, so we
 * throw with a clear message rather than silently signing with a guessable
 * default.
 */
export function getSessionSecret(): string {
  const configured = process.env.SESSION_SECRET;
  if (configured) return configured;
  if (process.env.DEV_AUTH === "1") return DEV_MODE_SECRET;
  throw new Error(
    "SESSION_SECRET is not set. Set the SESSION_SECRET environment variable, or set DEV_AUTH=1 for local development.",
  );
}

function base64UrlEncode(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function base64UrlDecode(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

/** The default purpose used by `signSession`/`verifySession`. */
const SESSION_PURPOSE = "session";

/**
 * Derives a purpose-scoped HMAC key from the base secret.
 *
 * This is `HMAC(secret, purpose)`, NOT string concatenation like
 * `` `${secret}:${purpose}` ``. Concatenation-with-a-delimiter schemes are
 * vulnerable to "delimiter games": if `purpose` could ever contain the
 * delimiter (or if two distinct `(secret, purpose)` pairs could be crafted
 * to concatenate to the same string), two different purposes could collide
 * on the same derived key. Running `purpose` through HMAC as its own
 * message avoids that class of bug entirely — there is no delimiter to
 * inject around, so distinct purpose strings always derive distinct keys
 * (barring a HMAC-SHA256 collision). Every signing/verification namespace
 * in this codebase MUST go through this function (or `signWithPurpose`/
 * `verifyWithPurpose` below) rather than deriving keys ad hoc, and a new
 * purpose is safe to add without coordinating on delimiter-safe naming.
 */
function deriveKey(secret: string, purpose: string): Buffer {
  return createHmac("sha256", secret).update(purpose).digest();
}

function sign(payload: string, secret: string, purpose: string): string {
  return createHmac("sha256", deriveKey(secret, purpose))
    .update(payload)
    .digest("base64url");
}

/**
 * Serializes and signs a `Session` into the `${payload}.${signature}` wire
 * format, scoped to `purpose` via `deriveKey`. Different purposes derive
 * different keys, so a value signed for one purpose can never verify under
 * another — this is what lets `_oauthState.ts` reuse this module's signing
 * logic for its own `manual_editor_oauth_state` cookie (purpose
 * `"oauth-state"`) without that cookie's signed value also being accepted
 * as a valid `manual_editor_session` cookie by `verifySession`.
 */
export function signWithPurpose(
  session: Session,
  secret: string,
  purpose: string,
): string {
  const payload = base64UrlEncode(JSON.stringify(session));
  const sig = sign(payload, secret, purpose);
  return `${payload}.${sig}`;
}

/**
 * Verifies a signed value produced by `signWithPurpose` for the same
 * `purpose`. Returns the recovered `Session` on success, or `null` for
 * absolutely any failure (malformed shape, bad base64/JSON, tampered
 * payload or signature, wrong secret, wrong purpose) — this never throws,
 * so callers can treat "no valid session" as a plain unauthenticated state.
 */
export function verifyWithPurpose(
  value: string,
  secret: string,
  purpose: string,
): Session | null {
  try {
    if (!value) return null;
    const dotIndex = value.indexOf(".");
    if (dotIndex < 0) return null;
    const payload = value.slice(0, dotIndex);
    const sig = value.slice(dotIndex + 1);
    if (!payload || !sig) return null;

    const expectedSig = sign(payload, secret, purpose);
    const sigBuf = Buffer.from(sig, "base64url");
    const expectedBuf = Buffer.from(expectedSig, "base64url");
    if (sigBuf.length !== expectedBuf.length) return null;
    if (!timingSafeEqual(sigBuf, expectedBuf)) return null;

    const parsed: unknown = JSON.parse(base64UrlDecode(payload));
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof (parsed as { token?: unknown }).token !== "string" ||
      typeof (parsed as { login?: unknown }).login !== "string"
    ) {
      return null;
    }
    return parsed as Session;
  } catch {
    return null;
  }
}

/**
 * Serializes and signs a session for the real `manual_editor_session`
 * cookie — always purpose `"session"`. Other cookies (e.g. the OAuth state
 * cookie) MUST NOT use this; they should call `signWithPurpose` with their
 * own purpose string so their signed values can never verify as a session
 * (see `verifySession`/`deriveKey`).
 */
export function signSession(session: Session, secret: string): string {
  return signWithPurpose(session, secret, SESSION_PURPOSE);
}

/**
 * Verifies a signed session value produced by `signSession`
 * (purpose `"session"`). A value signed under any other purpose — e.g. the
 * OAuth state cookie's `"oauth-state"` purpose — always fails here, even
 * with the correct `SESSION_SECRET`, because `deriveKey` derives a
 * different HMAC key per purpose.
 */
export function verifySession(value: string, secret: string): Session | null {
  return verifyWithPurpose(value, secret, SESSION_PURPOSE);
}

export interface SessionCookieOptions {
  /**
   * Whether to set the `Secure` attribute. Defaults to `false` when either
   * dev signal is present — `process.env.DEV_AUTH === "1"` (this repo's
   * actual local-dev flow, `bun run dev:local` → `dev-server.ts`, the
   * required workaround since netlify-cli is broken on Node 24) or
   * `process.env.NODE_ENV === "development"` — so local dev over HTTP
   * still gets the cookie stored. Defaults to `true` otherwise.
   */
  secure?: boolean;
}

function resolveSecure(opts?: SessionCookieOptions): boolean {
  if (opts?.secure !== undefined) return opts.secure;
  const dev =
    process.env.DEV_AUTH === "1" || process.env.NODE_ENV === "development";
  return !dev;
}

/** Serializes the `Set-Cookie` header value carrying a signed session. */
export function sessionCookie(
  value: string,
  opts?: SessionCookieOptions,
): string {
  return stringifySetCookie({
    name: COOKIE_NAME,
    value,
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: resolveSecure(opts),
    maxAge: SEVEN_DAYS_SECONDS,
  });
}

/** Serializes a `Set-Cookie` header value that clears the session cookie. */
export function clearSessionCookie(opts?: SessionCookieOptions): string {
  return stringifySetCookie({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: resolveSecure(opts),
    maxAge: 0,
  });
}

/** Reads and verifies the session cookie from a `Request`'s `Cookie` header. */
export function readSession(request: Request, secret: string): Session | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  const cookies = parseCookie(header);
  const value = cookies[COOKIE_NAME];
  if (!value) return null;
  return verifySession(value, secret);
}
