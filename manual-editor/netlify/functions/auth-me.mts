import { currentSession, json } from "../lib/_shared";

/**
 * `GET /api/auth-me` — reports the signed-in identity, never the token.
 *
 * Dev mode (`DEV_AUTH=1`) has no real session (see `_shared.ts`'s
 * `currentSession`, which always returns `null` there) so it reports the
 * fixed dev identity instead of 401ing every dev request.
 */
export default async (request: Request): Promise<Response> => {
  if (process.env.DEV_AUTH === "1") {
    return json({ login: "dev", mode: "dev" });
  }
  const session = currentSession(request);
  if (!session) {
    return json({ error: "unauthenticated" }, 401);
  }
  return json({ login: session.login, mode: "github" });
};
