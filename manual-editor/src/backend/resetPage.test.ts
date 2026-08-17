import { expect, test } from "bun:test";
import { InMemoryBackend } from "./inMemoryBackend";

const PATH = "src/content/manual/basics/a.mdx";
const BASE_SRC = "---\ntitle: A\nsection: Basics\n---\n\nPublished body.\n";
const seed = [{ path: PATH, source: BASE_SRC }];

test("resetPage restores a modified page to the base content", async () => {
  const backend = new InMemoryBackend(seed);
  await backend.saveDraft([{ path: PATH, content: "edited" }], "edit");
  const restored = await backend.resetPage(PATH);
  expect(restored).toEqual({ path: PATH, source: BASE_SRC });
  expect((await backend.readPage(PATH)).source).toBe(BASE_SRC);
  const meta = (await backend.listPages()).find((p) => p.path === PATH)!;
  expect(meta.hasDraft).toBe(false);
});

test("resetPage clears a staged deletion", async () => {
  const backend = new InMemoryBackend(seed);
  await backend.deletePage(PATH);
  await backend.resetPage(PATH);
  expect((await backend.readPage(PATH)).source).toBe(BASE_SRC);
});

test("resetPage throws for a never-published page", async () => {
  const backend = new InMemoryBackend(seed);
  const draftOnly = "src/content/manual/basics/new.mdx";
  await backend.saveDraft([{ path: draftOnly, content: "new page" }], "new");
  await expect(backend.resetPage(draftOnly)).rejects.toThrow(
    `Cannot reset — page has never been published: ${draftOnly}`,
  );
});

test("resetPage on an unmodified page is a harmless no-op", async () => {
  const backend = new InMemoryBackend(seed);
  const restored = await backend.resetPage(PATH);
  expect(restored.source).toBe(BASE_SRC);
  expect((await backend.readPage(PATH)).source).toBe(BASE_SRC);
});

test("listPages sets existsOnBase for base pages and clears it for draft-only pages", async () => {
  const backend = new InMemoryBackend(seed);
  const draftOnly = "src/content/manual/basics/new.mdx";
  await backend.saveDraft(
    [
      {
        path: draftOnly,
        content: "---\ntitle: New\nsection: Basics\n---\n\nx\n",
      },
    ],
    "new",
  );
  const pages = await backend.listPages();
  expect(pages.find((p) => p.path === PATH)!.existsOnBase).toBe(true);
  expect(pages.find((p) => p.path === draftOnly)!.existsOnBase).toBe(false);
});
