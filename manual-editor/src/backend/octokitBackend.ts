import { Octokit } from "@octokit/rest";
import type {
  CurrentUser,
  FileChange,
  GitHubBackend,
  ManualPageMeta,
  PageContent,
  PublishResult,
} from "./types";
import { metaFromSource } from "./inMemoryBackend";

const MANUAL_PATH_RE = /^src\/content\/manual\/.+\.(md|mdx)$/;
/** Blob fetches for `listPages` are batched to avoid firing 200+ requests at once. */
const BLOB_FETCH_CONCURRENCY = 20;

/**
 * The slice of the Octokit REST surface this backend actually calls. Kept
 * narrow (rather than the full generated `Octokit` instance type) so tests
 * can inject a plain-object fake without constructing a real client.
 */
export interface MinimalOctokit {
  users: {
    getAuthenticated(): Promise<{ data: { login: string } }>;
  };
  git: {
    getRef(params: {
      owner: string;
      repo: string;
      ref: string;
    }): Promise<{ data: { object: { sha: string } } }>;
    getCommit(params: {
      owner: string;
      repo: string;
      commit_sha: string;
    }): Promise<{ data: { tree: { sha: string } } }>;
    getTree(params: {
      owner: string;
      repo: string;
      tree_sha: string;
      recursive?: string;
    }): Promise<{
      data: { tree: Array<{ path?: string; type?: string; sha?: string }> };
    }>;
    getBlob(params: {
      owner: string;
      repo: string;
      file_sha: string;
    }): Promise<{ data: { content: string; encoding: string } }>;
  };
  repos: {
    getContent(params: {
      owner: string;
      repo: string;
      path: string;
      ref: string;
    }): Promise<{ data: { content?: string; encoding?: string } }>;
  };
}

export interface OctokitBackendOptions {
  owner?: string;
  repo?: string;
  baseBranch?: string;
  draftsBranch?: string;
  /** Inject a (fake or real) Octokit-shaped client, mainly for tests. */
  octokit?: MinimalOctokit;
}

function isNotFound(err: unknown): boolean {
  const status = (err as { status?: number } | undefined)?.status;
  return status === 404;
}

function decodeBase64Content(data: {
  content?: string;
  encoding?: string;
}): string {
  if (data.encoding && data.encoding !== "base64") {
    throw new Error(`Unsupported content encoding: ${data.encoding}`);
  }
  return Buffer.from(data.content ?? "", "base64").toString("utf8");
}

/**
 * `GitHubBackend` implementation backed by the real GitHub REST API via
 * Octokit. This task (G1) implements the read paths only — `currentUser`,
 * `listPages`, `readPage`. The mutating methods (`saveDraft`, `saveImage`,
 * `publish`, `deletePage`) are stubbed and land in G2/G3.
 *
 * Strategy:
 * - `listPages` walks the git Trees API (recursive) for the base branch and,
 *   if it exists, the drafts branch, and diffs the two trees by blob sha.
 *   This is the only way to build a full "what changed" picture without
 *   fetching every file's history, and it lets us batch blob fetches.
 * - `readPage` uses the single-file Contents API instead — fetching one
 *   page doesn't need the whole-tree picture, so a direct per-path request
 *   is both simpler and cheaper. It falls back to a `git.getRef` check only
 *   when it needs to tell "no drafts branch" apart from "drafts branch
 *   exists but this page was deleted on it".
 */
export class OctokitBackend implements GitHubBackend {
  private octokit: MinimalOctokit;
  private owner: string;
  private repo: string;
  private baseBranch: string;
  private draftsBranch: string;

  constructor(token: string, opts: OctokitBackendOptions = {}) {
    this.octokit =
      opts.octokit ??
      (new Octokit({ auth: token }) as unknown as MinimalOctokit);
    this.owner = opts.owner ?? "audacity";
    this.repo = opts.repo ?? "audacity.github.io";
    this.baseBranch = opts.baseBranch ?? "release/audacity-4";
    this.draftsBranch = opts.draftsBranch ?? "manual/editor-drafts";
  }

  async currentUser(): Promise<CurrentUser> {
    const { data } = await this.octokit.users.getAuthenticated();
    return { login: data.login, mode: "github" };
  }

  /**
   * Resolves a branch to a `path -> blob sha` map, filtered to manual
   * md/mdx files. Returns `null` if the branch (ref) doesn't exist.
   */
  private async getManualTree(
    branch: string,
  ): Promise<Map<string, string> | null> {
    let ref;
    try {
      ref = await this.octokit.git.getRef({
        owner: this.owner,
        repo: this.repo,
        ref: `heads/${branch}`,
      });
    } catch (err) {
      if (isNotFound(err)) return null;
      throw err;
    }
    const commit = await this.octokit.git.getCommit({
      owner: this.owner,
      repo: this.repo,
      commit_sha: ref.data.object.sha,
    });
    const tree = await this.octokit.git.getTree({
      owner: this.owner,
      repo: this.repo,
      tree_sha: commit.data.tree.sha,
      recursive: "1",
    });
    const out = new Map<string, string>();
    for (const entry of tree.data.tree) {
      if (
        entry.type === "blob" &&
        entry.path &&
        entry.sha &&
        MANUAL_PATH_RE.test(entry.path)
      ) {
        out.set(entry.path, entry.sha);
      }
    }
    return out;
  }

  private async getBlobContent(sha: string): Promise<string> {
    const { data } = await this.octokit.git.getBlob({
      owner: this.owner,
      repo: this.repo,
      file_sha: sha,
    });
    return decodeBase64Content(data);
  }

  async listPages(): Promise<ManualPageMeta[]> {
    const baseTree = await this.getManualTree(this.baseBranch);
    if (!baseTree) {
      throw new Error(`Base branch not found: ${this.baseBranch}`);
    }
    const draftsTree = await this.getManualTree(this.draftsBranch);

    const entries: { path: string; sha: string; hasDraft: boolean }[] = [];
    if (!draftsTree) {
      for (const [path, sha] of baseTree) {
        entries.push({ path, sha, hasDraft: false });
      }
    } else {
      const allPaths = new Set<string>([
        ...baseTree.keys(),
        ...draftsTree.keys(),
      ]);
      for (const path of allPaths) {
        const inBase = baseTree.has(path);
        const inDrafts = draftsTree.has(path);
        // In base but absent from a drafts tree that itself exists: the
        // drafts branch is a full branch off base, so absence here means
        // the page was explicitly deleted there — staged deletion.
        if (inBase && !inDrafts) continue;
        const sha = inDrafts ? draftsTree.get(path)! : baseTree.get(path)!;
        const hasDraft = inDrafts && (!inBase || baseTree.get(path) !== sha);
        entries.push({ path, sha, hasDraft });
      }
    }

    const pages: ManualPageMeta[] = [];
    for (let i = 0; i < entries.length; i += BLOB_FETCH_CONCURRENCY) {
      const chunk = entries.slice(i, i + BLOB_FETCH_CONCURRENCY);
      const sources = await Promise.all(
        chunk.map((e) => this.getBlobContent(e.sha)),
      );
      chunk.forEach((e, idx) => {
        const meta = metaFromSource(e.path, sources[idx]!);
        meta.hasDraft = e.hasDraft;
        pages.push(meta);
      });
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
    const draftsResult = await this.tryGetContent(path, this.draftsBranch);
    if (draftsResult !== "not-found") {
      return { path, source: draftsResult };
    }

    // Missing on the drafts ref — could mean "no drafts branch at all" or
    // "drafts branch exists but this page was deleted there". Disambiguate
    // with a cheap ref check before deciding whether base is a valid
    // fallback.
    const draftsBranchExists = await this.branchExists(this.draftsBranch);
    const baseResult = await this.tryGetContent(path, this.baseBranch);

    if (draftsBranchExists) {
      if (baseResult !== "not-found") {
        throw new Error(`No such page (deleted on drafts): ${path}`);
      }
      throw new Error(`No such page: ${path}`);
    }

    if (baseResult === "not-found") {
      throw new Error(`No such page: ${path}`);
    }
    return { path, source: baseResult };
  }

  private async tryGetContent(
    path: string,
    ref: string,
  ): Promise<string | "not-found"> {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
        ref,
      });
      return decodeBase64Content(data);
    } catch (err) {
      if (isNotFound(err)) return "not-found";
      throw err;
    }
  }

  private async branchExists(branch: string): Promise<boolean> {
    try {
      await this.octokit.git.getRef({
        owner: this.owner,
        repo: this.repo,
        ref: `heads/${branch}`,
      });
      return true;
    } catch (err) {
      if (isNotFound(err)) return false;
      throw err;
    }
  }

  async saveDraft(_changes: FileChange[], _message: string): Promise<void> {
    throw new Error("not implemented until G2/G3");
  }

  async saveImage(
    _pageSlug: string,
    _filename: string,
    _bytes: Uint8Array,
  ): Promise<string> {
    throw new Error("not implemented until G2/G3");
  }

  async publish(): Promise<PublishResult> {
    throw new Error("not implemented until G2/G3");
  }

  async deletePage(_path: string): Promise<void> {
    throw new Error("not implemented until G2/G3");
  }
}
