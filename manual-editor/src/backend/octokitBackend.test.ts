import { expect, test } from "bun:test";
import { OctokitBackend, type MinimalOctokit } from "./octokitBackend";

/**
 * Fake Octokit test double. Models the real GitHub API shape closely enough
 * to exercise the backend: branches are `path -> source` maps; a missing
 * branch key means "this ref doesn't exist" (404, matching real Octokit
 * error shape: `err.status === 404`).
 */
interface FakeRepoState {
  login: string;
  branches: Record<string, Record<string, string> | undefined>;
}

function notFound(): Error & { status: number } {
  const err = new Error("Not Found") as Error & { status: number };
  err.status = 404;
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

test("stubbed mutating methods throw a clear not-implemented error", async () => {
  const { backend } = backendFor({ login: "u", branches: { [BASE]: {} } });
  await expect(backend.saveDraft([], "m")).rejects.toThrow(
    "not implemented until G2/G3",
  );
  await expect(
    backend.saveImage("slug", "f.png", new Uint8Array()),
  ).rejects.toThrow("not implemented until G2/G3");
  await expect(backend.publish()).rejects.toThrow(
    "not implemented until G2/G3",
  );
  await expect(backend.deletePage("x")).rejects.toThrow(
    "not implemented until G2/G3",
  );
});
