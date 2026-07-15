import { expect, test } from "bun:test";
import {
  slugify,
  buildNewPagePath,
  existingFolders,
  nextOrder,
} from "./newPagePath";

test("slugify normalizes titles", () => {
  expect(slugify("Recording Your Voice!")).toBe("recording-your-voice");
  expect(slugify("  A  B__c ")).toBe("a-b-c");
  expect(slugify("Rész — 4")).toBe("resz-4"); // strips non [a-z0-9-]; see note below
});

test("buildNewPagePath composes folder + slug", () => {
  expect(buildNewPagePath("audio-editing", "My New Page")).toBe(
    "src/content/manual/audio-editing/my-new-page.mdx",
  );
});

test("existingFolders lists unique folders from page paths", () => {
  const pages = [
    { path: "src/content/manual/basics/a.mdx" },
    { path: "src/content/manual/basics/b.mdx" },
    { path: "src/content/manual/audio-editing/c.mdx" },
  ] as any;
  expect(existingFolders(pages).sort()).toEqual(["audio-editing", "basics"]);
});

test("nextOrder is max order in the folder + 1", () => {
  const pages = [
    { path: "src/content/manual/basics/a.mdx", order: 1 },
    { path: "src/content/manual/basics/b.mdx", order: 4 },
    { path: "src/content/manual/other/c.mdx", order: 9 },
  ] as any;
  expect(nextOrder(pages, "basics")).toBe(5);
  expect(nextOrder(pages, "empty-folder")).toBe(1);
});
