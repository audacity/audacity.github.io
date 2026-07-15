import type {
  CurrentUser,
  FileChange,
  GitHubBackend,
  ManualPageMeta,
  PageContent,
  PublishResult,
} from "./types";
import { parseFrontmatter } from "./frontmatter";
import { listManualFiles, readManualFile, manualDir } from "../mdx/corpus";
import path from "node:path";

export function loadCorpusSeed(): PageContent[] {
  const base = manualDir();
  return listManualFiles().map((abs) => ({
    path: `src/content/manual/${path.relative(base, abs).split(path.sep).join("/")}`,
    source: readManualFile(abs),
  }));
}

function slugOf(repoPath: string): string {
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
    for (const [path, source] of this.base) {
      const current = this.drafts.get(path) ?? source;
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
    const source = this.drafts.get(path) ?? this.base.get(path);
    if (source === undefined) throw new Error(`No such page: ${path}`);
    return { path, source };
  }
  async saveDraft(changes: FileChange[], _message: string): Promise<void> {
    for (const c of changes) this.drafts.set(c.path, c.content);
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
    this.drafts.clear();
    this.prCounter += 1;
    return { prUrl: `memory://pr/${this.prCounter}`, prNumber: this.prCounter };
  }
}
