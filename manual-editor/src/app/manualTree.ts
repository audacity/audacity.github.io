import type { ManualPageMeta } from "../backend/types";

export interface TreeNode {
  page: ManualPageMeta;
  children: TreeNode[];
}

export interface SectionTree {
  section: string;
  sectionOrder: number;
  nodes: TreeNode[];
}

/**
 * Build a nested tree from a flat list of pages (within a single section) by
 * using the slug path as the hierarchy. A page whose slug is `foo/bar/baz`
 * becomes a child of `foo/bar` if that page exists in the set, otherwise of
 * `foo`, otherwise a root.
 *
 * Port of the reference `buildTree` in
 * src/components/manual/ManualSidebar.astro.
 */
function buildTree(pages: ManualPageMeta[]): TreeNode[] {
  const sorted = [...pages].sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return a.slug.localeCompare(b.slug);
  });

  const nodes = new Map<string, TreeNode>();
  for (const page of sorted) {
    nodes.set(page.slug, { page, children: [] });
  }

  const roots: TreeNode[] = [];
  for (const page of sorted) {
    const node = nodes.get(page.slug)!;
    const parts = page.slug.split("/");
    let attached = false;
    for (let i = parts.length - 1; i > 0; i--) {
      const parentSlug = parts.slice(0, i).join("/");
      const parent = nodes.get(parentSlug);
      if (parent) {
        parent.children.push(node);
        attached = true;
        break;
      }
    }
    if (!attached) roots.push(node);
  }
  return roots;
}

/**
 * Groups manual pages by section and nests them by slug path within each
 * section. Sections are ordered by the minimum `sectionOrder` seen among
 * their pages, then by section name. Tree-building is per-section: a page
 * only attaches to an ancestor slug that exists within the same section.
 */
export function buildManualTree(pages: ManualPageMeta[]): SectionTree[] {
  const grouped = new Map<
    string,
    { sectionOrder: number; pages: ManualPageMeta[] }
  >();
  for (const page of pages) {
    const existing = grouped.get(page.section);
    if (existing) {
      existing.pages.push(page);
      if (page.sectionOrder < existing.sectionOrder) {
        existing.sectionOrder = page.sectionOrder;
      }
    } else {
      grouped.set(page.section, {
        sectionOrder: page.sectionOrder,
        pages: [page],
      });
    }
  }

  return Array.from(grouped.entries())
    .sort((a, b) => {
      if (a[1].sectionOrder !== b[1].sectionOrder) {
        return a[1].sectionOrder - b[1].sectionOrder;
      }
      return a[0].localeCompare(b[0]);
    })
    .map(([section, { sectionOrder, pages: sectionPages }]) => ({
      section,
      sectionOrder,
      nodes: buildTree(sectionPages),
    }));
}
