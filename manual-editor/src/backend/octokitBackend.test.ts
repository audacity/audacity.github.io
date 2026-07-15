import { expect, test } from "bun:test";
import { OctokitBackend, type MinimalOctokit } from "./octokitBackend";

/**
 * Fake Octokit test double. Models the real GitHub API shape closely enough
 * to exercise the backend: branches are `path -> source` maps; a missing
 * branch key means "this ref doesn't exist" (404, matching real Octokit
 * error shape: `err.status === 404`).
 */
interface FakeOpenPull {
  number: number;
  html_url: string;
  head: string;
  base: string;
}

interface FakeRepoState {
  login: string;
  branches: Record<string, Record<string, string> | undefined>;
  /** Open PRs already on the fake repo, for the "existing PR" publish path. */
  openPulls?: FakeOpenPull[];
  /**
   * When true, `pulls.create` throws the real API's 422 "No commits
   * between" error instead of creating a PR — models "drafts branch
   * doesn't exist" (the only case that still reaches `pulls.create` without
   * a diff, now that `resetDraftsIfNoContentDiff` intercepts the
   * branch-exists-but-no-diff case earlier).
   */
  noCommitsToPublish?: boolean;
  /**
   * Controls `compareCommits`' fake `data.files` response, consulted by
   * `publish()`'s pre-create `resetDraftsIfNoContentDiff` guard whenever the
   * drafts branch exists. `undefined`/`true` models a real content diff
   * (`data.files` nonempty); `false` models a squash/rebase-merged drafts
   * branch that's byte-identical to base despite divergent history
   * (`data.files` empty) — the case that should trigger the branch reset.
   */
  draftsHaveContentDiff?: boolean;
}

/** Records of write-side calls, in order, for assertion on call sequence. */
type CallLog = Array<{ op: string; args: unknown }>;

function notFound(): Error & { status: number } {
  const err = new Error("Not Found") as Error & { status: number };
  err.status = 404;
  return err;
}

/**
 * Mimics GitHub's real `createTree` 422: "Returns an error if you try to
 * delete a file that does not exist." Thrown by the write fake below when a
 * `sha: null` tree entry targets a path absent from the merged base_tree.
 */
function unprocessable(): Error & { status: number } {
  const err = new Error(
    "GitHub422: Returns an error if you try to delete a file that does not exist.",
  ) as Error & { status: number };
  err.status = 422;
  return err;
}

/** Mirrors the real API's `pulls.create` 422 when there's nothing to diff. */
function noCommitsBetween(
  base: string,
  head: string,
): Error & { status: number } {
  const err = new Error(
    `Validation Failed: No commits between ${base} and ${head}`,
  ) as Error & { status: number };
  err.status = 422;
  return err;
}

/** Deterministic content-derived "sha" so equal content -> equal sha. */
function fakeSha(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    hash = (hash * 31 + content.charCodeAt(i)) | 0;
  }
  return `sha_${hash}`;
}

function b64(content: string): string {
  return Buffer.from(content, "utf8").toString("base64");
}

function makeFakeOctokit(state: FakeRepoState): {
  octokit: MinimalOctokit;
  calls: { getTree: number; getBlob: number; getContent: number };
} {
  const calls = { getTree: 0, getBlob: 0, getContent: 0 };

  function filesFor(branch: string): Record<string, string> | undefined {
    return state.branches[branch];
  }

  const octokit: MinimalOctokit = {
    users: {
      async getAuthenticated() {
        return { data: { login: state.login } };
      },
    },
    git: {
      async getRef({ ref }) {
        const branch = ref.replace(/^heads\//, "");
        if (filesFor(branch) === undefined) throw notFound();
        return { data: { object: { sha: `commit-${branch}` } } };
      },
      async getCommit({ commit_sha }) {
        const branch = commit_sha.replace(/^commit-/, "");
        return { data: { tree: { sha: `tree-${branch}` } } };
      },
      async getTree({ tree_sha }) {
        calls.getTree++;
        const branch = tree_sha.replace(/^tree-/, "");
        const files = filesFor(branch) ?? {};
        const entries = Object.entries(files).map(([path, content]) => ({
          path,
          type: "blob" as const,
          sha: fakeSha(content),
        }));
        // Non-matching entries the filter regex must reject.
        entries.push({
          path: "src/content/manual/images",
          type: "tree",
          sha: "dir-sha",
        } as any);
        entries.push({ path: "README.md", type: "blob", sha: "readme-sha" });
        entries.push({
          path: "src/content/manual/basics/photo.png",
          type: "blob",
          sha: "photo-sha",
        });
        return { data: { tree: entries } };
      },
      async getBlob({ file_sha }) {
        calls.getBlob++;
        for (const files of Object.values(state.branches)) {
          if (!files) continue;
          for (const content of Object.values(files)) {
            if (fakeSha(content) === file_sha) {
              return { data: { content: b64(content), encoding: "base64" } };
            }
          }
        }
        throw notFound();
      },
      // Write methods aren't exercised by the read-path tests using this
      // fake — see `makeWriteFakeOctokit` below for the write-path fake.
      async createBlob() {
        throw new Error("createBlob not supported by read-only fake");
      },
      async createTree() {
        throw new Error("createTree not supported by read-only fake");
      },
      async createCommit() {
        throw new Error("createCommit not supported by read-only fake");
      },
      async createRef() {
        throw new Error("createRef not supported by read-only fake");
      },
      async updateRef() {
        throw new Error("updateRef not supported by read-only fake");
      },
    },
    repos: {
      async getContent({ path, ref }) {
        calls.getContent++;
        const files = filesFor(ref);
        if (files === undefined) throw notFound();
        const content = files[path];
        if (content === undefined) throw notFound();
        return { data: { content: b64(content), encoding: "base64" } };
      },
      async compareCommits() {
        throw new Error("compareCommits not supported by read-only fake");
      },
    },
    pulls: {
      async list() {
        throw new Error("pulls.list not supported by read-only fake");
      },
      async create() {
        throw new Error("pulls.create not supported by read-only fake");
      },
    },
  };

  return { octokit, calls };
}

const OWNER = "audacity";
const REPO = "audacity.github.io";
const BASE = "release/audacity-4";
const DRAFTS = "manual/editor-drafts";

function backendFor(state: FakeRepoState) {
  const { octokit, calls } = makeFakeOctokit(state);
  const backend = new OctokitBackend("fake-token", {
    owner: OWNER,
    repo: REPO,
    baseBranch: BASE,
    draftsBranch: DRAFTS,
    octokit,
  });
  return { backend, calls };
}

/**
 * Fake Octokit for the write (Git Data API) paths: `createBlob`,
 * `createTree`, `createCommit`, `createRef`, `updateRef`, plus the G1 read
 * methods (reused by `commitToDrafts`/existence checks). Unlike the
 * read-only fake above, this one actually threads state through — branch
 * heads move, commits/trees/blobs are stored keyed by generated shas — so
 * multi-call sequences (e.g. "create drafts branch, then commit to it")
 * behave like the real API and every call's args can be asserted for real.
 */
function makeWriteFakeOctokit(state: FakeRepoState): {
  octokit: MinimalOctokit;
  calls: CallLog;
} {
  const calls: CallLog = [];
  const heads: Record<string, string> = {};
  const commits: Record<string, { tree: string }> = {};
  const trees: Record<string, Array<{ path: string; sha: string | null }>> = {};
  const blobs: Record<string, string> = {}; // sha -> base64 content
  let counter = 0;

  function seedBranch(branch: string): void {
    const files = state.branches[branch];
    if (files === undefined) return;
    const treeSha = `tree-${branch}-seed`;
    trees[treeSha] = Object.entries(files).map(([path, content]) => {
      const sha = fakeSha(content);
      blobs[sha] = b64(content);
      return { path, sha };
    });
    const commitSha = `commit-${branch}-seed`;
    commits[commitSha] = { tree: treeSha };
    heads[branch] = commitSha;
  }
  for (const branch of Object.keys(state.branches)) seedBranch(branch);

  const octokit: MinimalOctokit = {
    users: {
      async getAuthenticated() {
        return { data: { login: state.login } };
      },
    },
    git: {
      async getRef({ ref }) {
        calls.push({ op: "getRef", args: { ref } });
        const branch = ref.replace(/^heads\//, "");
        const sha = heads[branch];
        if (sha === undefined) throw notFound();
        return { data: { object: { sha } } };
      },
      async getCommit({ commit_sha }) {
        calls.push({ op: "getCommit", args: { commit_sha } });
        const commit = commits[commit_sha];
        if (!commit) throw notFound();
        return { data: { tree: { sha: commit.tree } } };
      },
      async getTree({ tree_sha }) {
        calls.push({ op: "getTree", args: { tree_sha } });
        const entries = trees[tree_sha] ?? [];
        return {
          data: {
            tree: entries.map((e) => ({
              path: e.path,
              type: "blob" as const,
              sha: e.sha ?? undefined,
            })),
          },
        };
      },
      async getBlob({ file_sha }) {
        calls.push({ op: "getBlob", args: { file_sha } });
        const content = blobs[file_sha];
        if (content === undefined) throw notFound();
        return { data: { content, encoding: "base64" } };
      },
      async createBlob({ content, encoding }) {
        calls.push({ op: "createBlob", args: { content, encoding } });
        const sha = `blob-gen-${counter++}`;
        blobs[sha] = content;
        return { data: { sha } };
      },
      async createTree({ base_tree, tree }) {
        calls.push({ op: "createTree", args: { base_tree, tree } });
        const baseEntries = base_tree ? (trees[base_tree] ?? []) : [];
        const merged = new Map<string, string | null>(
          baseEntries.map((e) => [e.path, e.sha]),
        );
        for (const item of tree) {
          if (item.sha === null) {
            // Real GitHub 422s deleting a path that isn't in base_tree —
            // mirror that so an unconditional (unguarded) delete would be
            // caught by tests instead of silently "succeeding".
            if (!merged.has(item.path)) {
              throw unprocessable();
            }
            merged.delete(item.path);
          } else if (item.sha !== undefined) {
            merged.set(item.path, item.sha);
          } else if (item.content !== undefined) {
            const sha = `blob-inline-${counter++}`;
            blobs[sha] = b64(item.content);
            merged.set(item.path, sha);
          }
        }
        const treeSha = `tree-gen-${counter++}`;
        trees[treeSha] = [...merged.entries()].map(([path, sha]) => ({
          path,
          sha,
        }));
        return { data: { sha: treeSha } };
      },
      async createCommit({ message, tree, parents }) {
        calls.push({ op: "createCommit", args: { message, tree, parents } });
        const sha = `commit-gen-${counter++}`;
        commits[sha] = { tree };
        return { data: { sha } };
      },
      async createRef({ ref, sha }) {
        calls.push({ op: "createRef", args: { ref, sha } });
        const branch = ref.replace(/^refs\/heads\//, "");
        heads[branch] = sha;
        return { data: { object: { sha } } };
      },
      async updateRef({ ref, sha, force }) {
        calls.push({ op: "updateRef", args: { ref, sha, force } });
        const branch = ref.replace(/^heads\//, "");
        heads[branch] = sha;
        return { data: { object: { sha } } };
      },
    },
    repos: {
      async getContent({ path, ref }) {
        calls.push({ op: "getContent", args: { path, ref } });
        const head = heads[ref];
        if (head === undefined) throw notFound();
        const commit = commits[head];
        const entries = commit ? (trees[commit.tree] ?? []) : [];
        const entry = entries.find((e) => e.path === path && e.sha !== null);
        if (!entry) throw notFound();
        const content = blobs[entry.sha!];
        if (content === undefined) throw notFound();
        return { data: { content, encoding: "base64" } };
      },
      async compareCommits({ base, head }) {
        calls.push({ op: "compareCommits", args: { base, head } });
        const hasDiff = state.draftsHaveContentDiff ?? true;
        return { data: { files: hasDiff ? [{ filename: "x" }] : [] } };
      },
    },
    pulls: {
      async list({ head, base, state: prState }) {
        calls.push({ op: "pulls.list", args: { head, base, state: prState } });
        const open = state.openPulls ?? [];
        return {
          data: open
            .filter((p) => p.head === head && p.base === base)
            .map((p) => ({ number: p.number, html_url: p.html_url })),
        };
      },
      async create({ title, head, base, body }) {
        calls.push({ op: "pulls.create", args: { title, head, base, body } });
        if (state.noCommitsToPublish) throw noCommitsBetween(base, head);
        const number = (state.openPulls?.length ?? 0) + 100;
        const html_url = `https://github.com/${OWNER}/${REPO}/pull/${number}`;
        return { data: { number, html_url } };
      },
    },
  };

  return { octokit, calls };
}

function writeBackendFor(state: FakeRepoState) {
  const { octokit, calls } = makeWriteFakeOctokit(state);
  const backend = new OctokitBackend("fake-token", {
    owner: OWNER,
    repo: REPO,
    baseBranch: BASE,
    draftsBranch: DRAFTS,
    octokit,
  });
  return { backend, calls };
}

function fm(title: string, section: string, order?: number): string {
  return `---\ntitle: ${title}\nsection: ${section}${
    order !== undefined ? `\norder: ${order}` : ""
  }\n---\n\nBody for ${title}\n`;
}

test("currentUser maps login and reports github mode", async () => {
  const { backend } = backendFor({
    login: "octo-cat",
    branches: { [BASE]: {} },
  });
  const user = await backend.currentUser();
  expect(user).toEqual({ login: "octo-cat", mode: "github" });
});

test("listPages: throws a clear error when GitHub reports the tree as truncated, instead of silently missing pages (Fix 4)", async () => {
  // Minimal inline fake: a recursive tree response with `truncated: true` —
  // GitHub's signal that the repo has grown past what a single recursive
  // call can return, so the tree entries actually present are an unknown
  // (and silently incomplete) subset.
  const fake = {
    git: {
      getRef: async () => ({ data: { object: { sha: "commit-1" } } }),
      getCommit: async () => ({ data: { tree: { sha: "tree-1" } } }),
      getTree: async () => ({
        data: {
          tree: [
            {
              path: "src/content/manual/basics/a.mdx",
              type: "blob" as const,
              sha: "sha-a",
            },
          ],
          truncated: true,
        },
      }),
    },
  };
  const backend = new OctokitBackend("tok", {
    octokit: fake as unknown as ConstructorParameters<
      typeof OctokitBackend
    >[1] extends { octokit?: infer O }
      ? O
      : never,
  });
  await expect(backend.listPages()).rejects.toThrow(
    "Repository tree too large — listing would be incomplete",
  );
});

test("listPages: base-only (no drafts branch) lists base pages with hasDraft false", async () => {
  const { backend } = backendFor({
    login: "u",
    branches: {
      [BASE]: {
        "src/content/manual/basics/a.mdx": fm("A", "Basics", 1),
        "src/content/manual/basics/b.mdx": fm("B", "Basics", 2),
      },
      // no [DRAFTS] key -> branch doesn't exist
    },
  });
  const pages = await backend.listPages();
  expect(pages.length).toBe(2);
  expect(pages.every((p) => p.hasDraft === false)).toBe(true);
  const a = pages.find((p) => p.slug === "basics/a");
  expect(a).toBeDefined();
  expect(a!.title).toBe("A");
  expect(a!.section).toBe("Basics");
});

test("listPages filters out non-manual and non-md/mdx tree entries", async () => {
  const { backend } = backendFor({
    login: "u",
    branches: {
      [BASE]: {
        "src/content/manual/basics/a.mdx": fm("A", "Basics", 1),
      },
    },
  });
  const pages = await backend.listPages();
  expect(pages.map((p) => p.path)).toEqual(["src/content/manual/basics/a.mdx"]);
});

test("listPages: drafts branch — edited file has differing sha, hasDraft true, draft content used", async () => {
  const { backend } = backendFor({
    login: "u",
    branches: {
      [BASE]: {
        "src/content/manual/basics/a.mdx": fm("A", "Basics", 1),
      },
      [DRAFTS]: {
        "src/content/manual/basics/a.mdx": fm("A Edited", "Basics", 1),
      },
    },
  });
  const pages = await backend.listPages();
  expect(pages.length).toBe(1);
  expect(pages[0]!.hasDraft).toBe(true);
  expect(pages[0]!.title).toBe("A Edited");
});

test("listPages: drafts branch — new draft-only file is listed with hasDraft true", async () => {
  const { backend } = backendFor({
    login: "u",
    branches: {
      [BASE]: {
        "src/content/manual/basics/a.mdx": fm("A", "Basics", 1),
      },
      [DRAFTS]: {
        "src/content/manual/basics/a.mdx": fm("A", "Basics", 1), // unedited, same content
        "src/content/manual/basics/new.mdx": fm("New Page", "Basics", 2),
      },
    },
  });
  const pages = await backend.listPages();
  expect(pages.length).toBe(2);
  const a = pages.find((p) => p.slug === "basics/a")!;
  expect(a.hasDraft).toBe(false); // identical content on drafts -> not "changed"
  const created = pages.find((p) => p.slug === "basics/new")!;
  expect(created.hasDraft).toBe(true);
  expect(created.title).toBe("New Page");
});

test("listPages: file deleted on drafts (present in base, absent from drafts tree) is excluded", async () => {
  const { backend } = backendFor({
    login: "u",
    branches: {
      [BASE]: {
        "src/content/manual/basics/a.mdx": fm("A", "Basics", 1),
        "src/content/manual/basics/gone.mdx": fm("Gone", "Basics", 2),
      },
      [DRAFTS]: {
        "src/content/manual/basics/a.mdx": fm("A", "Basics", 1),
        // "gone.mdx" deliberately absent -> staged deletion
      },
    },
  });
  const pages = await backend.listPages();
  expect(pages.map((p) => p.slug)).toEqual(["basics/a"]);
});

test("listPages sorts by sectionOrder, section, order, then slug", async () => {
  const { backend } = backendFor({
    login: "u",
    branches: {
      [BASE]: {
        "src/content/manual/z/z.mdx":
          "---\ntitle: Z\nsection: Zeta\nsectionOrder: 1\norder: 1\n---\n\nZ\n",
        "src/content/manual/a/a.mdx":
          "---\ntitle: A\nsection: Alpha\nsectionOrder: 0\norder: 2\n---\n\nA\n",
        "src/content/manual/a/b.mdx":
          "---\ntitle: B\nsection: Alpha\nsectionOrder: 0\norder: 1\n---\n\nB\n",
      },
    },
  });
  const pages = await backend.listPages();
  expect(pages.map((p) => p.slug)).toEqual(["a/b", "a/a", "z/z"]);
});

test("listPages batches blob fetches over more than one concurrency chunk", async () => {
  const branch: Record<string, string> = {};
  for (let i = 0; i < 25; i++) {
    branch[`src/content/manual/basics/page-${i}.mdx`] = fm(
      `Page ${i}`,
      "Basics",
      i,
    );
  }
  const { backend } = backendFor({ login: "u", branches: { [BASE]: branch } });
  const pages = await backend.listPages();
  expect(pages.length).toBe(25);
  expect(new Set(pages.map((p) => p.slug)).size).toBe(25);
});

test("readPage: prefers the drafts version when the page differs there", async () => {
  const { backend } = backendFor({
    login: "u",
    branches: {
      [BASE]: {
        "src/content/manual/basics/a.mdx": fm("A", "Basics", 1),
      },
      [DRAFTS]: {
        "src/content/manual/basics/a.mdx": fm("A Edited", "Basics", 1),
      },
    },
  });
  const page = await backend.readPage("src/content/manual/basics/a.mdx");
  expect(page.source).toContain("A Edited");
});

test("readPage: falls back to base when there is no drafts branch", async () => {
  const { backend } = backendFor({
    login: "u",
    branches: {
      [BASE]: {
        "src/content/manual/basics/a.mdx": fm("A", "Basics", 1),
      },
    },
  });
  const page = await backend.readPage("src/content/manual/basics/a.mdx");
  expect(page.source).toContain("title: A\n");
});

test("readPage: throws when the page was deleted on drafts", async () => {
  const { backend } = backendFor({
    login: "u",
    branches: {
      [BASE]: {
        "src/content/manual/basics/gone.mdx": fm("Gone", "Basics", 1),
      },
      [DRAFTS]: {},
    },
  });
  await expect(
    backend.readPage("src/content/manual/basics/gone.mdx"),
  ).rejects.toThrow();
});

test("readPage: throws when the page is missing everywhere", async () => {
  const { backend } = backendFor({
    login: "u",
    branches: {
      [BASE]: {
        "src/content/manual/basics/a.mdx": fm("A", "Basics", 1),
      },
      [DRAFTS]: {},
    },
  });
  await expect(
    backend.readPage("src/content/manual/basics/nope.mdx"),
  ).rejects.toThrow();
});

test("readPage: throws when missing everywhere and there is no drafts branch", async () => {
  const { backend } = backendFor({
    login: "u",
    branches: {
      [BASE]: {
        "src/content/manual/basics/a.mdx": fm("A", "Basics", 1),
      },
    },
  });
  await expect(
    backend.readPage("src/content/manual/basics/nope.mdx"),
  ).rejects.toThrow();
});

test("publish: returns the existing open PR without creating a new one", async () => {
  const { backend, calls } = writeBackendFor({
    login: "u",
    branches: { [BASE]: {}, [DRAFTS]: {} },
    openPulls: [
      {
        number: 42,
        html_url: `https://github.com/${OWNER}/${REPO}/pull/42`,
        head: `${OWNER}:${DRAFTS}`,
        base: BASE,
      },
    ],
  });

  const result = await backend.publish();

  expect(result).toEqual({
    prUrl: `https://github.com/${OWNER}/${REPO}/pull/42`,
    prNumber: 42,
  });
  const listCall = calls.find((c) => c.op === "pulls.list")!;
  expect(listCall.args).toEqual({
    head: `${OWNER}:${DRAFTS}`,
    base: BASE,
    state: "open",
  });
  expect(calls.some((c) => c.op === "pulls.create")).toBe(false);
});

test("publish: creates a PR when none is open, with the right head/base/title", async () => {
  const { backend, calls } = writeBackendFor({
    login: "u",
    branches: { [BASE]: {}, [DRAFTS]: {} },
  });

  const result = await backend.publish();

  const createCall = calls.find((c) => c.op === "pulls.create")!;
  expect(createCall.args).toMatchObject({
    title: "Manual: content updates from the editor",
    head: DRAFTS,
    base: BASE,
  });
  expect((createCall.args as any).body).toEqual(expect.any(String));
  expect(result).toEqual({
    prUrl: `https://github.com/${OWNER}/${REPO}/pull/100`,
    prNumber: 100,
  });
});

test("publish: no draft changes to publish surfaces a clear error", async () => {
  const { backend, calls } = writeBackendFor({
    login: "u",
    branches: { [BASE]: {} },
    noCommitsToPublish: true,
  });

  await expect(backend.publish()).rejects.toThrow(
    "Nothing to publish — no draft changes",
  );
  expect(calls.some((c) => c.op === "pulls.create")).toBe(true);
});

// ---------------------------------------------------------------------------
// publish: drafts-branch staleness after a squash/rebase merge (Fix 2)
// ---------------------------------------------------------------------------
//
// A merge commit self-heals: drafts' history stays an ancestor-plus-more of
// base, so `pulls.create` naturally 422s "no commits between" once there's
// truly nothing new (covered above). A squash or rebase merge instead
// leaves base and drafts with identical *content* on permanently divergent
// *history* — `compareCommits` (unlike raw history comparison) still
// reports that correctly as "no diff", which is what `publish()` must act
// on before ever calling `pulls.create`.

test("publish: resets the drafts branch to base's head and reports nothing-to-publish when compareCommits shows no content diff (squash/rebase-merge staleness)", async () => {
  const PATH = "src/content/manual/basics/a.mdx";
  const { backend, calls } = writeBackendFor({
    login: "u",
    branches: {
      // Same content on both branches — models a squash/rebase merge that
      // already shipped these exact contents to base, leaving drafts
      // pointing at now-stale, already-merged commits.
      [BASE]: { [PATH]: fm("A", "Basics", 1) },
      [DRAFTS]: { [PATH]: fm("A", "Basics", 1) },
    },
    draftsHaveContentDiff: false,
  });

  await expect(backend.publish()).rejects.toThrow(
    "Nothing to publish — no draft changes",
  );

  const compareCall = calls.find((c) => c.op === "compareCommits")!;
  expect(compareCall.args).toEqual({ base: BASE, head: DRAFTS });

  const updateRefCall = calls.find((c) => c.op === "updateRef")!;
  expect(updateRefCall.args).toMatchObject({
    ref: `heads/${DRAFTS}`,
    sha: "commit-release/audacity-4-seed",
    force: true,
  });

  expect(calls.some((c) => c.op === "pulls.create")).toBe(false);
});

test("publish: proceeds to create a PR (no reset) when compareCommits shows a real content diff", async () => {
  const PATH = "src/content/manual/basics/a.mdx";
  const { backend, calls } = writeBackendFor({
    login: "u",
    branches: {
      [BASE]: { [PATH]: fm("A", "Basics", 1) },
      [DRAFTS]: { [PATH]: fm("A (edited)", "Basics", 1) },
    },
    draftsHaveContentDiff: true,
  });

  const result = await backend.publish();

  expect(calls.some((c) => c.op === "compareCommits")).toBe(true);
  expect(calls.some((c) => c.op === "updateRef")).toBe(false);
  expect(calls.some((c) => c.op === "pulls.create")).toBe(true);
  expect(result).toEqual({
    prUrl: `https://github.com/${OWNER}/${REPO}/pull/100`,
    prNumber: 100,
  });
});

test("saveDraft: missing drafts branch is created off base head, then committed — full call order", async () => {
  const PATH = "src/content/manual/basics/a.mdx";
  const { backend, calls } = writeBackendFor({
    login: "u",
    branches: {
      [BASE]: { [PATH]: fm("A", "Basics", 1) },
      // no [DRAFTS] key -> branch doesn't exist yet
    },
  });

  await backend.saveDraft(
    [{ path: PATH, content: "NEW CONTENT" }],
    "docs: edit a",
  );

  expect(calls.map((c) => c.op)).toEqual([
    "getRef", // heads/DRAFTS -> 404
    "getRef", // heads/BASE
    "createRef", // refs/heads/DRAFTS off base head
    "getCommit", // drafts head commit -> tree sha
    "createTree",
    "createCommit",
    "updateRef",
  ]);

  const createRefCall = calls.find((c) => c.op === "createRef")!;
  expect(createRefCall.args).toEqual({
    ref: `refs/heads/${DRAFTS}`,
    sha: `commit-${BASE}-seed`,
  });

  const createTreeCall = calls.find((c) => c.op === "createTree")!;
  expect((createTreeCall.args as any).base_tree).toBe(`tree-${BASE}-seed`);
  expect((createTreeCall.args as any).tree).toEqual([
    { path: PATH, mode: "100644", type: "blob", content: "NEW CONTENT" },
  ]);

  const createCommitCall = calls.find((c) => c.op === "createCommit")!;
  expect((createCommitCall.args as any).message).toBe("docs: edit a");
  expect((createCommitCall.args as any).parents).toEqual([
    `commit-${BASE}-seed`,
  ]);

  const updateRefCall = calls.find((c) => c.op === "updateRef")!;
  expect((updateRefCall.args as any).ref).toBe(`heads/${DRAFTS}`);
  expect((updateRefCall.args as any).force).toBe(false);
  // A freshly generated commit sha (the fake threads real state through:
  // it's whatever `createCommit` returned), and distinct from the old head.
  expect((updateRefCall.args as any).sha).toMatch(/^commit-gen-\d+$/);
  expect((updateRefCall.args as any).sha).not.toBe(`commit-${BASE}-seed`);
});

test("saveDraft: existing drafts branch — no createRef, correct parents from drafts head", async () => {
  const PATH = "src/content/manual/basics/a.mdx";
  const { backend, calls } = writeBackendFor({
    login: "u",
    branches: {
      [BASE]: { [PATH]: fm("A", "Basics", 1) },
      [DRAFTS]: { [PATH]: fm("A", "Basics", 1) },
    },
  });

  await backend.saveDraft(
    [{ path: PATH, content: "NEW CONTENT" }],
    "docs: edit a",
  );

  expect(calls.some((c) => c.op === "createRef")).toBe(false);
  expect(calls.map((c) => c.op)).toEqual([
    "getRef", // heads/DRAFTS -> found
    "getCommit",
    "createTree",
    "createCommit",
    "updateRef",
  ]);

  const createTreeCall = calls.find((c) => c.op === "createTree")!;
  expect((createTreeCall.args as any).base_tree).toBe(`tree-${DRAFTS}-seed`);

  const createCommitCall = calls.find((c) => c.op === "createCommit")!;
  expect((createCommitCall.args as any).parents).toEqual([
    `commit-${DRAFTS}-seed`,
  ]);
});

test("saveImage: createBlob(base64), tree item uses the returned sha, returns repo-relative path", async () => {
  const { backend, calls } = writeBackendFor({
    login: "u",
    branches: {
      [BASE]: {},
      [DRAFTS]: {},
    },
  });
  const bytes = new Uint8Array([1, 2, 3, 4]);

  const returnedPath = await backend.saveImage(
    "basics/a",
    "diagram.png",
    bytes,
  );

  expect(returnedPath).toBe("src/assets/img/manual/basics/a/diagram.png");

  const createBlobCall = calls.find((c) => c.op === "createBlob")!;
  // Hardcoded literal (not `Buffer.from(bytes).toString("base64")`) so a
  // shared encoding bug in both production code and this assertion can't
  // hide: bytes [1,2,3,4] must always base64-encode to "AQIDBA==".
  expect(createBlobCall.args).toEqual({
    content: "AQIDBA==",
    encoding: "base64",
  });

  const createTreeCall = calls.find((c) => c.op === "createTree")!;
  const treeItems = (createTreeCall.args as any).tree;
  expect(treeItems).toEqual([
    {
      path: "src/assets/img/manual/basics/a/diagram.png",
      mode: "100644",
      type: "blob",
      sha: "blob-gen-0",
    },
  ]);

  const createCommitCall = calls.find((c) => c.op === "createCommit")!;
  expect((createCommitCall.args as any).message).toBe(
    "docs: add image diagram.png",
  );
});

test("deletePage: page exists on drafts — commits a tree entry with sha: null", async () => {
  const PATH = "src/content/manual/basics/a.mdx";
  const { backend, calls } = writeBackendFor({
    login: "u",
    branches: {
      [BASE]: { [PATH]: fm("A", "Basics", 1) },
      [DRAFTS]: { [PATH]: fm("A", "Basics", 1) },
    },
  });

  await backend.deletePage(PATH);

  const createTreeCall = calls.find((c) => c.op === "createTree")!;
  expect((createTreeCall.args as any).tree).toEqual([
    { path: PATH, mode: "100644", type: "blob", sha: null },
  ]);

  const createCommitCall = calls.find((c) => c.op === "createCommit")!;
  expect((createCommitCall.args as any).message).toBe(`docs: delete ${PATH}`);
});

test("deletePage: draft-only page (never in base) — deletes from drafts, no throw", async () => {
  const PATH = "src/content/manual/basics/new.mdx";
  const { backend, calls } = writeBackendFor({
    login: "u",
    branches: {
      [BASE]: {},
      [DRAFTS]: { [PATH]: fm("New", "Basics", 1) },
    },
  });

  await backend.deletePage(PATH);

  const createTreeCall = calls.find((c) => c.op === "createTree")!;
  expect((createTreeCall.args as any).tree).toEqual([
    { path: PATH, mode: "100644", type: "blob", sha: null },
  ]);
});

test("deletePage: already staged-deleted on drafts but still present on base — true no-op, zero write calls", async () => {
  const PATH = "src/content/manual/basics/gone.mdx";
  const { backend, calls } = writeBackendFor({
    login: "u",
    branches: {
      [BASE]: { [PATH]: fm("Gone", "Basics", 1) },
      [DRAFTS]: {}, // already removed from drafts
    },
  });

  await expect(backend.deletePage(PATH)).resolves.toBeUndefined();

  // The drafts tree (what would become base_tree) is already missing the
  // path, so submitting `sha: null` for it would 422 against the real API
  // (and does throw against the hardened fake — see `unprocessable()`
  // above). The fix must recognize this and skip the commit entirely: no
  // createTree/createCommit/updateRef/createRef calls at all.
  expect(
    calls.some((c) =>
      ["createTree", "createCommit", "updateRef", "createRef"].includes(c.op),
    ),
  ).toBe(false);
});

test("deletePage: path missing everywhere — throws without committing", async () => {
  const { backend, calls } = writeBackendFor({
    login: "u",
    branches: {
      [BASE]: { "src/content/manual/basics/a.mdx": fm("A", "Basics", 1) },
      [DRAFTS]: { "src/content/manual/basics/a.mdx": fm("A", "Basics", 1) },
    },
  });

  await expect(
    backend.deletePage("src/content/manual/basics/nope.mdx"),
  ).rejects.toThrow();

  expect(
    calls.some((c) =>
      ["createTree", "createCommit", "updateRef", "createRef"].includes(c.op),
    ),
  ).toBe(false);
});

test("publish: a non-'no commits' 422 from pulls.create is rethrown, not masked as nothing-to-publish", async () => {
  // Minimal inline fake: no open PR, no drafts branch (so
  // `resetDraftsIfNoContentDiff` is skipped and `publish()` falls straight
  // through to `pulls.create`), which fails with a 422 that is NOT GitHub's
  // "No commits between" — must propagate unchanged.
  const fake = {
    git: {
      getRef: async () => {
        throw notFound();
      },
    },
    pulls: {
      list: async () => ({ data: [] }),
      create: async () => {
        const err = new Error(
          "Validation Failed: some other field problem",
        ) as Error & { status: number };
        err.status = 422;
        throw err;
      },
    },
  };
  const backend = new OctokitBackend("tok", {
    octokit: fake as unknown as ConstructorParameters<
      typeof OctokitBackend
    >[1] extends { octokit?: infer O }
      ? O
      : never,
  });
  await expect(backend.publish()).rejects.toThrow(
    "Validation Failed: some other field problem",
  );
});
