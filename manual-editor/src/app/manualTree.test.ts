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

test("a page with no matching ancestor in its own section is a root even if a deeper-nested slug exists in another section", () => {
  const pages = [
    page("shared/leaf", { section: "S", sectionOrder: 1, order: 1 }),
    page("shared", { section: "Other", sectionOrder: 2, order: 1 }),
  ];
  const tree = buildManualTree(pages);
  const sSection = tree.find((s) => s.section === "S")!;
  expect(sSection.nodes.map((n) => n.page.slug)).toEqual(["shared/leaf"]);
});
