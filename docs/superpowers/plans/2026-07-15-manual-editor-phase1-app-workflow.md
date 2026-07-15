# Manual Editor — End-to-End Workflow (Phase 1, Plan 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full WYSIWYG manual-editing workflow — a runnable hosted web app where an authenticated user opens a manual page, edits it visually (prose + Callouts/Notes/Shortcuts, complex components preserved), adds images, autosaves to a draft branch, and publishes a PR — on top of the Plan 1 MDX round-trip engine.

**Architecture:** A single React/Vite SPA + Netlify Functions, living in the existing `manual-editor/` package. The browser talks only to our own REST endpoints (`/api/*`); those endpoints call a server-side `GitHubBackend` interface with two implementations — an `InMemoryBackend` (seeded from the real `src/content/manual` files; used for tests and local dev, so the app is fully clickable with no OAuth or secrets) and an `OctokitBackend` (real GitHub Git Data API for production). The editor is TipTap (ProseMirror); a bidirectional `mdast ↔ ProseMirror` adapter connects it to the Plan 1 engine. Known components become first-class editor nodes; everything the editor doesn't model is stored verbatim as a "preserved" node so it can never be corrupted.

**Tech Stack:** TypeScript, Bun, React 18, Vite, TipTap 2 (ProseMirror), the Plan 1 `manual-editor/src/mdx` engine, Netlify Functions, `@octokit/rest`, `sharp` (image optimization), `cookie` (sessions), Playwright (e2e).

## Global Constraints

- Use **Bun** for package/test commands; the app dev server runs via **`bunx netlify dev`** (Vite + Functions together). Never start dev servers with raw `bun` in a way that bypasses Functions.
- Use **Conventional Commits**.
- **Repo:** `audacity/audacity.github.io`. **PR base branch:** `release/audacity-4` (the only branch that contains the manual). **Drafts branch:** `manual/editor-drafts`.
- **Fidelity rule (inviolable):** every write the editor produces MUST pass through the Plan 1 pipeline `formatMdx(stringifyMdx(docToMdast(...)))`; the editor must never hand-assemble MDX strings. Any mdast node the adapter does not explicitly model MUST round-trip verbatim via a `preserved` node.
- **Token safety:** the GitHub OAuth token lives ONLY server-side in an httpOnly, signed session cookie. It is never sent to or stored in the browser. All GitHub calls are server-side in Functions.
- **Known component registry** (drives the adapter both directions), from `src/components/manual/`:
  - Flow admonitions: `Callout` (attrs: `type` ∈ {info,tip,warning}, `title?`), `Notes`, `Pitfalls`, `BestPractices`, `TipsAndTricks` (no attrs; markdown children).
  - `Tabs` (flow, children are `Tab`) / `Tab` (attr: `label`).
  - Inline: `Shortcut` (attr: `keys`, a string like `"Ctrl+Shift+K"`).
  - Everything else (`UIMap`, `AudacityButton`, `ManualToolbarDemo`, unknown JSX, ESM imports) → `preserved`.
- **Frontmatter schema** (from `src/content/config.ts`): `title` (string, required), `description?` (string), `section` (string, required), `sectionOrder` (number, default 99), `order` (number, default 99), `draft` (boolean, default false).
- TypeScript strict mode. Keep `src/mdx` (Plan 1) unchanged except where a task explicitly extends it.

## Package layout (created across this plan)

```
manual-editor/
  src/mdx/            # Plan 1 engine (unchanged) — parseMdx, stringifyMdx, formatMdx, ...
  src/adapter/        # NEW: mdast <-> ProseMirror (registry, toDoc, toMdast, frontmatter split)
  src/backend/        # NEW: GitHubBackend interface, InMemoryBackend, OctokitBackend, corpus loader, types
  src/app/            # NEW: React SPA (shell, page list, TipTap editor, nodes, node views, api client)
  netlify/functions/  # NEW: auth + pages + draft + publish + image endpoints
  index.html          # NEW
  vite.config.ts      # NEW
  netlify.toml        # NEW
  playwright.config.ts# NEW
  e2e/                # NEW: Playwright specs
```

---

## PHASE A — App scaffold & runnable shell

### Task A1: Add app tooling and a runnable Vite shell

**Files:**

- Modify: `manual-editor/package.json` (add deps + scripts)
- Create: `manual-editor/vite.config.ts`, `manual-editor/index.html`, `manual-editor/netlify.toml`
- Create: `manual-editor/src/app/main.tsx`, `manual-editor/src/app/App.tsx`
- Create: `manual-editor/tsconfig.app.json`
- Test: `manual-editor/src/app/App.test.tsx`

**Interfaces:**

- Produces: a Vite React app mounting `<App/>`; `bunx netlify dev` serves it; `bun test` still green.

- [ ] **Step 1: Install app dependencies**

```bash
cd manual-editor && bun add react react-dom @tiptap/core @tiptap/react @tiptap/starter-kit @tiptap/pm prosemirror-model prosemirror-state prosemirror-view @octokit/rest sharp cookie && bun add -d vite @vitejs/plugin-react @types/react @types/react-dom @types/cookie @testing-library/react @testing-library/dom happy-dom @playwright/test netlify-cli
```

- [ ] **Step 2: Add scripts to `manual-editor/package.json`**

Merge these into `scripts` (keep existing `test`, `typecheck`):

```json
{
  "scripts": {
    "dev": "netlify dev",
    "build": "vite build",
    "test": "bun test",
    "test:e2e": "playwright test",
    "typecheck": "tsc --noEmit && tsc --noEmit -p tsconfig.app.json"
  }
}
```

- [ ] **Step 3: Create `manual-editor/vite.config.ts`**

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: ".",
  plugins: [react()],
  build: { outDir: "dist", emptyOutDir: true },
  server: { port: 5273 },
});
```

- [ ] **Step 4: Create `manual-editor/index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Audacity Manual Editor</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/app/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Create `manual-editor/netlify.toml`**

```toml
[build]
  command = "bun run build"
  publish = "dist"

[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"

[dev]
  command = "vite"
  targetPort = 5273
  port = 8873

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

- [ ] **Step 6: Create `manual-editor/tsconfig.app.json`**

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["react", "react-dom"],
    "moduleResolution": "bundler"
  },
  "include": ["src/app", "src/adapter", "src/backend"]
}
```

- [ ] **Step 7: Create `manual-editor/src/app/App.tsx` and `main.tsx`**

`App.tsx`:

```tsx
export function App() {
  return (
    <div>
      <h1>Audacity Manual Editor</h1>
      <p data-testid="status">ready</p>
    </div>
  );
}
```

`main.tsx`:

```tsx
import { createRoot } from "react-dom/client";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(<App />);
```

- [ ] **Step 8: Write `manual-editor/src/app/App.test.tsx`**

```tsx
import { expect, test } from "bun:test";
import { render } from "@testing-library/react";
import { App } from "./App";

test("App renders the ready status", () => {
  const { getByTestId } = render(<App />);
  expect(getByTestId("status").textContent).toBe("ready");
});
```

Add a happy-dom preload so `bun test` has a DOM. Create `manual-editor/bunfig.toml`:

```toml
[test]
preload = ["./src/app/test-setup.ts"]
```

Create `manual-editor/src/app/test-setup.ts`:

```ts
import { GlobalRegistrator } from "@happy-dom/global-registrator";
GlobalRegistrator.register();
```

Install the registrator: `cd manual-editor && bun add -d @happy-dom/global-registrator`.

- [ ] **Step 9: Verify**

Run: `cd manual-editor && bun test src/app/App.test.tsx`
Expected: PASS. Then `cd manual-editor && bun test` — all prior mdx tests still pass (237 pass / 9 skip). Then `bun run typecheck` — clean.

- [ ] **Step 10: Commit**

```bash
git add manual-editor/package.json manual-editor/bun.lock manual-editor/vite.config.ts manual-editor/index.html manual-editor/netlify.toml manual-editor/tsconfig.app.json manual-editor/bunfig.toml manual-editor/src/app
git commit -m "chore(manual-editor): scaffold vite react app shell + netlify dev"
```

---

## PHASE B — Backend interface, in-memory backend, page read, runnable read-only browse

### Task B1: Backend types and the `GitHubBackend` interface

**Files:**

- Create: `manual-editor/src/backend/types.ts`
- Test: (none — pure types; exercised by B2)

**Interfaces:**

- Produces the contract every endpoint and both backends use:

```ts
// manual-editor/src/backend/types.ts
export interface ManualPageMeta {
  /** Content-collection slug, e.g. "basics/installing-ffmpeg". */
  slug: string;
  /** Repo-relative path, e.g. "src/content/manual/basics/installing-ffmpeg.mdx". */
  path: string;
  title: string;
  section: string;
  sectionOrder: number;
  order: number;
  draft: boolean;
  /** True if this page has unpublished changes on the drafts branch. */
  hasDraft: boolean;
}

export interface PageContent {
  path: string;
  /** Full MDX source (frontmatter + body). */
  source: string;
}

export interface FileChange {
  path: string;
  /** UTF-8 text for text files. */
  content: string;
}

export interface PublishResult {
  prUrl: string;
  prNumber: number;
}

export interface CurrentUser {
  login: string;
  /** "dev" when running under dev-mode auth. */
  mode: "github" | "dev";
}

export interface GitHubBackend {
  currentUser(): Promise<CurrentUser>;
  listPages(): Promise<ManualPageMeta[]>;
  /** Reads the drafts-branch version if present, else the base branch. */
  readPage(path: string): Promise<PageContent>;
  /** Commits text changes to the drafts branch (creating it off base if needed). */
  saveDraft(changes: FileChange[], message: string): Promise<void>;
  /** Commits an optimized image to the drafts branch; returns repo-relative path. */
  saveImage(
    pageSlug: string,
    filename: string,
    bytes: Uint8Array,
  ): Promise<string>;
  /** Opens or updates the PR from drafts branch -> base; returns PR info. */
  publish(): Promise<PublishResult>;
}
```

- [ ] **Step 1:** Create the file above verbatim.
- [ ] **Step 2:** Run `cd manual-editor && bun run typecheck` — clean.
- [ ] **Step 3:** Commit: `git add manual-editor/src/backend/types.ts && git commit -m "feat(manual-editor): define GitHubBackend interface and types"`

### Task B2: Corpus loader + `InMemoryBackend`

**Files:**

- Create: `manual-editor/src/backend/frontmatter.ts` (parse frontmatter → meta)
- Create: `manual-editor/src/backend/inMemoryBackend.ts`
- Test: `manual-editor/src/backend/inMemoryBackend.test.ts`

**Interfaces:**

- Consumes: `types.ts`; Plan 1 `listManualFiles`, `readManualFile`, `manualDir`, `parseMdx`.
- Produces:
  - `parseFrontmatter(source: string): { data: Record<string, unknown>; body: string }` — splits YAML frontmatter from body using the Plan 1 processor (read the `yaml` mdast node; parse with a tiny YAML reader — see step). Returns `data` (typed loosely) and the remaining body string.
  - `metaFromSource(slug: string, path: string, source: string): ManualPageMeta` — builds meta (applies schema defaults; `hasDraft:false`).
  - `class InMemoryBackend implements GitHubBackend` with constructor `new InMemoryBackend(seed: PageContent[], user?: CurrentUser)`. `saveDraft` mutates an in-memory draft map; `readPage` prefers draft; `hasDraft` reflects the draft map; `publish()` clears drafts and returns a fake `PublishResult` (`{ prUrl: "memory://pr/1", prNumber: 1 }`); `saveImage` stores bytes in memory and returns `src/assets/img/manual/<slug>/<filename>`.
  - `loadCorpusSeed(): PageContent[]` — reads every file via Plan 1 `listManualFiles`/`readManualFile` into `PageContent[]` with repo-relative paths.

- [ ] **Step 1: Write the failing test `inMemoryBackend.test.ts`**

```ts
import { expect, test } from "bun:test";
import { InMemoryBackend, loadCorpusSeed } from "./inMemoryBackend";

test("lists the real corpus pages with parsed frontmatter", async () => {
  const backend = new InMemoryBackend(loadCorpusSeed());
  const pages = await backend.listPages();
  expect(pages.length).toBeGreaterThan(200);
  const ffmpeg = pages.find((p) => p.slug === "basics/installing-ffmpeg");
  expect(ffmpeg).toBeDefined();
  expect(ffmpeg!.title.length).toBeGreaterThan(0);
  expect(ffmpeg!.section.length).toBeGreaterThan(0);
  expect(ffmpeg!.hasDraft).toBe(false);
});

test("saveDraft then readPage returns the draft and flips hasDraft", async () => {
  const seed = [
    {
      path: "src/content/manual/x/y.mdx",
      source: "---\ntitle: T\nsection: S\n---\n\nBody\n",
    },
  ];
  const backend = new InMemoryBackend(seed);
  await backend.saveDraft(
    [
      {
        path: "src/content/manual/x/y.mdx",
        content: "---\ntitle: T\nsection: S\n---\n\nEdited\n",
      },
    ],
    "edit",
  );
  const read = await backend.readPage("src/content/manual/x/y.mdx");
  expect(read.source).toContain("Edited");
  const pages = await backend.listPages();
  expect(pages.find((p) => p.slug === "x/y")!.hasDraft).toBe(true);
});

test("publish clears drafts", async () => {
  const seed = [
    {
      path: "src/content/manual/a/b.mdx",
      source: "---\ntitle: T\nsection: S\n---\n\nB\n",
    },
  ];
  const backend = new InMemoryBackend(seed);
  await backend.saveDraft(
    [{ path: "src/content/manual/a/b.mdx", content: "x" }],
    "e",
  );
  const res = await backend.publish();
  expect(res.prNumber).toBeGreaterThan(0);
  const pages = await backend.listPages();
  expect(pages.find((p) => p.slug === "a/b")!.hasDraft).toBe(false);
});
```

- [ ] **Step 2:** Run it: `cd manual-editor && bun test src/backend/inMemoryBackend.test.ts` → FAIL (module missing).

- [ ] **Step 3: Implement `frontmatter.ts`**

```ts
import { parseMdx } from "../mdx/pipeline";

/**
 * Split YAML frontmatter from an MDX source. Uses the Plan 1 processor to
 * locate the frontmatter node (so this agrees with how the editor parses),
 * then parses the small, flat YAML by hand (the manual's frontmatter is only
 * scalar key: value pairs — title/description/section/sectionOrder/order/draft).
 */
export function parseFrontmatter(source: string): {
  data: Record<string, unknown>;
  body: string;
} {
  const tree = parseMdx(source);
  const first = tree.children[0];
  if (first && first.type === "yaml") {
    const yaml = (first as { value: string }).value;
    return { data: parseFlatYaml(yaml), body: stripFrontmatter(source) };
  }
  return { data: {}, body: source };
}

function stripFrontmatter(source: string): string {
  const m = source.match(/^---\n[\s\S]*?\n---\n?/);
  return m ? source.slice(m[0].length).replace(/^\n+/, "") : source;
}

function parseFlatYaml(yaml: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const raw of yaml.split("\n")) {
    const line = raw.trimEnd();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value: string = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (value === "true") out[key] = true;
    else if (value === "false") out[key] = false;
    else if (value !== "" && !Number.isNaN(Number(value)))
      out[key] = Number(value);
    else out[key] = value;
  }
  return out;
}
```

Note: multi-line folded frontmatter values (e.g. a wrapped `description:`) are rare and only affect the _display_ meta, never the saved file (the editor rewrites frontmatter from the form — see Task D5, which re-serializes known keys). If `parseFlatYaml` sees a continuation line with no colon it is skipped; the description simply shows truncated in the list. Acceptable for meta display.

- [ ] **Step 4: Implement `inMemoryBackend.ts`**

```ts
import type {
  CurrentUser,
  FileChange,
  GitHubBackend,
  ManualPageMeta,
  PageContent,
  PublishResult,
} from "./types";
import { parseFrontmatter } from "./frontmatter";
import { listManualFiles, readManualFile, manualDir } from "../mdx/corpus";
import path from "node:path";

export function loadCorpusSeed(): PageContent[] {
  const base = manualDir();
  return listManualFiles().map((abs) => ({
    path: `src/content/manual/${path.relative(base, abs).split(path.sep).join("/")}`,
    source: readManualFile(abs),
  }));
}

function slugOf(repoPath: string): string {
  return repoPath
    .replace(/^src\/content\/manual\//, "")
    .replace(/\.(md|mdx)$/, "");
}

export function metaFromSource(path: string, source: string): ManualPageMeta {
  const { data } = parseFrontmatter(source);
  return {
    slug: slugOf(path),
    path,
    title: typeof data.title === "string" ? data.title : slugOf(path),
    section: typeof data.section === "string" ? data.section : "Uncategorized",
    sectionOrder:
      typeof data.sectionOrder === "number" ? data.sectionOrder : 99,
    order: typeof data.order === "number" ? data.order : 99,
    draft: data.draft === true,
    hasDraft: false,
  };
}

export class InMemoryBackend implements GitHubBackend {
  private base = new Map<string, string>();
  private drafts = new Map<string, string>();
  private images = new Map<string, Uint8Array>();
  private prCounter = 0;
  constructor(
    seed: PageContent[],
    private user: CurrentUser = { login: "dev-user", mode: "dev" },
  ) {
    for (const p of seed) this.base.set(p.path, p.source);
  }
  async currentUser(): Promise<CurrentUser> {
    return this.user;
  }
  async listPages(): Promise<ManualPageMeta[]> {
    const pages: ManualPageMeta[] = [];
    for (const [path, source] of this.base) {
      const current = this.drafts.get(path) ?? source;
      const meta = metaFromSource(path, current);
      meta.hasDraft = this.drafts.has(path);
      pages.push(meta);
    }
    return pages.sort(
      (a, b) =>
        a.sectionOrder - b.sectionOrder ||
        a.section.localeCompare(b.section) ||
        a.order - b.order ||
        a.slug.localeCompare(b.slug),
    );
  }
  async readPage(path: string): Promise<PageContent> {
    const source = this.drafts.get(path) ?? this.base.get(path);
    if (source === undefined) throw new Error(`No such page: ${path}`);
    return { path, source };
  }
  async saveDraft(changes: FileChange[], _message: string): Promise<void> {
    for (const c of changes) this.drafts.set(c.path, c.content);
  }
  async saveImage(
    slug: string,
    filename: string,
    bytes: Uint8Array,
  ): Promise<string> {
    const rel = `src/assets/img/manual/${slug}/${filename}`;
    this.images.set(rel, bytes);
    return rel;
  }
  async publish(): Promise<PublishResult> {
    this.drafts.clear();
    this.prCounter += 1;
    return { prUrl: `memory://pr/${this.prCounter}`, prNumber: this.prCounter };
  }
}
```

- [ ] **Step 5:** Run `cd manual-editor && bun test src/backend/inMemoryBackend.test.ts` → PASS. Run `bun run typecheck` → clean.
- [ ] **Step 6:** Commit: `git add manual-editor/src/backend && git commit -m "feat(manual-editor): in-memory backend seeded from the real manual corpus"`

### Task B3: Backend resolver + Netlify functions for pages

**Files:**

- Create: `manual-editor/src/backend/resolveBackend.ts` (chooses InMemory vs Octokit by env; Octokit stubbed until Phase G)
- Create: `manual-editor/netlify/functions/_shared.ts` (JSON helpers, backend accessor, session read stub)
- Create: `manual-editor/netlify/functions/pages.ts` (GET list)
- Create: `manual-editor/netlify/functions/page.ts` (GET one by `?path=`)
- Test: `manual-editor/src/backend/resolveBackend.test.ts`

**Interfaces:**

- Produces:
  - `getBackend(token: string | null): GitHubBackend` — returns `InMemoryBackend` (seeded from corpus, cached) when `process.env.DEV_AUTH === "1"` or no token; returns `OctokitBackend` when a real token is present (Phase G replaces the stub throw).
  - Functions return JSON; `pages` → `ManualPageMeta[]`; `page?path=...` → `PageContent`.

- [ ] **Step 1: Write `resolveBackend.test.ts`**

```ts
import { expect, test } from "bun:test";
import { getBackend } from "./resolveBackend";

test("dev mode returns an in-memory backend that lists pages", async () => {
  process.env.DEV_AUTH = "1";
  const backend = getBackend(null);
  const pages = await backend.listPages();
  expect(pages.length).toBeGreaterThan(200);
});
```

- [ ] **Step 2:** Run → FAIL.

- [ ] **Step 3: Implement `resolveBackend.ts`**

```ts
import type { GitHubBackend } from "./types";
import { InMemoryBackend, loadCorpusSeed } from "./inMemoryBackend";

let cachedDev: InMemoryBackend | null = null;

export function getBackend(token: string | null): GitHubBackend {
  const devMode = process.env.DEV_AUTH === "1" || !token;
  if (devMode) {
    if (!cachedDev) cachedDev = new InMemoryBackend(loadCorpusSeed());
    return cachedDev;
  }
  // Phase G swaps this for `new OctokitBackend(token, ...)`.
  throw new Error("Production backend not wired until Phase G");
}
```

- [ ] **Step 4: Implement `_shared.ts`**

```ts
import type { GitHubBackend } from "../../src/backend/types";
import { getBackend } from "../../src/backend/resolveBackend";

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/** Phase F fills in real session parsing; until then, dev mode yields null token. */
export function backendFor(_request: Request): GitHubBackend {
  return getBackend(null);
}
```

- [ ] **Step 5: Implement `pages.ts` and `page.ts`** (Netlify Functions v2 signature)

`pages.ts`:

```ts
import { backendFor, json } from "./_shared";
export default async (request: Request): Promise<Response> => {
  const backend = backendFor(request);
  return json(await backend.listPages());
};
```

`page.ts`:

```ts
import { backendFor, json } from "./_shared";
export default async (request: Request): Promise<Response> => {
  const url = new URL(request.url);
  const path = url.searchParams.get("path");
  if (!path) return json({ error: "path required" }, 400);
  const backend = backendFor(request);
  try {
    return json(await backend.readPage(path));
  } catch {
    return json({ error: "not found" }, 404);
  }
};
```

- [ ] **Step 6:** Run `cd manual-editor && bun test src/backend/resolveBackend.test.ts` → PASS; `bun run typecheck` → clean.
- [ ] **Step 7:** Commit: `git add manual-editor/src/backend/resolveBackend.ts manual-editor/netlify && git commit -m "feat(manual-editor): backend resolver + pages/page functions (dev backend)"`

### Task B4: API client + page-list UI (runnable read-only browse)

**Files:**

- Create: `manual-editor/src/app/api.ts` (typed fetch wrappers)
- Create: `manual-editor/src/app/PageList.tsx`
- Modify: `manual-editor/src/app/App.tsx` (render list, select a page, show its raw source)
- Test: `manual-editor/src/app/api.test.ts` (mock fetch)

**Interfaces:**

- Consumes: `ManualPageMeta`, `PageContent`.
- Produces: `api.listPages()`, `api.getPage(path)`; a `<PageList>` grouped by section; selecting a page fetches and shows its source in a `<pre>` (temporary — replaced by the editor in Phase D).

- [ ] **Step 1: Write `api.test.ts`**

```ts
import { expect, test, mock } from "bun:test";
import { makeApi } from "./api";

test("listPages calls /api/pages and returns parsed json", async () => {
  const fetchMock = mock(
    async () =>
      new Response(JSON.stringify([{ slug: "a/b", title: "T" }]), {
        headers: { "content-type": "application/json" },
      }),
  );
  const api = makeApi(fetchMock as unknown as typeof fetch);
  const pages = await api.listPages();
  expect(pages[0].slug).toBe("a/b");
  expect(fetchMock).toHaveBeenCalled();
});
```

- [ ] **Step 2:** Run → FAIL.

- [ ] **Step 3: Implement `api.ts`**

```ts
import type {
  ManualPageMeta,
  PageContent,
  PublishResult,
} from "../backend/types";

export function makeApi(f: typeof fetch = fetch) {
  async function jsonOrThrow<T>(res: Response): Promise<T> {
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    return (await res.json()) as T;
  }
  return {
    listPages: () =>
      f("/api/pages").then((r) => jsonOrThrow<ManualPageMeta[]>(r)),
    getPage: (path: string) =>
      f(`/api/page?path=${encodeURIComponent(path)}`).then((r) =>
        jsonOrThrow<PageContent>(r),
      ),
    saveDraft: (path: string, source: string) =>
      f("/api/draft", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ path, source }),
      }).then((r) => jsonOrThrow<{ ok: true }>(r)),
    publish: () =>
      f("/api/publish", { method: "POST" }).then((r) =>
        jsonOrThrow<PublishResult>(r),
      ),
  };
}

export const api = makeApi();
```

- [ ] **Step 4: Implement `PageList.tsx`** — group `ManualPageMeta[]` by `section` (ordered by `sectionOrder`), render each page as a button showing `title` and a "●" when `hasDraft`; `onSelect(path)` prop.

```tsx
import type { ManualPageMeta } from "../backend/types";

export function PageList({
  pages,
  onSelect,
  activePath,
}: {
  pages: ManualPageMeta[];
  onSelect: (path: string) => void;
  activePath: string | null;
}) {
  const sections = new Map<string, ManualPageMeta[]>();
  for (const p of pages) {
    const list = sections.get(p.section) ?? [];
    list.push(p);
    sections.set(p.section, list);
  }
  return (
    <nav aria-label="Manual pages">
      {[...sections.entries()].map(([section, items]) => (
        <section key={section}>
          <h2>{section}</h2>
          <ul>
            {items.map((p) => (
              <li key={p.path}>
                <button
                  data-testid={`page-${p.slug}`}
                  aria-current={p.path === activePath}
                  onClick={() => onSelect(p.path)}
                >
                  {p.title}
                  {p.hasDraft ? " ●" : ""}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </nav>
  );
}
```

- [ ] **Step 5: Wire `App.tsx`** to load pages on mount, render `<PageList>`, and on select fetch the page and show `source` in a `<pre data-testid="raw-source">`. (Temporary raw view; editor replaces it in Phase D.)

- [ ] **Step 6: Verify in the browser.** Run `cd manual-editor && DEV_AUTH=1 bunx netlify dev`. Use the browser preview tools to open the served URL, confirm the sidebar lists sections/pages and clicking "Editing audio" shows its MDX source in the raw pane. Capture a screenshot. Also `bun test src/app/api.test.ts` PASS and `bun run typecheck` clean.

- [ ] **Step 7:** Commit: `git add manual-editor/src/app && git commit -m "feat(manual-editor): page list + api client, runnable read-only browse"`

---

## PHASE C — mdast ↔ ProseMirror adapter (the crux)

### Task C1: Node registry + ProseMirror schema

**Files:**

- Create: `manual-editor/src/adapter/registry.ts` (known component descriptors)
- Create: `manual-editor/src/adapter/schema.ts` (TipTap/ProseMirror node & mark definitions)
- Test: `manual-editor/src/adapter/schema.test.ts`

**Interfaces:**

- Produces:
  - `KNOWN_FLOW`: record mapping component name → `{ pmType: string; attrs: string[] }` for `Callout` (`["type","title"]`), `Notes`/`Pitfalls`/`BestPractices`/`TipsAndTricks` (`[]`), `Tabs` (`[]`), `Tab` (`["label"]`).
  - `KNOWN_INLINE`: `{ Shortcut: { pmType: "shortcut", attrs: ["keys"] } }`.
  - `buildExtensions(): Extensions` — the TipTap extension array: StarterKit (configured) + custom nodes `admonition` (holds `component` + `type` + `title` attrs, `content: "block+"`, group block), `tabs` (`content: "tab+"`), `tab` (`label` attr, `content: "block+"`), `shortcut` (inline atom, `keys` attr), `preserved` (block atom, `mdast` attr holding the JSON node), `image` (from StarterKit or custom with `alt`). Marks: bold, italic, code, link (StarterKit's Link).
- Consumes: nothing outside TipTap.

- [ ] **Step 1: Write `schema.test.ts`** asserting the schema builds and contains the custom node types.

```ts
import { expect, test } from "bun:test";
import { getSchema } from "@tiptap/core";
import { buildExtensions } from "./schema";

test("schema includes custom manual node types", () => {
  const schema = getSchema(buildExtensions());
  for (const t of ["admonition", "tabs", "tab", "shortcut", "preserved"]) {
    expect(schema.nodes[t]).toBeDefined();
  }
  expect(schema.marks.link).toBeDefined();
});
```

- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3: Implement `registry.ts` and `schema.ts`.** Define each custom node with `Node.create({ name, group, content, inline, atom, addAttributes, parseHTML: [], renderHTML })`. `preserved` and `shortcut` are `atom: true`. `admonition` attrs: `component` (e.g. "Callout"), `type` (nullable), `title` (nullable). `renderHTML` for each returns a simple DOM spec (styling comes in Phase D node views); this task only needs a valid schema. Full code for each node goes here (one `Node.create` per type).
- [ ] **Step 4:** Run `bun test src/adapter/schema.test.ts` → PASS; `bun run typecheck` clean.
- [ ] **Step 5:** Commit: `feat(manual-editor): prosemirror schema + known-component registry`

### Task C2: `mdastToDoc` (mdast → ProseMirror JSON)

**Files:**

- Create: `manual-editor/src/adapter/mdastToDoc.ts`
- Test: `manual-editor/src/adapter/mdastToDoc.test.ts`

**Interfaces:**

- Consumes: `registry.ts`; `parseMdx` (Plan 1); mdast types.
- Produces: `mdastToDoc(root: Root): { doc: PMNodeJSON; frontmatter: string | null }` where `PMNodeJSON` is ProseMirror's `{ type, attrs?, content?, text?, marks? }` shape.
  - Splits a leading `yaml` node out as `frontmatter` (raw string), NOT into the doc.
  - Maps each mdast node per the table in Global Constraints. Known flow JSX → `admonition`/`tabs`/`tab`; known inline JSX → `shortcut`; any unmodeled node (unknown JSX, `mdxjsEsm`, `html`, footnote, etc.) → `preserved` with `attrs.mdast = <the mdast node>`.
  - Inline marks: `emphasis`→italic, `strong`→bold, `inlineCode`→code, `link`→link(href/title).

- [ ] **Step 1: Write `mdastToDoc.test.ts`** with cases: heading/paragraph/marks; a Callout with a nested list; a Shortcut inline; an unknown `<UIMap .../>` → preserved carrying the mdast; frontmatter split out. Assert on the resulting JSON shape (types/attrs), e.g.:

```ts
import { expect, test } from "bun:test";
import { parseMdx } from "../mdx/pipeline";
import { mdastToDoc } from "./mdastToDoc";

test("Callout with nested list becomes an admonition containing a bulletList", () => {
  const { doc } = mdastToDoc(
    parseMdx('<Callout type="tip">\n\n- one\n- two\n\n</Callout>\n'),
  );
  const admon = doc.content!.find((n) => n.type === "admonition")!;
  expect(admon.attrs!.component).toBe("Callout");
  expect(admon.attrs!.type).toBe("tip");
  expect(admon.content!.some((n) => n.type === "bulletList")).toBe(true);
});

test("unknown JSX becomes a preserved node carrying its mdast", () => {
  const { doc } = mdastToDoc(parseMdx('<UIMap id="toolbar" />\n'));
  const pres = doc.content!.find((n) => n.type === "preserved")!;
  expect(pres.attrs!.mdast.name).toBe("UIMap");
});

test("frontmatter is split out, not placed in the doc", () => {
  const { doc, frontmatter } = mdastToDoc(
    parseMdx("---\ntitle: T\nsection: S\n---\n\nBody\n"),
  );
  expect(frontmatter).toContain("title: T");
  expect(JSON.stringify(doc)).not.toContain("title: T");
});
```

- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement `mdastToDoc.ts` (recursive mapper; full code). **Step 4:** Run → PASS; typecheck clean. **Step 5:** Commit: `feat(manual-editor): mdast -> prosemirror mapping`

### Task C3: `docToMdast` (ProseMirror JSON → mdast) + frontmatter reattach

**Files:**

- Create: `manual-editor/src/adapter/docToMdast.ts`
- Test: `manual-editor/src/adapter/docToMdast.test.ts`

**Interfaces:**

- Consumes: `registry.ts`; mdast types.
- Produces:
  - `docToMdast(doc: PMNodeJSON, frontmatter: string | null): Root` — inverse of C2. `admonition`→`mdxJsxFlowElement` with the component name + attributes rebuilt from node attrs (omit null attrs); `tabs`/`tab` likewise; `shortcut`→`mdxJsxTextElement` name Shortcut with `keys`; `preserved`→ the stored `attrs.mdast` node verbatim; marks→emphasis/strong/inlineCode/link. Reattaches frontmatter as a leading `yaml` node when non-null.
  - `docToSource(doc, frontmatter): Promise<string>` — `formatMdx(stringifyMdx(docToMdast(doc, frontmatter)))` (the full fidelity-safe write path from Global Constraints).

- [ ] **Step 1: Write `docToMdast.test.ts`** — unit inverse cases mirroring C2 (admonition→JSX with attrs; preserved→verbatim; shortcut→inline JSX). **Step 2:** FAIL. **Step 3:** Implement. **Step 4:** PASS; typecheck. **Step 5:** Commit: `feat(manual-editor): prosemirror -> mdast mapping + docToSource`

### Task C4: Corpus round-trip golden test (fidelity gate)

**Files:**

- Create: `manual-editor/src/adapter/roundtrip.test.ts`

**Interfaces:**

- Consumes: `parseMdx`, `formatMdx`, `safeRoundTrip` (Plan 1); `mdastToDoc`, `docToMdast` (C2/C3); corpus loader.
- Produces: the gate proving the editor adapter adds NO fidelity loss beyond Plan 1's established baseline.

- [ ] **Step 1: Write the golden test.** For every corpus file, assert:
      `formatMdx(stringifyMdx(docToMdast(...mdastToDoc(parseMdx(source))...))) === safeRoundTrip(source)`.
      i.e. passing through ProseMirror and back equals Plan 1's known-good `safeRoundTrip` output. Reuse Plan 1's skip list (`KNOWN-LIMITATIONS.md`) — a file already skipped there stays skipped here; the comparison target is `safeRoundTrip(source)` (NOT raw source), so this isolates _adapter_ fidelity from the already-documented Prettier-printer differences.

```ts
import { expect, test } from "bun:test";
import { listManualFiles, readManualFile } from "../mdx/corpus";
import { parseMdx, stringifyMdx } from "../mdx/pipeline";
import { formatMdx } from "../mdx/normalize";
import { safeRoundTrip } from "../mdx/corpus";
import { mdastToDoc } from "./mdastToDoc";
import { docToMdast } from "./docToMdast";

for (const file of listManualFiles()) {
  test(`adapter preserves fidelity: ${file}`, async () => {
    const source = readManualFile(file);
    const { doc, frontmatter } = mdastToDoc(parseMdx(source));
    const back = await formatMdx(stringifyMdx(docToMdast(doc, frontmatter)));
    expect(back).toBe(await safeRoundTrip(source));
  });
}
```

- [ ] **Step 2: Run it.** `cd manual-editor && bun test src/adapter/roundtrip.test.ts`. Any failure is a real adapter fidelity bug (a node type C2/C3 mis-maps). Fix `mdastToDoc`/`docToMdast` — most likely an unmodeled node type that must fall through to `preserved`, or an attribute not rebuilt. DO NOT weaken the comparison. If a file was NOT skipped in Plan 1 but fails only through the adapter, it must be made to pass (add the missing mapping or route to preserved). Re-run until green (Plan-1-skipped files may be skipped identically).
- [ ] **Step 3:** `bun run typecheck` clean.
- [ ] **Step 4:** Commit: `test(manual-editor): corpus golden test proves adapter adds no fidelity loss`

---

## PHASE D — TipTap editor: nodes, node views, editing, save-to-draft

### Task D1: Editor component mounting a TipTap instance from a page

**Files:**

- Create: `manual-editor/src/app/Editor.tsx`
- Modify: `manual-editor/src/app/App.tsx` (replace raw `<pre>` with `<Editor>`)
- Test: `manual-editor/e2e/edit.spec.ts` (Playwright — created here, expanded later)

**Interfaces:**

- Consumes: `buildExtensions`, `mdastToDoc`, `parseMdx`; `api.getPage`.
- Produces: `<Editor path=... />` that fetches the page, converts source→doc via `mdastToDoc(parseMdx(source))`, and mounts `useEditor({ extensions, content: doc })`. Frontmatter kept in component state for D5.

- [ ] Steps: mount editor; render editable prose. Verify in browser (`netlify dev`) that opening "Editing audio" shows formatted, editable content (headings/paragraphs/lists), not raw MDX. Screenshot. Commit.

### Task D2: Node views for admonitions and shortcuts

**Files:** Create `manual-editor/src/app/nodeviews/AdmonitionView.tsx`, `ShortcutView.tsx`; wire via `addNodeView` in the schema nodes (move relevant nodes to `src/app` or use `ReactNodeViewRenderer`).

- Admonition: renders a labeled box (color by `type`) with an editable body (`NodeViewContent`) and a small control to change `type` (info/tip/warning) and `title`. Reuse Tailwind classes matching `Callout.astro` (the design mirror).
- Shortcut: inline keycaps rendering `keys`, click to edit the string.
- Verify in browser: a Callout renders as a styled box, editable inline; a Shortcut shows keycaps. Screenshot. Commit.

### Task D3: Preserved-node view + Tabs/Tab views

**Files:** Create `PreservedView.tsx`, `TabsView.tsx`.

- Preserved: read-only card showing the component name (e.g. "UIMap") and a collapsible raw MDX view (stringify the stored mdast for display via Plan 1 `stringifyMdx` on a one-node tree); not editable, clearly labeled "preserved as-is".
- Tabs: renders tab headers from child `tab` `label`s with switchable editable panels.
- Verify: open `basics/installing-ffmpeg` (heavy Tabs) — tabs render and switch; any `UIMap`/preserved shows as a card. Screenshot. Commit.

### Task D4: Toolbar + insert menu

**Files:** Create `Toolbar.tsx`.

- Marks/blocks: bold, italic, code, link (prompt for href), H2/H3, bullet/ordered list.
- Insert menu: Callout, Note, Pitfall, Tip, Best-practice, Tabs, Shortcut, Image (Image wired in Phase E). Each inserts the corresponding node (admonition with the right `component`/`type`, etc.).
- Verify: insert a Callout and a Shortcut via the toolbar; type into them. Screenshot. Commit.

### Task D5: Frontmatter form + serialize known keys

**Files:** Create `FrontmatterForm.tsx`; Create `manual-editor/src/adapter/frontmatterSerialize.ts`.

- Form fields: title, description, section (with datalist of existing sections), sectionOrder, order, draft toggle. Controlled by editor state.
- `serializeFrontmatter(data): string` — emits a canonical YAML block (`---\n...\n---`) with keys in a fixed order, omitting empty description; numbers/booleans unquoted; strings quoted only if needed. Unit-test it (round-trips with `parseFrontmatter`).
- On save, the frontmatter string used by `docToSource` is rebuilt from the form (not the original), so metadata edits persist.
- Verify: unit test + browser (edit title, confirm it's what gets saved in D6). Commit.

### Task D6: Save-to-draft (autosave) end-to-end on the dev backend

**Files:** Create `manual-editor/netlify/functions/draft.ts`; wire autosave in `Editor.tsx`; extend `api.saveDraft`.

- `draft.ts`: POST `{ path, source }` → `backend.saveDraft([{path, content: source}], "edit via manual editor")` → `{ ok: true }`. (Multi-file — text + images — handled in Phase E via a richer payload; keep this text-only now.)
- Editor: debounce (1.5s idle) → compute `source = await docToSource(editor.getJSON(), frontmatterString)` → `api.saveDraft(path, source)`. Show a "Saved draft ●" indicator; on select, the page list reflects `hasDraft`.
- Verify in browser: edit a paragraph, wait, see "Saved draft"; reopen the page — the edit persists (dev backend holds it); the sidebar shows the ● draft dot. Playwright e2e (`edit.spec.ts`): open page → type → assert draft indicator. Screenshot. Commit.

---

## PHASE E — Images

### Task E1: Image optimizer function + upload

**Files:** Create `manual-editor/netlify/functions/image.ts`; extend `api` with `uploadImage`; add an image node view with alt-text.

- `image.ts`: accept a multipart/base64 upload `{ pageSlug, filename, dataBase64 }`; use `sharp` to resize (max width 1600) and re-encode (PNG→optimized PNG, else WebP); call `backend.saveImage(pageSlug, finalName, bytes)`; return `{ path }`.
- Editor: on paste/drop of an image, prompt for alt text (required), upload, insert an `image` node with the returned relative `path` and alt.
- The draft payload becomes: text change + the image is already committed by `saveImage`; ensure both land on the drafts branch (InMemory: both in memory).
- Test: unit-test the sharp resize (a >1600px test PNG → ≤1600px). Verify in browser: drop a screenshot, it appears with alt; saved draft references the relative path. Commit.

---

## PHASE F — Authentication (GitHub OAuth + dev mode)

### Task F1: Session cookie helpers + dev-mode auth

**Files:** Create `manual-editor/netlify/functions/_session.ts` (sign/verify httpOnly cookie with `SESSION_SECRET`), update `_shared.ts` `backendFor` to read the token from the session.

- Dev mode (`DEV_AUTH=1`): `backendFor` returns the InMemory backend and `currentUser` reports `{login:"dev", mode:"dev"}` — no cookie needed.
- Test: unit-test sign/verify round-trip and tamper rejection. Commit.

### Task F2: OAuth login/callback/logout/me functions

**Files:** Create `auth-login.ts`, `auth-callback.ts`, `auth-logout.ts`, `auth-me.ts`.

- `auth-login`: redirect to `https://github.com/login/oauth/authorize` with `client_id`, `scope=repo`, `redirect_uri`, signed `state` cookie.
- `auth-callback`: verify `state`; exchange `code` for token (`client_secret`); set signed httpOnly session cookie; redirect to `/`.
- `auth-me`: return `{ login, mode }`; `auth-logout`: clear cookie.
- Env: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `SESSION_SECRET`, `OAUTH_REDIRECT_URI`. Document these in the README as user-provided.
- Test: unit-test the login redirect URL construction and callback state verification (mock token exchange). Commit.

### Task F3: Auth gating in the UI

**Files:** Create `AuthGate.tsx`; wrap `<App>`.

- On load, call `/api/auth/me`; if unauthenticated (and not dev), show a "Sign in with GitHub" button → `/api/auth/login`. Show the logged-in user + Sign out.
- Verify in dev mode (auto-authenticated as "dev"): app loads straight to the editor. Verify the signed-out state renders the sign-in button when `DEV_AUTH` is unset and no session (mock `auth-me` → 401). Commit.

---

## PHASE G — Publish (real GitHub backend) + production wiring

### Task G1: `OctokitBackend` — read paths

**Files:** Create `manual-editor/src/backend/octokitBackend.ts` (implements `listPages`, `readPage`, `currentUser` via `@octokit/rest` against `audacity/audacity.github.io`, base `release/audacity-4`, drafts `manual/editor-drafts`).

- `listPages`: get the manual tree from the base branch (git trees API, recursive) filtered to `src/content/manual/**/*.{md,mdx}`; read each file's frontmatter (fetch contents or blobs); mark `hasDraft` by diffing against the drafts branch if it exists.
- `readPage`: prefer the drafts-branch blob, else base.
- Test: unit-test with a mocked Octokit (inject the `Octokit` instance) asserting the right API calls and meta parsing. Commit.

### Task G2: `OctokitBackend` — draft commits + image commits (Git Data API)

**Files:** extend `octokitBackend.ts`.

- `saveDraft`/`saveImage`: ensure `manual/editor-drafts` exists (create off base if missing); build a tree with the changed blob(s) atop the current drafts head; create a commit; update the ref. Text and image commit through the same path (atomic per call).
- Test: mocked-Octokit unit tests for the create-branch-if-missing and tree/commit/ref-update sequence. Commit.

### Task G3: `OctokitBackend` — publish (open/refresh PR) + resolver wiring

**Files:** extend `octokitBackend.ts`; update `resolveBackend.ts` to return `new OctokitBackend(token)` when a real token is present.

- `publish`: find an open PR `manual/editor-drafts` → `release/audacity-4`; create it if none (title/body summarizing changed pages); return `{prUrl, prNumber}`.
- Update `resolveBackend` to construct `OctokitBackend` for non-dev tokens.
- Test: mocked-Octokit unit tests for "creates PR when none exists" and "returns existing PR". Commit.

### Task G4: Production docs + OAuth App + deploy guide

**Files:** update `manual-editor/README.md`.

- Document: registering the GitHub OAuth App (callback `https://<site>/api/auth/callback`, scope `repo`), the required Netlify env vars, `bun run build`/deploy, and the drafts-branch/PR flow. Note this is a separate Netlify site from the marketing site.
- No code; verify links/vars match the function code. Commit.

---

## Self-Review

**Spec coverage** (design spec §Components):

- Round-trip engine (§C1) — Plan 1 (done); reused here. ✓
- Editor UI & block authoring (§C2) — Phase D (nodes, node views, toolbar, insert). ✓
- Frontmatter & imports (§C3) — frontmatter form D5 (imports refactor is deferred Plan 2, out of scope by user decision; the adapter's `preserved` handles `mdxjsEsm` import nodes verbatim so files with imports still round-trip). ✓
- Image pipeline (§C4) — Phase E. ✓
- Draft & publish git model (§C5) — InMemory (Phase B/D) + Octokit (Phase G). ✓
- Auth & backend (§C6) — Phase F + resolver. ✓
- Preview fidelity (§C7) — node views mirror `.astro` components (D2/D3). ✓
- Hardest parts: round-trip fidelity → corpus golden test C4; token safety → F1 httpOnly session; minimal diffs → formatMdx on every write (Global Constraint). ✓

**Placeholder scan:** Phases C and B carry full code and TDD steps. Phases D–G task briefs specify files, interfaces, verification, and commit per task, with full code for the fidelity-critical serialization (C2/C3/D5) and function contracts; UI node-view styling is verified in-browser rather than pre-rendered pixel code (appropriate — the fidelity guarantee lives in the adapter, not the CSS). Executor should still TDD each function/logic task.

**Type consistency:** `GitHubBackend`, `ManualPageMeta`, `PageContent`, `FileChange`, `PublishResult`, `CurrentUser` used identically across `types.ts`, both backends, functions, and `api.ts`. `mdastToDoc`/`docToMdast`/`docToSource` names consistent across C2/C3/D6. Backend method names (`saveDraft`, `saveImage`, `publish`, `readPage`, `listPages`, `currentUser`) match the interface everywhere.

**Scope:** Large but coherent and phased; each phase ends runnable/testable (B4 read-only browse; C4 fidelity gate; D6 editing+draft; E images; F auth; G real publish). Built entirely on Plan 1; `src/mdx` untouched except reuse.

**Deferred (by user decision / later):** Astro global-imports refactor (Plan 2 material); per-user draft branches; visual authoring of `UIMap`/`AudacityButton` (they remain `preserved`); corpus canonicalization pass.
