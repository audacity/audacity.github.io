/**
 * Task 2: the editor header's "Delete page" action.
 *
 * Covers the children-block guard (disabled button + tooltip when the active
 * page has sub-pages), the inline confirm/cancel state machine, and the
 * post-delete `App` state transition (list re-fetch, editor unmount back to
 * the placeholder). See `Editor.tsx`'s header and `App.tsx`'s `hasChildren`
 * derivation / `onDeleted` handler.
 */
import { expect, test } from "bun:test";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { App } from "./App";
import { makeApi } from "./api";
import type { ManualPageMeta, PageContent } from "../backend/types";

const pageA: ManualPageMeta = {
  slug: "a",
  path: "src/content/manual/a.mdx",
  title: "Page A",
  section: "Basics",
  sectionOrder: 0,
  order: 0,
  draft: false,
  hasDraft: false,
};

const pageAB: ManualPageMeta = {
  slug: "a/b",
  path: "src/content/manual/a/b.mdx",
  title: "Page A/B",
  section: "Basics",
  sectionOrder: 0,
  order: 1,
  draft: false,
  hasDraft: false,
};

function fakeFetch(opts: {
  pages: ManualPageMeta[];
  deleteCalls: string[];
  listPagesCalls: number[];
  failDelete?: boolean;
}): typeof fetch {
  let listCallCount = 0;
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    if (url.startsWith("/api/pages")) {
      listCallCount += 1;
      opts.listPagesCalls.push(listCallCount);
      return new Response(JSON.stringify(opts.pages), {
        headers: { "content-type": "application/json" },
      });
    }
    if (url.startsWith("/api/page") && method === "DELETE") {
      const path = new URL(url, "http://localhost").searchParams.get("path")!;
      opts.deleteCalls.push(path);
      if (opts.failDelete) {
        return new Response(JSON.stringify({ error: "boom" }), {
          status: 500,
          headers: { "content-type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "content-type": "application/json" },
      });
    }
    if (url.startsWith("/api/page")) {
      const path = new URL(url, "http://localhost").searchParams.get("path")!;
      const page: PageContent = {
        path,
        source: `# ${path}\n`,
      };
      return new Response(JSON.stringify(page), {
        headers: { "content-type": "application/json" },
      });
    }
    throw new Error(`unexpected fetch: ${method} ${url}`);
  }) as typeof fetch;
}

test("a page with sub-pages shows a disabled delete button with a guard tooltip", async () => {
  const deleteCalls: string[] = [];
  const listPagesCalls: number[] = [];
  const api = makeApi(
    fakeFetch({ pages: [pageA, pageAB], deleteCalls, listPagesCalls }),
  );
  render(<App api={api} />);

  const button = await waitFor(() => screen.getByTestId("page-a"));
  fireEvent.click(button);
  await waitFor(() => screen.getByTestId("editor"));

  const deleteButton = await waitFor(() =>
    screen.getByTestId("editor-delete-page"),
  );
  expect((deleteButton as HTMLButtonElement).disabled).toBe(true);
  expect(deleteButton.getAttribute("title")).toBe(
    "Delete or move its sub-pages first",
  );

  // Guarded: clicking a disabled button fires no confirm UI and no API call.
  fireEvent.click(deleteButton);
  expect(screen.queryByTestId("editor-delete-confirm")).toBeNull();
  expect(deleteCalls).toEqual([]);
});

test("deleting a leaf page: confirm calls the API, re-fetches pages, and returns to the placeholder", async () => {
  const deleteCalls: string[] = [];
  const listPagesCalls: number[] = [];
  const api = makeApi(
    fakeFetch({ pages: [pageA, pageAB], deleteCalls, listPagesCalls }),
  );
  render(<App api={api} />);

  // "a/b" is nested under "a" and collapsed by default; expand it first.
  const toggle = await waitFor(() => screen.getByTestId("toggle-a"));
  fireEvent.click(toggle);
  const button = await waitFor(() => screen.getByTestId("page-a/b"));
  fireEvent.click(button);
  await waitFor(() => screen.getByTestId("editor"));

  const deleteButton = await waitFor(() =>
    screen.getByTestId("editor-delete-page"),
  );
  expect((deleteButton as HTMLButtonElement).disabled).toBe(false);

  const listCallsBeforeDelete = listPagesCalls.length;

  fireEvent.click(deleteButton);
  const confirmButton = await waitFor(() =>
    screen.getByTestId("editor-delete-confirm"),
  );
  expect(screen.getByTestId("editor-delete-cancel")).toBeDefined();

  fireEvent.click(confirmButton);

  await waitFor(() => expect(deleteCalls).toEqual([pageAB.path]));
  await waitFor(() =>
    expect(listPagesCalls.length).toBeGreaterThan(listCallsBeforeDelete),
  );
  await waitFor(() =>
    expect(
      screen.getByText("Select a page from the list to start editing."),
    ).toBeDefined(),
  );
  expect(screen.queryByTestId("editor")).toBeNull();
});

test("cancel returns to the plain delete button without calling the API", async () => {
  const deleteCalls: string[] = [];
  const listPagesCalls: number[] = [];
  const api = makeApi(
    fakeFetch({ pages: [pageA, pageAB], deleteCalls, listPagesCalls }),
  );
  render(<App api={api} />);

  // "a/b" is nested under "a" and collapsed by default; expand it first.
  const toggle = await waitFor(() => screen.getByTestId("toggle-a"));
  fireEvent.click(toggle);
  const button = await waitFor(() => screen.getByTestId("page-a/b"));
  fireEvent.click(button);
  await waitFor(() => screen.getByTestId("editor"));

  const deleteButton = await waitFor(() =>
    screen.getByTestId("editor-delete-page"),
  );
  fireEvent.click(deleteButton);
  const cancelButton = await waitFor(() =>
    screen.getByTestId("editor-delete-cancel"),
  );
  fireEvent.click(cancelButton);

  await waitFor(() => screen.getByTestId("editor-delete-page"));
  expect(screen.queryByTestId("editor-delete-confirm")).toBeNull();
  expect(deleteCalls).toEqual([]);
  // Editor is still mounted — nothing was deleted.
  expect(screen.getByTestId("editor")).toBeDefined();
});

test("a failed delete surfaces an error and returns to the plain button", async () => {
  const deleteCalls: string[] = [];
  const listPagesCalls: number[] = [];
  const api = makeApi(
    fakeFetch({
      pages: [pageA, pageAB],
      deleteCalls,
      listPagesCalls,
      failDelete: true,
    }),
  );
  render(<App api={api} />);

  // "a/b" is nested under "a" and collapsed by default; expand it first.
  const toggle = await waitFor(() => screen.getByTestId("toggle-a"));
  fireEvent.click(toggle);
  const button = await waitFor(() => screen.getByTestId("page-a/b"));
  fireEvent.click(button);
  await waitFor(() => screen.getByTestId("editor"));

  const deleteButton = await waitFor(() =>
    screen.getByTestId("editor-delete-page"),
  );
  fireEvent.click(deleteButton);
  const confirmButton = await waitFor(() =>
    screen.getByTestId("editor-delete-confirm"),
  );
  fireEvent.click(confirmButton);

  await waitFor(() => expect(deleteCalls).toEqual([pageAB.path]));
  // Editor stays mounted (delete failed) and the confirm UI is dismissed.
  await waitFor(() => screen.getByTestId("editor-delete-page"));
  expect(screen.queryByTestId("editor-delete-confirm")).toBeNull();
  expect(screen.getByTestId("editor")).toBeDefined();
  expect(screen.getByTestId("save-status").textContent).toBe("Save failed");
});
