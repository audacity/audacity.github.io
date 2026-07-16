# Manual Editor — Image Upload (Phase E) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Paste or drop a screenshot into the editor → prompted for alt text → the image is optimized server-side (max-width 1600, recompressed), committed to `src/assets/img/manual/<page-slug>/<filename>` on the drafts branch, and inserted as an image block that renders in the editor and serializes as a standard relative markdown image.

**Architecture:** Three tasks. (1) Backend/API: `/api/image` upload endpoint (sharp pipeline → existing `saveImage`) + `readAsset` backend method + `/api/asset` serving endpoint (new uploads have repo-relative paths that resolve to nothing in the browser — the editor displays them through this proxy; existing corpus images use absolute URLs and render directly). (2) Editor UX: paste/drop handlers → alt prompt → upload → insert `image` node (persisted `src` stays repo-relative; the node view maps relative srcs through `/api/asset` for display only). (3) Controller browser verify + deploy.

## Global Constraints

- Bun; Conventional Commits; TS strict. No `src/mdx` changes; `src/adapter` untouched (the `image` node + both adapter directions already round-trip `src`/`alt`/`title` — C2/C3).
- **Persisted `src` is the repo-relative path** (`src/assets/img/manual/...`) — that's what lands in the MDX and what the Astro site consumes. Display-time proxying is a node-view concern ONLY; the doc/adapter never see proxied URLs.
- **Optimization:** sharp — `rotate()` (EXIF), resize to `width: 1600, withoutEnlargement: true`, PNG in → optimized PNG (`compressionLevel: 9`), everything else → quality-80 WebP with the filename extension adjusted accordingly. Reject non-images (400) and >15MB payloads (413).
- **Filename:** slugified original name (reuse `slugify`) + short random suffix to avoid collisions + correct extension.
- **Alt text required** at insert (a11y + design spec); Escape/empty cancels the whole insert (no upload happens before the prompt).
- Upload is auth-gated like every write. Existing `saveImage` (both backends, G2) does the commit — reuse, don't reimplement.
- `readAsset(path)`: InMemory → the in-memory images map (404 otherwise); Octokit → blob from the drafts branch, falling back to base (covers post-merge sessions). `/api/asset` GET streams bytes with a correct Content-Type (from extension) and long cache headers (immutable filenames).
- sharp import must be lazy (inside the handler) so other functions' cold starts don't pay for it; note in the report whether Netlify bundles sharp's native binary cleanly (zisi handles native modules — verify with the esbuild-simulation pattern used for earlier function work, `--external:sharp` mirrors zisi's native-module externalization).

---

### Task 1: Upload + asset endpoints, backend `readAsset`

**Files:**

- Modify: `manual-editor/src/backend/types.ts` (+`readAsset(path: string): Promise<Uint8Array>`), `inMemoryBackend.ts`, `octokitBackend.ts`
- Create: `manual-editor/netlify/functions/image.mts` (POST `{pageSlug, filename, dataBase64}` → validate → sharp → `saveImage` → `{path}`), `manual-editor/netlify/functions/asset.mts` (GET `?path=` → `readAsset` → bytes + Content-Type; 404 unknown; only paths under `src/assets/img/manual/` are servable — reject others 400)
- Modify: `manual-editor/src/app/api.ts` (`uploadImage(pageSlug, filename, blob) → {path}` — reads the blob to base64 client-side)
- Test: backend tests (InMemory readAsset roundtrip via saveImage; Octokit fake blob fetch drafts-then-base), endpoint tests (upload happy path with a tiny real PNG fixture buffer — assert resize metadata via sharp in the test; 400 non-image; 401 unauth; asset serving + 404 + path-scope 400)

- [ ] TDD backend `readAsset` both backends; then the endpoints (real sharp in tests — it's a devDependency-equivalent already in dependencies).
- [ ] esbuild-simulate `image.mts` + `asset.mts` as ESM/node (the established pattern) — import-clean with sharp external.
- [ ] Full `bun test` green; typecheck clean. Commit: `feat(manual-editor): image upload and asset endpoints`

### Task 2: Paste/drop UX + image display

**Files:**

- Modify: `manual-editor/src/app/editorExtensions.ts` or `Editor.tsx` (editorProps `handlePaste`/`handleDrop` — detect image files, run the flow; text/other content falls through to default), `manual-editor/src/app/editor.css`
- Create: `manual-editor/src/app/nodeviews/ImageView.tsx` (node view for the `image` node: renders `<img>` with `src` mapped through `/api/asset?path=` when relative, as-is when absolute; shows alt as a caption line; `data-testid="image-block"`), register in `buildAppExtensions` (schema-parity safe — node view only)
- Create: `manual-editor/src/app/imageUpload.ts` (pure-ish flow helper: `insertImageFromFile(editor, api, pageSlug, file): Promise<boolean>` — prompt alt (window.prompt, consistent with ⌘K), false/no-op on cancel; uploads; inserts `{type:"image", attrs:{src: path, alt}}` at selection; on failure surfaces the editor's existing error affordance)
- Test: `imageUpload.test.tsx` (mocked api: cancel → no upload; happy → uploadImage called with file + node inserted with returned path + alt; failure → no node), ImageView src-mapping unit (relative→proxied, absolute→untouched), regression suites green

- [ ] Editor needs the current page slug for the upload folder — derive from `path` (strip prefix/extension), pass into the handlers.
- [ ] Full `bun test` green; typecheck; build. Commit: `feat(manual-editor): paste and drop images into pages`

### Task 3 (controller): browser verify + deploy

- Construct a File in the real browser, dispatch a paste/drop with it; alt prompt (pre-stub window.prompt); verify upload → `/api/asset` render → draft MDX contains `![alt](src/assets/img/manual/...)` (fetch the draft source via /api/page); push → deploy.

---

## Self-Review

- Spec coverage: optimization, relative-src persistence, display proxy, alt-required, auth, both backends, lazy sharp, deploy simulation. ✓
- The design spec's "atomic with text" nicety is intentionally relaxed (image commits on upload; the referencing text commits on next autosave — same PR, documented since G2).
- Type consistency: `readAsset`/`uploadImage`/`insertImageFromFile` consistent. ✓
