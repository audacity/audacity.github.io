import { expect, test } from "bun:test";
import { InMemoryBackend, loadCorpusSeed } from "./inMemoryBackend";

test("lists the real corpus pages with parsed frontmatter", async () => {
  const backend = new InMemoryBackend(loadCorpusSeed());
  const pages = await backend.listPages();
  expect(pages.length).toBeGreaterThan(200);
  const ffmpeg = pages.find((p) => p.slug === "basics/installing-ffmpeg");
  expect(ffmpeg).toBeDefined();
  expect(ffmpeg!.title.length).toBeGreaterThan(0);
  expect(ffmpeg!.section.length).toBeGreaterThan(0);
  expect(ffmpeg!.hasDraft).toBe(false);
});

test("saveDraft then readPage returns the draft and flips hasDraft", async () => {
  const seed = [
    {
      path: "src/content/manual/x/y.mdx",
      source: "---\ntitle: T\nsection: S\n---\n\nBody\n",
    },
  ];
  const backend = new InMemoryBackend(seed);
  await backend.saveDraft(
    [
      {
        path: "src/content/manual/x/y.mdx",
        content: "---\ntitle: T\nsection: S\n---\n\nEdited\n",
      },
    ],
    "edit",
  );
  const read = await backend.readPage("src/content/manual/x/y.mdx");
  expect(read.source).toContain("Edited");
  const pages = await backend.listPages();
  expect(pages.find((p) => p.slug === "x/y")!.hasDraft).toBe(true);
});

test("publish clears drafts", async () => {
  const seed = [
    {
      path: "src/content/manual/a/b.mdx",
      source: "---\ntitle: T\nsection: S\n---\n\nB\n",
    },
  ];
  const backend = new InMemoryBackend(seed);
  await backend.saveDraft(
    [{ path: "src/content/manual/a/b.mdx", content: "x" }],
    "e",
  );
  const res = await backend.publish();
  expect(res.prNumber).toBeGreaterThan(0);
  const pages = await backend.listPages();
  expect(pages.find((p) => p.slug === "a/b")!.hasDraft).toBe(false);
});

test("listPages includes a draft-only (newly created) page", async () => {
  const seed = [
    {
      path: "src/content/manual/basics/existing.mdx",
      source: "---\ntitle: E\nsection: Basics\n---\n\nBody\n",
    },
  ];
  const backend = new InMemoryBackend(seed);
  // No such file in base — this is a brand-new page saved only as a draft:
  await backend.saveDraft(
    [
      {
        path: "src/content/manual/basics/new-page.mdx",
        content: "---\ntitle: New Page\nsection: Basics\norder: 2\n---\n\n",
      },
    ],
    "create",
  );
  const pages = await backend.listPages();
  const created = pages.find((p) => p.slug === "basics/new-page");
  expect(created).toBeDefined();
  expect(created!.title).toBe("New Page");
  expect(created!.hasDraft).toBe(true);
  // Existing page still present exactly once:
  expect(pages.filter((p) => p.slug === "basics/existing").length).toBe(1);
});

test("a draft that edits an existing page is not double-listed", async () => {
  const seed = [
    {
      path: "src/content/manual/a/b.mdx",
      source: "---\ntitle: T\nsection: S\n---\n\nB\n",
    },
  ];
  const backend = new InMemoryBackend(seed);
  await backend.saveDraft(
    [
      {
        path: "src/content/manual/a/b.mdx",
        content: "---\ntitle: T2\nsection: S\n---\n\nEdited\n",
      },
    ],
    "e",
  );
  const pages = await backend.listPages();
  expect(pages.filter((p) => p.slug === "a/b").length).toBe(1);
  expect(pages.find((p) => p.slug === "a/b")!.title).toBe("T2"); // draft title wins
});

test("deleting a base page hides it from listPages and readPage throws", async () => {
  const seed = [
    {
      path: "src/content/manual/a/b.mdx",
      source: "---\ntitle: T\nsection: S\n---\n\nB\n",
    },
  ];
  const backend = new InMemoryBackend(seed);
  await backend.deletePage("src/content/manual/a/b.mdx");
  const pages = await backend.listPages();
  expect(pages.find((p) => p.slug === "a/b")).toBeUndefined();
  await expect(
    backend.readPage("src/content/manual/a/b.mdx"),
  ).rejects.toThrow();
});

test("deleting a draft-only page discards it entirely", async () => {
  const backend = new InMemoryBackend([]);
  await backend.saveDraft(
    [
      {
        path: "src/content/manual/x/new.mdx",
        content: "---\ntitle: N\nsection: S\n---\n\n",
      },
    ],
    "create",
  );
  await backend.deletePage("src/content/manual/x/new.mdx");
  expect((await backend.listPages()).length).toBe(0);
});

test("saveDraft to a deleted path clears the deletion (re-create)", async () => {
  const seed = [
    {
      path: "src/content/manual/a/b.mdx",
      source: "---\ntitle: T\nsection: S\n---\n\nB\n",
    },
  ];
  const backend = new InMemoryBackend(seed);
  await backend.deletePage("src/content/manual/a/b.mdx");
  await backend.saveDraft(
    [
      {
        path: "src/content/manual/a/b.mdx",
        content: "---\ntitle: T2\nsection: S\n---\n\nNew\n",
      },
    ],
    "recreate",
  );
  const page = (await backend.listPages()).find((p) => p.slug === "a/b");
  expect(page).toBeDefined();
  expect(page!.title).toBe("T2");
});

test("deletePage on an unknown path throws", async () => {
  const backend = new InMemoryBackend([]);
  await expect(
    backend.deletePage("src/content/manual/nope.mdx"),
  ).rejects.toThrow();
});

test("publish clears pending deletions", async () => {
  const seed = [
    {
      path: "src/content/manual/a/b.mdx",
      source: "---\ntitle: T\nsection: S\n---\n\nB\n",
    },
  ];
  const backend = new InMemoryBackend(seed);
  await backend.deletePage("src/content/manual/a/b.mdx");
  await backend.publish();
  // After the fake publish, the deletion has "landed": the page stays gone
  // (the in-memory base still holds the file, but the deletion set is cleared
  // conceptually with the publish). Assert publish() doesn't throw and the
  // page remains hidden OR reappears — pick ONE semantic and document it:
  // for the dev backend, keep it simple: publish clears the marker AND
  // removes the file from base (the deletion landed).
  const pages = await backend.listPages();
  expect(pages.find((p) => p.slug === "a/b")).toBeUndefined();
});
