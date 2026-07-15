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
