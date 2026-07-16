import { expect, test } from "bun:test";
import { computeDrop } from "./treeDnd";
import type { ManualPageMeta } from "../backend/types";

/** Same fixture shape as `manualTree.test.ts`/`PageList.test.tsx`. */
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

// ---------------------------------------------------------------------------
// Same-parent reorder (before/after)
// ---------------------------------------------------------------------------

test("before: reorders within the same parent, renumbering only what changed", () => {
  const pages = [
    page("p"),
    page("p/a", { order: 1 }),
    page("p/b", { order: 2 }),
    page("p/c", { order: 3 }),
  ];
  // Drag c before b: [a, c, b] -> a=1(same), c=2(changed), b=3(changed).
  const plan = computeDrop(pages, "p/c", "p/b", "before");
  expect(plan).toEqual({
    kind: "reorder",
    updates: [
      { path: "src/content/manual/p/c.mdx", order: 2 },
      { path: "src/content/manual/p/b.mdx", order: 3 },
    ],
  });
});

test("after: reorders within the same parent to the last position", () => {
  const pages = [
    page("p"),
    page("p/a", { order: 1 }),
    page("p/b", { order: 2 }),
    page("p/c", { order: 3 }),
  ];
  // Drag a after c: [b, c, a] -> b=1(same? was 2 -> now1 changed), c stays 2->2? wait recompute.
  const plan = computeDrop(pages, "p/a", "p/c", "after");
  expect(plan).toEqual({
    kind: "reorder",
    updates: [
      { path: "src/content/manual/p/b.mdx", order: 1 },
      { path: "src/content/manual/p/c.mdx", order: 2 },
      { path: "src/content/manual/p/a.mdx", order: 3 },
    ],
  });
});

test("before: dropping into the first position renumbers everything after it", () => {
  const pages = [
    page("p"),
    page("p/a", { order: 1 }),
    page("p/b", { order: 2 }),
    page("p/c", { order: 3 }),
  ];
  // Drag c before a: [c, a, b].
  const plan = computeDrop(pages, "p/c", "p/a", "before");
  expect(plan).toEqual({
    kind: "reorder",
    updates: [
      { path: "src/content/manual/p/c.mdx", order: 1 },
      { path: "src/content/manual/p/a.mdx", order: 2 },
      { path: "src/content/manual/p/b.mdx", order: 3 },
    ],
  });
});

test("dropping a page directly after its current predecessor is a noop", () => {
  const pages = [
    page("p"),
    page("p/a", { order: 1 }),
    page("p/b", { order: 2 }),
    page("p/c", { order: 3 }),
  ];
  // b is already right after a; dropping it "after" a changes nothing.
  const plan = computeDrop(pages, "p/b", "p/a", "after");
  expect(plan).toEqual({ kind: "noop" });
});

test("dropping a page onto itself is a noop regardless of zone", () => {
  const pages = [page("p"), page("p/a"), page("p/b")];
  expect(computeDrop(pages, "p/a", "p/a", "before")).toEqual({
    kind: "noop",
  });
  expect(computeDrop(pages, "p/a", "p/a", "into")).toEqual({ kind: "noop" });
});

// ---------------------------------------------------------------------------
// "into" — nesting
// ---------------------------------------------------------------------------

test("into a leaf: the leaf becomes a parent, dragged page gets order 1", () => {
  const pages = [
    page("a", { section: "S", order: 1 }),
    page("b", { section: "S", order: 2 }),
  ];
  const plan = computeDrop(pages, "b", "a", "into");
  expect(plan).toEqual({
    kind: "move",
    path: "src/content/manual/b.mdx",
    dest: { folder: "a", order: 1 },
    alsoReorder: [],
  });
});

test("into an existing parent: appended after the current last child", () => {
  const pages = [
    page("p"),
    page("p/a", { order: 1 }),
    page("p/b", { order: 2 }),
    page("other", { order: 1 }),
  ];
  const plan = computeDrop(pages, "other", "p", "into");
  expect(plan).toEqual({
    kind: "move",
    path: "src/content/manual/other.mdx",
    dest: { folder: "p", order: 3 },
    alsoReorder: [],
  });
});

test("into a parent that's already the dragged page's parent reorders it to the end", () => {
  const pages = [
    page("p"),
    page("p/a", { order: 1 }),
    page("p/b", { order: 2 }),
    page("p/c", { order: 3 }),
  ];
  // a is already p's first child; dropping it "into" p moves it to the end.
  const plan = computeDrop(pages, "p/a", "p", "into");
  expect(plan).toEqual({
    kind: "reorder",
    updates: [
      { path: "src/content/manual/p/b.mdx", order: 1 },
      { path: "src/content/manual/p/c.mdx", order: 2 },
      { path: "src/content/manual/p/a.mdx", order: 3 },
    ],
  });
});

test("into a parent that's already the dragged page's parent and already last is a noop", () => {
  const pages = [
    page("p"),
    page("p/a", { order: 1 }),
    page("p/b", { order: 2 }),
  ];
  const plan = computeDrop(pages, "p/b", "p", "into");
  expect(plan).toEqual({ kind: "noop" });
});

test("into a target in a different section inherits its section/sectionOrder", () => {
  const pages = [
    page("target", { section: "Other", sectionOrder: 2, order: 1 }),
    page("dragged", { section: "S", sectionOrder: 1, order: 1 }),
  ];
  const plan = computeDrop(pages, "dragged", "target", "into");
  expect(plan).toEqual({
    kind: "move",
    path: "src/content/manual/dragged.mdx",
    dest: {
      folder: "target",
      order: 1,
      section: "Other",
      sectionOrder: 2,
    },
    alsoReorder: [],
  });
});

// ---------------------------------------------------------------------------
// Cycle guard
// ---------------------------------------------------------------------------

test("dropping a page onto its own child is blocked", () => {
  const pages = [page("p"), page("p/child", { order: 1 })];
  const plan = computeDrop(pages, "p", "p/child", "into");
  expect(plan.kind).toBe("blocked");
});

test("dropping a page onto its own grandchild is blocked", () => {
  const pages = [
    page("p"),
    page("p/child", { order: 1 }),
    page("p/child/grandchild", { order: 1 }),
  ];
  const plan = computeDrop(pages, "p", "p/child/grandchild", "before");
  expect(plan.kind).toBe("blocked");
});

test("dropping a page before/after its own descendant is also blocked", () => {
  const pages = [page("p"), page("p/child", { order: 1 })];
  expect(computeDrop(pages, "p", "p/child", "before").kind).toBe("blocked");
  expect(computeDrop(pages, "p", "p/child", "after").kind).toBe("blocked");
});

// ---------------------------------------------------------------------------
// Cross-parent before/after (kind: "move")
// ---------------------------------------------------------------------------

test("cross-parent before: derives dest.folder from the target's tree parent slug", () => {
  const pages = [
    page("p1"),
    page("p1/a", { order: 1 }),
    page("p2"),
    page("p2/x", { order: 1 }),
    page("p2/y", { order: 2 }),
  ];
  // Drag p1/a to before p2/y: destination arrangement (p2's children minus
  // dragged) = [x, y]; inserting before y -> [x, a, y] -> a lands at order 2.
  const plan = computeDrop(pages, "p1/a", "p2/y", "before");
  expect(plan).toEqual({
    kind: "move",
    path: "src/content/manual/p1/a.mdx",
    dest: { folder: "p2", order: 2 },
    alsoReorder: [{ path: "src/content/manual/p2/y.mdx", order: 3 }],
  });
});

test("cross-parent after: only emits alsoReorder for members whose order actually changed", () => {
  const pages = [
    page("p1"),
    page("p1/a", { order: 1 }),
    page("p2"),
    page("p2/x", { order: 1 }),
    page("p2/y", { order: 2 }),
  ];
  // Drag p1/a to after p2/x: [x, a, y] -> x stays 1(same), a=2, y stays
  // 2->3 (changed). x is unchanged so it's excluded from alsoReorder.
  const plan = computeDrop(pages, "p1/a", "p2/x", "after");
  expect(plan).toEqual({
    kind: "move",
    path: "src/content/manual/p1/a.mdx",
    dest: { folder: "p2", order: 2 },
    alsoReorder: [{ path: "src/content/manual/p2/y.mdx", order: 3 }],
  });
});

test("cross-parent move into a different section inherits section/sectionOrder", () => {
  const pages = [
    page("p1", { section: "S", sectionOrder: 1 }),
    page("p1/a", { section: "S", sectionOrder: 1, order: 1 }),
    page("p2", { section: "Other", sectionOrder: 2 }),
    page("p2/x", { section: "Other", sectionOrder: 2, order: 1 }),
  ];
  const plan = computeDrop(pages, "p1/a", "p2/x", "after");
  expect(plan).toEqual({
    kind: "move",
    path: "src/content/manual/p1/a.mdx",
    dest: {
      folder: "p2",
      order: 2,
      section: "Other",
      sectionOrder: 2,
    },
    alsoReorder: [],
  });
});

// ---------------------------------------------------------------------------
// Root-level drops (folder derivation + cross-section)
// ---------------------------------------------------------------------------

test("root-level before/after within the same section reorders the section's root list", () => {
  const pages = [
    page("basics/a", { section: "Basics", sectionOrder: 1, order: 1 }),
    page("basics/b", { section: "Basics", sectionOrder: 1, order: 2 }),
  ];
  // Both are root nodes (no "basics" page exists) in the same section.
  const plan = computeDrop(pages, "basics/b", "basics/a", "before");
  expect(plan).toEqual({
    kind: "reorder",
    updates: [
      { path: "src/content/manual/basics/b.mdx", order: 1 },
      { path: "src/content/manual/basics/a.mdx", order: 2 },
    ],
  });
});

test("cross-section root drop derives dest.folder from the target's own file path, not its slug", () => {
  const pages = [
    page("basics/install", {
      section: "Basics",
      sectionOrder: 1,
      order: 1,
    }),
    page("advanced/tips", {
      section: "Advanced",
      sectionOrder: 2,
      order: 1,
    }),
    page("advanced/tricks", {
      section: "Advanced",
      sectionOrder: 2,
      order: 2,
    }),
  ];
  // "basics/install" and "advanced/tips" are both root nodes (no "basics"/
  // "advanced" page exists). Dragging install to before tips crosses
  // sections; dest.folder must come from tips' own path ("advanced"), not
  // from a nonexistent tree-parent slug.
  const plan = computeDrop(pages, "basics/install", "advanced/tips", "before");
  expect(plan).toEqual({
    kind: "move",
    path: "src/content/manual/basics/install.mdx",
    dest: {
      folder: "advanced",
      order: 1,
      section: "Advanced",
      sectionOrder: 2,
    },
    alsoReorder: [
      { path: "src/content/manual/advanced/tips.mdx", order: 2 },
      { path: "src/content/manual/advanced/tricks.mdx", order: 3 },
    ],
  });
});

test("root-level into a leaf root page: the leaf becomes a parent", () => {
  const pages = [
    page("basics/a", { section: "Basics", sectionOrder: 1, order: 1 }),
    page("basics/b", { section: "Basics", sectionOrder: 1, order: 2 }),
  ];
  const plan = computeDrop(pages, "basics/b", "basics/a", "into");
  expect(plan).toEqual({
    kind: "move",
    path: "src/content/manual/basics/b.mdx",
    dest: { folder: "basics/a", order: 1 },
    alsoReorder: [],
  });
});
