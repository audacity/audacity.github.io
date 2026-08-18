import { expect, test } from "bun:test";
import type { ManualPageMeta } from "../backend/types";
import type { DropPlan } from "./treeDnd";
import { applyDropPlan } from "./optimisticDrop";
import { buildManualTree } from "./manualTree";

/**
 * `applyDropPlan` predicts the `ManualPageMeta[]` that the server's
 * `reorderPages`/`movePage` will produce, so the sidebar can update instantly
 * (optimistically) instead of waiting for the write + a `listPages` refetch.
 * These tests pin the prediction to the backend's path/frontmatter math
 * (see `inMemoryBackend.movePage`) so the two can't silently diverge.
 */

function meta(
  overrides: Partial<ManualPageMeta> & { path: string },
): ManualPageMeta {
  const slug = overrides.path
    .replace(/^src\/content\/manual\//, "")
    .replace(/\.(md|mdx)$/, "");
  return {
    slug,
    title: slug,
    stream: "reference",
    section: "Basics",
    sectionOrder: 0,
    order: 1,
    draft: false,
    hasDraft: false,
    ...overrides,
    // keep slug consistent with path even if caller overrode neither
    ...(overrides.slug ? {} : { slug }),
  };
}

const A = meta({ path: "src/content/manual/a.mdx", order: 1 });
const B = meta({ path: "src/content/manual/b.mdx", order: 2 });
const C = meta({ path: "src/content/manual/c.mdx", order: 3 });

test("noop / blocked plans return the list unchanged (same reference)", () => {
  const pages = [A, B];
  expect(applyDropPlan(pages, { kind: "noop" })).toBe(pages);
  expect(applyDropPlan(pages, { kind: "blocked", reason: "x" })).toBe(pages);
});

test("reorder plan rewrites order only on the listed paths, nothing else", () => {
  const plan: DropPlan = {
    kind: "reorder",
    updates: [
      { path: B.path, order: 1 },
      { path: A.path, order: 2 },
    ],
  };
  const next = applyDropPlan([A, B, C], plan);
  const byPath = new Map(next.map((p) => [p.path, p]));
  expect(byPath.get(A.path)!.order).toBe(2);
  expect(byPath.get(B.path)!.order).toBe(1);
  // C untouched, and its object identity preserved (no needless churn).
  expect(byPath.get(C.path)).toBe(C);
  // No paths changed on a reorder.
  expect(next.map((p) => p.path).sort()).toEqual(
    [A.path, B.path, C.path].sort(),
  );
});

test("cross-section move updates the moved page's path, slug, section, sectionOrder and order", () => {
  // Move `a` into folder `advanced` under section "Advanced".
  const plan: DropPlan = {
    kind: "move",
    path: A.path,
    dest: {
      folder: "advanced",
      order: 5,
      section: "Advanced",
      sectionOrder: 2,
    },
    alsoReorder: [],
  };
  const next = applyDropPlan([A, B], plan);
  const moved = next.find((p) => p.title === A.title)!;
  expect(moved.path).toBe("src/content/manual/advanced/a.mdx");
  expect(moved.slug).toBe("advanced/a");
  expect(moved.section).toBe("Advanced");
  expect(moved.sectionOrder).toBe(2);
  expect(moved.order).toBe(5);
  // The untouched sibling keeps its identity.
  expect(next.find((p) => p.path === B.path)).toBe(B);

  // And the moved page now lives under the Advanced section in the tree.
  const tree = buildManualTree(next);
  const advanced = tree.find((s) => s.section === "Advanced");
  expect(advanced).toBeDefined();
  expect(advanced!.nodes.map((n) => n.page.slug)).toContain("advanced/a");
});

test("move rewrites descendant paths/slugs and (when crossing sections) their section", () => {
  const parent = meta({ path: "src/content/manual/guide.mdx", order: 1 });
  const child = meta({
    path: "src/content/manual/guide/intro.mdx",
    order: 1,
    section: "Basics",
    sectionOrder: 0,
  });
  const grandchild = meta({
    path: "src/content/manual/guide/intro/deep.mdx",
    order: 1,
    section: "Basics",
    sectionOrder: 0,
  });
  const plan: DropPlan = {
    kind: "move",
    path: parent.path,
    dest: { folder: "manuals", order: 2, section: "Advanced", sectionOrder: 3 },
    alsoReorder: [],
  };
  const next = applyDropPlan([parent, child, grandchild], plan);
  const byTitle = new Map(next.map((p) => [p.title, p]));

  expect(byTitle.get(parent.title)!.path).toBe(
    "src/content/manual/manuals/guide.mdx",
  );
  expect(byTitle.get(child.title)!.path).toBe(
    "src/content/manual/manuals/guide/intro.mdx",
  );
  expect(byTitle.get(child.title)!.slug).toBe("manuals/guide/intro");
  expect(byTitle.get(grandchild.title)!.path).toBe(
    "src/content/manual/manuals/guide/intro/deep.mdx",
  );
  // Section propagates to descendants on a cross-section move.
  expect(byTitle.get(child.title)!.section).toBe("Advanced");
  expect(byTitle.get(grandchild.title)!.section).toBe("Advanced");
});

test("same-section move leaves descendant section untouched", () => {
  const parent = meta({
    path: "src/content/manual/guide.mdx",
    section: "Basics",
  });
  const child = meta({
    path: "src/content/manual/guide/intro.mdx",
    section: "Basics",
  });
  // No `section` in dest -> same-section relocation.
  const plan: DropPlan = {
    kind: "move",
    path: parent.path,
    dest: { folder: "manuals", order: 2 },
    alsoReorder: [],
  };
  const next = applyDropPlan([parent, child], plan);
  const movedChild = next.find((p) => p.title === child.title)!;
  expect(movedChild.path).toBe("src/content/manual/manuals/guide/intro.mdx");
  expect(movedChild.section).toBe("Basics");
});

test("move applies alsoReorder to the destination's other members", () => {
  const plan: DropPlan = {
    kind: "move",
    path: A.path,
    dest: {
      folder: "advanced",
      order: 1,
      section: "Advanced",
      sectionOrder: 2,
    },
    alsoReorder: [{ path: B.path, order: 2 }],
  };
  const next = applyDropPlan([A, B], plan);
  expect(next.find((p) => p.path === B.path)!.order).toBe(2);
});
