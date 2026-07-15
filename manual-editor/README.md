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
bun run dev:local # Bun dev server (Vite + local /api/* dispatch), DEV_AUTH=1 automatic
bun run build     # vite build -> dist/ (what Netlify's build command runs)
```

## Local dev

`bun run dev:local` runs `dev-server.ts`: it spawns Vite on `:5273` for the
React app/HMR and serves `:8873`, proxying everything to Vite except `/api/*`,
which it dispatches directly to the Netlify v2 function modules under
`netlify/functions/`, replicating the `/api/*` -> `/.netlify/functions/:splat`
redirect in `netlify.toml`. `DEV_AUTH` defaults to `1` here, so sign-in is
bypassed and every `backendFor`/`currentSession` call in `netlify/functions/
_shared.ts` uses the in-memory backend and reports `{login:"dev",
mode:"dev"}` — no GitHub OAuth App or session secret needed for local work.

This is a deliberate workaround, not a preference: `netlify dev` (the `dev`
script) crashes under this machine's installed Node 24
(`Cannot read properties of undefined (reading 'Cjs')`), so `netlify-cli` has
never actually been exercised against this codebase locally. Keep that in
mind when trusting "works locally" for anything `netlify dev`-specific
(redirect matching, edge middleware, `netlify.toml` parsing) — verify those
against a real Netlify deploy preview instead.

**Backend-change gotcha:** `dev-server.ts` re-`import()`s the function module
per request but Node's ESM module cache means edits to files it doesn't
directly re-resolve (e.g. changes reached only via `src/backend/
resolveBackend.ts`'s module-level singleton, or anything cached before the
edit) can go unpicked-up. If a change to `src/backend/*` or `netlify/
functions/_shared.ts` doesn't seem to take effect, restart `bun run
dev:local` rather than assuming the code is wrong.

## Production deployment

The editor deploys as its **own Netlify site**, separate from the marketing
site (whose `netlify.toml` lives at the repo root and builds with `npm run
build`). Point a new Netlify site at this repo with:

- **Base directory:** `manual-editor`
- **Build command / publish directory:** picked up automatically from
  `manual-editor/netlify.toml` (`bun run build`, publish `dist`) once the base
  directory is set; functions under `netlify/functions/` are auto-detected via
  `[functions] directory`.
- **Node version:** pin an explicit supported LTS rather than inheriting
  whatever Netlify's build image defaults to — set the `NODE_VERSION`
  environment variable (e.g. `NODE_VERSION=20`) in the site's environment
  variables, or add a `.nvmrc`/`.node-version` file. This project has not been
  verified against Node 24 end-to-end: the local dev machine runs Node 24, and
  `netlify-cli`/`netlify dev` crashes under it here (see "Local dev" above),
  which is exactly the kind of incompatibility that could also bite the
  production Functions runtime if left unpinned. Node 20 LTS is the safer
  known-good target until someone explicitly verifies newer Node against a
  real deploy.

### 1. Register the GitHub OAuth App

Create the OAuth App at <https://github.com/settings/applications/new> (or
under the `audacity` org, if this should be an org-owned app):

- **Homepage URL:** the manual editor site's URL, e.g.
  `https://<site>.netlify.app` (or its custom domain).
- **Authorization callback URL:** `https://<site>/api/auth-callback` — this
  must match `auth-callback.ts` exactly (function name `auth-callback`, hit
  through the `/api/*` -> `/.netlify/functions/:splat` redirect in
  `netlify.toml`). It is **not** `/api/auth/callback` — there is no
  `/auth/callback` path; the function is `auth-callback`.
- The app requests GitHub's `repo` OAuth scope (`auth-login.ts` sets
  `scope=repo` on the authorize URL) — full read/write on repos the
  authenticated user can access, needed because the editor commits drafts and
  opens PRs as that user via `OctokitBackend`.

Record the generated **Client ID** and **Client Secret** for the environment
variables below.

### 2. Environment variables

Set these in the Netlify site's environment variable configuration (Site
settings > Environment variables), never checked into the repo:

| Variable               | Purpose                                                                                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GITHUB_CLIENT_ID`     | From the OAuth App above. Read by `auth-login.ts`/`auth-callback.ts`.                                                                                                    |
| `GITHUB_CLIENT_SECRET` | From the OAuth App above. Read by `auth-callback.ts` for the token exchange. Never sent to the client.                                                                   |
| `OAUTH_REDIRECT_URI`   | Must exactly equal the OAuth App's callback URL above, e.g. `https://<site>/api/auth-callback`.                                                                          |
| `SESSION_SECRET`       | A long random string (e.g. `openssl rand -hex 32`) used to HMAC-sign the session and OAuth-state cookies (`_session.ts`). Rotating it invalidates all existing sessions. |

**Do not set `DEV_AUTH` in production.** `DEV_AUTH=1` makes `_shared.ts`'s
`currentSession`/`backendFor` skip auth entirely — every request is treated
as a fixed `{login:"dev", mode:"dev"}` identity against the in-memory (not
GitHub-backed) backend, and `auth-login.ts` actively refuses to run when it's
set. It exists solely for `bun run dev:local`. If this variable is present
and truthy on the production site, sign-in is silently bypassed for everyone.

Without `SESSION_SECRET` set and `DEV_AUTH` unset, `getSessionSecret()`
throws (`_session.ts`) rather than falling back to a guessable default — the
site fails safe, but every `/api/*` call that needs a session will error
until it's configured.

### 3. Repo/branch model

`OctokitBackend`'s constructor (`src/backend/octokitBackend.ts`) defaults to:

- **Repo:** `audacity/audacity.github.io`
- **Base branch:** `release/audacity-4` — pages are read from here when there's
  no draft, and PRs target this branch.
- **Drafts branch:** `manual/editor-drafts` — a single shared branch (no
  per-user branches; single-writer assumption, documented in
  `commitToDrafts`'s doc comment) that all in-progress edits accumulate on.
  `saveDraft`/`saveImage`/`deletePage` commit here, creating the branch off
  the base branch's head the first time it's needed.

Clicking "Publish" (`publish()`) opens a PR from `manual/editor-drafts` onto
`release/audacity-4` (or returns the existing open one if there already is
one) — it does not merge automatically. Merging is a manual step in GitHub,
same as any other PR.

Because the manual's content lives in the main site's repo
(`src/content/manual/**`, `src/assets/img/manual/**`) and that PR targets the
main site's `release/audacity-4` branch, if the main marketing site has
Netlify deploy previews enabled for that repo/branch, the PR's deploy preview
renders the updated manual pages (`src/pages/manual`) — a reviewer can read
the actual rendered change before merging, on the main site, not the editor.

### 4. Function bundling (prettier config) — known deploy blocker

Every draft save (`POST /api/draft`, `netlify/functions/draft.ts`) calls
`docToSource` -> `formatMdx` (`src/adapter/docToMdast.ts` ->
`src/mdx/normalize.ts`), which loads the repo-root `.prettierrc.json` — the
config that lists the `prettier-plugin-astro` plugin — to normalize every
file the editor writes. This is the only Netlify function in this codebase
that touches `src/mdx`; nothing else pulls it in.

Two things were needed for this to have any chance of working once bundled,
and both have been done as part of this change:

1. **`prettier-plugin-astro` is now a `manual-editor` dependency** (was only a
   root-level `devDependency` of the marketing site before), so esbuild's
   dependency closure for the bundled function actually includes it.
2. **`netlify.toml`'s `[functions]` block now sets
   `included_files = ["../.prettierrc.json"]`**, attempting to copy the
   repo-root config file into the function bundle since `formatMdx` reads it
   via `fs` at runtime, not a static `import` esbuild can trace. **Caveat:**
   Netlify's docs describe `included_files` paths as resolved relative to the
   site's base directory (`manual-editor` here), with no documented support
   for `../` escaping that boundary — whether this actually reaches the
   repo-root file is unverified against a real deploy. Confirm it with a
   preview deploy; if it doesn't resolve, the fallback is copying
   `.prettierrc.json` into `manual-editor/` (inside the base directory) and
   including that copy instead.

**Neither of those is actually sufficient**, and this is the important part:
`normalize.ts`'s `REPO_ROOT` is computed as
`path.resolve(import.meta.dir, "../../..")`, and `import.meta.dir` is a
**Bun-only** global — it does not exist under Node.js (`import.meta.url` and,
on modern Node, `import.meta.dirname`/`filename` do; `import.meta.dir` does
not). Netlify Functions execute on a Node.js runtime, not Bun. Verified
directly: bundling `netlify/functions/draft.ts` with esbuild the same way
Netlify's `node_bundler = "esbuild"` does (`--bundle --platform=node
--format=esm`) and importing the result under `node` throws immediately, at
module load, before any request is handled or any file is read:

```
TypeError: The "paths[0]" argument must be of type string. Received undefined
```

This is why the bug has gone unnoticed: local dev never runs through this
path (`dev-server.ts` runs the function modules directly under Bun, where
`import.meta.dir` is defined, and `netlify dev` — the one thing that would
bundle-and-run under Node like production does — crashes on this machine's
Node 24 before it gets that far; see "Local dev" above). **`/api/draft` will
crash on first use in a real deploy today.** Fixing it requires changing
`src/mdx/normalize.ts`'s `REPO_ROOT` computation to something portable across
both Bun and Node (e.g. `path.dirname(fileURLToPath(import.meta.url))`
instead of `import.meta.dir`) — `src/mdx` is frozen for this task, so that
change is out of scope here and must land as a follow-up before the editor's
save/publish flow can be trusted in production, independent of the
`included_files` question above.
