export interface ManualPageMeta {
  /** Content-collection slug, e.g. "basics/installing-ffmpeg". */
  slug: string;
  /** Repo-relative path, e.g. "src/content/manual/basics/installing-ffmpeg.mdx". */
  path: string;
  title: string;
  section: string;
  sectionOrder: number;
  order: number;
  draft: boolean;
  /** True if this page has unpublished changes on the drafts branch. */
  hasDraft: boolean;
}

export interface PageContent {
  path: string;
  /** Full MDX source (frontmatter + body). */
  source: string;
}

export interface FileChange {
  path: string;
  /** UTF-8 text for text files. */
  content: string;
}

export interface PublishResult {
  prUrl: string;
  prNumber: number;
}

export interface CurrentUser {
  login: string;
  /** "dev" when running under dev-mode auth. */
  mode: "github" | "dev";
}

export interface MovePageDest {
  /** Destination folder relative to `src/content/manual`; "" is not allowed. */
  folder: string;
  order: number;
  /** Set when crossing sections; applies to descendants too. */
  section?: string;
  sectionOrder?: number;
}

export interface GitHubBackend {
  currentUser(): Promise<CurrentUser>;
  listPages(): Promise<ManualPageMeta[]>;
  /** Reads the drafts-branch version if present, else the base branch. */
  readPage(path: string): Promise<PageContent>;
  /** Reads the base-branch version only. Returns null if the page is draft-only (not yet published). */
  readBasePage(path: string): Promise<PageContent | null>;
  /** Commits text changes to the drafts branch (creating it off base if needed). */
  saveDraft(changes: FileChange[], message: string): Promise<void>;
  /** Commits an optimized image to the drafts branch; returns repo-relative path. */
  saveImage(
    pageSlug: string,
    filename: string,
    bytes: Uint8Array,
  ): Promise<string>;
  /**
   * Reads a binary asset (an image previously written by `saveImage`) by its
   * repo-relative path. Prefers the drafts-branch version if present, else
   * falls back to base — same precedence as `readPage`. Throws if the path
   * doesn't exist on either.
   */
  readAsset(path: string): Promise<Uint8Array>;
  /** Opens or updates the PR from drafts branch -> base; returns PR info. */
  publish(): Promise<PublishResult>;
  /**
   * Deletes a page. A draft-only page is discarded entirely; a page that
   * exists on base is staged for deletion (hidden from listings/reads until
   * `publish()` lands it). Throws if the path doesn't exist at all.
   */
  deletePage(path: string): Promise<void>;
  /** Rewrite `order` frontmatter on each path. One commit. */
  reorderPages(updates: Array<{ path: string; order: number }>): Promise<void>;
  /**
   * Move a page and all its descendants to a new folder. Rewrites the moved
   * page's frontmatter (order; section/sectionOrder when provided). Returns
   * the old→new path mapping (moved page first).
   */
  movePage(
    path: string,
    dest: MovePageDest,
  ): Promise<Array<{ from: string; to: string }>>;
}
