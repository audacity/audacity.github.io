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

    const moves: Array<{ from: string; to: string }> = [
      { from: path, to: newPagePath },
    ];
    const changes: FileChange[] = [
      { path: newPagePath, content: rewriteFrontmatter(pageSource, pagePatch) },
    ];

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

    for (const oldPath of descendantPaths) {
      const rest = oldPath.slice(descendantPrefix.length);
      const newPath = `${prefix}${dest.folder}/${name}/${rest}`;
      const source = this.currentSource(oldPath)!;
      const content =
        Object.keys(descendantPatch).length > 0
          ? rewriteFrontmatter(source, descendantPatch)
          : source;
      moves.push({ from: oldPath, to: newPath });
      changes.push({ path: newPath, content });
    }

    await this.saveDraft(changes, `move ${path} -> ${newPagePath}`);
    for (const { from } of moves) {
      await this.deletePage(from);
    }

    return moves;
  }
}
