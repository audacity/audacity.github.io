import { expect, test, mock } from "bun:test";
import { makeApi } from "./api";

test("listPages calls /api/pages and returns parsed json", async () => {
  const fetchMock = mock(
    async () =>
      new Response(JSON.stringify([{ slug: "a/b", title: "T" }]), {
        headers: { "content-type": "application/json" },
      }),
  );
  const api = makeApi(fetchMock as unknown as typeof fetch);
  const pages = await api.listPages();
  expect(pages[0].slug).toBe("a/b");
  expect(fetchMock).toHaveBeenCalled();
});

test("listPages throws on a non-ok response", async () => {
  const fetchMock = mock(async () => new Response("boom", { status: 500 }));
  const api = makeApi(fetchMock as unknown as typeof fetch);
  await expect(api.listPages()).rejects.toThrow("500");
});

test("getPage calls /api/page with an encoded path and returns parsed json", async () => {
  const fetchMock = mock(
    async () =>
      new Response(
        JSON.stringify({ path: "src/content/manual/a b.mdx", source: "# Hi" }),
        { headers: { "content-type": "application/json" } },
      ),
  );
  const api = makeApi(fetchMock as unknown as typeof fetch);
  const page = await api.getPage("src/content/manual/a b.mdx");
  expect(page.source).toBe("# Hi");
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/page?path=" + encodeURIComponent("src/content/manual/a b.mdx"),
  );
});

test("saveDraft posts path and source as JSON", async () => {
  const fetchMock = mock(
    async () =>
      new Response(JSON.stringify({ ok: true }), {
        headers: { "content-type": "application/json" },
      }),
  );
  const api = makeApi(fetchMock as unknown as typeof fetch);
  const result = await api.saveDraft("a.mdx", "content");
  expect(result.ok).toBe(true);
  expect(fetchMock).toHaveBeenCalledWith("/api/draft", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ path: "a.mdx", source: "content" }),
  });
});

test("saveDraftDoc resolves the committed source from the response", async () => {
  const fetchMock = mock(
    async () =>
      new Response(JSON.stringify({ ok: true, source: "ASSEMBLED" }), {
        headers: { "content-type": "application/json" },
      }),
  );
  const api = makeApi(fetchMock as unknown as typeof fetch);
  const result = await api.saveDraftDoc("a.mdx", { type: "doc" }, "---\n---\n");
  expect(result.source).toBe("ASSEMBLED");
  expect(fetchMock).toHaveBeenCalledWith("/api/draft", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      path: "a.mdx",
      doc: { type: "doc" },
      frontmatter: "---\n---\n",
    }),
  });
});

test("resetPage posts path and returns the restored page", async () => {
  const fetchMock = mock(
    async () =>
      new Response(
        JSON.stringify({ path: "src/content/manual/x/y.mdx", source: "S" }),
        { headers: { "content-type": "application/json" } },
      ),
  );
  const api = makeApi(fetchMock as unknown as typeof fetch);
  const restored = await api.resetPage("src/content/manual/x/y.mdx");
  expect(restored).toEqual({
    path: "src/content/manual/x/y.mdx",
    source: "S",
  });
  expect(fetchMock).toHaveBeenCalledWith("/api/reset", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ path: "src/content/manual/x/y.mdx" }),
  });
});

test("publish posts to /api/publish and returns parsed json", async () => {
  const fetchMock = mock(
    async () =>
      new Response(
        JSON.stringify({ prUrl: "https://example.com/pr/1", prNumber: 1 }),
        { headers: { "content-type": "application/json" } },
      ),
  );
  const api = makeApi(fetchMock as unknown as typeof fetch);
  const result = await api.publish();
  expect(result.prNumber).toBe(1);
  expect(fetchMock).toHaveBeenCalledWith("/api/publish", { method: "POST" });
});
