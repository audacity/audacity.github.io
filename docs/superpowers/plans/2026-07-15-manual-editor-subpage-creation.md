# Manual Editor — Sub-Page Creation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Let a writer create a nested (child) page from a parent, via two entry points that share one pre-filled New Page dialog: a hover "+" on each sidebar tree node, and an "Add sub-page" button in the editor header for the open page.

**Architecture:** In this manual, a page's children live in a folder named after the page's slug (`…/home.mdx` → children in `…/home/`). So "sub-page of P" = a new page whose Location is `P.slug`. The existing `NewPageDialog` gains an optional `parent` prop that pre-fills Location (`parent.slug`), Section (`parent.section`), and next child order — everything still editable, same path-preview + collision check. `App` tracks which parent (if any) the dialog is opened for. Two buttons open it: a per-node "+" in `PageList`, and a header button in `Editor`.

**Tech Stack:** Same editor app (React/TS/Bun). No backend/adapter/engine change — reuses `saveDraftDoc` + the draft-only listing already in place.

## Global Constraints

- Bun; Conventional Commits; TypeScript strict. Do NOT modify `src/mdx` or `src/adapter`.
- Sub-page path = the existing `buildNewPagePath(parent.slug, title)` → `src/content/manual/<parent.slug>/<title-slug>.mdx`. Order = `nextOrder(pages, parent.slug)`. Section defaults to `parent.section`.
- Preserve all existing New Page behavior (collision check, path preview, empty-doc create via `saveDraftDoc`, sidebar refresh + select). The top-level "+ New page" button keeps working (opens the dialog with no parent).
- Keep existing `data-testid`s; add `data-testid="add-subpage-<slug>"` (tree) and `data-testid="editor-add-subpage"` (header).

---

### Task 1: `NewPageDialog` pre-fills from an optional parent; App tracks the dialog's parent

**Files:**

- Modify: `manual-editor/src/app/NewPageDialog.tsx`
- Modify: `manual-editor/src/app/App.tsx`
- Test: `manual-editor/src/app/NewPageDialog.test.tsx` (add cases)

**Interfaces:**

- `NewPageDialog` gains optional prop `parent?: ManualPageMeta`. When present:
  - Heading reads `New sub-page of {parent.title}` (else `New page`).
  - Initial `location` state = `parent.slug`; initial `section` state = `parent.section` (title starts empty).
  - Everything else (path preview via `buildNewPagePath`, collision check, `onCreate({path, frontmatter})`) unchanged; `nextOrder`/`sectionOrderFor` already derive order from the (now pre-filled) location/section.
- `App` replaces its boolean `dialogOpen` with `dialogParent: ManualPageMeta | null | undefined` where `undefined` = closed, `null` = open for a top-level page, a `ManualPageMeta` = open as that page's child. Add `openNewPage(parent: ManualPageMeta | null)` and pass `parent={dialogParent ?? undefined}` to the dialog. The existing "+ New page" button calls `openNewPage(null)`.

- [ ] **Step 1: Add failing tests** to `NewPageDialog.test.tsx`:

```tsx
import { expect, test } from "bun:test";
import { render, fireEvent } from "@testing-library/react";
import { NewPageDialog } from "./NewPageDialog";
import type { ManualPageMeta } from "../backend/types";

const parent: ManualPageMeta = {
  slug: "manual-index/project-management-menu/home",
  path: "src/content/manual/manual-index/project-management-menu/home.mdx",
  title: "Home",
  section: "Project Management Menu",
  sectionOrder: 5,
  order: 2,
  draft: false,
  hasDraft: false,
};

test("with a parent, pre-fills location + section and previews a nested path", () => {
  const { getByTestId, getByText } = render(
    <NewPageDialog
      parent={parent}
      existingPaths={[]}
      onCreate={() => {}}
      onCancel={() => {}}
    />,
  );
  // Heading names the parent:
  expect(getByText(/sub-page of Home/i)).toBeDefined();
  // Type a title; the previewed path is nested under the parent's slug:
  fireEvent.change(
    getByTestId("new-page-title-input") ??
      document.getElementById("new-page-title")!,
    {
      target: { value: "Cloud Backups" },
    },
  );
  const preview = getByTestId("new-page-dialog").querySelector(
    ".new-page-dialog__preview",
  )!;
  expect(preview.textContent).toContain(
    "src/content/manual/manual-index/project-management-menu/home/cloud-backups.mdx",
  );
});

test("without a parent, heading is the plain New page and location is empty", () => {
  const { getByText, container } = render(
    <NewPageDialog
      existingPaths={[]}
      onCreate={() => {}}
      onCancel={() => {}}
    />,
  );
  expect(getByText(/^New page$/i)).toBeDefined();
  const loc = container.querySelector("#new-page-location") as HTMLInputElement;
  expect(loc.value).toBe("");
});
```

Note: adjust the title-input selector to the dialog's real one (`#new-page-title`); the test above shows intent — use the actual id/testid present in `NewPageDialog.tsx`.

- [ ] **Step 2:** Run `cd manual-editor && bun test src/app/NewPageDialog.test.tsx` → new tests FAIL.

- [ ] **Step 3: Implement** — add the `parent?` prop; initialize `location`/`section` state from it (`useState(() => parent?.slug ?? "")`, `useState(() => parent?.section ?? "")`); heading text conditional on `parent`. In `App.tsx`, switch `dialogOpen` boolean → `dialogParent` (`ManualPageMeta | null | undefined`), add `openNewPage(parent)`, render the dialog when `dialogParent !== undefined` with `parent={dialogParent ?? undefined}`, and point the existing "+ New page" button at `openNewPage(null)`. `handleCreatePage` is unchanged (it already takes `{path, frontmatter}`).

- [ ] **Step 4:** Run tests → PASS. Full `cd manual-editor && bun test` green; `bun run typecheck` clean; `bun run build` succeeds.

- [ ] **Step 5: Commit:** `feat(manual-editor): pre-fill the new-page dialog for sub-pages`

---

### Task 2: Two entry points — sidebar "+" and editor header "Add sub-page"

**Files:**

- Modify: `manual-editor/src/app/PageList.tsx` (per-node "+"), `manual-editor/src/app/Editor.tsx` (header button), `manual-editor/src/app/App.tsx` (thread callbacks), `manual-editor/src/app/editor.css` (styles)
- Test: `manual-editor/src/app/PageList.test.tsx` (add a case)

**Interfaces:**

- `PageList` gains prop `onAddSubpage: (parent: ManualPageMeta) => void`; each tree node's row renders a `<button data-testid="add-subpage-<slug>" title="Add sub-page">+</button>` that calls `onAddSubpage(node.page)`. (Show it always, or on row hover via CSS — either is fine; keep it keyboard-focusable.)
- `Editor` gains prop `onAddSubpage: () => void`; renders a header button `<button data-testid="editor-add-subpage">Add sub-page</button>` in the `.editor-header` (near the save status).
- `App` wires: `<PageList onAddSubpage={(p) => openNewPage(p)} .../>` and `<Editor onAddSubpage={() => { const meta = pages?.find((p) => p.path === activePath); if (meta) openNewPage(meta); }} .../>`.

- [ ] **Step 1: Add a failing test** to `PageList.test.tsx`:

```tsx
test("clicking a node's add-subpage button calls onAddSubpage with that page", () => {
  const added: string[] = [];
  const { getByTestId } = render(
    <PageList
      pages={pages}
      onSelect={() => {}}
      activePath={null}
      onAddSubpage={(p) => added.push(p.slug)}
    />,
  );
  fireEvent.click(getByTestId("add-subpage-pmm"));
  expect(added).toEqual(["pmm"]);
});
```

(Use the existing `pages` fixture in that test file, whose first node has slug `pmm`. If `PageList`'s existing tests omit the new required `onAddSubpage` prop, add a no-op `onAddSubpage={() => {}}` to those renders so they still type-check — do not delete assertions.)

- [ ] **Step 2:** Run `cd manual-editor && bun test src/app/PageList.test.tsx` → FAIL.

- [ ] **Step 3: Implement** — add `onAddSubpage` to `PageList` props + the per-node "+" button in `.sidebar-tree__row` (after the page button); wire `Editor`'s header button; thread both through `App`. Add CSS: the tree "+" button small and subtle (e.g. visible on `.sidebar-tree__row:hover`, `:focus-within` keeps it visible for keyboard); the header button styled like a small secondary action.

- [ ] **Step 4:** Run `cd manual-editor && bun test src/app/PageList.test.tsx` → PASS. Full `bun test` green; `bun run typecheck` clean; `bun run build` succeeds. Update any existing `PageList`/`App`/`Editor` test that now needs the new prop (add a no-op; don't weaken).

- [ ] **Step 5: Commit:** `feat(manual-editor): add sub-page from the sidebar and editor header`

- [ ] **Step 6: Controller browser verification** — hover a tree node, click its "+", confirm the dialog opens titled "New sub-page of X" with Location pre-filled to X's slug and Section pre-filled; create a sub-page and confirm it appears nested under X in the tree. Then open a page, click "Add sub-page" in the header, confirm the same pre-filled flow.

---

## Self-Review

- Spec coverage: pre-filled dialog (Task 1) + both entry points (Task 2). ✓
- Placeholder scan: the parent→location/section/order derivation is concrete (reuses `buildNewPagePath`/`nextOrder`/`sectionOrderFor`); path-preview + collision unchanged. The one adjust-the-selector note is a guard against the dialog's real input id, not a placeholder.
- Type consistency: `parent?: ManualPageMeta`, `onAddSubpage`, `openNewPage`, `dialogParent` used consistently across dialog, PageList, Editor, App.
- Scope: UI only; no backend/adapter/engine change. Nested pages already persist + list via the earlier draft-only-listing work; this task only makes creating them ergonomic.
