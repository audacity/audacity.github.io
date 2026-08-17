import { useEffect, useState, type DragEvent } from "react";
import type { ManualPageMeta } from "../backend/types";
import { buildManualTree, type TreeNode } from "./manualTree";
import { computeDrop, type DropPlan, type DropZone } from "./treeDnd";

const MANUAL_PREFIX = "src/content/manual/";

/** Strips the content-collection path prefix/extension to recover the slug. */
function activeSlugFromPath(activePath: string | null): string | null {
  if (!activePath) return null;
  let slug = activePath;
  if (slug.startsWith(MANUAL_PREFIX)) {
    slug = slug.slice(MANUAL_PREFIX.length);
  }
  slug = slug.replace(/\.mdx?$/, "");
  return slug;
}

function isAncestor(nodeSlug: string, activeSlug: string): boolean {
  return activeSlug === nodeSlug || activeSlug.startsWith(nodeSlug + "/");
}

/** Collects the slugs of every node on the path to (and including) the active page. */
function collectAncestorSlugs(
  nodes: TreeNode[],
  activeSlug: string,
  into: Set<string>,
): void {
  for (const node of nodes) {
    if (isAncestor(node.page.slug, activeSlug)) {
      into.add(node.page.slug);
      collectAncestorSlugs(node.children, activeSlug, into);
    }
  }
}

/** A row is a "before"/"after" drop target when the pointer is in the top or
 * bottom quarter of its height; the middle half is "into". */
const EDGE_ZONE_RATIO = 0.25;

function zoneFromPointerY(rect: DOMRect, clientY: number): DropZone {
  const ratio = (clientY - rect.top) / rect.height;
  if (ratio < EDGE_ZONE_RATIO) return "before";
  if (ratio > 1 - EDGE_ZONE_RATIO) return "after";
  return "into";
}

function TreeNodeRow({
  node,
  depth,
  expanded,
  onToggle,
  onSelect,
  onAddSubpage,
  activePath,
  draggedSlug,
  dropTarget,
  onRowDragStart,
  onRowDragOver,
  onRowDrop,
  onRowDragEnd,
}: {
  node: TreeNode;
  depth: number;
  expanded: Set<string>;
  onToggle: (slug: string) => void;
  onSelect: (path: string) => void;
  onAddSubpage: (parent: ManualPageMeta) => void;
  activePath: string | null;
  draggedSlug: string | null;
  dropTarget: { slug: string; zone: DropZone; blocked: boolean } | null;
  onRowDragStart: (slug: string) => void;
  onRowDragOver: (e: DragEvent<HTMLDivElement>, slug: string) => void;
  onRowDrop: (slug: string) => void;
  onRowDragEnd: () => void;
}) {
  const hasChildren = node.children.length > 0;
  const isOpen = expanded.has(node.page.slug);
  const isDragging = draggedSlug === node.page.slug;
  const isDropTarget = dropTarget?.slug === node.page.slug;
  const rowClasses = ["sidebar-tree__row"];
  if (isDragging) rowClasses.push("sidebar-tree__row--dragging");
  if (isDropTarget) {
    rowClasses.push(`sidebar-tree__row--drop-${dropTarget.zone}`);
    if (dropTarget.blocked) rowClasses.push("sidebar-tree__row--drop-blocked");
  }
  return (
    <li className="sidebar-tree__item" data-depth={depth}>
      <div
        className={rowClasses.join(" ")}
        onDragOver={(e) => onRowDragOver(e, node.page.slug)}
        onDrop={(e) => {
          e.preventDefault();
          onRowDrop(node.page.slug);
        }}
      >
        {hasChildren ? (
          <button
            type="button"
            data-testid={`toggle-${node.page.slug}`}
            className="sidebar-tree__toggle"
            aria-expanded={isOpen}
            aria-label={`Toggle ${node.page.title}`}
            onClick={() => onToggle(node.page.slug)}
          >
            <span
              className={`sidebar-tree__chevron${isOpen ? " sidebar-tree__chevron--open" : ""}`}
              aria-hidden="true"
            >
              ▶
            </span>
          </button>
        ) : (
          <span className="sidebar-tree__toggle-spacer" aria-hidden="true" />
        )}
        <button
          data-testid={`page-${node.page.slug}`}
          className={`sidebar-tree__page${node.page.draft ? " sidebar-tree__page--draft" : ""}`}
          aria-current={node.page.path === activePath}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", node.page.slug);
            onRowDragStart(node.page.slug);
          }}
          onDragEnd={onRowDragEnd}
          onClick={() => onSelect(node.page.path)}
        >
          {node.page.title}
          {node.page.draft ? (
            <span className="page-list__draft-label" aria-label="Draft page">
              {" "}
              Draft
            </span>
          ) : null}
          {node.page.hasDraft ? (
            <span
              className="page-list__draft-dot"
              aria-label="Has unsaved changes"
              title="Unsaved changes"
            >
              {" "}
              ●
            </span>
          ) : null}
        </button>
        <button
          type="button"
          data-testid={`add-subpage-${node.page.slug}`}
          className="sidebar-tree__add"
          title="Add sub-page"
          aria-label={`Add sub-page under ${node.page.title}`}
          onClick={() => onAddSubpage(node.page)}
        >
          +
        </button>
      </div>
      {hasChildren && isOpen ? (
        <ul className="sidebar-tree">
          {node.children.map((child) => (
            <TreeNodeRow
              key={child.page.path}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              onToggle={onToggle}
              onSelect={onSelect}
              onAddSubpage={onAddSubpage}
              activePath={activePath}
              draggedSlug={draggedSlug}
              dropTarget={dropTarget}
              onRowDragStart={onRowDragStart}
              onRowDragOver={onRowDragOver}
              onRowDrop={onRowDrop}
              onRowDragEnd={onRowDragEnd}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function PageList({
  pages,
  onSelect,
  activePath,
  onAddSubpage,
  onAddToSection,
  onDropPlan,
}: {
  pages: ManualPageMeta[];
  onSelect: (path: string) => void;
  activePath: string | null;
  onAddSubpage: (parent: ManualPageMeta) => void;
  /**
   * The per-section "+" in each group header: opens the new-page dialog
   * prefilled for that section (see `NewPageDialog`'s `sectionPrefill`).
   */
  onAddToSection: (section: string) => void;
  onDropPlan: (plan: DropPlan) => void;
}) {
  const sections = buildManualTree(pages);
  const [draggedSlug, setDraggedSlug] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    slug: string;
    zone: DropZone;
    blocked: boolean;
  } | null>(null);

  function handleRowDragStart(slug: string) {
    setDraggedSlug(slug);
  }

  function handleRowDragOver(e: DragEvent<HTMLDivElement>, slug: string) {
    if (!draggedSlug || draggedSlug === slug) return;
    // Required so the browser treats this row as a valid drop target.
    e.preventDefault();
    const zone = zoneFromPointerY(
      e.currentTarget.getBoundingClientRect(),
      e.clientY,
    );
    const plan = computeDrop(pages, draggedSlug, slug, zone);
    setDropTarget({ slug, zone, blocked: plan.kind === "blocked" });
  }

  function handleRowDrop(slug: string) {
    if (draggedSlug && dropTarget && dropTarget.slug === slug) {
      const plan = computeDrop(pages, draggedSlug, slug, dropTarget.zone);
      // Blocked plans never reach the API — the row's cursor/tint already
      // signaled the refusal while hovering.
      if (plan.kind !== "blocked") {
        onDropPlan(plan);
      }
    }
    setDraggedSlug(null);
    setDropTarget(null);
  }

  function handleRowDragEnd() {
    setDraggedSlug(null);
    setDropTarget(null);
  }

  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const seed = new Set<string>();
    const activeSlug = activeSlugFromPath(activePath);
    if (activeSlug) {
      for (const section of sections) {
        collectAncestorSlugs(section.nodes, activeSlug, seed);
      }
    }
    return seed;
  });

  useEffect(() => {
    const activeSlug = activeSlugFromPath(activePath);
    if (!activeSlug) return;
    const ancestors = new Set<string>();
    for (const section of sections) {
      collectAncestorSlugs(section.nodes, activeSlug, ancestors);
    }
    if (ancestors.size === 0) return;
    setExpanded((prev) => {
      const next = new Set(prev);
      let changed = false;
      for (const slug of ancestors) {
        if (!next.has(slug)) {
          next.add(slug);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
    // Only re-seed when the active page changes, not on every pages/sections
    // recompute (which would re-run each render otherwise).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePath]);

  function toggle(slug: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  }

  return (
    <nav aria-label="Manual pages">
      {sections.map(({ section, nodes }) => (
        <section key={section}>
          {/* Hover-revealed "+" (see .sidebar-section__add in editor.css)
              rather than a permanent ghost row per group: the sidebar is
              dense already, and this matches the app's subtle-until-hover
              affordances (sub-page "+", drag handles). */}
          <div className="sidebar-section__header">
            <h2>{section}</h2>
            <button
              type="button"
              className="sidebar-section__add"
              data-testid="section-add-page"
              aria-label={`Add page to ${section}`}
              title={`Add page to ${section}`}
              onClick={() => onAddToSection(section)}
            >
              +
            </button>
          </div>
          <ul className="sidebar-tree">
            {nodes.map((node) => (
              <TreeNodeRow
                key={node.page.path}
                node={node}
                depth={0}
                expanded={expanded}
                onToggle={toggle}
                onSelect={onSelect}
                onAddSubpage={onAddSubpage}
                activePath={activePath}
                draggedSlug={draggedSlug}
                dropTarget={dropTarget}
                onRowDragStart={handleRowDragStart}
                onRowDragOver={handleRowDragOver}
                onRowDrop={handleRowDrop}
                onRowDragEnd={handleRowDragEnd}
              />
            ))}
          </ul>
        </section>
      ))}
    </nav>
  );
}
