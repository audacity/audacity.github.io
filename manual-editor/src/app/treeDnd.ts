import type { ManualPageMeta } from "../backend/types";
import { buildManualTree, type SectionTree, type TreeNode } from "./manualTree";

/** Repo-relative prefix all manual content lives under (mirrors `PageList.tsx`,
 * `newPagePath.ts`). */
const MANUAL_PREFIX = "src/content/manual/";

export type DropZone = "before" | "after" | "into";

export type DropPlan =
  | { kind: "noop" }
  | { kind: "blocked"; reason: string }
  | { kind: "reorder"; updates: Array<{ path: string; order: number }> }
  | {
      kind: "move";
      path: string;
      dest: {
        folder: string;
        order: number;
        section?: string;
        sectionOrder?: number;
      };
      alsoReorder: Array<{ path: string; order: number }>;
    };

/**
 * The directory a page's OWN file lives in, relative to `src/content/manual`
 * — i.e. its path minus its own filename (e.g. "a/b.mdx" -> "a"; "b.mdx" ->
 * ""). Deliberately distinct from a tree node's PARENT slug: a root tree
 * node can still live inside a real on-disk folder when no page represents
 * that folder directly (e.g. "basics/installing-ffmpeg" is a root node
 * because no "basics" page exists, but the file's own folder is still
 * "basics") — that's exactly the case root-level cross-parent drops need.
 */
function folderOf(path: string): string {
  const rest = path.startsWith(MANUAL_PREFIX)
    ? path.slice(MANUAL_PREFIX.length)
    : path;
  const lastSlash = rest.lastIndexOf("/");
  return lastSlash === -1 ? "" : rest.slice(0, lastSlash);
}

interface Location {
  node: TreeNode;
  /** `null` for a root (section-level) node. */
  parent: TreeNode | null;
  section: string;
  sectionOrder: number;
  /** The array `node` currently belongs to — `parent.children`, or the
   * section's root `nodes` list when `parent` is `null`. */
  siblings: TreeNode[];
}

function locateIn(
  nodes: TreeNode[],
  parent: TreeNode | null,
  section: string,
  sectionOrder: number,
  slug: string,
): Location | undefined {
  for (const node of nodes) {
    if (node.page.slug === slug) {
      return { node, parent, section, sectionOrder, siblings: nodes };
    }
    const deep = locateIn(node.children, node, section, sectionOrder, slug);
    if (deep) return deep;
  }
  return undefined;
}

function locate(sections: SectionTree[], slug: string): Location | undefined {
  for (const { section, sectionOrder, nodes } of sections) {
    const found = locateIn(nodes, null, section, sectionOrder, slug);
    if (found) return found;
  }
  return undefined;
}

/** Inserts `draggedNode` into `others` (which must NOT already contain it) at
 * `insertIndex`, clamped to a valid range. Returns the resulting arrangement
 * plus the dragged node's 1-indexed position within it. */
function insertDragged(
  others: TreeNode[],
  draggedNode: TreeNode,
  insertIndex: number,
): { arrangement: TreeNode[]; order: number } {
  const clamped = Math.max(0, Math.min(insertIndex, others.length));
  const arrangement = [
    ...others.slice(0, clamped),
    draggedNode,
    ...others.slice(clamped),
  ];
  return { arrangement, order: clamped + 1 };
}

/** Builds a same-parent `reorder` plan: 1..n renumbers `arrangement`,
 * emitting an update ONLY for entries whose order actually changed. Returns
 * `noop` when nothing changed (e.g. dropped back where it already was). */
function buildReorderPlan(
  others: TreeNode[],
  draggedNode: TreeNode,
  insertIndex: number,
): DropPlan {
  const { arrangement } = insertDragged(others, draggedNode, insertIndex);
  const updates: Array<{ path: string; order: number }> = [];
  arrangement.forEach((n, i) => {
    const newOrder = i + 1;
    if (n.page.order !== newOrder) {
      updates.push({ path: n.page.path, order: newOrder });
    }
  });
  if (updates.length === 0) return { kind: "noop" };
  return { kind: "reorder", updates };
}

/** `alsoReorder` for a cross-parent move: renumbers the OTHER members of the
 * destination arrangement (excluding the dragged page, whose order rides in
 * `dest`), emitting only the ones whose order actually changed. */
function alsoReorderFor(
  arrangement: TreeNode[],
  draggedNode: TreeNode,
): Array<{ path: string; order: number }> {
  const updates: Array<{ path: string; order: number }> = [];
  arrangement.forEach((n, i) => {
    if (n === draggedNode) return;
    const newOrder = i + 1;
    if (n.page.order !== newOrder) {
      updates.push({ path: n.page.path, order: newOrder });
    }
  });
  return updates;
}

function computeInto(draggedLoc: Location, targetLoc: Location): DropPlan {
  const dragged = draggedLoc.node;
  const target = targetLoc.node;

  const alreadyChild = draggedLoc.parent?.page.slug === target.page.slug;
  if (alreadyChild) {
    // Already one of target's children — dropping "into" the parent itself
    // (rather than before/after a specific sibling) reorders it to the end.
    const others = target.children.filter(
      (n) => n.page.slug !== dragged.page.slug,
    );
    return buildReorderPlan(others, dragged, others.length);
  }

  const order = target.children.length + 1;
  const sameSection = target.page.section === dragged.page.section;
  return {
    kind: "move",
    path: dragged.page.path,
    dest: {
      folder: target.page.slug,
      order,
      ...(sameSection
        ? {}
        : {
            section: target.page.section,
            sectionOrder: target.page.sectionOrder,
          }),
    },
    alsoReorder: [],
  };
}

function computeBeforeAfter(
  draggedLoc: Location,
  targetLoc: Location,
  zone: "before" | "after",
): DropPlan {
  const dragged = draggedLoc.node;
  const target = targetLoc.node;

  const sameParent =
    draggedLoc.parent !== null && targetLoc.parent !== null
      ? draggedLoc.parent.page.slug === targetLoc.parent.page.slug
      : draggedLoc.parent === null &&
        targetLoc.parent === null &&
        draggedLoc.section === targetLoc.section;

  const others = targetLoc.siblings.filter(
    (n) => n.page.slug !== dragged.page.slug,
  );
  const targetIndex = others.findIndex((n) => n.page.slug === target.page.slug);
  const insertIndex = zone === "before" ? targetIndex : targetIndex + 1;

  if (sameParent) {
    return buildReorderPlan(others, dragged, insertIndex);
  }

  const folder = targetLoc.parent
    ? targetLoc.parent.page.slug
    : folderOf(target.page.path);
  const sameSection = target.page.section === dragged.page.section;
  const { arrangement, order } = insertDragged(others, dragged, insertIndex);

  return {
    kind: "move",
    path: dragged.page.path,
    dest: {
      folder,
      order,
      ...(sameSection
        ? {}
        : {
            section: target.page.section,
            sectionOrder: target.page.sectionOrder,
          }),
    },
    alsoReorder: alsoReorderFor(arrangement, dragged),
  };
}

/**
 * Computes what dropping `draggedSlug` onto `targetSlug` (in `zone`) should
 * do, purely from the current flat page list — no I/O. See `PageList.tsx`
 * for how the caller derives `zone` from pointer position, and `App.tsx`'s
 * `handleDropPlan` for how each `DropPlan` kind is executed against the
 * `/api/reorder` and `/api/move` endpoints (Task 1).
 */
export function computeDrop(
  pages: ManualPageMeta[],
  draggedSlug: string,
  targetSlug: string,
  zone: DropZone,
): DropPlan {
  if (draggedSlug === targetSlug) return { kind: "noop" };
  if (targetSlug === draggedSlug || targetSlug.startsWith(`${draggedSlug}/`)) {
    return {
      kind: "blocked",
      reason: "Can't drop a page into its own sub-pages",
    };
  }

  const sections = buildManualTree(pages);
  const draggedLoc = locate(sections, draggedSlug);
  const targetLoc = locate(sections, targetSlug);
  if (!draggedLoc || !targetLoc) {
    return { kind: "blocked", reason: "Page not found" };
  }

  if (zone === "into") return computeInto(draggedLoc, targetLoc);
  return computeBeforeAfter(draggedLoc, targetLoc, zone);
}
