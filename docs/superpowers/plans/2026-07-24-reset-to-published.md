# Reset to Published — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A "Reset to published" header action that discards a page's unsaved changes and restores the base-branch version, safely under autosave races.

**Architecture:** New `resetPage` backend method (both implementations) riding the existing drafts-commit machinery; `existsOnBase` added to page metadata to gate the button for never-published pages; `/api/reset` endpoint; editor header confirm-flow that cancels pending autosaves and awaits in-flight ones before resetting.

**Tech Stack:** TypeScript, React 19, TipTap, Octokit, Netlify functions, bun test.

**Spec:** `docs/superpowers/specs/2026-07-24-reset-to-published-design.md`

## Global Constraints

- Bun everywhere (`bun test` from `manual-editor/`, `bunx tsc --noEmit`). Conventional Commits. All commits from repo root.
- `resetPage` commit message is exactly `` `docs: reset ${path} to published` ``.
- Never-published error message is exactly `` `Cannot reset — page has never been published: ${path}` `` (the API maps it to 409 by matching "never been published").
- The reset flow MUST cancel a pending debounced autosave (never flush it) and MUST await settlement of an in-flight save before calling the API — both orderings get dedicated tests.
- `existsOnBase` is optional on `ManualPageMeta` (`existsOnBase?: boolean`); both `listPages` implementations set it; UI treats only `=== true` as published (absent → button hidden — safe default).
- Reset rides `commitToDrafts` unchanged (append-only, `force: false`, writeLock).

---

### Task 1: Backend `resetPage` + `existsOnBase` metadata

**Files:**

- Modify: `manual-editor/src/backend/types.ts`
- Modify: `manual-editor/src/backend/inMemoryBackend.ts`
- Modify: `manual-editor/src/backend/octokitBackend.ts`
- Test: `manual-editor/src/backend/resetPage.test.ts` (new), additions to `manual-editor/src/backend/octokitBackend.test.ts`

**Interfaces:**

- Consumes: existing `readBasePage`, `commitToDrafts`, `listPages` internals.
- Produces: `resetPage(path: string): Promise<PageContent>` on `GitHubBackend`; `existsOnBase?: boolean` on `ManualPageMeta` — used by Tasks 2 and 3.

- [ ] **Step 1: Write the failing InMemory tests**

```ts
// manual-editor/src/backend/resetPage.test.ts
import { expect, test } from "bun:test";
import { InMemoryBackend } from "./inMemoryBackend";

const PATH = "src/content/manual/basics/a.mdx";
const BASE_SRC = "---\ntitle: A\nsection: Basics\n---\n\nPublished body.\n";
const seed = [{ path: PATH, source: BASE_SRC }];

test("resetPage restores a modified page to the base content", async () => {
  const backend = new InMemoryBackend(seed);
  await backend.saveDraft([{ path: PATH, content: "edited" }], "edit");
  const restored = await backend.resetPage(PATH);
  expect(restored).toEqual({ path: PATH, source: BASE_SRC });
  expect((await backend.readPage(PATH)).source).toBe(BASE_SRC);
  const meta = (await backend.listPages()).find((p) => p.path === PATH)!;
  expect(meta.hasDraft).toBe(false);
});

test("resetPage clears a staged deletion", async () => {
  const backend = new InMemoryBackend(seed);
  await backend.deletePage(PATH);
  await backend.resetPage(PATH);
  expect((await backend.readPage(PATH)).source).toBe(BASE_SRC);
});

test("resetPage throws for a never-published page", async () => {
  const backend = new InMemoryBackend(seed);
  const draftOnly = "src/content/manual/basics/new.mdx";
  await backend.saveDraft([{ path: draftOnly, content: "new page" }], "new");
  await expect(backend.resetPage(draftOnly)).rejects.toThrow(
    `Cannot reset — page has never been published: ${draftOnly}`,
  );
});

test("resetPage on an unmodified page is a harmless no-op", async () => {
  const backend = new InMemoryBackend(seed);
  const restored = await backend.resetPage(PATH);
  expect(restored.source).toBe(BASE_SRC);
  expect((await backend.readPage(PATH)).source).toBe(BASE_SRC);
});

test("listPages sets existsOnBase for base pages and clears it for draft-only pages", async () => {
  const backend = new InMemoryBackend(seed);
  const draftOnly = "src/content/manual/basics/new.mdx";
  await backend.saveDraft(
    [
      {
        path: draftOnly,
        content: "---\ntitle: New\nsection: Basics\n---\n\nx\n",
      },
    ],
    "new",
  );
  const pages = await backend.listPages();
  expect(pages.find((p) => p.path === PATH)!.existsOnBase).toBe(true);
  expect(pages.find((p) => p.path === draftOnly)!.existsOnBase).toBe(false);
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run (from `manual-editor/`): `bun test src/backend/resetPage.test.ts`
Expected: FAIL — `resetPage` does not exist; `existsOnBase` undefined.

- [ ] **Step 3: Add the interface members**

In `manual-editor/src/backend/types.ts`, add to `ManualPageMeta` (after `hasDraft`):

```ts
  /**
   * True if the page exists on the base branch (i.e. has a published
   * version). Absent/false for draft-only pages — the editor's
   * "Reset to published" action is only offered when true.
   */
  existsOnBase?: boolean;
```

Add to `GitHubBackend` (after `readBasePage`):

```ts
  /**
   * Restores `path` on the drafts branch to its base-branch content, as one
   * commit ("docs: reset <path> to published"). Returns the restored page.
   * Throws if the page has never been published (no base version) — the UI
   * never offers reset for that case.
   */
  resetPage(path: string): Promise<PageContent>;
```

- [ ] **Step 4: Implement `InMemoryBackend`**

In `manual-editor/src/backend/inMemoryBackend.ts`, inside `listPages`, after `meta.hasDraft = this.drafts.has(path);` add:

```ts
meta.existsOnBase = this.base.has(path);
```

Add the method after `readBasePage`:

```ts
  async resetPage(path: string): Promise<PageContent> {
    const source = this.base.get(path);
    if (source === undefined) {
      throw new Error(
        `Cannot reset — page has never been published: ${path}`,
      );
    }
    // Restoring = dropping the draft overlay (and any staged deletion) so
    // reads fall back to base — the in-memory equivalent of committing the
    // base content onto the drafts branch.
    this.drafts.delete(path);
    this.deleted.delete(path);
    return { path, source };
  }
```

- [ ] **Step 5: Implement `OctokitBackend`**

In `manual-editor/src/backend/octokitBackend.ts`:

In `listPages`, the `entries` array type gains `existsOnBase`: change the declaration to

```ts
const entries: {
  path: string;
  sha: string;
  hasDraft: boolean;
  existsOnBase: boolean;
}[] = [];
```

In the no-drafts-branch loop: `entries.push({ path, sha, hasDraft: false, existsOnBase: true });`
In the diff loop (where `inBase`/`inDrafts` are computed): `entries.push({ path, sha, hasDraft, existsOnBase: inBase });`
Where metas are built (`meta.hasDraft = e.hasDraft;`), add `meta.existsOnBase = e.existsOnBase;`

Add the method after `readBasePage`:

```ts
  /**
   * Restores `path` on the drafts branch to its base-branch content, as one
   * append-only commit riding the same serialized machinery as autosave.
   * Throws for never-published pages — the UI never offers that case.
   */
  async resetPage(path: string): Promise<PageContent> {
    const base = await this.readBasePage(path);
    if (base === null) {
      throw new Error(
        `Cannot reset — page has never been published: ${path}`,
      );
    }
    await this.commitToDrafts(
      [{ path, mode: "100644", type: "blob", content: base.source }],
      `docs: reset ${path} to published`,
    );
    return base;
  }
```

- [ ] **Step 6: Add Octokit fake tests**

Append to `manual-editor/src/backend/octokitBackend.test.ts`, following the file's existing `writeBackendFor` idiom (see the "saveDraft: existing drafts branch" test for the helper's shape; adapt setup helpers to match the file if names differ):

```ts
test("resetPage: commits the base content onto drafts and returns it", async () => {
  const PATH = "src/content/manual/basics/a.mdx";
  const { backend, calls } = writeBackendFor({
    login: "u",
    branches: {
      [BASE]: { [PATH]: fm("A", "Basics", 1) },
      [DRAFTS]: { [PATH]: "edited content" },
    },
  });

  const restored = await backend.resetPage(PATH);

  expect(restored.path).toBe(PATH);
  expect(restored.source).toBe(fm("A", "Basics", 1));

  const createTreeCall = calls.find((c) => c.op === "createTree")!;
  expect((createTreeCall.args as any).tree).toEqual([
    {
      path: PATH,
      mode: "100644",
      type: "blob",
      content: fm("A", "Basics", 1),
    },
  ]);
  const createCommitCall = calls.find((c) => c.op === "createCommit")!;
  expect((createCommitCall.args as any).message).toBe(
    `docs: reset ${PATH} to published`,
  );
  const updateRefCall = calls.find((c) => c.op === "updateRef")!;
  expect((updateRefCall.args as any).force).toBe(false);
});

test("resetPage: throws for a page absent from base, with no commit calls", async () => {
  const PATH = "src/content/manual/basics/new.mdx";
  const { backend, calls } = writeBackendFor({
    login: "u",
    branches: {
      [BASE]: {},
      [DRAFTS]: { [PATH]: "draft-only content" },
    },
  });

  await expect(backend.resetPage(PATH)).rejects.toThrow(
    `Cannot reset — page has never been published: ${PATH}`,
  );
  expect(calls.some((c) => c.op === "createCommit")).toBe(false);
});
```

Also extend the file's existing `listPages` coverage with an `existsOnBase` assertion: in whichever existing test lists a base-modified page and a draft-only page, assert `existsOnBase === true` for the former and `=== false` for the latter (add a small new test in the file's existing read-path idiom if no single test covers both).

- [ ] **Step 7: Run the backend tests, then the full suite**

Run: `bun test src/backend/`
Expected: all pass, including the new ones.
Run: `bun test`
Expected: no new failures (adding an optional meta field must not break existing fixtures).

- [ ] **Step 8: Commit**

```bash
git add manual-editor/src/backend/
git commit -m "feat(manual-editor): add resetPage backend op and existsOnBase page metadata"
```

---

### Task 2: `/api/reset` endpoint + client method

**Files:**

- Create: `manual-editor/netlify/functions/reset.mts`
- Modify: `manual-editor/src/app/api.ts`
- Test: `manual-editor/netlify/tests/reset.test.ts` (new), additions to `manual-editor/src/app/api.test.ts`

**Interfaces:**

- Consumes: `backend.resetPage` (Task 1), `requireBackend`/`json` from `../lib/_shared`.
- Produces: `POST /api/reset` `{ path }` → `{ path, source }`; `api.resetPage(path): Promise<PageContent>` — used by Task 3.

- [ ] **Step 1: Write the failing function test**

Create `manual-editor/netlify/tests/reset.test.ts` mirroring `netlify/tests/draft.test.ts`'s harness EXACTLY (same imports, same backend-injection/session setup — read that file first and reuse its scaffolding verbatim). Cover:

1. Happy path: seed a base page, save a draft edit over it, `POST` `{ path }` → 200 with `{ path, source: <base source> }`, and a subsequent page read returns the base source.
2. Invalid body: `POST` `{}` → 400 with an error mentioning `path`.
3. Never-published: draft-only page → 409, error message containing "never been published".
4. Method guard: `GET` → 405.

Run: `bun test netlify/tests/reset.test.ts` — FAIL (module missing).

- [ ] **Step 2: Implement the function**

```ts
// manual-editor/netlify/functions/reset.mts
import { requireBackend, json } from "../lib/_shared";

/**
 * `POST /api/reset` — restores a page's drafts-branch content to the
 * base-branch (published) version via `backend.resetPage`. The editor's
 * "Reset to published" header action is the only caller; it never offers
 * the action for never-published pages, so the 409 branch is
 * belt-and-braces for direct API calls.
 */
export default async (request: Request): Promise<Response> => {
  if (request.method !== "POST") {
    return json({ error: "method not allowed" }, 405);
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid JSON body" }, 400);
  }
  const { path } = (body ?? {}) as { path?: unknown };
  if (typeof path !== "string" || path.length === 0) {
    return json({ error: "path (string) required" }, 400);
  }
  const backend = requireBackend(request);
  if (backend instanceof Response) return backend;
  try {
    const restored = await backend.resetPage(path);
    return json(restored);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("never been published")) {
      return json({ error: message }, 409);
    }
    throw err;
  }
};
```

Run: `bun test netlify/tests/reset.test.ts` — all pass.

- [ ] **Step 3: Client method + test**

In `manual-editor/src/app/api.ts`, after `getBasePage`:

```ts
    /**
     * `POST /api/reset` — discards the page's drafts-branch changes and
     * restores the published (base-branch) version. Returns the restored
     * content. See Editor.tsx's reset flow for the autosave-ordering
     * contract around calling this.
     */
    resetPage: (path: string) =>
      f("/api/reset", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ path }),
      }).then((r) => jsonOrThrow<PageContent>(r)),
```

Append to `manual-editor/src/app/api.test.ts` (mirror the file's existing fetch-recording idiom):

```ts
test("resetPage POSTs the path to /api/reset and returns the restored page", async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fakeFetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), init });
    return new Response(
      JSON.stringify({ path: "src/content/manual/x/y.mdx", source: "S" }),
      { headers: { "content-type": "application/json" } },
    );
  }) as typeof fetch;
  const api = makeApi(fakeFetch);

  const restored = await api.resetPage("src/content/manual/x/y.mdx");

  expect(restored).toEqual({ path: "src/content/manual/x/y.mdx", source: "S" });
  expect(calls[0]!.url).toBe("/api/reset");
  expect(calls[0]!.init?.method).toBe("POST");
  expect(JSON.parse(String(calls[0]!.init?.body))).toEqual({
    path: "src/content/manual/x/y.mdx",
  });
});
```

Run: `bun test src/app/api.test.ts netlify/tests/reset.test.ts` — all pass.

- [ ] **Step 4: Full suite + commit**

Run: `bun test` — no new failures.

```bash
git add manual-editor/netlify/functions/reset.mts manual-editor/netlify/tests/reset.test.ts manual-editor/src/app/api.ts manual-editor/src/app/api.test.ts
git commit -m "feat(manual-editor): add POST /api/reset endpoint and client method"
```

---

### Task 3: Editor reset flow (header confirm + autosave-race handling)

**Files:**

- Modify: `manual-editor/src/app/Editor.tsx`
- Modify: `manual-editor/src/app/App.tsx`
- Modify: `manual-editor/src/app/editor.css`
- Test: `manual-editor/src/app/resetPage.test.tsx` (new)

**Interfaces:**

- Consumes: `api.resetPage` (Task 2), `activePageMeta.existsOnBase` (Task 1).
- Produces: Editor props `existsOnBase?: boolean` (default `false`) and `onReset?: (path: string) => void`; App's `handleReset` reload flow.

- [ ] **Step 1: Write the failing editor tests**

```tsx
// manual-editor/src/app/resetPage.test.tsx
/**
 * The "Reset to published" header flow (see the reset-to-published spec):
 * visibility gating, the confirm step, and — the correctness core — the
 * autosave-ordering contract: a pending debounced autosave is DISCARDED
 * (never fired), and an in-flight save is awaited before /api/reset goes
 * out. Harness mirrors autosave.test.tsx (short real debounce, recording
 * fake fetch).
 */
import { expect, test } from "bun:test";
import type { Editor as TiptapEditor } from "@tiptap/core";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { Editor } from "./Editor";
import { makeApi } from "./api";

const pagePath = "src/content/manual/x/y.mdx";
const pageSource =
  "---\ntitle: My Page\nsection: Basics\n---\n\nHello world.\n";

interface RecordedCall {
  url: string;
  body: unknown;
}

/**
 * Records /api/draft and /api/reset calls in arrival order. `draftGate`
 * (when provided) delays draft responses until the test resolves it —
 * simulating an in-flight save.
 */
function fakeFetch(
  calls: RecordedCall[],
  draftGate?: Promise<void>,
): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    if (url.startsWith("/api/draft")) {
      calls.push({ url: "/api/draft", body });
      if (draftGate) await draftGate;
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "content-type": "application/json" },
      });
    }
    if (url.startsWith("/api/reset")) {
      calls.push({ url: "/api/reset", body });
      return new Response(
        JSON.stringify({ path: pagePath, source: pageSource }),
        { headers: { "content-type": "application/json" } },
      );
    }
    throw new Error(`unexpected fetch in reset test: ${url}`);
  }) as typeof fetch;
}

async function mountEditor(
  overrides: Partial<Parameters<typeof Editor>[0]> = {},
  calls: RecordedCall[] = [],
  draftGate?: Promise<void>,
) {
  const api = makeApi(fakeFetch(calls, draftGate));
  let editor: TiptapEditor | null = null;
  render(
    <Editor
      source={pageSource}
      path={pagePath}
      api={api}
      autosaveDelayMs={30}
      onEditorReady={(created) => {
        editor = created;
      }}
      onAddSubpage={() => {}}
      hasChildren={false}
      onDeleted={() => {}}
      hasDraft={true}
      existsOnBase={true}
      {...overrides}
    />,
  );
  await waitFor(() => expect(editor).not.toBeNull());
  return { calls, getEditor: () => editor as unknown as TiptapEditor };
}

test("reset button shows only when hasDraft AND existsOnBase", async () => {
  await mountEditor({ hasDraft: true, existsOnBase: true });
  expect(screen.getByTestId("editor-reset-page")).toBeDefined();
});

test("reset button hidden for a clean page", async () => {
  await mountEditor({ hasDraft: false, existsOnBase: true });
  expect(screen.queryByTestId("editor-reset-page")).toBeNull();
});

test("reset button hidden for a never-published page", async () => {
  await mountEditor({ hasDraft: true, existsOnBase: false });
  expect(screen.queryByTestId("editor-reset-page")).toBeNull();
});

test("clicking reset shows the confirm step; cancel returns without any API call", async () => {
  const { calls } = await mountEditor();
  fireEvent.click(screen.getByTestId("editor-reset-page"));
  expect(screen.getByTestId("editor-reset-confirm")).toBeDefined();
  fireEvent.click(screen.getByTestId("editor-reset-cancel"));
  expect(screen.queryByTestId("editor-reset-confirm")).toBeNull();
  expect(screen.getByTestId("editor-reset-page")).toBeDefined();
  expect(calls.length).toBe(0);
});

test("confirming reset DISCARDS a pending autosave: reset fires, the draft save never does", async () => {
  const resets: string[] = [];
  const { calls, getEditor } = await mountEditor({
    autosaveDelayMs: 5000, // long debounce: stays pending until reset
    onReset: (p) => resets.push(p),
  });
  const editor = getEditor();

  act(() => {
    editor.commands.focus("end");
    editor.commands.insertContent(" doomed edit");
  });

  fireEvent.click(screen.getByTestId("editor-reset-page"));
  fireEvent.click(screen.getByTestId("editor-reset-confirm"));

  await waitFor(() => expect(resets).toEqual([pagePath]));
  // Give the (discarded) debounce ample time to have fired if the discard
  // were broken — autosaveDelayMs is 5s, but a broken discard-as-flush
  // would fire immediately.
  await new Promise((r) => setTimeout(r, 100));
  expect(calls.map((c) => c.url)).toEqual(["/api/reset"]);
});

test("confirming reset during an in-flight save waits for it to settle first", async () => {
  let releaseDraft!: () => void;
  const draftGate = new Promise<void>((resolve) => {
    releaseDraft = resolve;
  });
  const resets: string[] = [];
  const calls: RecordedCall[] = [];
  const { getEditor } = await mountEditor(
    { autosaveDelayMs: 15, onReset: (p) => resets.push(p) },
    calls,
    draftGate,
  );
  const editor = getEditor();

  act(() => {
    editor.commands.focus("end");
    editor.commands.insertContent(" racing edit");
  });

  // Wait until the debounce fired and the save request is in flight
  // (recorded but unresolved).
  await waitFor(() =>
    expect(calls.some((c) => c.url === "/api/draft")).toBe(true),
  );

  fireEvent.click(screen.getByTestId("editor-reset-page"));
  fireEvent.click(screen.getByTestId("editor-reset-confirm"));

  // The reset request must NOT be issued while the save is unresolved.
  await new Promise((r) => setTimeout(r, 50));
  expect(calls.map((c) => c.url)).toEqual(["/api/draft"]);

  releaseDraft();
  await waitFor(() => expect(resets).toEqual([pagePath]));
  expect(calls.map((c) => c.url)).toEqual(["/api/draft", "/api/reset"]);
});
```

Run: `bun test src/app/resetPage.test.tsx` — FAIL (no reset button).

- [ ] **Step 2: Editor.tsx — props, refs, and the discard/await machinery**

All edits to `manual-editor/src/app/Editor.tsx`:

(a) Props — add to the destructured list and type (after `hasDraft`):

```ts
  existsOnBase = false,
  onReset,
```

```ts
  /**
   * True when the page exists on the base branch (has a published
   * version). With `hasDraft`, gates the header's "Reset to published"
   * action — a never-published page has nothing to reset to (Delete page
   * covers discarding it).
   */
  existsOnBase?: boolean;
  /**
   * Called with `path` after a successful reset. App responds by
   * re-fetching the page (fresh Editor mount) and refreshing the sidebar.
   */
  onReset?: (path: string) => void;
```

(b) State — next to the delete confirm state:

```ts
const [confirmingReset, setConfirmingReset] = useState(false);
const [resetting, setResetting] = useState(false);
```

Extend the `saveStatus` union with `"reset-error"` and the label chain with
`: saveStatus === "reset-error" ? "Reset failed"` (before the final `""`).

(c) In-flight tracking — next to `pendingSaveRef`:

```ts
// The autosave request currently on the wire (null when none). The reset
// flow awaits its settlement so a save can never land AFTER the reset
// commit and resurrect the discarded edits (append-only branch — later
// commit wins).
const inFlightSaveRef = useRef<Promise<unknown> | null>(null);
```

(d) Reshape `pendingSaveRef` to `{ flush: () => Promise<void>; discard: () => void }` and make the debounce effect register BOTH, closing over the timer so `discard` (and `flush`) can clear it. Replace the effect body's `pendingSaveRef.current = {...}` + `const timer = setTimeout(...)` with:

```ts
const timer = setTimeout(() => {
  pendingSaveRef.current = null;
  void (async () => {
    setSaveStatus("saving");
    try {
      const request = api.saveDraftDoc(
        savingPath,
        editor.getJSON(),
        serializeFrontmatter(frontmatterData),
      );
      inFlightSaveRef.current = request;
      await request;
      if (cancelled) return;
      setSaveStatus("saved");
      onDraftSaved?.(savingPath);
    } catch {
      if (!cancelled) setSaveStatus("error");
    } finally {
      inFlightSaveRef.current = null;
    }
  })();
}, autosaveDelayMs);
pendingSaveRef.current = {
  flush: () => {
    clearTimeout(timer);
    pendingSaveRef.current = null;
    const request = api
      .saveDraftDoc(
        savingPath,
        editor.getJSON(),
        serializeFrontmatter(frontmatterData),
      )
      .then(() => {
        onDraftSaved?.(savingPath);
      })
      .catch(() => {});
    inFlightSaveRef.current = request.finally(() => {
      inFlightSaveRef.current = null;
    });
    return request;
  },
  discard: () => {
    clearTimeout(timer);
    pendingSaveRef.current = null;
  },
};
```

(Note: `flush` now also clears the timer — previously a flushed save could double-fire when the timer later elapsed; the reshape fixes that latent issue in passing. The existing type annotation on `pendingSaveRef` must be updated to the new shape.)

(e) The reset handler — next to `handleConfirmDelete`:

```ts
async function handleConfirmReset() {
  setResetting(true);
  // Ordering contract (see the reset spec): discard any pending debounced
  // save so it can never fire after the reset, then wait out a save
  // already on the wire so the reset commit is guaranteed to land last.
  pendingSaveRef.current?.discard();
  if (inFlightSaveRef.current) {
    await inFlightSaveRef.current.catch(() => {});
  }
  try {
    await api.resetPage(path);
    onReset?.(path);
  } catch {
    setResetting(false);
    setConfirmingReset(false);
    setSaveStatus("reset-error");
  }
}
```

(f) Header JSX — insert BEFORE the Compare button block (inside `.editor-header__actions`):

```tsx
{
  hasDraft && existsOnBase ? (
    confirmingReset ? (
      <span className="editor-header__delete-confirm">
        <span className="editor-header__delete-confirm-label">
          Discard your changes and restore the published version?
        </span>
        <button
          type="button"
          data-testid="editor-reset-confirm"
          className="editor-header__delete-confirm-button"
          disabled={resetting}
          onClick={handleConfirmReset}
        >
          Reset
        </button>
        <button
          type="button"
          data-testid="editor-reset-cancel"
          className="editor-header__delete-cancel-button"
          disabled={resetting}
          onClick={() => setConfirmingReset(false)}
        >
          Cancel
        </button>
      </span>
    ) : (
      <button
        type="button"
        data-testid="editor-reset-page"
        className="editor-header__reset"
        onClick={() => setConfirmingReset(true)}
      >
        Reset to published
      </button>
    )
  ) : null;
}
```

(The confirm span reuses the delete-confirm styling classes on purpose — same chrome, different words.)

- [ ] **Step 3: CSS**

Append to `manual-editor/src/app/editor.css` (next to `.editor-header__compare`):

```css
/* Header "Reset to published": same secondary chrome as Compare. */
.editor-header__reset {
  flex: 0 0 auto;
  padding: 0.3rem 0.7rem;
  border: 1px solid #cbd5e1;
  border-radius: 5px;
  background: #ffffff;
  color: #1f2937;
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
}

.editor-header__reset:hover {
  background: #f1f5f9;
}
```

- [ ] **Step 4: App.tsx wiring**

In `manual-editor/src/app/App.tsx`, add next to `handleDeleted`:

```ts
// After a successful reset: re-fetch the page through the same load path
// as selecting it (fresh Editor mount showing the restored content), and
// refresh the sidebar so the unsaved-changes dot clears.
function handleReset(path: string) {
  setSource(null);
  api.getPage(path).then((page) => setSource(page.source));
  api.listPages().then(setPages);
}
```

And in the `<Editor …>` JSX, after `hasDraft={…}`:

```tsx
              existsOnBase={activePageMeta?.existsOnBase ?? false}
              onReset={handleReset}
```

- [ ] **Step 5: Run the reset tests, then the neighbouring suites**

Run: `bun test src/app/resetPage.test.tsx`
Expected: 6 pass.
Run: `bun test src/app/autosave.test.tsx src/app/editorHeader.test.tsx src/app/deletePage.test.tsx src/app/App.test.tsx src/app/publish.test.tsx`
Expected: all pass (the `pendingSaveRef` reshape must not disturb flush-on-unmount, publish-flush, or pagehide behaviour).

- [ ] **Step 6: Full suite + typecheck + commit**

Run: `bun test` — no new failures.
Run: `bunx tsc --noEmit` — clean.

```bash
git add manual-editor/src/app/
git commit -m "feat(manual-editor): reset-to-published header action with autosave-safe ordering"
```

---

## Verification after all tasks

1. `cd manual-editor && bun test` — full suite green.
2. `cd manual-editor && bunx tsc --noEmit` — clean.
3. Manual browser pass (Alex): edit a published page → Reset to published appears → confirm restores the published content and clears the dot; a brand-new page shows no Reset button; mid-typing reset discards cleanly.
