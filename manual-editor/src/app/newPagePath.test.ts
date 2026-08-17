import { expect, test } from "bun:test";
import {
  slugify,
  slugifyFolder,
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

test("slugifyFolder slugifies each segment and drops originally-empty ones", () => {
  expect(slugifyFolder("Audio Editing")).toBe("audio-editing");
  expect(slugifyFolder("audio-editing/")).toBe("audio-editing");
  expect(slugifyFolder("a//b")).toBe("a/b");
  expect(slugifyFolder("")).toBe("");
});

test("nextOrder sees the real folder when the caller slugifies a raw Location first", () => {
  const pages = [
    { path: "src/content/manual/audio-editing/trimming.mdx", order: 1 },
    { path: "src/content/manual/audio-editing/fading.mdx", order: 2 },
  ] as any;
  // A raw, human-typed Location ("Audio Editing") must resolve through
  // slugifyFolder before being handed to nextOrder, or it silently fails to
  // match the slugified folder already used by existing pages (order: 1,
  // not 3, would be a bug).
  expect(nextOrder(pages, slugifyFolder("Audio Editing"))).toBe(3);
});

test("buildNewPagePath drops a trailing-slash folder segment instead of falling back to a stray 'page' folder", () => {
  const path = buildNewPagePath("audio-editing/", "X");
  expect(path).not.toContain("/page/");
  expect(path).toBe("src/content/manual/audio-editing/x.mdx");
});
