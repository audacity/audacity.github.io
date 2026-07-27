# Save Safety — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A leave-page prompt while saves are pending/in flight, and stale-read protection so a reload never shows (or lets you clobber) older content than your last save.

**Architecture:** `/api/draft` returns the committed source; the editor records it per page in localStorage after every successful save; App prefers a fresh differing local copy over the server response at page load; reset/delete invalidate the record; a `beforeunload` handler guards the unsafe states.

**Tech Stack:** TypeScript, React 19, localStorage, Netlify functions, bun test.

**Spec:** `docs/superpowers/specs/2026-07-24-save-safety-design.md`

## Global Constraints

- Bun everywhere (`bun test` from `manual-editor/`, `bunx tsc --noEmit`). Conventional Commits. Commits from repo root.
- localStorage key format exactly `` `manual-editor:lastSave:${path}` ``; freshness window exactly `120_000` ms.
- Every localStorage access is wrapped so storage failures degrade to feature-off, never an editor error.
- The beforeunload prompt fires only for `saveStatus === "dirty" | "saving"` and never while `resettingRef.current` is true.
- `/api/draft`'s response keeps `ok: true` (existing callers) and adds `source` (the exact committed MDX, i.e. `withImports`).

---

### Task 1: Save response carries the source + the lastSave module

**Files:**

- Modify: `manual-editor/netlify/functions/draft.mts`
- Modify: `manual-editor/src/app/api.ts`
- Create: `manual-editor/src/app/lastSave.ts`
- Test: `manual-editor/src/app/lastSave.test.ts` (new), additions to `manual-editor/netlify/tests/draft.test.ts` and `manual-editor/src/app/api.test.ts`

**Interfaces:**

- Consumes: existing `draft.mts` (`withImports` local), `api.saveDraftDoc`.
- Produces: `saveDraftDoc` resolves `{ ok: true; source: string }`; `recordLastSave(path, source)`, `takeFresherLocalCopy(path, serverSource): string | null`, `clearLastSave(path)` — used by Task 2.

- [ ] **Step 1: Write the failing lastSave tests**

```ts
// manual-editor/src/app/lastSave.test.ts
import { beforeEach, expect, test } from "bun:test";
import {
  clearLastSave,
  recordLastSave,
  takeFresherLocalCopy,
} from "./lastSave";

const PATH = "src/content/manual/x/y.mdx";
const KEY = `manual-editor:lastSave:${PATH}`;

beforeEach(() => {
  localStorage.clear();
});

test("a fresh record differing from the server copy is returned", () => {
  recordLastSave(PATH, "NEWER");
  expect(takeFresherLocalCopy(PATH, "older-server-copy")).toBe("NEWER");
});

test("a record identical to the server copy returns null (server caught up)", () => {
  recordLastSave(PATH, "SAME");
  expect(takeFresherLocalCopy(PATH, "SAME")).toBeNull();
});

test("an expired record returns null and is pruned", () => {
  localStorage.setItem(
    KEY,
    JSON.stringify({ source: "OLD", at: Date.now() - 121_000 }),
  );
  expect(takeFresherLocalCopy(PATH, "server")).toBeNull();
  expect(localStorage.getItem(KEY)).toBeNull();
});

test("a malformed record returns null and is pruned", () => {
  localStorage.setItem(KEY, "{not json");
  expect(takeFresherLocalCopy(PATH, "server")).toBeNull();
});

test("clearLastSave removes the record", () => {
  recordLastSave(PATH, "X");
  clearLastSave(PATH);
  expect(localStorage.getItem(KEY)).toBeNull();
  expect(takeFresherLocalCopy(PATH, "server")).toBeNull();
});

test("no record returns null", () => {
  expect(takeFresherLocalCopy(PATH, "server")).toBeNull();
});
```

Run (from `manual-editor/`): `bun test src/app/lastSave.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 2: Implement `lastSave.ts`**

```ts
// manual-editor/src/app/lastSave.ts
/**
 * Per-page record of the last successfully saved MDX source (browser
 * localStorage) — the client half of the stale-read protection in the
 * save-safety spec.
 *
 * GitHub's read API lags its writes by a few seconds: reloading right
 * after a save can serve the pre-save content, which looks like data loss
 * and — if the writer keeps editing the stale copy — causes it. The editor
 * records what each save committed; at page load, a record that is FRESH
 * (within the window) and DIFFERENT from the server response means the
 * server is provably behind, and the local copy is what it will serve once
 * its cache catches up.
 *
 * Every storage access is try/caught: quota/disabled storage degrades to
 * feature-off, never an editor error.
 */

const KEY_PREFIX = "manual-editor:lastSave:";
/** How long a record may outvote the server. GitHub's lag is seconds; 120s covers retries with margin. */
const FRESHNESS_WINDOW_MS = 120_000;

interface LastSaveRecord {
  source: string;
  at: number;
}

function keyFor(path: string): string {
  return KEY_PREFIX + path;
}

/** Records `source` as the last content saved for `path`, timestamped now. */
export function recordLastSave(path: string, source: string): void {
  try {
    localStorage.setItem(
      keyFor(path),
      JSON.stringify({ source, at: Date.now() } satisfies LastSaveRecord),
    );
  } catch {
    // Storage unavailable/full — protection silently off.
  }
}

/**
 * Returns the recorded source when it should outvote `serverSource`
 * (recorded within the freshness window AND different), else null.
 * Expired/malformed records are pruned as a side effect.
 */
export function takeFresherLocalCopy(
  path: string,
  serverSource: string,
): string | null {
  try {
    const raw = localStorage.getItem(keyFor(path));
    if (raw === null) return null;
    let record: LastSaveRecord;
    try {
      record = JSON.parse(raw) as LastSaveRecord;
    } catch {
      localStorage.removeItem(keyFor(path));
      return null;
    }
    if (
      typeof record?.source !== "string" ||
      typeof record?.at !== "number" ||
      Date.now() - record.at > FRESHNESS_WINDOW_MS
    ) {
      localStorage.removeItem(keyFor(path));
      return null;
    }
    return record.source !== serverSource ? record.source : null;
  } catch {
    return null;
  }
}

/** Drops the record — reset/delete must never be shadowed by a stale local copy. */
export function clearLastSave(path: string): void {
  try {
    localStorage.removeItem(keyFor(path));
  } catch {
    // Same degradation as above.
  }
}
```

Run: `bun test src/app/lastSave.test.ts` — 6 pass.

- [ ] **Step 3: `/api/draft` returns the committed source**

In `manual-editor/netlify/functions/draft.mts`, change the final response line from `return json({ ok: true });` to:

```ts
// `source` = the exact content committed (imports injected) — the client
// records it for stale-read protection (see the save-safety spec).
return json({ ok: true, source: withImports });
```

In `manual-editor/netlify/tests/draft.test.ts`: read the file first; update any assertion that strictly equals the old `{ ok: true }` body, and add to the happy-path test:

```ts
expect(body.source).toContain("EDITED"); // or the test's own saved marker
expect(typeof body.source).toBe("string");
```

(match the file's existing variable names — the intent: the response's `source` is the committed MDX containing the saved edit).

- [ ] **Step 4: Client type**

In `manual-editor/src/app/api.ts`, change `saveDraftDoc`'s `jsonOrThrow<{ ok: true }>` to `jsonOrThrow<{ ok: true; source: string }>`.

Append to `manual-editor/src/app/api.test.ts` (mirror its existing idiom):

```ts
test("saveDraftDoc resolves the committed source from the response", async () => {
  // Fake fetch returning { ok: true, source: "ASSEMBLED" } for /api/draft;
  // assert (await api.saveDraftDoc(path, {}, "---\n---\n")).source === "ASSEMBLED".
  // Follow the file's existing mock()/fetch-fake pattern.
});
```

(Replace the comment body with the file's real pattern — the assertion is the contract.)

- [ ] **Step 5: Verify + commit**

Run: `bun test src/app/lastSave.test.ts src/app/api.test.ts netlify/tests/draft.test.ts`, then full `bun test` — green (autosave suite still passes: its fake fetch returns `{ ok: true }` without `source`; the editor doesn't consume `source` until Task 2, and Task 2's harness updates follow there).

```bash
git add manual-editor/netlify/functions/draft.mts manual-editor/netlify/tests/draft.test.ts manual-editor/src/app/api.ts manual-editor/src/app/api.test.ts manual-editor/src/app/lastSave.ts manual-editor/src/app/lastSave.test.ts
git commit -m "feat(manual-editor): return committed source from /api/draft; add lastSave record module"
```

---

### Task 2: Editor recording + beforeunload guard + App wiring

**Files:**

- Modify: `manual-editor/src/app/Editor.tsx`
- Modify: `manual-editor/src/app/App.tsx`
- Test: `manual-editor/src/app/saveSafety.test.tsx` (new); possible fake-fetch updates in `manual-editor/src/app/autosave.test.tsx` and `manual-editor/src/app/resetPage.test.tsx` (their `/api/draft` fakes should return `{ ok: true, source: "..." }` so recording has something to store — update the fakes, keep all existing assertions)

**Interfaces:**

- Consumes: `recordLastSave`/`takeFresherLocalCopy`/`clearLastSave` (Task 1); `saveDraftDoc` response `source`; existing `resettingRef`, `saveStatus`.
- Produces: no new props/APIs — behavioral only.

- [ ] **Step 1: Write the failing tests**

```tsx
// manual-editor/src/app/saveSafety.test.tsx
/**
 * Save-safety spec coverage: (A) the beforeunload guard fires only in the
 * unsafe states; (B) successful saves record the committed source for
 * stale-read protection. App-side read/invalidation is covered in the App
 * section below. Harness mirrors autosave.test.tsx.
 */
import { beforeEach, expect, test } from "bun:test";
import type { Editor as TiptapEditor } from "@tiptap/core";
import { act, render, screen, waitFor } from "@testing-library/react";
import { Editor } from "./Editor";
import { makeApi } from "./api";

const pagePath = "src/content/manual/x/y.mdx";
const pageSource =
  "---\ntitle: My Page\nsection: Basics\n---\n\nHello world.\n";
const KEY = `manual-editor:lastSave:${pagePath}`;

beforeEach(() => {
  localStorage.clear();
});

function draftFetch(committedSource: string): typeof fetch {
  return (async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.startsWith("/api/draft")) {
      return new Response(
        JSON.stringify({ ok: true, source: committedSource }),
        { headers: { "content-type": "application/json" } },
      );
    }
    throw new Error(`unexpected fetch: ${url}`);
  }) as typeof fetch;
}

async function mountEditor(autosaveDelayMs = 20) {
  const api = makeApi(draftFetch("COMMITTED-SOURCE"));
  let editor: TiptapEditor | null = null;
  render(
    <Editor
      source={pageSource}
      path={pagePath}
      api={api}
      autosaveDelayMs={autosaveDelayMs}
      onEditorReady={(created) => {
        editor = created;
      }}
      onAddSubpage={() => {}}
      hasChildren={false}
      onDeleted={() => {}}
    />,
  );
  await waitFor(() => expect(editor).not.toBeNull());
  return () => editor as unknown as TiptapEditor;
}

function fireBeforeUnload(): boolean {
  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
}

test("beforeunload is not blocked while idle", async () => {
  await mountEditor();
  expect(fireBeforeUnload()).toBe(false);
});

test("beforeunload is blocked while dirty, released once saved", async () => {
  const getEditor = await mountEditor(5000);
  act(() => {
    getEditor().commands.focus("end");
    getEditor().commands.insertContent(" edit");
  });
  await waitFor(() =>
    expect(screen.getByTestId("save-status").textContent).toBe(
      "Unsaved changes",
    ),
  );
  expect(fireBeforeUnload()).toBe(true);
});

test("beforeunload is released after the save lands", async () => {
  const getEditor = await mountEditor(20);
  act(() => {
    getEditor().commands.focus("end");
    getEditor().commands.insertContent(" edit");
  });
  await waitFor(() =>
    expect(screen.getByTestId("save-status").textContent).toBe(
      "Changes saved ●",
    ),
  );
  expect(fireBeforeUnload()).toBe(false);
});

test("a successful autosave records the committed source", async () => {
  const getEditor = await mountEditor(20);
  act(() => {
    getEditor().commands.focus("end");
    getEditor().commands.insertContent(" edit");
  });
  await waitFor(() =>
    expect(screen.getByTestId("save-status").textContent).toBe(
      "Changes saved ●",
    ),
  );
  const record = JSON.parse(localStorage.getItem(KEY)!) as {
    source: string;
    at: number;
  };
  expect(record.source).toBe("COMMITTED-SOURCE");
  expect(typeof record.at).toBe("number");
});
```

Also append to `manual-editor/src/app/resetPage.test.tsx`, inside/alongside the existing gated-reset test (using its harness): while the reset request is gated (resettingRef true), `fireBeforeUnload`-style dispatch must NOT be prevented (copy the tiny helper in, or inline the three lines).

App-side tests: append to `manual-editor/src/app/App.test.tsx` (read the file, mirror its fake-api idiom):

1. Stale-read: seed `localStorage` with a fresh record for page A whose `source` differs from the fake api's `getPage` response; select page A; assert the editor renders the RECORDED content (e.g. a marker word from the record), not the server's.
2. Expired record: same but `at` 121s in the past → server content renders.
3. Reset invalidation: after the reset flow completes (existing late-reset harness or a simple non-gated one), the localStorage key for the page is gone.

Run: `bun test src/app/saveSafety.test.tsx` — FAIL (no guard, no recording).

- [ ] **Step 2: Editor — record on save + the guard**

In `manual-editor/src/app/Editor.tsx`:

(a) Import: `import { recordLastSave } from "./lastSave";`

(b) Timer save path — capture the result and record BEFORE the `cancelled` check (the save landed regardless of unmount):

```ts
const result = await request;
recordLastSave(savingPath, result.source);
if (cancelled) return;
```

(where `request` is the registered `api.saveDraftDoc(...)` promise; adjust the existing `await request;` line.)

(c) `flush()` path — record in its `.then`:

```ts
          .then((result) => {
            recordLastSave(savingPath, result.source);
            onDraftSaved?.(savingPath);
          })
```

(d) The guard effect, near the pagehide effect:

```ts
// Save-safety spec, feature A: while there are unsaved or in-flight
// changes, leaving the page asks for confirmation (browser-native
// prompt). Skipped during a deliberate reset — that flow is discarding
// the changes on purpose. The pagehide keepalive below still fires if
// the writer leaves anyway.
useEffect(() => {
  if (saveStatus !== "dirty" && saveStatus !== "saving") return;
  const handleBeforeUnload = (event: BeforeUnloadEvent) => {
    if (resettingRef.current) return;
    event.preventDefault();
    // Legacy engines require returnValue for the prompt to appear.
    event.returnValue = "";
  };
  window.addEventListener("beforeunload", handleBeforeUnload);
  return () => {
    window.removeEventListener("beforeunload", handleBeforeUnload);
  };
}, [saveStatus]);
```

(e) Update `autosave.test.tsx`'s and `resetPage.test.tsx`'s `/api/draft` fakes to return `{ ok: true, source: "..." }` (any string) so recording has a value; all existing assertions stay untouched.

- [ ] **Step 3: App — prefer the fresher copy, invalidate on reset/delete**

In `manual-editor/src/app/App.tsx`:

(a) Import: `import { clearLastSave, takeFresherLocalCopy } from "./lastSave";`

(b) `handleSelect`:

```ts
api.getPage(path).then((page) => {
  // Stale-read protection (save-safety spec): a fresh local record that
  // differs from the server response means GitHub's read cache is
  // behind our own last save — show what was actually saved.
  setSource(takeFresherLocalCopy(path, page.source) ?? page.source);
});
```

(c) `handleReset`: add `clearLastSave(path);` as its first line (before the listPages refresh).

(d) `handleDeleted`: add `clearLastSave(deletedPath);` as its first line.

- [ ] **Step 4: Run everything**

Run: `bun test src/app/saveSafety.test.tsx src/app/App.test.tsx src/app/autosave.test.tsx src/app/resetPage.test.tsx src/app/editorHeader.test.tsx src/app/publish.test.tsx src/app/deletePage.test.tsx`
Expected: all pass.
Run: `bun test` — full suite green. `bunx tsc --noEmit` — clean.

- [ ] **Step 5: Commit**

```bash
git add manual-editor/src/app/
git commit -m "feat(manual-editor): leave-page guard and stale-read protection for saves"
```

---

## Verification after all tasks

1. Full `bun test` + `bunx tsc --noEmit` green.
2. Browser pass (Alex): edit → immediate refresh attempt shows the browser prompt; cancel, wait for "Changes saved ●", refresh — content correct even when refreshed instantly; Reset still restores the published version (no resurrection).
