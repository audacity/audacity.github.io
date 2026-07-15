# Manual Editor — New Page Creation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Let a writer create a brand-new manual page in the editor — pick a title, section, and folder location; the file is seeded with frontmatter and created on the draft branch via the existing autosave path, appearing in the sidebar and the eventual PR.

**Architecture:** Two small tasks on top of the existing app. (1) Backend: `listPages` must surface draft-only pages (files that exist only on the drafts branch, not on base) so a newly created page shows up. (2) UI: a "New page" form that derives the file path, seeds frontmatter, creates the draft via the existing `saveDraftDoc` path, and opens the blank page in the editor. Reuses the frozen adapter/engine and the server-side serialization from Phase D6.

**Tech Stack:** Same as Plan 2 (TypeScript, Bun, React, TipTap, Netlify functions, InMemory/Octokit backends).

## Global Constraints

- Bun; Conventional Commits; TypeScript strict. Do NOT modify `src/mdx` or `src/adapter` logic.
- New pages live under `src/content/manual/<folder>/<slug>.mdx`. `<slug>` is the title slugified (lowercase, spaces/underscores → `-`, strip characters other than `[a-z0-9-]`, collapse repeats, trim leading/trailing `-`). `<folder>` is an existing manual folder or a new one the user types (same slug rules per path segment; may contain `/`).
- Seed frontmatter uses the existing `serializeFrontmatter` with `{ title, section, order }` where `order` = (max `order` among pages sharing the chosen folder) + 1, or 1 if none. `sectionOrder` is copied from an existing page in that section if one exists, else omitted (defaults to 99).
- Creating a page must never overwrite an existing file: reject if the computed path already exists among the loaded pages.
- All serialization stays server-side (Phase D6): the client posts an (empty) editor doc + serialized frontmatter to `/api/draft` via the existing `saveDraftDoc`.

---

### Task 1: Backend lists draft-only (newly created) pages

**Files:**

- Modify: `manual-editor/src/backend/inMemoryBackend.ts`
- Test: `manual-editor/src/backend/inMemoryBackend.test.ts` (add cases)

**Interfaces:**

- Consumes: existing `GitHubBackend` types, `metaFromSource`.
- Produces: `InMemoryBackend.listPages()` returns a page for every path in `base` OR `drafts` (union). A draft-only path (in `drafts`, not in `base`) is listed with `hasDraft: true` and meta parsed from the draft source. Ordering unchanged (sectionOrder → section → order → slug). `readPage` already prefers drafts, so no change needed there.

- [ ] **Step 1: Write failing tests** in `inMemoryBackend.test.ts`:

```ts
test("listPages includes a draft-only (newly created) page", async () => {
  const seed = [
    {
      path: "src/content/manual/basics/existing.mdx",
      source: "---\ntitle: E\nsection: Basics\n---\n\nBody\n",
    },
  ];
  const backend = new InMemoryBackend(seed);
  // No such file in base — this is a brand-new page saved only as a draft:
  await backend.saveDraft(
    [
      {
        path: "src/content/manual/basics/new-page.mdx",
        content: "---\ntitle: New Page\nsection: Basics\norder: 2\n---\n\n",
      },
    ],
    "create",
  );
  const pages = await backend.listPages();
  const created = pages.find((p) => p.slug === "basics/new-page");
  expect(created).toBeDefined();
  expect(created!.title).toBe("New Page");
  expect(created!.hasDraft).toBe(true);
  // Existing page still present exactly once:
  expect(pages.filter((p) => p.slug === "basics/existing").length).toBe(1);
});

test("a draft that edits an existing page is not double-listed", async () => {
  const seed = [
    {
      path: "src/content/manual/a/b.mdx",
      source: "---\ntitle: T\nsection: S\n---\n\nB\n",
    },
  ];
  const backend = new InMemoryBackend(seed);
  await backend.saveDraft(
    [
      {
        path: "src/content/manual/a/b.mdx",
        content: "---\ntitle: T2\nsection: S\n---\n\nEdited\n",
      },
    ],
    "e",
  );
  const pages = await backend.listPages();
  expect(pages.filter((p) => p.slug === "a/b").length).toBe(1);
  expect(pages.find((p) => p.slug === "a/b")!.title).toBe("T2"); // draft title wins
});
```

- [ ] **Step 2:** Run `cd manual-editor && bun test src/backend/inMemoryBackend.test.ts` → the draft-only test FAILS (page not listed).

- [ ] **Step 3: Implement** — change `listPages` to iterate the union of keys. Replace the `for (const [path, source] of this.base)` loop with:

```ts
async listPages(): Promise<ManualPageMeta[]> {
  const pages: ManualPageMeta[] = [];
  const paths = new Set<string>([...this.base.keys(), ...this.drafts.keys()]);
  for (const path of paths) {
    const current = this.drafts.get(path) ?? this.base.get(path)!;
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
```

- [ ] **Step 4:** Run the test → PASS. Run full `cd manual-editor && bun test` → all green (existing backend tests unaffected). `bun run typecheck` → clean.

- [ ] **Step 5: Commit**

```bash
git add manual-editor/src/backend/inMemoryBackend.ts manual-editor/src/backend/inMemoryBackend.test.ts
git commit -m "feat(manual-editor): list draft-only pages so newly created pages appear"
```

---

### Task 2: "New page" UI flow

**Files:**

- Create: `manual-editor/src/app/NewPageDialog.tsx`
- Create: `manual-editor/src/app/newPagePath.ts` (pure path/slug helpers)
- Modify: `manual-editor/src/app/App.tsx` (button + wiring), `manual-editor/src/app/editor.css` (dialog styles)
- Test: `manual-editor/src/app/newPagePath.test.ts`, `manual-editor/src/app/NewPageDialog.test.tsx`

**Interfaces:**

- Consumes: `api.saveDraftDoc(path, doc, frontmatter)` (from D6), `serializeFrontmatter` (adapter), the loaded `pages: ManualPageMeta[]`.
- Produces:
  - `slugify(input: string): string` and `buildNewPagePath(folder: string, title: string): string` (returns `src/content/manual/<folder-slug>/<title-slug>.mdx`) in `newPagePath.ts`.
  - `existingFolders(pages): string[]` — unique folder prefixes (the path between `src/content/manual/` and the last `/`).
  - `nextOrder(pages, folder): number` and `sectionOrderFor(pages, section): number | undefined`.
  - `<NewPageDialog>` — a modal form (Title, Section with datalist, Location with a folder datalist), a live path preview, validation (non-empty title/section, computed path not already in `pages`), and an `onCreate({ path, frontmatter })` callback. `data-testid="new-page-dialog"`.
  - App renders a `+ New page` button above the page list; on submit it builds an empty PM doc (`{ type: "doc", content: [{ type: "paragraph" }] }`), calls `api.saveDraftDoc(path, emptyDoc, serializeFrontmatter(seed))`, then re-fetches pages and selects the new path (so the editor opens it). `data-testid="new-page-button"`.

- [ ] **Step 1: Write `newPagePath.test.ts`** (pure helpers):

```ts
import { expect, test } from "bun:test";
import {
  slugify,
  buildNewPagePath,
  existingFolders,
  nextOrder,
} from "./newPagePath";

test("slugify normalizes titles", () => {
  expect(slugify("Recording Your Voice!")).toBe("recording-your-voice");
  expect(slugify("  A  B__c ")).toBe("a-b-c");
  expect(slugify("Rész — 4")).toBe("resz-4"); // strips non [a-z0-9-]; see note below
});

test("buildNewPagePath composes folder + slug", () => {
  expect(buildNewPagePath("audio-editing", "My New Page")).toBe(
    "src/content/manual/audio-editing/my-new-page.mdx",
  );
});

test("existingFolders lists unique folders from page paths", () => {
  const pages = [
    { path: "src/content/manual/basics/a.mdx" },
    { path: "src/content/manual/basics/b.mdx" },
    { path: "src/content/manual/audio-editing/c.mdx" },
  ] as any;
  expect(existingFolders(pages).sort()).toEqual(["audio-editing", "basics"]);
});

test("nextOrder is max order in the folder + 1", () => {
  const pages = [
    { path: "src/content/manual/basics/a.mdx", order: 1 },
    { path: "src/content/manual/basics/b.mdx", order: 4 },
    { path: "src/content/manual/other/c.mdx", order: 9 },
  ] as any;
  expect(nextOrder(pages, "basics")).toBe(5);
  expect(nextOrder(pages, "empty-folder")).toBe(1);
});
```

Note on `slugify` of accented characters: normalize via `String.prototype.normalize("NFKD")` then strip combining marks before removing non-`[a-z0-9-]`, so `Rész` → `resz`. If a title slugifies to empty (e.g. all non-latin), fall back to `page`.

- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement `newPagePath.ts` (full helpers per the tests + the NFKD note). **Step 4:** Run → PASS.

- [ ] **Step 5: Write `NewPageDialog.test.tsx`** — mount the dialog with a couple of existing `pages`; assert: (a) the path preview updates as the title changes; (b) submitting with a title whose path collides with an existing page shows an error and does NOT call `onCreate`; (c) a valid submit calls `onCreate` with the composed path and a frontmatter string containing the title and section. Real assertions.

- [ ] **Step 6:** Implement `NewPageDialog.tsx` (controlled form, datalists for section + folder, live `buildNewPagePath` preview, collision check against passed `existingPaths`, `onCreate`/`onCancel`). Keep styling minimal in `editor.css` (a centered modal card over a dim backdrop).

- [ ] **Step 7: Wire `App.tsx`** — add the `+ New page` button; manage dialog open state; on create:

```ts
async function handleCreatePage({
  path,
  frontmatter,
}: {
  path: string;
  frontmatter: string;
}) {
  const emptyDoc = { type: "doc", content: [{ type: "paragraph" }] };
  await api.saveDraftDoc(path, emptyDoc, frontmatter);
  const fresh = await api.listPages();
  setPages(fresh);
  handleSelect(path); // opens the new page in the editor
  setDialogOpen(false);
}
```

(Confirm `api.saveDraftDoc` exists from D6 with signature `(path, doc, frontmatter)`; if the name differs, use the actual D6 method that posts to `/api/draft`.)

- [ ] **Step 8:** Full `cd manual-editor && bun test` → all green. `bun run typecheck` → clean. `bun run build` → succeeds.

- [ ] **Step 9: Commit**

```bash
git add manual-editor/src/app/NewPageDialog.tsx manual-editor/src/app/newPagePath.ts manual-editor/src/app/newPagePath.test.ts manual-editor/src/app/NewPageDialog.test.tsx manual-editor/src/app/App.tsx manual-editor/src/app/editor.css
git commit -m "feat(manual-editor): create new manual pages from the editor"
```

- [ ] **Step 10: Controller browser verification** — create a new page via the UI, confirm it appears in the sidebar with a ●, opens as a blank editor, accepts edits, autosaves, and persists across reload (draft-only page listed).

---

## Self-Review

- Spec coverage: draft-only listing (Task 1) + creation flow (Task 2) → the two pieces the feature needs. ✓
- Placeholder scan: helpers have concrete tests; the empty-doc shape and saveDraftDoc reuse are specified. The only "confirm the actual method name" note (Step 7) is a deliberate guard against D6 naming drift, not a placeholder.
- Type consistency: `slugify`/`buildNewPagePath`/`existingFolders`/`nextOrder` names match across tests, impl, and dialog usage.
- Scope: no Octokit change here (backend `listPages` union is InMemory; the Octokit backend, wired in Phase G, must implement the same union — noted for G). No adapter/engine changes.
