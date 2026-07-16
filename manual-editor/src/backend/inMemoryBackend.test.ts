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

// ---------------------------------------------------------------------------
// saveImage / readAsset
// ---------------------------------------------------------------------------

test("saveImage then readAsset roundtrips the exact bytes", async () => {
  const backend = new InMemoryBackend([]);
  const bytes = new Uint8Array([137, 80, 78, 71, 1, 2, 3, 4, 5]);
  const path = await backend.saveImage("basics/a", "diagram-ab12cd.png", bytes);
  expect(path).toBe("src/assets/img/manual/basics/a/diagram-ab12cd.png");
  const read = await backend.readAsset(path);
  expect(read).toEqual(bytes);
});

test("readAsset on an unknown path throws", async () => {
  const backend = new InMemoryBackend([]);
  await expect(
    backend.readAsset("src/assets/img/manual/basics/a/nope.png"),
  ).rejects.toThrow();
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

// ---------------------------------------------------------------------------
// reorderPages
// ---------------------------------------------------------------------------

test("reorderPages updates order and only order", async () => {
  const seed = [
    {
      path: "src/content/manual/a/b.mdx",
      source:
        "---\ntitle: T\ndescription: D\nsection: S\nsectionOrder: 2\norder: 1\n---\n\nBody\n",
    },
  ];
  const backend = new InMemoryBackend(seed);
  await backend.reorderPages([
    { path: "src/content/manual/a/b.mdx", order: 7 },
  ]);
  const page = (await backend.listPages()).find((p) => p.slug === "a/b")!;
  expect(page.order).toBe(7);
  expect(page.title).toBe("T");
  expect(page.section).toBe("S");
  expect(page.sectionOrder).toBe(2);
  expect(page.hasDraft).toBe(true);
  const read = await backend.readPage("src/content/manual/a/b.mdx");
  expect(read.source).toContain("Body\n");
});

test("reorderPages on an unknown path throws", async () => {
  const backend = new InMemoryBackend([]);
  await expect(
    backend.reorderPages([{ path: "src/content/manual/nope.mdx", order: 1 }]),
  ).rejects.toThrow();
});

// ---------------------------------------------------------------------------
// movePage
// ---------------------------------------------------------------------------

test("movePage: single page — path map correct, old gone, new listed, order applied", async () => {
  const seed = [
    {
      path: "src/content/manual/a/b.mdx",
      source: "---\ntitle: T\nsection: S\norder: 1\n---\n\nBody\n",
    },
  ];
  const backend = new InMemoryBackend(seed);
  const moves = await backend.movePage("src/content/manual/a/b.mdx", {
    folder: "c",
    order: 5,
  });
  expect(moves).toEqual([
    { from: "src/content/manual/a/b.mdx", to: "src/content/manual/c/b.mdx" },
  ]);
  const pages = await backend.listPages();
  expect(
    pages.find((p) => p.path === "src/content/manual/a/b.mdx"),
  ).toBeUndefined();
  const moved = pages.find((p) => p.path === "src/content/manual/c/b.mdx")!;
  expect(moved).toBeDefined();
  expect(moved.order).toBe(5);
  expect(moved.section).toBe("S"); // unchanged, no section provided
  await expect(
    backend.readPage("src/content/manual/a/b.mdx"),
  ).rejects.toThrow();
});

test("movePage: nested descendants travel with the page (including a deeper-nested child)", async () => {
  const seed = [
    {
      path: "src/content/manual/a/b.mdx",
      source: "---\ntitle: B\nsection: S\norder: 1\n---\n\nParent body\n",
    },
    {
      path: "src/content/manual/a/b/child1.mdx",
      source: "---\ntitle: Child1\nsection: S\norder: 1\n---\n\nChild1 body\n",
    },
    {
      path: "src/content/manual/a/b/sub/child2.mdx",
      source: "---\ntitle: Child2\nsection: S\norder: 1\n---\n\nChild2 body\n",
    },
  ];
  const backend = new InMemoryBackend(seed);
  const moves = await backend.movePage("src/content/manual/a/b.mdx", {
    folder: "c",
    order: 2,
  });
  expect(moves).toEqual([
    { from: "src/content/manual/a/b.mdx", to: "src/content/manual/c/b.mdx" },
    {
      from: "src/content/manual/a/b/child1.mdx",
      to: "src/content/manual/c/b/child1.mdx",
    },
    {
      from: "src/content/manual/a/b/sub/child2.mdx",
      to: "src/content/manual/c/b/sub/child2.mdx",
    },
  ]);
  const pages = await backend.listPages();
  const paths = pages.map((p) => p.path).sort();
  expect(paths).toEqual(
    [
      "src/content/manual/c/b.mdx",
      "src/content/manual/c/b/child1.mdx",
      "src/content/manual/c/b/sub/child2.mdx",
    ].sort(),
  );
  const child2 = await backend.readPage(
    "src/content/manual/c/b/sub/child2.mdx",
  );
  expect(child2.source).toContain("Child2 body\n");
});

test("movePage: crossing sections updates the moved page and its descendants' section", async () => {
  const seed = [
    {
      path: "src/content/manual/a/b.mdx",
      source: "---\ntitle: B\nsection: Old\norder: 1\n---\n\nParent\n",
    },
    {
      path: "src/content/manual/a/b/child.mdx",
      source: "---\ntitle: Child\nsection: Old\norder: 1\n---\n\nChild\n",
    },
  ];
  const backend = new InMemoryBackend(seed);
  await backend.movePage("src/content/manual/a/b.mdx", {
    folder: "c",
    order: 3,
    section: "New",
    sectionOrder: 9,
  });
  const pages = await backend.listPages();
  const moved = pages.find((p) => p.path === "src/content/manual/c/b.mdx")!;
  expect(moved.section).toBe("New");
  expect(moved.sectionOrder).toBe(9);
  const child = pages.find(
    (p) => p.path === "src/content/manual/c/b/child.mdx",
  )!;
  expect(child.section).toBe("New");
  expect(child.sectionOrder).toBe(9);
});

test("movePage: a draft-edited page moves with its draft content", async () => {
  const seed = [
    {
      path: "src/content/manual/a/b.mdx",
      source:
        "---\ntitle: Original\nsection: S\norder: 1\n---\n\nOriginal body\n",
    },
  ];
  const backend = new InMemoryBackend(seed);
  await backend.saveDraft(
    [
      {
        path: "src/content/manual/a/b.mdx",
        content:
          "---\ntitle: Edited\nsection: S\norder: 1\n---\n\nEdited body\n",
      },
    ],
    "edit",
  );
  await backend.movePage("src/content/manual/a/b.mdx", {
    folder: "c",
    order: 2,
  });
  const moved = await backend.readPage("src/content/manual/c/b.mdx");
  expect(moved.source).toContain("Edited body");
  expect(moved.source).toContain("title: Edited");
});

test("movePage: moving into own descendant folder throws (cycle guard)", async () => {
  const seed = [
    {
      path: "src/content/manual/a/b.mdx",
      source: "---\ntitle: B\nsection: S\norder: 1\n---\n\nBody\n",
    },
  ];
  const backend = new InMemoryBackend(seed);
  await expect(
    backend.movePage("src/content/manual/a/b.mdx", {
      folder: "a/b",
      order: 1,
    }),
  ).rejects.toThrow();
  await expect(
    backend.movePage("src/content/manual/a/b.mdx", {
      folder: "a/b/deeper",
      order: 1,
    }),
  ).rejects.toThrow();
});

test("movePage: unknown path throws", async () => {
  const backend = new InMemoryBackend([]);
  await expect(
    backend.movePage("src/content/manual/nope.mdx", { folder: "c", order: 1 }),
  ).rejects.toThrow();
});

// ---------------------------------------------------------------------------
// movePage: same-folder move (Bug 1 regression — must not delete the page)
// ---------------------------------------------------------------------------

test("movePage: same-folder move (reorder-only) keeps the page alive, updates order, no deletion staged", async () => {
  const seed = [
    {
      path: "src/content/manual/a/b.mdx",
      source: "---\ntitle: B\nsection: S\norder: 1\n---\n\nBody\n",
    },
  ];
  const backend = new InMemoryBackend(seed);
  const moves = await backend.movePage("src/content/manual/a/b.mdx", {
    folder: "a",
    order: 9,
  });
  expect(moves).toEqual([
    { from: "src/content/manual/a/b.mdx", to: "src/content/manual/a/b.mdx" },
  ]);
  const page = await backend.readPage("src/content/manual/a/b.mdx");
  expect(page.source).toContain("Body\n");
  const meta = (await backend.listPages()).find(
    (p) => p.path === "src/content/manual/a/b.mdx",
  );
  expect(meta).toBeDefined();
  expect(meta!.order).toBe(9);
});

test("movePage: same-folder move of a parent leaves children untouched (not deleted, content byte-identical)", async () => {
  const seed = [
    {
      path: "src/content/manual/a/b.mdx",
      source: "---\ntitle: B\nsection: S\norder: 1\n---\n\nParent body\n",
    },
    {
      path: "src/content/manual/a/b/child.mdx",
      source: "---\ntitle: Child\nsection: S\norder: 1\n---\n\nChild body\n",
    },
  ];
  const backend = new InMemoryBackend(seed);
  const moves = await backend.movePage("src/content/manual/a/b.mdx", {
    folder: "a",
    order: 4,
  });
  expect(moves).toEqual([
    { from: "src/content/manual/a/b.mdx", to: "src/content/manual/a/b.mdx" },
    {
      from: "src/content/manual/a/b/child.mdx",
      to: "src/content/manual/a/b/child.mdx",
    },
  ]);
  const child = await backend.readPage("src/content/manual/a/b/child.mdx");
  expect(child.source).toBe(
    "---\ntitle: Child\nsection: S\norder: 1\n---\n\nChild body\n",
  );
  const pages = await backend.listPages();
  expect(pages.map((p) => p.path).sort()).toEqual(
    ["src/content/manual/a/b.mdx", "src/content/manual/a/b/child.mdx"].sort(),
  );
});

test("movePage: same-folder move with a section change still rewrites descendant frontmatter without deleting", async () => {
  const seed = [
    {
      path: "src/content/manual/a/b.mdx",
      source: "---\ntitle: B\nsection: Old\norder: 1\n---\n\nParent\n",
    },
    {
      path: "src/content/manual/a/b/child.mdx",
      source: "---\ntitle: Child\nsection: Old\norder: 1\n---\n\nChild\n",
    },
  ];
  const backend = new InMemoryBackend(seed);
  await backend.movePage("src/content/manual/a/b.mdx", {
    folder: "a",
    order: 1,
    section: "New",
  });
  const pages = await backend.listPages();
  const parent = pages.find((p) => p.path === "src/content/manual/a/b.mdx")!;
  expect(parent.section).toBe("New");
  const child = pages.find(
    (p) => p.path === "src/content/manual/a/b/child.mdx",
  )!;
  expect(child.section).toBe("New");
});

// ---------------------------------------------------------------------------
// movePage: destination collision (Bug 2 regression)
// ---------------------------------------------------------------------------

test("movePage: destination collision with an unrelated page throws and leaves the target unharmed", async () => {
  const seed = [
    {
      path: "src/content/manual/a/b.mdx",
      source: "---\ntitle: B\nsection: S\norder: 1\n---\n\nMovable\n",
    },
    {
      path: "src/content/manual/c/b.mdx",
      source: "---\ntitle: Unrelated\nsection: S\norder: 1\n---\n\nOriginal\n",
    },
  ];
  const backend = new InMemoryBackend(seed);
  await expect(
    backend.movePage("src/content/manual/a/b.mdx", { folder: "c", order: 1 }),
  ).rejects.toThrow("Destination already exists: src/content/manual/c/b.mdx");

  // Both pages remain exactly as before.
  const target = await backend.readPage("src/content/manual/c/b.mdx");
  expect(target.source).toContain("Unrelated");
  expect(target.source).toContain("Original");
  const original = await backend.readPage("src/content/manual/a/b.mdx");
  expect(original.source).toContain("Movable");
});

test("movePage: destination collision on a descendant path throws before any writes", async () => {
  const seed = [
    {
      path: "src/content/manual/a/b.mdx",
      source: "---\ntitle: B\nsection: S\norder: 1\n---\n\nParent\n",
    },
    {
      path: "src/content/manual/a/b/child.mdx",
      source: "---\ntitle: Child\nsection: S\norder: 1\n---\n\nChild\n",
    },
    {
      path: "src/content/manual/c/b/child.mdx",
      source:
        "---\ntitle: Unrelated Child\nsection: S\norder: 1\n---\n\nOther\n",
    },
  ];
  const backend = new InMemoryBackend(seed);
  await expect(
    backend.movePage("src/content/manual/a/b.mdx", { folder: "c", order: 1 }),
  ).rejects.toThrow("Destination already exists");

  // Nothing moved: original pages intact, unrelated page untouched.
  const pages = await backend.listPages();
  expect(pages.map((p) => p.path).sort()).toEqual(
    [
      "src/content/manual/a/b.mdx",
      "src/content/manual/a/b/child.mdx",
      "src/content/manual/c/b/child.mdx",
    ].sort(),
  );
  const unrelated = await backend.readPage("src/content/manual/c/b/child.mdx");
  expect(unrelated.source).toContain("Unrelated Child");
});

test("movePage: preserves the .md extension", async () => {
  const seed = [
    {
      path: "src/content/manual/a/b.md",
      source: "---\ntitle: B\nsection: S\norder: 1\n---\n\nBody\n",
    },
  ];
  const backend = new InMemoryBackend(seed);
  const moves = await backend.movePage("src/content/manual/a/b.md", {
    folder: "c",
    order: 1,
  });
  expect(moves).toEqual([
    { from: "src/content/manual/a/b.md", to: "src/content/manual/c/b.md" },
  ]);
  const page = (await backend.listPages()).find(
    (p) => p.path === "src/content/manual/c/b.md",
  );
  expect(page).toBeDefined();
});
