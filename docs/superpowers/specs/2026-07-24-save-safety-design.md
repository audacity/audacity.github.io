# Save Safety: Leave-Page Guard + Stale-Read Protection — Design

**Date:** 2026-07-24
**Status:** Approved (design agreed in conversation; combined spec+plan review)
**Owner:** Alex (design lead) — UX; engineering — implementation

## Goal

Close the two windows where a writer's work appears (or becomes) lost around
page reloads:

1. Leaving the page while an autosave is pending or in flight.
2. Reloading shortly after a save, when GitHub's read API serves cached
   pre-save content — which both _looks_ like data loss and, if the writer
   keeps editing the stale copy, _causes_ it (the next autosave overwrites
   the newer commit).

Diagnosed against evidence: the drafts branch showed every "lost" edit
landing as a commit; the loss was the stale read-back.

## Feature A: leave-page guard

- While `saveStatus` is `"dirty"` or `"saving"` — and NOT during a
  deliberate reset (`resettingRef`) — a `beforeunload` handler calls
  `preventDefault()` (+ legacy `returnValue = ""`), triggering the
  browser's native "Leave site?" prompt.
- In every other state the handler declines to interfere (no prompt).
- The existing `pagehide` keepalive save still fires if the writer leaves
  anyway — the guard reduces, not replaces, it.

## Feature B: stale-read protection

**Write side.** `/api/draft` (`draft.mts`) responds
`{ ok: true, source }` where `source` is the exact MDX it committed
(`withImports`). The client (`api.saveDraftDoc`) returns it. After every
successful save — both the debounce-timer path and `flush()` — the editor
records `{ source, at }` per page in `localStorage`
(key `manual-editor:lastSave:<path>`).

**Read side.** A small pure module `manual-editor/src/app/lastSave.ts`:

```ts
recordLastSave(path: string, source: string): void
/** Stored source if recorded within the last 120s AND different from
 *  serverSource (server provably behind); otherwise null. Prunes expired
 *  entries as a side effect. */
takeFresherLocalCopy(path: string, serverSource: string): string | null
clearLastSave(path: string): void
```

`App.handleSelect` (and `handleReset`'s refetch) resolve the page as
`takeFresherLocalCopy(path, page.source) ?? page.source`. No banner or
notice — the page silently shows what the writer actually saved (agreed:
matches the no-self-narration copy rules).

**Invalidation.** `clearLastSave(path)` runs in `App.handleReset` (before
its refetch) and `App.handleDeleted` — a reset/delete must never be
shadowed by a resurrected local copy. Renamed/moved pages leave an orphaned
entry that expires harmlessly within the window.

**Constants.** Freshness window: `120_000` ms (GitHub read lag is seconds;
120s covers retries with margin).

**Robustness.** All `localStorage` access wrapped in try/catch no-ops
(quota, disabled storage → feature silently off, editor unaffected).

## Accepted gaps (documented)

- The `pagehide` keepalive save cannot record its response (the page is
  gone), so a writer who dismisses the leave prompt mid-save may still see
  stale content on the next load — the guard makes this a deliberate act.
- Multi-tab edits of the same page within the window: single-writer
  assumption, as everywhere else.

## Testing

- `lastSave` unit: record → fresher-differing returns stored; identical →
  null; expired → null and pruned; clear removes; storage errors swallowed.
- Editor: a successful debounced autosave records the entry (localStorage
  inspected after save); the beforeunload handler prevents default while
  dirty and while saving, not when idle/saved, not during reset.
- App: selecting a page whose fake-api response is stale (differs from a
  fresh seeded record) mounts the editor with the stored source; an expired
  record yields the server source; `handleReset` clears the record.
- `draft.mts` test: response carries `source` equal to the committed
  content; existing callers unaffected (`ok` retained).

## Out of scope

- Fixing stale `hasDraft` dots in the sidebar after quick reloads
  (cosmetic; self-corrects).
- Cross-session/local-history recovery beyond the 120s window.
