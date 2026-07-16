import type {
  CurrentUser,
  FileChange,
  GitHubBackend,
  ManualPageMeta,
  MovePageDest,
  PageContent,
  PublishResult,
} from "./types";
import { parseFrontmatter } from "./frontmatter";
import { rewriteFrontmatter } from "./frontmatterRewrite";
import type { FrontmatterData } from "../adapter/frontmatterSerialize";
import { listManualFiles, readManualFile, manualDir } from "../mdx/corpus";
import path from "node:path";

export function loadCorpusSeed(): PageContent[] {
  const base = manualDir();
  return listManualFiles().map((abs) => ({
    path: `src/content/manual/${path.relative(base, abs).split(path.sep).join("/")}`,
    source: readManualFile(abs),
  }));
}

/** Repo-relative manual path -> content-collection slug, e.g. "basics/x". */
export function slugOf(repoPath: string): string {
  return repoPath
    .replace(/^src\/content\/manual\//, "")
    .replace(/\.(md|mdx)$/, "");
}

export function metaFromSource(path: string, source: string): ManualPageMeta {
  const { data } = parseFrontmatter(source);
  return {
    slug: slugOf(path),
    path,
    title: typeof data.title === "string" ? data.title : slugOf(path),
    section: typeof data.section === "string" ? data.section : "Uncategorized",
    sectionOrder:
      typeof data.sectionOrder === "number" ? data.sectionOrder : 99,
    order: typeof data.order === "number" ? data.order : 99,
    draft: data.draft === true,
    hasDraft: false,
  };
}

export class InMemoryBackend implements GitHubBackend {
  private base = new Map<string, string>();
  private drafts = new Map<string, string>();
  private images = new Map<string, Uint8Array>();
  private deleted = new Set<string>();
  private prCounter = 0;
  constructor(
    seed: PageContent[],
    private user: CurrentUser = { login: "dev-user", mode: "dev" },
  ) {
    for (const p of seed) this.base.set(p.path, p.source);
  }
  async currentUser(): Promise<CurrentUser> {
    return this.user;
  }
  async listPages(): Promise<ManualPageMeta[]> {
    const pages: ManualPageMeta[] = [];
    const paths = new Set<string>([...this.base.keys(), ...this.drafts.keys()]);
    for (const path of paths) {
      if (this.deleted.has(path)) continue;
      const current = this.drafts.get(path) ?? this.base.get(path)!;
      const meta = metaFromSource(path, current);
      meta.hasDraft = this.drafts.has(path);
      pages.push(meta);
    }
    return pages.sort(
      (a, b) =>
        a.sectionOrder - b.sectionOrder ||
        a.section.localeCompare(b.section) ||
        a.order - b.order ||
        a.slug.localeCompare(b.slug),
    );
  }
  async readPage(path: string): Promise<PageContent> {
    if (this.deleted.has(path)) throw new Error(`No such page: ${path}`);
    const source = this.drafts.get(path) ?? this.base.get(path);
    if (source === undefined) throw new Error(`No such page: ${path}`);
    return { path, source };
  }
  async saveDraft(changes: FileChange[], _message: string): Promise<void> {
    for (const c of changes) {
      this.deleted.delete(c.path);
      this.drafts.set(c.path, c.content);
    }
  }
  async saveImage(
    slug: string,
    filename: string,
    bytes: Uint8Array,
  ): Promise<string> {
    const rel = `src/assets/img/manual/${slug}/${filename}`;
    this.images.set(rel, bytes);
    return rel;
  }
  async publish(): Promise<PublishResult> {
    // Parity with OctokitBackend: publishing with no staged changes is an
    // error there (GitHub's "No commits between" 422 -> "Nothing to publish"),
    // so the dev backend must behave the same for the UI to be truthful.
    if (this.drafts.size === 0 && this.deleted.size === 0) {
      throw new Error("Nothing to publish — no draft changes");
    }
    for (const path of this.deleted) this.base.delete(path);
    this.deleted.clear();
    this.drafts.clear();
    this.prCounter += 1;
    return { prUrl: `memory://pr/${this.prCounter}`, prNumber: this.prCounter };
  }
  async deletePage(path: string): Promise<void> {
    if (this.base.has(path)) {
      this.deleted.add(path);
      this.drafts.delete(path);
      return;
    }
    if (this.drafts.has(path)) {
      this.drafts.delete(path);
      return;
    }
    throw new Error(`No such page: ${path}`);
  }

  /** Base+drafts source for `path`, or `undefined` if it doesn't exist/was deleted. */
  private currentSource(path: string): string | undefined {
    if (this.deleted.has(path)) return undefined;
    return this.drafts.get(path) ?? this.base.get(path);
  }

  /** Set of paths currently "live" (union of base+drafts, minus staged deletions). */
  private livePaths(): Set<string> {
    const live = new Set<string>();
    for (const p of new Set<string>([
      ...this.base.keys(),
      ...this.drafts.keys(),
    ])) {
      if (!this.deleted.has(p)) live.add(p);
    }
    return live;
  }

  async reorderPages(
    updates: Array<{ path: string; order: number }>,
  ): Promise<void> {
    const changes: FileChange[] = updates.map(({ path, order }) => {
      const source = this.currentSource(path);
      if (source === undefined) throw new Error(`No such page: ${path}`);
      return { path, content: rewriteFrontmatter(source, { order }) };
    });
    // One logical op — there are no commits in-memory, so this is just a
    // single `saveDraft` batch (which also clears any deletion markers).
    await this.saveDraft(changes, "reorder pages");
  }

  async movePage(
    path: string,
    dest: MovePageDest,
  ): Promise<Array<{ from: string; to: string }>> {
    const pageSource = this.currentSource(path);
    if (pageSource === undefined) throw new Error(`No such page: ${path}`);
    if (!dest.folder) throw new Error("dest.folder is required");

    const movedSlug = slugOf(path);
    if (dest.folder === movedSlug || dest.folder.startsWith(`${movedSlug}/`)) {
      throw new Error(
        `Cannot move "${movedSlug}" into its own descendant folder "${dest.folder}"`,
      );
    }

    const prefix = "src/content/manual/";
    const ext = path.slice(path.lastIndexOf(".") + 1);
    const name = movedSlug.split("/").pop()!;
    const descendantPrefix = `${prefix}${movedSlug}/`;

    const allPaths = new Set<string>([
      ...this.base.keys(),
      ...this.drafts.keys(),
    ]);
    const descendantPaths = [...allPaths].filter(
      (p) =>
        p !== path && !this.deleted.has(p) && p.startsWith(descendantPrefix),
    );

    const newPagePath = `${prefix}${dest.folder}/${name}.${ext}`;
    const pagePatch: Partial<FrontmatterData> = { order: dest.order };
    if (dest.section !== undefined) pagePatch.section = dest.section;
    if (dest.sectionOrder !== undefined) {
      pagePatch.sectionOrder = dest.sectionOrder;
    }

    // Descendants only get their frontmatter rewritten when a section is
    // provided (a same-section reorder-only move leaves their content byte-
    // identical, just relocated).
    const descendantPatch: Partial<FrontmatterData> = {};
    if (dest.section !== undefined) {
      descendantPatch.section = dest.section;
      if (dest.sectionOrder !== undefined) {
        descendantPatch.sectionOrder = dest.sectionOrder;
      }
    }

    const moves: Array<{ from: string; to: string }> = [
      { from: path, to: newPagePath },
    ];
    const descendantMoves: Array<{ from: string; to: string }> = [];
    for (const oldPath of descendantPaths) {
      const rest = oldPath.slice(descendantPrefix.length);
      const newPath = `${prefix}${dest.folder}/${name}/${rest}`;
      descendantMoves.push({ from: oldPath, to: newPath });
      moves.push({ from: oldPath, to: newPath });
    }

    // Destination-collision guard, checked against the live page set before
    // any write is built. `from === to` is the legal same-path
    // reorder/frontmatter-only move (see below), not a collision with
    // itself — everything else landing on an already-occupied path is a
    // real collision with an unrelated page.
    const live = this.livePaths();
    for (const { from, to } of moves) {
      if (from === to) continue;
      if (live.has(to)) {
        throw new Error(`Destination already exists: ${to}`);
      }
    }

    const changes: FileChange[] = [
      { path: newPagePath, content: rewriteFrontmatter(pageSource, pagePatch) },
    ];
    // Same-folder move of the page itself: `newPagePath === path` is a
    // legal reorder/frontmatter-only move, not a relocation — write the
    // rewritten frontmatter in place and do NOT stage a deletion of the
    // path we just wrote (that would destroy the page).
    const toDelete: string[] = newPagePath === path ? [] : [path];

    for (const { from: oldPath, to: newPath } of descendantMoves) {
      // A descendant's from/to are identical exactly when the page's own
      // path is unchanged (same-folder move) — plain no-op unless a
      // section rewrite applies, in which case it's a content-only write
      // with no accompanying delete.
      if (newPath === oldPath) {
        if (Object.keys(descendantPatch).length > 0) {
          const source = this.currentSource(oldPath)!;
          changes.push({
            path: newPath,
            content: rewriteFrontmatter(source, descendantPatch),
          });
        }
        continue;
      }
      const source = this.currentSource(oldPath)!;
      const content =
        Object.keys(descendantPatch).length > 0
          ? rewriteFrontmatter(source, descendantPatch)
          : source;
      changes.push({ path: newPath, content });
      toDelete.push(oldPath);
    }

    await this.saveDraft(changes, `move ${path} -> ${newPagePath}`);
    for (const from of toDelete) {
      await this.deletePage(from);
    }

    return moves;
  }
}
