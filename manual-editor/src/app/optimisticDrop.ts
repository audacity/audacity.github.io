import type { ManualPageMeta } from "../backend/types";
import type { DropPlan } from "./treeDnd";

/** Repo-relative prefix all manual content lives under (mirrors `treeDnd.ts`,
 * `PageList.tsx`, `newPagePath.ts`). */
const MANUAL_PREFIX = "src/content/manual/";

/** Repo-relative manual path -> content-collection slug. Mirrors
 * `inMemoryBackend.slugOf` exactly so predicted slugs match the server's. */
function slugOf(repoPath: string): string {
  return repoPath
    .replace(/^src\/content\/manual\//, "")
    .replace(/\.(md|mdx)$/, "");
}

/**
 * Predicts the `ManualPageMeta[]` that executing `plan` will produce, WITHOUT
 * any I/O — so the sidebar can update the instant a drop lands instead of
 * waiting for the write plus a `listPages` refetch (the felt "lag" a QA
 * report flagged; see `App.tsx`'s `handleDropPlan`). The real server response
 * is still authoritative: `handleDropPlan` reconciles by refetching in the
 * background and rolls back to the pre-drop snapshot if the write fails.
 *
 * The move branch mirrors `inMemoryBackend.movePage`'s path + frontmatter
 * math field-for-field (moved page renamed into `dest.folder` keeping its own
 * filename; each descendant's `<movedSlug>/` prefix swapped for
 * `<dest.folder>/<name>/`; `order` always rewritten on the moved page,
 * `section`/`sectionOrder` only when crossing sections and then propagated to
 * descendants too). If those rules change server-side, `optimisticDrop.test.ts`
 * — which pins this to the same expectations — must change with them.
 *
 * Object identity is preserved for every unaffected page so React re-renders
 * only the rows that actually moved.
 */
export function applyDropPlan(
  pages: ManualPageMeta[],
  plan: DropPlan,
): ManualPageMeta[] {
  if (plan.kind === "noop" || plan.kind === "blocked") return pages;

  if (plan.kind === "reorder") {
    const orderByPath = new Map(plan.updates.map((u) => [u.path, u.order]));
    return pages.map((p) => {
      const order = orderByPath.get(p.path);
      return order === undefined ? p : { ...p, order };
    });
  }

  // move
  const { path, dest, alsoReorder } = plan;
  const movedSlug = slugOf(path);
  const ext = path.slice(path.lastIndexOf(".") + 1);
  const name = movedSlug.split("/").pop()!;
  const descendantPrefix = `${MANUAL_PREFIX}${movedSlug}/`;
  const newPagePath = `${MANUAL_PREFIX}${dest.folder}/${name}.${ext}`;

  // Section fields ride along only when the plan crosses sections; applied to
  // the moved page AND its descendants (matches the backend's descendantPatch).
  const sectionPatch: Partial<
    Pick<ManualPageMeta, "section" | "sectionOrder">
  > = {};
  if (dest.section !== undefined) sectionPatch.section = dest.section;
  if (dest.sectionOrder !== undefined) {
    sectionPatch.sectionOrder = dest.sectionOrder;
  }

  const alsoOrderByPath = new Map(alsoReorder.map((u) => [u.path, u.order]));

  return pages.map((p) => {
    if (p.path === path) {
      return {
        ...p,
        path: newPagePath,
        slug: slugOf(newPagePath),
        order: dest.order,
        ...sectionPatch,
      };
    }
    if (p.path.startsWith(descendantPrefix)) {
      const rest = p.path.slice(descendantPrefix.length);
      const newDescendantPath = `${MANUAL_PREFIX}${dest.folder}/${name}/${rest}`;
      return {
        ...p,
        path: newDescendantPath,
        slug: slugOf(newDescendantPath),
        ...sectionPatch,
      };
    }
    const alsoOrder = alsoOrderByPath.get(p.path);
    return alsoOrder === undefined ? p : { ...p, order: alsoOrder };
  });
}
