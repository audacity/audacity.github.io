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

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

/** Serializes and signs a session into the `${payload}.${signature}` cookie value. */
export function signSession(session: Session, secret: string): string {
  const payload = base64UrlEncode(JSON.stringify(session));
  const sig = sign(payload, secret);
  return `${payload}.${sig}`;
}

/**
 * Verifies a signed session value produced by `signSession`. Returns the
 * recovered `Session` on success, or `null` for absolutely any failure
 * (malformed shape, bad base64/JSON, tampered payload or signature, wrong
 * secret) — this never throws, so callers can treat "no valid session" as
 * a plain unauthenticated state.
 */
export function verifySession(value: string, secret: string): Session | null {
  try {
    if (!value) return null;
    const dotIndex = value.indexOf(".");
    if (dotIndex < 0) return null;
    const payload = value.slice(0, dotIndex);
    const sig = value.slice(dotIndex + 1);
    if (!payload || !sig) return null;

    const expectedSig = sign(payload, secret);
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

export interface SessionCookieOptions {
  /**
   * Whether to set the `Secure` attribute. Defaults to
   * `process.env.NODE_ENV !== "development"` so local dev over HTTP still
   * gets the cookie stored.
   */
  secure?: boolean;
}

function resolveSecure(opts?: SessionCookieOptions): boolean {
  if (opts?.secure !== undefined) return opts.secure;
  return process.env.NODE_ENV !== "development";
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
