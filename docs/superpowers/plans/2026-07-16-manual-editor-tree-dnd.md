# Manual Editor — Sidebar Page-Tree Drag & Drop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Restructure the manual by dragging pages in the sidebar tree: drop **between** siblings to reorder, drop **onto** a page to nest under it (dropping onto a page with no children makes it a parent). Moves carry all descendants, update frontmatter (`order`, and `section`/`sectionOrder` when crossing sections), and are staged as draft commits like every other edit.

**Architecture:** Three tasks. (1) Backend semantics: `reorderPages(updates)` (rewrite `order` frontmatter across files, one commit) and `movePage(path, dest)` (move the file + ALL descendants to a new folder, rewrite the moved page's frontmatter, one commit) on both backends + `/api/reorder` + `/api/move` endpoints. (2) Sidebar tree HTML5 drag & drop: three-zone drop detection (above/below = reorder, middle = nest), indicator styling, client-side operation computation (incl. cycle guard), App wiring + refresh. (3) Controller browser verification + deploy.

## Global Constraints

- Bun; Conventional Commits; TypeScript strict. No `src/mdx` or `src/adapter` changes.
- **Move semantics (file model):** page slug `a/b` lives at `src/content/manual/a/b.mdx`; its children live under `src/content/manual/a/b/`. Moving `a/b` under parent `x/y` → `src/content/manual/x/y/b.mdx` AND every descendant `a/b/**` → `x/y/b/**`. One atomic draft commit per move (new contents + old-path deletions together). Frontmatter body content NEVER changes except the frontmatter block itself.
- **Frontmatter rewrites (server-side):** use `parseFrontmatter` (backend) to split, mutate only the affected keys, re-serialize via `serializeFrontmatter` (adapter — server-side import is fine, functions already import adapter code). The moved page gets the new `order` and, when the destination differs in section, the destination's `section` + `sectionOrder`; descendants inherit the section change too (their `order` is untouched). Reorders rewrite ONLY `order`.
- **Reorder strategy:** on any drop, the client computes the destination sibling list's final arrangement and renumbers it 1..n; only files whose `order` actually changes are sent. (Predictable, integer-only; a 25-child folder reorder may touch many files — acceptable, it's one commit.)
- **Destination folder for "root of section" drops** (between two top-level nodes of a section): the folder of the adjacent sibling at the drop position.
- **Cycle guard:** dropping a page onto/into its own descendant is blocked client-side (no-op + brief visual refusal) AND the server rejects `movePage` where `dest.folder` starts with the moved page's slug (400).
- **Self/no-op guards:** dropping in place = no-op, no API call.
- **UI:** the existing `.sidebar-tree__page` rows become `draggable`; during drag, a 2px indigo line indicates before/after positions, a full-row highlight indicates nest-into; auto-expand a collapsed parent on hover-over (500ms) is nice-to-have, not required. The page being dragged gets reduced opacity. Keyboard alternative NOT in scope (v2).
- After a successful move/reorder: re-fetch pages; if the ACTIVE page was moved, update `activePath` to its new path (the server response returns the new path map).

---

### Task 1: Backend `reorderPages` + `movePage` + endpoints

**Files:**

- Modify: `manual-editor/src/backend/types.ts` (two new methods), `manual-editor/src/backend/inMemoryBackend.ts`, `manual-editor/src/backend/octokitBackend.ts`
- Create: `manual-editor/netlify/functions/reorder.mts`, `manual-editor/netlify/functions/move.mts`
- Create: `manual-editor/src/backend/frontmatterRewrite.ts` (shared helper: `rewriteFrontmatter(source, patch: Partial<FrontmatterData>) → string` — parse, merge, re-serialize frontmatter + original body; pure, unit-tested; body bytes untouched)
- Test: extend backend tests + new `netlify/tests/move.test.ts`

**Interfaces (binding):**

```ts
// types.ts additions
interface GitHubBackend {
  /** Rewrite `order` frontmatter on each path. One commit. */
  reorderPages(updates: Array<{ path: string; order: number }>): Promise<void>;
  /**
   * Move a page and all its descendants to a new folder. Rewrites the moved
   * page's frontmatter (order; section/sectionOrder when provided). Returns
   * the old→new path mapping (moved page first).
   */
  movePage(
    path: string,
    dest: {
      folder: string; // destination folder RELATIVE to src/content/manual, "" not allowed
      order: number;
      section?: string; // set when crossing sections (applies to descendants too)
      sectionOrder?: number;
    },
  ): Promise<Array<{ from: string; to: string }>>;
}
```

- InMemory: operate on the union of base+drafts sources (readPage semantics); moved old paths become staged deletions (base pages) or vanish (draft-only); new paths become drafts. Guard: destination folder inside the moved slug → throw.
- Octokit: build ONE `commitToDrafts` tree: `{path: new, content}` entries for every moved file (content read via the drafts-preferring read path, frontmatter rewritten where applicable) + `{path: old, sha: null}` deletions. Reorder: content rewrites only.
- Endpoints: POST `/api/reorder` `{updates}` → `{ok:true}`; POST `/api/move` `{path, dest}` → `{moves: [{from,to}]}`. Both behind the existing auth gate; 400 on validation failures (cycle, bad folder, unknown path).

- [ ] TDD `frontmatterRewrite.ts` (body untouched byte-for-byte; only patched keys change; works on files with/without optional keys).
- [ ] TDD InMemory `reorderPages` + `movePage` (single page; page with nested descendants — folder travels; cross-section move updates descendants' section; draft-edited page moves with its DRAFT content; cycle throw; unknown path throw).
- [ ] Mock-octokit tests: one commit per op; move tree = adds + sha:null deletions in ONE createTree; reorder = content rewrites only.
- [ ] Endpoint tests under DEV_AUTH (+401 when unauthenticated, matching the existing pattern).
- [ ] Full `bun test` green; typecheck clean. Commit: `feat(manual-editor): backend page move and reorder operations`

### Task 2: Sidebar tree drag & drop UI

**Files:**

- Modify: `manual-editor/src/app/PageList.tsx` (draggable rows + drop zones), `manual-editor/src/app/App.tsx` (perform ops, refresh, active-path remap), `manual-editor/src/app/api.ts` (`reorder`, `movePage`), `manual-editor/src/app/editor.css`
- Create: `manual-editor/src/app/treeDnd.ts` (pure logic: given the tree, the dragged slug, the drop target slug + zone → compute `{kind:"reorder", updates} | {kind:"move", path, dest, alsoReorder?} | {kind:"noop"} | {kind:"blocked"}` — including the 1..n renumbering of the destination sibling list and the adjacent-sibling folder rule for root drops)
- Test: `manual-editor/src/app/treeDnd.test.ts` (the pure logic is where the correctness lives — test it hard), plus a PageList render test for draggable attrs

**Interfaces:** `computeDrop(pages: ManualPageMeta[], draggedSlug: string, targetSlug: string, zone: "before" | "after" | "into"): DropPlan` as above. `PageList` gains `onDropPlan(plan)` → App executes (`api.movePage` then/or `api.reorder`), re-fetches, remaps `activePath` via returned moves.

- [ ] TDD `treeDnd.ts` exhaustively: reorder within parent (before/after, first/last positions, no-op when dropped in place); nest into leaf (becomes parent, order 1) and into existing parent (appended last, order n+1); cross-section root drop (adjacent-sibling folder + section inherit); cycle blocked (onto own child + own grandchild); renumber-only-changed emission.
- [ ] Implement drag handlers in `PageList`: `draggable` page buttons; `onDragStart` (set slug in dataTransfer + drag image), `onDragOver` per row computing zone from pointer Y within the row rect (top 25% before / bottom 25% after / middle into) with `event.preventDefault()`, indicator state in React; `onDrop` → `computeDrop` → `onDropPlan`; `onDragEnd` clears state. CSS: `.sidebar-tree__row--drop-before/after` (2px indigo line via ::before/::after or border), `.sidebar-tree__row--drop-into` (indigo tint bg), dragged row opacity .4.
- [ ] App: execute plan (move → reorder if both), optimistic-free (just await + refresh), error → alert-style inline message (reuse an existing pattern), remap activePath.
- [ ] Full `bun test` green; typecheck; build. Commit: `feat(manual-editor): drag pages in the sidebar to reorder and re-parent`

### Task 3 (controller): browser verification + deploy

- Reorder two siblings in a small section (verify order flip persists via /api/pages), nest a page under another (verify path change + tree nesting + folder travel with a parent that has children), cross-section move (section inheritance), cycle refusal, active-page move remaps selection, autosave/hasDraft dots update. Push → deploy.

---

## Self-Review

- Spec coverage: reorder, re-parent w/ descendants, cross-section, cycle/self guards, one-commit atomicity per op, active-path remap, indicators. ✓
- Placeholder scan: interfaces pinned; renumber + folder rules stated concretely; three-zone thresholds specified. ✓
- Type consistency: `reorderPages`/`movePage`/`computeDrop`/`DropPlan` names consistent. ✓
- Known limitation (documented, not built): internal links to moved pages aren't rewritten — PR review catches; a future link-checker could flag. Keyboard tree-reorder = v2.
