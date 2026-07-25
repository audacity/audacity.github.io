# Reset to Published — Design

**Date:** 2026-07-24
**Status:** Approved pending final review
**Owner:** Alex (design lead) — UX approval; engineering — implementation

## Goal

Let a manual writer discard a page's unsaved changes and restore the
published (base-branch) version, from the editor, safely — including under
autosave race conditions.

## Background

Every edit autosaves as a commit to the drafts branch
(`manual/editor-drafts`). A page whose drafts content differs from the base
branch shows the "unsaved changes" state (`hasDraft`). Until now the only
escape from unwanted edits was hand-reverting them or resetting the branch
outside the editor. The Compare view (Published vs Your changes) shows the
target state but offers no way to adopt it.

## Decisions (agreed in brainstorming)

1. **Placement:** a "Reset to published" button in the editor header next
   to Compare, visible under the same `hasDraft` condition — with an
   explicit inline Confirm/Cancel step (same pattern as Delete page).
   Not inside the Compare view.
2. **Draft-only pages are excluded.** A never-published page gets no Reset
   button — discarding it is what Delete page already does. The sidebar
   metadata gains the signal needed to distinguish the two cases.
3. **Single page only.** No whole-branch "reset everything".

## UX

- Button label: `Reset to published`. Rendered in
  `.editor-header__actions`, before Compare. Visible when
  `hasDraft && existsOnBase`.
- Click → the header action swaps to an inline confirm:
  "Discard your changes and restore the published version?" with
  `Reset` / `Cancel` buttons (mirrors the delete-page confirm flow and its
  styling).
- Confirm →
  - any pending debounced autosave is cancelled (not flushed),
  - any in-flight autosave request is awaited,
  - `POST /api/reset` runs,
  - the editor notifies App, which re-fetches the page through the same
    load path as selecting it in the sidebar (a fresh Editor mount —
    Compare mode therefore starts closed); the response's `source` is not
    consumed by the client,
  - the sidebar refetches; the page's unsaved-changes dot clears.
- Failure (network/API error) → inline error state in the header pill
  (same treatment as save failures); the document is left untouched.

## Backend

New `GitHubBackend` method:

```ts
/**
 * Restores `path` on the drafts branch to its base-branch content, as one
 * commit ("docs: reset <path> to published"). Returns the restored page.
 * Throws if the page has never been published (no base version) — the UI
 * never offers reset for that case.
 */
resetPage(path: string): Promise<PageContent>;
```

- **OctokitBackend:** `readBasePage(path)`; if `null`, throw
  `Error("Cannot reset — page has never been published: <path>")`. Else
  `commitToDrafts([{ path, content: base.source }], "docs: reset <path> to published")`
  and return `{ path, source }`. Rides the existing append-only commit
  machinery (writeLock serialisation, `force: false`) unchanged.
- **InMemoryBackend:** clear the page's draft overlay and any staged
  deletion marker so reads fall back to base; throw the same error for
  base-missing paths.
- No drafts-branch existence special-case is needed beyond what
  `commitToDrafts` already handles (button can only appear when a draft
  exists, but the method must still behave sanely — a reset when drafts ==
  base is a harmless no-op commit).

## Sidebar metadata

`ManualPageMeta` gains `existsOnBase: boolean` (named exactly that), set by
`listPages` in both backends:

- Octokit: `baseTree.has(path)` — the listing already computes this.
- InMemory: `this.base.has(path)`.

The editor header receives it alongside `hasDraft` (same derivation from
`activePageMeta` in `App.tsx`).

## API

- `POST /api/reset` with body `{ path: string }` → `200 { path, source }`.
- 400 for missing/invalid `path`; 409 with the backend's error message for
  the never-published case (client never triggers it; belt-and-braces);
  standard auth gating like every other endpoint (`requireBackend`).
- Client: `api.resetPage(path): Promise<PageContent>`.

## Autosave race handling (the correctness core)

Failure mode: an autosave landing after the reset commit resurrects the
discarded edits (append-only branch — later commit wins).

- **Pending (debounce not fired):** `Editor.tsx`'s `pendingSaveRef` gains a
  `discard()` that clears the pending save without firing it. Reset calls
  it first.
- **In flight (request already sent):** the autosave effect records its
  promise in an `inFlightSaveRef`; reset awaits settlement (success or
  failure) before issuing `POST /api/reset`.
- **After reset:** the editor remounts with the restored source, so no
  stale editor state can dirty-mark from the discarded doc.
- Ordering gets dedicated tests: reset with a pending debounce must NOT
  produce a save call; reset during an in-flight save must issue the reset
  request only after the save settles.

## Failure modes

| Failure                                                      | Behaviour                                                                                     |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| Reset API fails                                              | Header pill shows error (as save failures do); document untouched; button available to retry. |
| Autosave in flight fails while reset waits                   | Reset proceeds after settlement — the discarded content was going to be discarded anyway.     |
| Page never published                                         | Button never rendered; API returns 409 if called directly.                                    |
| Concurrent writer edits same page (single-writer assumption) | Out of scope, as everywhere else in the editor.                                               |

## Testing

- Backend (both implementations): resets modified page to base content;
  throws on never-published; harmless when drafts already match base.
- `listPages` sets `existsOnBase` correctly (base page, modified page,
  draft-only page).
- API function: happy path, invalid body, never-published 409.
- Editor: button visibility matrix (`hasDraft` × `existsOnBase`); confirm
  flow (cancel leaves everything untouched); reset discards pending
  autosave (no save call fires); reset awaits in-flight save; editor
  reloads restored source and notifies App (sidebar refetch).

## Out of scope

- Whole-branch reset.
- Cleaning up images orphaned by the reset (matches page-deletion
  behaviour today).
- Undo of a reset (content remains in drafts-branch git history for
  forensics).
