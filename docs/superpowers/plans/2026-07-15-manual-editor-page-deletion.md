# Manual Editor — Page Deletion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Let a writer delete a page from the editor: deleting a base-branch page stages a deletion (lands in the eventual PR); deleting a draft-only (newly created) page discards it. Pages with sub-pages cannot be deleted until their children are removed or moved.

**Architecture:** Two tasks. (1) Backend: `GitHubBackend.deletePage(path)` — `InMemoryBackend` tracks a deletions set (base pages) or drops the draft (draft-only pages); `listPages` hides deleted paths; `saveDraft` to a deleted path clears the deletion marker (re-create case); `publish` clears deletions. The `page.ts` function handles HTTP `DELETE`. (2) UI: a "Delete page" action in the editor header with an inline confirm step; disabled (with reason) when the page has children; on delete, refresh the page list and return to the placeholder view.

**Tech Stack:** Same editor app. `OctokitBackend` (Phase G, not yet built) will implement `deletePage` as a tree-entry removal commit on the drafts branch — out of scope here, noted for G.

## Global Constraints

- Bun; Conventional Commits; TypeScript strict. Do NOT modify `src/mdx` or `src/adapter`.
- Delete semantics: base-branch page → deletion marker (hidden from `listPages`, staged for publish); draft-only page → draft entry removed entirely (as if never created). `readPage` on a deleted path throws (404 at the API).
- `saveDraft` to a path with a deletion marker MUST clear the marker (a re-created page is a normal draft again).
- A page with children (any other listed page whose slug starts with `slug + "/"`) must NOT be deletable in the UI: the action is disabled with an explanatory title/tooltip. (The backend does not enforce this — the UI is the gate; the backend stays a dumb file store.)
- Deletion is confirmed in-UI via an inline two-step (Delete page → "Delete this page? Confirm/Cancel"). No `window.confirm`.
- Keep all existing `data-testid`s; add `editor-delete-page` (initial button), `editor-delete-confirm`, `editor-delete-cancel`.

---

### Task 1: Backend `deletePage` + HTTP DELETE

**Files:**

- Modify: `manual-editor/src/backend/types.ts` (add `deletePage(path: string): Promise<void>` to `GitHubBackend`)
- Modify: `manual-editor/src/backend/inMemoryBackend.ts`
- Modify: `manual-editor/netlify/functions/page.ts` (handle `DELETE`)
- Test: `manual-editor/src/backend/inMemoryBackend.test.ts`, `manual-editor/netlify/functions/draft.test.ts` or a new `page.test.ts`

**Interfaces:**

- `deletePage(path)`: if the path is draft-only (in `drafts`, not `base`) → remove from `drafts`. If in `base` → add to a new `private deleted = new Set<string>()` and remove any draft for it. Unknown path → throw.
- `listPages()`: skip paths in `deleted`.
- `readPage(path)`: throw for paths in `deleted`.
- `saveDraft(changes)`: for each change path, remove it from `deleted` (re-create case) before storing the draft.
- `publish()`: clears `deleted` too (the fake publish "lands" the deletions).
- `page.ts`: `request.method === "DELETE"` → `backend.deletePage(path)` → `{ ok: true }` (404 JSON on unknown path, 400 without `?path=`). GET behavior unchanged.

- [ ] **Step 1: Write failing tests** (add to `inMemoryBackend.test.ts`):

```ts
test("deleting a base page hides it from listPages and readPage throws", async () => {
  const seed = [
    {
      path: "src/content/manual/a/b.mdx",
      source: "---\ntitle: T\nsection: S\n---\n\nB\n",
    },
  ];
  const backend = new InMemoryBackend(seed);
  await backend.deletePage("src/content/manual/a/b.mdx");
  const pages = await backend.listPages();
  expect(pages.find((p) => p.slug === "a/b")).toBeUndefined();
  await expect(
    backend.readPage("src/content/manual/a/b.mdx"),
  ).rejects.toThrow();
});

test("deleting a draft-only page discards it entirely", async () => {
  const backend = new InMemoryBackend([]);
  await backend.saveDraft(
    [
      {
        path: "src/content/manual/x/new.mdx",
        content: "---\ntitle: N\nsection: S\n---\n\n",
      },
    ],
    "create",
  );
  await backend.deletePage("src/content/manual/x/new.mdx");
  expect((await backend.listPages()).length).toBe(0);
});

test("saveDraft to a deleted path clears the deletion (re-create)", async () => {
  const seed = [
    {
      path: "src/content/manual/a/b.mdx",
      source: "---\ntitle: T\nsection: S\n---\n\nB\n",
    },
  ];
  const backend = new InMemoryBackend(seed);
  await backend.deletePage("src/content/manual/a/b.mdx");
  await backend.saveDraft(
    [
      {
        path: "src/content/manual/a/b.mdx",
        content: "---\ntitle: T2\nsection: S\n---\n\nNew\n",
      },
    ],
    "recreate",
  );
  const page = (await backend.listPages()).find((p) => p.slug === "a/b");
  expect(page).toBeDefined();
  expect(page!.title).toBe("T2");
});

test("deletePage on an unknown path throws", async () => {
  const backend = new InMemoryBackend([]);
  await expect(
    backend.deletePage("src/content/manual/nope.mdx"),
  ).rejects.toThrow();
});

test("publish clears pending deletions", async () => {
  const seed = [
    {
      path: "src/content/manual/a/b.mdx",
      source: "---\ntitle: T\nsection: S\n---\n\nB\n",
    },
  ];
  const backend = new InMemoryBackend(seed);
  await backend.deletePage("src/content/manual/a/b.mdx");
  await backend.publish();
  // After the fake publish, the deletion has "landed": the page stays gone
  // (the in-memory base still holds the file, but the deletion set is cleared
  // conceptually with the publish). Assert publish() doesn't throw and the
  // page remains hidden OR reappears — pick ONE semantic and document it:
  // for the dev backend, keep it simple: publish clears the marker AND
  // removes the file from base (the deletion landed).
  const pages = await backend.listPages();
  expect(pages.find((p) => p.slug === "a/b")).toBeUndefined();
});
```

Semantic note for the last test: on `publish()`, apply deletions to `base` (delete the key) and clear the set — the deletion has "landed", matching how the real PR merge would remove the file.

- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement backend + `page.ts` DELETE. **Step 4:** Add a function-level test (invoke `page.ts` default with `new Request(url, { method: "DELETE" })` under DEV_AUTH) asserting `{ok:true}` then GET → 404. **Step 5:** Full `bun test` green; `bun run typecheck` clean. **Step 6:** Commit: `feat(manual-editor): support page deletion in the backend and API`

---

### Task 2: Delete action in the editor header

**Files:**

- Modify: `manual-editor/src/app/Editor.tsx` (delete button + inline confirm), `manual-editor/src/app/App.tsx` (onDeleted wiring), `manual-editor/src/app/api.ts` (`deletePage(path)`), `manual-editor/src/app/editor.css`
- Test: `manual-editor/src/app/App.test.tsx` or a focused `deletePage.test.tsx`

**Interfaces:**

- `api.deletePage(path)`: `fetch('/api/page?path=…', { method: 'DELETE' })` → `{ok:true}` or throw.
- `Editor` gains props `hasChildren: boolean` and `onDeleted: () => void`. Header renders, next to "Add sub-page":
  - `hasChildren === true` → `<button data-testid="editor-delete-page" disabled title="Delete or move its sub-pages first">Delete page</button>`.
  - else → click shows inline confirm: `Delete this page? <button data-testid="editor-delete-confirm">Delete</button> <button data-testid="editor-delete-cancel">Cancel</button>`. Confirm → `await api.deletePage(path)` → `onDeleted()`. Cancel returns to the plain button. Style the confirm state clearly destructive (red).
- `App`: computes `hasChildren` for the active page (`pages.some(p => p.slug !== activeSlug && p.slug.startsWith(activeSlug + "/"))`), passes it; `onDeleted` → re-fetch pages, clear `activePath`/`source` (placeholder view).
- Pending autosave interaction: on confirm-delete, the Editor unmounts right after (`onDeleted` clears source) — the existing autosave cleanup (cancel timer + cancelled flag) already prevents a post-delete save; note it in code.

- [ ] **Step 1: Failing test** — render App with a mocked api (2 pages: `a` and `a/b`): (i) open `a` → delete button disabled (hasChildren); (ii) open `a/b` → click delete → confirm appears → click confirm → `api.deletePage` called with `a/b`'s path, list re-fetched, editor unmounted (placeholder text visible). Real assertions.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement. **Step 4:** Full `bun test` green; typecheck clean; build succeeds. **Step 5:** Commit: `feat(manual-editor): delete pages from the editor header with inline confirm`
- [ ] **Step 6: Controller browser verification** — delete the earlier test sub-page ("Sharing & Export"): confirm inline flow, page vanishes from tree, placeholder shows. Then verify a parent (e.g. Project Management Menu) shows the disabled button with the tooltip. Then delete a draft-only page and confirm it's discarded entirely.

---

## Self-Review

- Spec coverage: backend semantics (staged deletion vs discard, re-create, publish landing) + UI gate (children block, inline confirm) + API DELETE. ✓
- Placeholder scan: semantics for every edge (unknown path, re-create, publish) are pinned by tests; the one "pick ONE semantic" note is resolved inline (publish applies deletions to base). ✓
- Type consistency: `deletePage` name across types/backend/function/api/UI. `hasChildren`/`onDeleted` threaded App→Editor. ✓
- Scope: Octokit `deletePage` explicitly deferred to Phase G (implement as a delete-blob tree commit on the drafts branch; PR then shows the file removal). Noted for the G task brief.
