# manual-editor

Standalone WYSIWYG editor for the Audacity 4 user manual. See the design spec at
`docs/superpowers/specs/2026-07-15-manual-wysiwyg-editor-design.md` and the plan
sequence under `docs/superpowers/plans/`.

## MDX round-trip core (`src/mdx`)

Pure, UI-independent library that safely reads and writes the manual's MDX files.

- `parseMdx(source)` / `stringifyMdx(tree)` — MDX <-> mdast.
- `roundTrip(source)` — stringify(parse(source)).
- `formatMdx(source)` — normalize with the repo's Prettier config (parser `mdx`).
- `safeRoundTrip(source)` — the editor's full read->write: `formatMdx(roundTrip(source))`.
- `listManualFiles()` / `readManualFile(path)` — enumerate/read the corpus.

Fidelity is guaranteed by `idempotency.test.ts`, which asserts every file in
`src/content/manual` survives `safeRoundTrip` with no content change.

## Auth (`netlify/functions/auth-*`)

GitHub OAuth login for the editor: `auth-login` redirects to GitHub,
`auth-callback` exchanges the code for a token and sets a signed httpOnly
session cookie, `auth-me` reports the signed-in login, `auth-logout` clears
the cookie. The GitHub token never leaves the server (no response body, no
client-visible cookie contents).

These environment variables are user-provided (set them in the Netlify site
config, or a local `.env` for `netlify dev`) — none of them are checked in:

- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` — from a GitHub OAuth App you
  register, with its callback URL set to `OAUTH_REDIRECT_URI` below.
- `OAUTH_REDIRECT_URI` — e.g. `https://<site>/api/auth-callback`.
- `SESSION_SECRET` — a random string used to sign session/state cookies.
- `DEV_AUTH=1` — bypasses OAuth entirely for local development (see
  `_shared.ts`); `auth-login` refuses to run when this is set.

## Commands

```bash
bun test          # run all tests (incl. corpus idempotency)
bun run typecheck # tsc --noEmit
```
