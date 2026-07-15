# Manual Editor — Hierarchical Sidebar Tree Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Replace the editor's flat section-grouped sidebar with a hierarchical, collapsible tree that mirrors the published manual — pages nest by their slug path within each section (e.g. `manual-index/project-management-menu` is a parent of `.../home`, which is a parent of `.../home/cloud-projects-and-audio-files`).

**Architecture:** Two tasks. (1) A pure `buildManualTree(pages)` that groups by `section` (ordered by `sectionOrder`) and, within each section, builds a nested tree from slug paths — a faithful port of the real site's `ManualSidebar.astro` `buildTree`. (2) A recursive React `SidebarTree` with expand/collapse (auto-open on the active page's ancestors), draft dots, and selection, wired into `PageList.tsx`.

**Reference (port faithfully):** `src/components/manual/ManualSidebar.astro` (`buildTree` + section grouping) and `src/components/manual/ManualSidebarTree.astro` (recursive render, `data-state` open/closed).

**Tech Stack:** TypeScript, Bun, React (same as the editor app).

## Global Constraints

- Bun; Conventional Commits; TypeScript strict. Do NOT modify `src/mdx` or `src/adapter`.
- Tree semantics must match the real manual: within a section, an entry whose slug is `a/b/c` attaches to the deepest existing ancestor among `a/b`, then `a`; if none exists in that section, it is a root. Sort siblings by `order` then `slug`. Sections ordered by `sectionOrder`.
- A parent page is itself an editable, selectable page (it has its own `.mdx`) AND a container for children — clicking its label opens it; a separate toggle expands/collapses its children.
- Preserve existing behavior: draft ● dots, `aria-current` on the active page, `onSelect(path)`, and the loading state. Keep the `data-testid="page-<slug>"` buttons so existing tests/queries keep working.

## Package layout

- `manual-editor/src/app/manualTree.ts` — pure tree builder (new)
- `manual-editor/src/app/manualTree.test.ts` — tests (new)
- `manual-editor/src/app/PageList.tsx` — refactor to render the tree (modify)
- `manual-editor/src/app/editor.css` — tree indentation + toggle styles (modify)

---

### Task 1: Pure `buildManualTree`

**Files:**

- Create: `manual-editor/src/app/manualTree.ts`
- Test: `manual-editor/src/app/manualTree.test.ts`

**Interfaces:**

- Consumes: `ManualPageMeta` (from `../backend/types`).
- Produces:
  - `interface TreeNode { page: ManualPageMeta; children: TreeNode[] }`
  - `interface SectionTree { section: string; sectionOrder: number; nodes: TreeNode[] }`
  - `buildManualTree(pages: ManualPageMeta[]): SectionTree[]` — groups by `section`, orders sections by `sectionOrder` (min seen for that section), builds a nested tree within each section by slug path (port of the reference `buildTree`), sorts siblings by `order` then `slug`.

- [ ] **Step 1: Write failing tests** `manualTree.test.ts`:

```ts
import { expect, test } from "bun:test";
import { buildManualTree, type TreeNode } from "./manualTree";
import type { ManualPageMeta } from "../backend/types";

function page(
  slug: string,
  extra: Partial<ManualPageMeta> = {},
): ManualPageMeta {
  return {
    slug,
    path: `src/content/manual/${slug}.mdx`,
    title: slug.split("/").pop()!,
    section: extra.section ?? "S",
    sectionOrder: extra.sectionOrder ?? 1,
    order: extra.order ?? 1,
    draft: false,
    hasDraft: false,
    ...extra,
  };
}
function findNode(nodes: TreeNode[], slug: string): TreeNode | undefined {
  for (const n of nodes) {
    if (n.page.slug === slug) return n;
    const deep = findNode(n.children, slug);
    if (deep) return deep;
  }
  return undefined;
}

test("nests pages by slug path within a section", () => {
  const pages = [
    page("manual-index/project-management-menu", { section: "PMM", order: 1 }),
    page("manual-index/project-management-menu/home", {
      section: "PMM",
      order: 2,
    }),
    page("manual-index/project-management-menu/project", {
      section: "PMM",
      order: 5,
    }),
    page("manual-index/project-management-menu/home/new-and-recent", {
      section: "PMM",
      order: 1,
    }),
  ];
  const tree = buildManualTree(pages);
  expect(tree.length).toBe(1);
  const root = tree[0].nodes;
  // The parent is a single root:
  expect(root.length).toBe(1);
  expect(root[0].page.slug).toBe("manual-index/project-management-menu");
  // home and project are its children:
  const home = findNode(root, "manual-index/project-management-menu/home")!;
  expect(home).toBeDefined();
  // new-and-recent nests under home, not under the top parent:
  expect(home.children.map((c) => c.page.slug)).toContain(
    "manual-index/project-management-menu/home/new-and-recent",
  );
});

test("groups by section and orders sections by sectionOrder", () => {
  const pages = [
    page("b/x", { section: "Second", sectionOrder: 2 }),
    page("a/y", { section: "First", sectionOrder: 1 }),
  ];
  const tree = buildManualTree(pages);
  expect(tree.map((s) => s.section)).toEqual(["First", "Second"]);
});

test("a page whose parent slug is not present becomes a root", () => {
  const pages = [page("orphan/child", { section: "S" })]; // no "orphan" entry
  const tree = buildManualTree(pages);
  expect(tree[0].nodes.map((n) => n.page.slug)).toEqual(["orphan/child"]);
});

test("siblings sort by order then slug", () => {
  const pages = [
    page("root", { order: 1 }),
    page("root/b", { order: 2 }),
    page("root/a", { order: 2 }),
    page("root/c", { order: 1 }),
  ];
  const kids = buildManualTree(pages)[0].nodes[0].children.map(
    (c) => c.page.slug,
  );
  expect(kids).toEqual(["root/c", "root/a", "root/b"]); // c(order1), then a,b(order2 by slug)
});
```

- [ ] **Step 2:** Run `cd manual-editor && bun test src/app/manualTree.test.ts` → FAIL.

- [ ] **Step 3: Implement `manualTree.ts`** — port the reference algorithm. Group entries by section; sectionOrder per section = the min `sectionOrder` among its pages (matches how the real site reads it off any entry, but min is robust). Within each section, sort by `order` then `slug`, build a `Map<slug, TreeNode>`, then attach each node to the deepest existing ancestor in that section (walk slug parts from `length-1` down to `1`), else it is a root. Return sections ordered by sectionOrder then name.

- [ ] **Step 4:** Run → PASS. Full `cd manual-editor && bun test` green; `bun run typecheck` clean.

- [ ] **Step 5: Commit:** `git add manual-editor/src/app/manualTree.ts manual-editor/src/app/manualTree.test.ts && git commit -m "feat(manual-editor): build a hierarchical section/slug tree for the sidebar"`

---

### Task 2: Recursive collapsible `SidebarTree` in `PageList`

**Files:**

- Modify: `manual-editor/src/app/PageList.tsx`
- Modify: `manual-editor/src/app/editor.css`
- Test: `manual-editor/src/app/PageList.test.tsx` (create if absent, or extend)

**Interfaces:**

- Consumes: `buildManualTree`, `ManualPageMeta`, existing `PageList` props (`pages`, `onSelect`, `activePath`).
- Produces: `PageList` renders `buildManualTree(pages)` as, per section, a heading + a recursive tree. Each node: a row with an expand/collapse toggle (only when it has children) + the page button (`data-testid="page-<slug>"`, `aria-current` when active, title + ● when `hasDraft`). Nodes on the active page's ancestor path are expanded by default; others collapsed. Expansion state is local React state keyed by slug.

- [ ] **Step 1: Write/extend `PageList.test.tsx`** with real assertions:

```ts
import { expect, test } from "bun:test";
import { render, fireEvent } from "@testing-library/react";
import { PageList } from "./PageList";
import type { ManualPageMeta } from "../backend/types";

function page(slug: string, extra: Partial<ManualPageMeta> = {}): ManualPageMeta {
  return { slug, path: `src/content/manual/${slug}.mdx`, title: slug.split("/").pop()!, section: "PMM", sectionOrder: 1, order: 1, draft: false, hasDraft: false, ...extra };
}

const pages = [
  page("pmm", { title: "Project Management Menu", order: 1 }),
  page("pmm/home", { title: "Home", order: 2 }),
  page("pmm/project", { title: "Project", order: 3 }),
];

test("nests children under their parent and toggles expansion", () => {
  const { getByTestId, queryByTestId } = render(
    <PageList pages={pages} onSelect={() => {}} activePath={null} />,
  );
  // Parent visible; children collapsed (parent not on active path):
  expect(getByTestId("page-pmm")).toBeDefined();
  expect(queryByTestId("page-pmm/home")).toBeNull();
  // Expand the parent:
  fireEvent.click(getByTestId("toggle-pmm"));
  expect(getByTestId("page-pmm/home")).toBeDefined();
});

test("auto-expands the active page's ancestors", () => {
  const { getByTestId } = render(
    <PageList pages={pages} onSelect={() => {}} activePath="src/content/manual/pmm/home.mdx" />,
  );
  // Child is visible without manual expansion because it's the active page:
  expect(getByTestId("page-pmm/home")).toBeDefined();
});

test("selecting a node calls onSelect with its path", () => {
  const selected: string[] = [];
  const { getByTestId } = render(
    <PageList pages={pages} onSelect={(p) => selected.push(p)} activePath={null} />,
  );
  fireEvent.click(getByTestId("page-pmm"));
  expect(selected).toEqual(["src/content/manual/pmm.mdx"]);
});
```

- [ ] **Step 2:** Run `cd manual-editor && bun test src/app/PageList.test.tsx` → FAIL.

- [ ] **Step 3: Implement** — refactor `PageList.tsx`:
  - Compute `const sections = buildManualTree(pages)`.
  - Track expansion: `const [expanded, setExpanded] = useState<Set<string>>(...)` seeded with the ancestors of `activePath` (derive the active slug from `activePath` by stripping `src/content/manual/` and the extension; a node is an ancestor if `activeSlug === node.slug` or `activeSlug.startsWith(node.slug + "/")`). Recompute the seed when `activePath` changes (an effect that unions ancestor slugs into `expanded`).
  - Recursive `renderNode(node, depth)`: a row with, when `node.children.length > 0`, a `<button data-testid="toggle-<slug>" aria-expanded=...>` chevron that toggles the slug in `expanded`; and the page `<button data-testid="page-<slug>">` (title + ● dot, `aria-current`). If expanded, render children indented (depth+1).
  - Keep the section `<h2>` headings.

- [ ] **Step 4:** Add CSS to `editor.css` for `.sidebar-tree` indentation (a left border/pad per depth) and the toggle chevron. Reuse existing `.app-sidebar nav button` styling for the page buttons.

- [ ] **Step 5:** Run `cd manual-editor && bun test src/app/PageList.test.tsx` → PASS. Full `bun test` green; `bun run typecheck` clean; `bun run build` succeeds.

- [ ] **Step 6: Commit:** `git add manual-editor/src/app/PageList.tsx manual-editor/src/app/PageList.test.tsx manual-editor/src/app/editor.css && git commit -m "feat(manual-editor): render the sidebar as a collapsible page tree"`

- [ ] **Step 7: Controller browser verification** — confirm "Project Management Menu" shows Home/Project/Publish nested (and Home's own children one level deeper), toggles expand/collapse, the tree auto-expands to the open page, and draft dots still show.

---

## Self-Review

- Spec coverage: pure tree builder (Task 1) + recursive collapsible render with auto-expand (Task 2). ✓
- Placeholder scan: the port algorithm is fully described (deepest-existing-ancestor attach; sibling sort; section order); tests pin the nesting, grouping, orphan, and sort behaviors. No TODOs.
- Type consistency: `TreeNode`/`SectionTree`/`buildManualTree` names consistent across builder, tests, and `PageList`. `data-testid` conventions (`page-<slug>`, `toggle-<slug>`) consistent between the plan's tests and the render spec.
- Scope: sidebar only; no backend/adapter/engine change. New-page creation of nested pages already works via the Location field (typing a nested folder) — no change needed here, though a future "add child page" affordance could seed the location from a parent.
