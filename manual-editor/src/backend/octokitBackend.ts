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
      data: {
        tree: Array<{ path?: string; type?: string; sha?: string }>;
        truncated?: boolean;
      };
    }>;
    getBlob(params: {
      owner: string;
      repo: string;
      file_sha: string;
    }): Promise<{ data: { content: string; encoding: string } }>;
    createBlob(params: {
      owner: string;
      repo: string;
      content: string;
      encoding: string;
    }): Promise<{ data: { sha: string } }>;
    createTree(params: {
      owner: string;
      repo: string;
      base_tree?: string;
      tree: DraftTreeItem[];
    }): Promise<{ data: { sha: string } }>;
    createCommit(params: {
      owner: string;
      repo: string;
      message: string;
      tree: string;
      parents: string[];
    }): Promise<{ data: { sha: string } }>;
    createRef(params: {
      owner: string;
      repo: string;
      ref: string;
      sha: string;
    }): Promise<{ data: { object: { sha: string } } }>;
    updateRef(params: {
      owner: string;
      repo: string;
      ref: string;
      sha: string;
      force?: boolean;
    }): Promise<{ data: { object: { sha: string } } }>;
  };
  repos: {
    getContent(params: {
      owner: string;
      repo: string;
      path: string;
      ref: string;
    }): Promise<{ data: { content?: string; encoding?: string } }>;
    /**
     * Used by `publish()` to detect a squash/rebase-merged drafts branch
     * (see its `resetDraftsIfNoContentDiff` doc comment): `data.files` is
     * GitHub's list of files that actually differ between `base` and
     * `head`, independent of commit-history divergence.
     */
    compareCommits(params: {
      owner: string;
      repo: string;
      base: string;
      head: string;
    }): Promise<{ data: { files?: Array<{ filename: string }> } }>;
  };
  pulls: {
    list(params: {
      owner: string;
      repo: string;
      state: "open";
      head: string;
      base: string;
    }): Promise<{ data: Array<{ number: number; html_url: string }> }>;
    create(params: {
      owner: string;
      repo: string;
      title: string;
      head: string;
      base: string;
      body: string;
    }): Promise<{ data: { number: number; html_url: string } }>;
  };
}

/**
 * A single entry in a `git.createTree` call. Either `content` (new/updated
 * text blob, created inline by the Trees API) or `sha` (a pre-created blob
 * — used for binary content — or `null` to delete the path) must be set.
 */
interface DraftTreeItem {
  path: string;
  mode: "100644";
  type: "blob";
  content?: string;
  sha?: string | null;
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
 * Octokit. G1 landed the read paths (`currentUser`, `listPages`,
 * `readPage`); G2 added the drafts-branch mutations (`saveDraft`,
 * `saveImage`, `deletePage`); G3 added `publish` (open/reuse the drafts ->
 * base PR).
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
    if (tree.data.truncated) {
      // GitHub caps recursive tree responses; a truncated response would
      // silently drop pages from `listPages`/`deletePage` rather than
      // erroring, which is worse than failing loudly — the repo has grown
      // past what a single recursive call can return.
      throw new Error(
        "Repository tree too large — listing would be incomplete",
      );
    }
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

  /**
   * Commits `tree` (a diff, not a full tree — entries merge onto the
   * drafts branch's current tree via `base_tree`) as a single atomic
   * commit on the drafts branch, creating that branch off the base
   * branch's head first if it doesn't exist yet.
   *
   * Single-writer assumption (one QA editing at a time): no retry-on-
   * conflict loop. If `updateRef` fails (e.g. drafts moved concurrently),
   * the error just propagates to the caller.
   */
  private async commitToDrafts(
    tree: DraftTreeItem[],
    message: string,
  ): Promise<void> {
    let draftsHeadSha: string;
    try {
      const ref = await this.octokit.git.getRef({
        owner: this.owner,
        repo: this.repo,
        ref: `heads/${this.draftsBranch}`,
      });
      draftsHeadSha = ref.data.object.sha;
    } catch (err) {
      if (!isNotFound(err)) throw err;
      const baseRef = await this.octokit.git.getRef({
        owner: this.owner,
        repo: this.repo,
        ref: `heads/${this.baseBranch}`,
      });
      const baseHeadSha = baseRef.data.object.sha;
      await this.octokit.git.createRef({
        owner: this.owner,
        repo: this.repo,
        ref: `refs/heads/${this.draftsBranch}`,
        sha: baseHeadSha,
      });
      draftsHeadSha = baseHeadSha;
    }

    const headCommit = await this.octokit.git.getCommit({
      owner: this.owner,
      repo: this.repo,
      commit_sha: draftsHeadSha,
    });

    const newTree = await this.octokit.git.createTree({
      owner: this.owner,
      repo: this.repo,
      base_tree: headCommit.data.tree.sha,
      tree,
    });

    const newCommit = await this.octokit.git.createCommit({
      owner: this.owner,
      repo: this.repo,
      message,
      tree: newTree.data.sha,
      parents: [draftsHeadSha],
    });

    await this.octokit.git.updateRef({
      owner: this.owner,
      repo: this.repo,
      ref: `heads/${this.draftsBranch}`,
      sha: newCommit.data.sha,
      force: false,
    });
  }

  async saveDraft(changes: FileChange[], message: string): Promise<void> {
    const tree: DraftTreeItem[] = changes.map((c) => ({
      path: c.path,
      mode: "100644",
      type: "blob",
      content: c.content,
    }));
    await this.commitToDrafts(tree, message);
  }

  async saveImage(
    pageSlug: string,
    filename: string,
    bytes: Uint8Array,
  ): Promise<string> {
    const path = `src/assets/img/manual/${pageSlug}/${filename}`;
    const blob = await this.octokit.git.createBlob({
      owner: this.owner,
      repo: this.repo,
      content: Buffer.from(bytes).toString("base64"),
      encoding: "base64",
    });
    const tree: DraftTreeItem[] = [
      { path, mode: "100644", type: "blob", sha: blob.data.sha },
    ];
    await this.commitToDrafts(tree, `docs: add image ${filename}`);
    return path;
  }

  /**
   * Opens (or, if one's already open, reuses) the PR from the drafts
   * branch onto base. `pulls.list`'s `head` filter must be `"owner:branch"`
   * (GitHub's cross-repo-safe format — required even for a same-repo
   * branch); `pulls.create`'s `head`, by contrast, is just the bare branch
   * name.
   *
   * Before creating a new PR, `resetDraftsIfNoContentDiff` guards against
   * drafts-branch staleness left behind by a squash or rebase merge of a
   * *previous* publish PR (see its doc comment) — a merge commit would
   * self-heal this (drafts stays an ancestor-plus-more of base), but squash
   * and rebase merges leave base and drafts with identical content on
   * permanently divergent history, which would otherwise make every
   * subsequent publish open a redundant zero-change PR forever.
   *
   * A `pulls.create` 422 is GitHub's signal that there's nothing to diff —
   * the drafts branch doesn't exist yet (never saved a draft), since the
   * content-diff case is now caught earlier by
   * `resetDraftsIfNoContentDiff`. Both still collapse to the same "nothing
   * to publish" outcome for the caller.
   */
  async publish(): Promise<PublishResult> {
    const { data: openPulls } = await this.octokit.pulls.list({
      owner: this.owner,
      repo: this.repo,
      state: "open",
      head: `${this.owner}:${this.draftsBranch}`,
      base: this.baseBranch,
    });
    const existing = openPulls[0];
    if (existing) {
      return { prUrl: existing.html_url, prNumber: existing.number };
    }

    if (await this.branchExists(this.draftsBranch)) {
      await this.resetDraftsIfNoContentDiff();
    }

    try {
      const { data: created } = await this.octokit.pulls.create({
        owner: this.owner,
        repo: this.repo,
        title: "Manual: content updates from the editor",
        head: this.draftsBranch,
        base: this.baseBranch,
        body: "Opened automatically by the Audacity manual editor.",
      });
      return { prUrl: created.html_url, prNumber: created.number };
    } catch (err) {
      const status = (err as { status?: number } | undefined)?.status;
      // Only GitHub's specific "No commits between base and head" 422 means
      // "nothing to publish". Other 422s (validation, duplicate-PR edge
      // cases) are real errors and must not be masked as an empty draft.
      const message = err instanceof Error ? err.message : String(err);
      if (status === 422 && /no commits between/i.test(message)) {
        throw new Error("Nothing to publish — no draft changes");
      }
      throw err;
    }
  }

  /**
   * Guards `publish()` against drafts-branch staleness left behind by a
   * squash or rebase merge of a previous publish PR. Nothing resets
   * `manual/editor-drafts` after a PR merges: a merge commit self-heals
   * (drafts' history remains an ancestor-plus-more of base, so the next
   * `pulls.create` naturally 422s "no commits between" once there really is
   * nothing new), but a squash or rebase merge rewrites the commits that
   * land on base, so drafts and base end up with identical *content* on
   * permanently divergent *history* — `pulls.create` would see a nonempty
   * (if content-free) diff and open a redundant zero-change PR, and the
   * drafts branch would keep accumulating stale, already-shipped commits
   * forever.
   *
   * `compareCommits` reports the actual changed files between `base` and
   * `head`, independent of commit-history divergence, so it correctly
   * reports "no diff" in the squash/rebase case where raw history
   * comparison would not. When there is truly no content diff, force-reset
   * drafts to base's head (discarding the stale commits) and throw the same
   * "nothing to publish" error `pulls.create`'s 422 produces for the
   * "brand-new drafts branch" case, so callers can't tell the two apart.
   */
  private async resetDraftsIfNoContentDiff(): Promise<void> {
    const { data } = await this.octokit.repos.compareCommits({
      owner: this.owner,
      repo: this.repo,
      base: this.baseBranch,
      head: this.draftsBranch,
    });
    if ((data.files?.length ?? 0) > 0) return;

    const baseRef = await this.octokit.git.getRef({
      owner: this.owner,
      repo: this.repo,
      ref: `heads/${this.baseBranch}`,
    });
    await this.octokit.git.updateRef({
      owner: this.owner,
      repo: this.repo,
      ref: `heads/${this.draftsBranch}`,
      sha: baseRef.data.object.sha,
      force: true,
    });
    throw new Error("Nothing to publish — no draft changes");
  }

  /**
   * Mirrors `InMemoryBackend.deletePage`'s existence semantics: "present in
   * base OR present in drafts" — independent OR, not
   * "drafts-tree-if-it-exists-else-base" — so that re-deleting a base page
   * that's already staged for deletion (present in base, absent from the
   * drafts tree — the same state `listPages` treats as a staged deletion
   * and excludes from the listing) is a harmless no-op rather than a
   * throw, exactly like `InMemoryBackend` (which checks `this.base.has`
   * unconditionally, regardless of whether it's already in `this.deleted`).
   * Only "absent from both" throws.
   *
   * Existence alone isn't enough to decide whether to *commit*, though.
   * `commitToDrafts` submits `{ path, sha: null }` in a tree diffed onto
   * `base_tree` (the drafts branch's current tree, or — when there's no
   * drafts branch yet — base's tree, since `commitToDrafts` creates the
   * drafts branch off base's head first). GitHub's `createTree` returns a
   * 422 if a `sha: null` entry targets a path that's absent from
   * `base_tree` ("Returns an error if you try to delete a file that does
   * not exist"). So the idempotent double-delete case above (in base, but
   * already removed from drafts by a prior delete) would 422 instead of
   * no-opping if we always submitted the entry. Guard against that by
   * checking presence against the tree that will actually become
   * `base_tree` and skipping the commit entirely when it's already gone.
   */
  async deletePage(path: string): Promise<void> {
    const baseTree = await this.getManualTree(this.baseBranch);
    const draftsTree = await this.getManualTree(this.draftsBranch);

    const inBase = baseTree?.has(path) ?? false;
    const inDrafts = draftsTree?.has(path) ?? false;
    if (!inBase && !inDrafts) {
      throw new Error(`No such page: ${path}`);
    }

    const effectiveBaseTree = draftsTree ?? baseTree;
    if (!effectiveBaseTree?.has(path)) {
      // Already absent from what `commitToDrafts` would use as base_tree —
      // a true no-op, not a commit that deletes nothing. See doc comment.
      return;
    }

    const tree: DraftTreeItem[] = [
      { path, mode: "100644", type: "blob", sha: null },
    ];
    await this.commitToDrafts(tree, `docs: delete ${path}`);
  }
}
