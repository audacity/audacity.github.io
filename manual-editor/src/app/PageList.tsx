import { useEffect, useState } from "react";
import type { ManualPageMeta } from "../backend/types";
import { buildManualTree, type TreeNode } from "./manualTree";

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

function TreeNodeRow({
  node,
  depth,
  expanded,
  onToggle,
  onSelect,
  onAddSubpage,
  activePath,
}: {
  node: TreeNode;
  depth: number;
  expanded: Set<string>;
  onToggle: (slug: string) => void;
  onSelect: (path: string) => void;
  onAddSubpage: (parent: ManualPageMeta) => void;
  activePath: string | null;
}) {
  const hasChildren = node.children.length > 0;
  const isOpen = expanded.has(node.page.slug);
  return (
    <li className="sidebar-tree__item" data-depth={depth}>
      <div className="sidebar-tree__row">
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
          className="sidebar-tree__page"
          aria-current={node.page.path === activePath}
          onClick={() => onSelect(node.page.path)}
        >
          {node.page.title}
          {node.page.hasDraft ? (
            <span
              className="page-list__draft-dot"
              aria-label="Has unpublished draft"
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
}: {
  pages: ManualPageMeta[];
  onSelect: (path: string) => void;
  activePath: string | null;
  onAddSubpage: (parent: ManualPageMeta) => void;
}) {
  const sections = buildManualTree(pages);
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
          <h2>{section}</h2>
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
              />
            ))}
          </ul>
        </section>
      ))}
    </nav>
  );
}
