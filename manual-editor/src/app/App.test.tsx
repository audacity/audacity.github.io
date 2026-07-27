import { beforeEach, expect, test } from "bun:test";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { App } from "./App";
import { makeApi } from "./api";
import type { ManualPageMeta, PageContent } from "../backend/types";

beforeEach(() => {
  localStorage.clear();
});

const pages: ManualPageMeta[] = [
  {
    slug: "basics/installing-ffmpeg",
    path: "src/content/manual/basics/installing-ffmpeg.mdx",
    title: "Installing FFmpeg",
    section: "Basics",
    sectionOrder: 0,
    order: 0,
    draft: false,
    hasDraft: false,
  },
];

function fakeFetch(): typeof fetch {
  return (async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.startsWith("/api/pages")) {
      return new Response(JSON.stringify(pages), {
        headers: { "content-type": "application/json" },
      });
    }
    if (url.startsWith("/api/page")) {
      const page: PageContent = {
        path: pages[0]!.path,
        source: "# Installing FFmpeg\n",
      };
      return new Response(JSON.stringify(page), {
        headers: { "content-type": "application/json" },
      });
    }
    throw new Error(`unexpected fetch: ${url}`);
  }) as typeof fetch;
}

test("App loads pages on mount and renders a page button", async () => {
  render(<App api={makeApi(fakeFetch())} />);
  await waitFor(() =>
    expect(screen.getByTestId("page-basics/installing-ffmpeg")).toBeDefined(),
  );
  expect(screen.getByText("Installing FFmpeg")).toBeDefined();
});

test("selecting a page fetches its source and mounts an editable rich-text editor", async () => {
  render(<App api={makeApi(fakeFetch())} />);
  const button = await waitFor(() =>
    screen.getByTestId("page-basics/installing-ffmpeg"),
  );
  fireEvent.click(button);
  const editor = await waitFor(() => screen.getByTestId("editor"));
  // The raw MDX source ("# Installing FFmpeg") should render as formatted
  // rich text (an editable heading), not literal markdown syntax. Scoped to
  // `.ProseMirror` since the collapsed header row also renders an `<h1>`
  // for the page title (`editor-header__title`).
  await waitFor(() => {
    const heading = editor.querySelector(".ProseMirror h1");
    expect(heading?.textContent).toBe("Installing FFmpeg");
  });
  const prosemirror = editor.querySelector(".ProseMirror");
  expect(prosemirror?.getAttribute("contenteditable")).toBe("true");
});

/**
 * A late `onReset` (Fix 3 in App.tsx's `handleReset`): the reset flow's
 * `/api/reset` round-trip can resolve well after the writer has already
 * clicked away to a different page. `handleReset(path)` must not blank or
 * overwrite the NEW page just because a reset for the OLD one finally
 * landed — a stale `handleSelect`-vs-`handleReset` race would otherwise
 * apply page A's restored content over page B, and one keystroke there
 * would autosave it under the wrong path.
 */
const resetPageA: ManualPageMeta = {
  slug: "a",
  path: "src/content/manual/a.mdx",
  title: "Page A",
  section: "Basics",
  sectionOrder: 0,
  order: 0,
  draft: false,
  hasDraft: true,
  existsOnBase: true,
};

const resetPageB: ManualPageMeta = {
  slug: "b",
  path: "src/content/manual/b.mdx",
  title: "Page B",
  section: "Basics",
  sectionOrder: 0,
  order: 1,
  draft: false,
  hasDraft: false,
  existsOnBase: true,
};

const resetPageSources: Record<string, string> = {
  [resetPageA.path]: "# Page A\n",
  [resetPageB.path]: "# Page B\n",
};

/**
 * `resetGate` (when provided) delays the `/api/reset` response until the
 * test resolves it, simulating a reset still in flight when the writer
 * navigates elsewhere. `calls` records request URLs in arrival order.
 */
function fakeFetchForLateReset(
  resetGate?: Promise<void>,
  calls: string[] = [],
): typeof fetch {
  return (async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.startsWith("/api/pages")) {
      return new Response(JSON.stringify([resetPageA, resetPageB]), {
        headers: { "content-type": "application/json" },
      });
    }
    if (url.startsWith("/api/reset")) {
      calls.push("/api/reset");
      if (resetGate) await resetGate;
      const page: PageContent = {
        path: resetPageA.path,
        source: resetPageSources[resetPageA.path]!,
      };
      return new Response(JSON.stringify(page), {
        headers: { "content-type": "application/json" },
      });
    }
    if (url.startsWith("/api/page")) {
      const path = new URL(url, "http://localhost").searchParams.get("path")!;
      const page: PageContent = { path, source: resetPageSources[path]! };
      return new Response(JSON.stringify(page), {
        headers: { "content-type": "application/json" },
      });
    }
    throw new Error(`unexpected fetch in late-reset test: ${url}`);
  }) as typeof fetch;
}

test("a reset that resolves after the writer navigates away does not stomp the newly selected page (Fix 3)", async () => {
  let releaseReset!: () => void;
  const resetGate = new Promise<void>((resolve) => {
    releaseReset = resolve;
  });
  const calls: string[] = [];
  render(<App api={makeApi(fakeFetchForLateReset(resetGate, calls))} />);

  fireEvent.click(await waitFor(() => screen.getByTestId("page-a")));
  await waitFor(() => {
    const heading = screen
      .getByTestId("editor")
      .querySelector(".ProseMirror h1");
    expect(heading?.textContent).toBe("Page A");
  });

  fireEvent.click(screen.getByTestId("editor-reset-page"));
  fireEvent.click(screen.getByTestId("editor-reset-confirm"));
  await waitFor(() => expect(calls).toEqual(["/api/reset"]));

  // While A's reset is still gated (in flight), select B — its `getPage`
  // isn't gated, so it resolves promptly.
  fireEvent.click(screen.getByTestId("page-b"));
  await waitFor(() => {
    const heading = screen
      .getByTestId("editor")
      .querySelector(".ProseMirror h1");
    expect(heading?.textContent).toBe("Page B");
  });

  // Now let the stale reset for A resolve. Without the `activePathRef`
  // guard, `handleReset` would blank the editor and then re-apply A's
  // restored source over the now-active B.
  releaseReset();
  await new Promise((r) => setTimeout(r, 50));

  const heading = screen.getByTestId("editor").querySelector(".ProseMirror h1");
  expect(heading?.textContent).toBe("Page B");
});

/**
 * Save-safety spec, feature B (App-side half): `handleSelect` prefers a
 * fresh local record over the server response when they differ — GitHub's
 * read API lags its writes, so right after a save the server can still
 * serve the pre-save content. `takeFresherLocalCopy` (Task 1) is the pure
 * decision function; these tests prove `App.tsx` actually calls it in the
 * page-select path.
 */
const STALE_READ_KEY = `manual-editor:lastSave:${pages[0]!.path}`;

test("selecting a page with a fresh local record that differs from the server shows the recorded content, not the server's", async () => {
  localStorage.setItem(
    STALE_READ_KEY,
    JSON.stringify({ source: "# Recorded Marker\n", at: Date.now() }),
  );
  render(<App api={makeApi(fakeFetch())} />);
  const button = await waitFor(() =>
    screen.getByTestId("page-basics/installing-ffmpeg"),
  );
  fireEvent.click(button);
  const editor = await waitFor(() => screen.getByTestId("editor"));
  await waitFor(() => {
    const heading = editor.querySelector(".ProseMirror h1");
    expect(heading?.textContent).toBe("Recorded Marker");
  });
});

test("selecting a page with an expired local record shows the server's content", async () => {
  localStorage.setItem(
    STALE_READ_KEY,
    JSON.stringify({
      source: "# Recorded Marker\n",
      at: Date.now() - 121_000,
    }),
  );
  render(<App api={makeApi(fakeFetch())} />);
  const button = await waitFor(() =>
    screen.getByTestId("page-basics/installing-ffmpeg"),
  );
  fireEvent.click(button);
  const editor = await waitFor(() => screen.getByTestId("editor"));
  await waitFor(() => {
    const heading = editor.querySelector(".ProseMirror h1");
    expect(heading?.textContent).toBe("Installing FFmpeg");
  });
});

/**
 * Save-safety spec, feature B: a completed reset must invalidate any
 * recorded local copy for that page — otherwise the stale-read protection
 * above would resurrect the just-discarded draft on the writer's next
 * reload, defeating the whole point of resetting.
 */
test("a completed reset clears the page's recorded local save", async () => {
  const resetKey = `manual-editor:lastSave:${resetPageA.path}`;
  render(<App api={makeApi(fakeFetchForLateReset())} />);

  fireEvent.click(await waitFor(() => screen.getByTestId("page-a")));
  await waitFor(() => {
    const heading = screen
      .getByTestId("editor")
      .querySelector(".ProseMirror h1");
    expect(heading?.textContent).toBe("Page A");
  });

  // Simulate a just-prior autosave having recorded a local copy (the thing
  // stale-read protection would otherwise resurrect on a later reload) —
  // seeded after page-select so it doesn't itself trigger the stale-read
  // path this test isn't exercising.
  localStorage.setItem(
    resetKey,
    JSON.stringify({ source: "# Discarded Draft\n", at: Date.now() }),
  );

  fireEvent.click(screen.getByTestId("editor-reset-page"));
  fireEvent.click(screen.getByTestId("editor-reset-confirm"));

  await waitFor(() => expect(localStorage.getItem(resetKey)).toBeNull());
});
