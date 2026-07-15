import { expect, test } from "bun:test";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { App } from "./App";
import { makeApi } from "./api";
import type { ManualPageMeta, PageContent } from "../backend/types";

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
  // rich text (an editable heading), not literal markdown syntax.
  await waitFor(() => {
    const heading = editor.querySelector("h1");
    expect(heading?.textContent).toBe("Installing FFmpeg");
  });
  const prosemirror = editor.querySelector(".ProseMirror");
  expect(prosemirror?.getAttribute("contenteditable")).toBe("true");
});
