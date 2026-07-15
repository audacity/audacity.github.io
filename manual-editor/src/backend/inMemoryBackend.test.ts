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
