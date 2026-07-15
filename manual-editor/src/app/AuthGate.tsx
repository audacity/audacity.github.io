import { useCallback, useEffect, useState } from "react";
import { api as defaultApi, type makeApi, type Me } from "./api";
import type { ReactNode } from "react";

type Status =
  | { kind: "loading" }
  | { kind: "signedOut" }
  | { kind: "error"; message: string }
  | { kind: "signedIn"; user: Me };

/**
 * Auth gate wrapping `<App>` (wired in `main.tsx`, not inside `App` itself —
 * see `App.test.tsx`, which renders `<App/>` directly and stays
 * auth-agnostic). Chosen approach: a render-prop (`children: (user) =>
 * ReactNode`) rather than context or `App` fetching `/api/auth-me` itself —
 * it keeps the "who's signed in" data flow explicit and colocated with the
 * one place that needs it (the top-bar badge), with no extra provider
 * boilerplate.
 *
 * `api.me()` (see `api.ts`) already distinguishes a 401 (resolves `null` —
 * an expected "no session" outcome) from every other failure (throws), so
 * this only has three branches to render: loading, signed-out, and error.
 */
export function AuthGate({
  api = defaultApi,
  children,
}: {
  /** Injectable for tests; defaults to the real fetch-backed client. */
  api?: ReturnType<typeof makeApi>;
  children: (user: Me) => ReactNode;
}) {
  const [status, setStatus] = useState<Status>({ kind: "loading" });

  const load = useCallback(() => {
    setStatus({ kind: "loading" });
    api.me().then(
      (user) =>
        setStatus(user ? { kind: "signedIn", user } : { kind: "signedOut" }),
      (err: unknown) =>
        setStatus({
          kind: "error",
          message: err instanceof Error ? err.message : String(err),
        }),
    );
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  if (status.kind === "loading") {
    return (
      <div className="auth-loading" data-testid="auth-loading">
        Loading…
      </div>
    );
  }

  if (status.kind === "signedOut") {
    return (
      <div className="auth-signin" data-testid="auth-signin">
        <div className="auth-signin__card">
          <h1 className="auth-signin__title">Audacity Manual Editor</h1>
          <a
            className="auth-signin__button"
            data-testid="auth-signin-link"
            href="/api/auth-login"
          >
            Sign in with GitHub
          </a>
        </div>
      </div>
    );
  }

  if (status.kind === "error") {
    return (
      <div className="auth-error" data-testid="auth-error">
        <div className="auth-error__card">
          <p>Couldn&apos;t check sign-in status: {status.message}</p>
          <button type="button" data-testid="auth-retry" onClick={load}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return <>{children(status.user)}</>;
}
