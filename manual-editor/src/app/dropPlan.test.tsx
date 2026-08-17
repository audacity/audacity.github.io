/**
 * Task 2: `App`'s wiring of `PageList`'s `onDropPlan` (see `treeDnd.ts`'s
 * `computeDrop`) to the `/api/move` and `/api/reorder` endpoints (Task 1).
 * `PageList.test.tsx` proves the drag gesture itself resolves to the right
 * `DropPlan`; this file proves `App.tsx`'s `handleDropPlan` executes that
 * plan correctly — move before reorder, a page list re-fetch after, and
 * `activePath` remapped when the currently-open page was the one moved. See
 * `deletePage.test.tsx`/`publish.test.tsx` for the same "mocked api via
 * makeApi(fakeFetch)" pattern this file follows.
 */
import { expect, test } from "bun:test";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { App } from "./App";
import { makeApi } from "./api";
import type { ManualPageMeta, PageContent } from "../backend/types";

const p1: ManualPageMeta = {
  slug: "p1",
  path: "src/content/manual/p1.mdx",
  title: "P1",
  section: "S",
  sectionOrder: 1,
  order: 1,
  draft: false,
  hasDraft: false,
};
const p1a: ManualPageMeta = {
  slug: "p1/a",
  path: "src/content/manual/p1/a.mdx",
  title: "A",
  section: "S",
  sectionOrder: 1,
  order: 1,
  draft: false,
  hasDraft: false,
};
const p2: ManualPageMeta = {
  slug: "p2",
  path: "src/content/manual/p2.mdx",
  title: "P2",
  section: "S",
  sectionOrder: 1,
  order: 2,
  draft: false,
  hasDraft: false,
};
const p2x: ManualPageMeta = {
  slug: "p2/x",
  path: "src/content/manual/p2/x.mdx",
  title: "X",
  section: "S",
  sectionOrder: 1,
  order: 1,
  draft: false,
  hasDraft: false,
};
const p2y: ManualPageMeta = {
  slug: "p2/y",
  path: "src/content/manual/p2/y.mdx",
  title: "Y",
  section: "S",
  sectionOrder: 1,
  order: 2,
  draft: false,
  hasDraft: false,
};

const initialPages = [p1, p1a, p2, p2x, p2y];

interface Call {
  method: string;
  url: string;
  body?: unknown;
}

function fakeFetch(opts: {
  calls: Call[];
  moveResponse?: () => Response;
}): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    if (url.startsWith("/api/pages")) {
      opts.calls.push({ method, url });
      return new Response(JSON.stringify(initialPages), {
        headers: { "content-type": "application/json" },
      });
    }
    if (url.startsWith("/api/page") && method === "GET") {
      opts.calls.push({ method, url });
      const path = new URL(url, "http://localhost").searchParams.get("path")!;
      const page: PageContent = { path, source: `# ${path}\n` };
      return new Response(JSON.stringify(page), {
        headers: { "content-type": "application/json" },
      });
    }
    if (url.startsWith("/api/move") && method === "POST") {
      opts.calls.push({ method, url, body });
      if (opts.moveResponse) return opts.moveResponse();
      const { path, dest } = body as {
        path: string;
        dest: { folder: string };
      };
      const name = path.split("/").pop();
      const to = `src/content/manual/${dest.folder}/${name}`;
      return new Response(JSON.stringify({ moves: [{ from: path, to }] }), {
        headers: { "content-type": "application/json" },
      });
    }
    if (url.startsWith("/api/reorder") && method === "POST") {
      opts.calls.push({ method, url, body });
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "content-type": "application/json" },
      });
    }
    throw new Error(`unexpected fetch: ${method} ${url}`);
  }) as typeof fetch;
}

function dataTransferStub() {
  return { effectAllowed: "", setData: () => {}, getData: () => "" };
}

/** See `PageList.test.tsx`'s `dragOver` helper doc comment: `fireEvent.
 * dragOver`'s `clientY` doesn't reach the handler in this happy-dom setup,
 * so a real `MouseEvent` is dispatched directly (wrapped in `act`). Row
 * rects are all-zero here, so a negative `clientY` reliably lands in the
 * "before" zone (see `zoneFromPointerY` in `PageList.tsx`). */
function dragOverBefore(row: Element) {
  act(() => {
    row.dispatchEvent(
      new MouseEvent("dragover", {
        bubbles: true,
        cancelable: true,
        clientY: -10,
      }),
    );
  });
}

test("a cross-parent drop calls movePage then reorder then re-fetches, and remaps activePath for the moved active page", async () => {
  const calls: Call[] = [];
  const api = makeApi(fakeFetch({ calls }));
  render(<App api={api} />);

  // Expand both parents so their children are in the DOM.
  const toggleP1 = await waitFor(() => screen.getByTestId("toggle-p1"));
  fireEvent.click(toggleP1);
  const toggleP2 = await waitFor(() => screen.getByTestId("toggle-p2"));
  fireEvent.click(toggleP2);

  // Select p1/a so it's the active page before it gets moved.
  const aButton = await waitFor(() => screen.getByTestId("page-p1/a"));
  fireEvent.click(aButton);
  await waitFor(() => screen.getByTestId("editor"));

  const callsBeforeDrop = calls.length;

  // Drag p1/a to before p2/y: cross-parent move, with y renumbered behind it
  // (alsoReorder), matching `treeDnd.test.ts`'s equivalent pure-logic case.
  fireEvent.dragStart(aButton, { dataTransfer: dataTransferStub() });
  const yRow = screen.getByTestId("page-p2/y").closest(".sidebar-tree__row")!;
  dragOverBefore(yRow);
  fireEvent.drop(yRow);

  await waitFor(() =>
    expect(calls.filter((c) => c.method === "POST").length).toBeGreaterThan(0),
  );
  await waitFor(() =>
    expect(calls.length).toBeGreaterThan(callsBeforeDrop + 1),
  );

  const postDropCalls = calls.slice(callsBeforeDrop);
  const moveIndex = postDropCalls.findIndex((c) =>
    c.url.startsWith("/api/move"),
  );
  const reorderIndex = postDropCalls.findIndex((c) =>
    c.url.startsWith("/api/reorder"),
  );
  expect(moveIndex).toBeGreaterThanOrEqual(0);
  expect(reorderIndex).toBeGreaterThan(moveIndex);
  expect(postDropCalls[moveIndex]!.body).toEqual({
    path: "src/content/manual/p1/a.mdx",
    dest: { folder: "p2", order: 2 },
  });
  expect(postDropCalls[reorderIndex]!.body).toEqual({
    updates: [{ path: "src/content/manual/p2/y.mdx", order: 3 }],
  });

  // Re-fetches the page list after the move settles.
  await waitFor(() =>
    expect(
      postDropCalls.filter((c) => c.url.startsWith("/api/pages")).length,
    ).toBeGreaterThan(0),
  );

  // activePath remapped: the editor re-fetches the moved page's NEW path.
  await waitFor(() =>
    expect(
      postDropCalls.some(
        (c) =>
          c.url.startsWith("/api/page?") &&
          c.url.includes(encodeURIComponent("src/content/manual/p2/a.mdx")),
      ),
    ).toBe(true),
  );
});

test("a failed move surfaces its error inline near the sidebar without crashing", async () => {
  const calls: Call[] = [];
  const api = makeApi(
    fakeFetch({
      calls,
      moveResponse: () =>
        new Response(JSON.stringify({ error: "Destination already exists" }), {
          status: 409,
          headers: { "content-type": "application/json" },
        }),
    }),
  );
  render(<App api={api} />);

  const toggleP1 = await waitFor(() => screen.getByTestId("toggle-p1"));
  fireEvent.click(toggleP1);
  const toggleP2 = await waitFor(() => screen.getByTestId("toggle-p2"));
  fireEvent.click(toggleP2);

  const aButton = await waitFor(() => screen.getByTestId("page-p1/a"));
  fireEvent.dragStart(aButton, { dataTransfer: dataTransferStub() });
  const yRow = screen.getByTestId("page-p2/y").closest(".sidebar-tree__row")!;
  dragOverBefore(yRow);
  fireEvent.drop(yRow);

  await waitFor(() =>
    expect(screen.getByTestId("drop-error").textContent).toBe(
      "Destination already exists",
    ),
  );
});
