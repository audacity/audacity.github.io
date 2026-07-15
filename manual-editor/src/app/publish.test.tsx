/**
 * The top-bar "Publish" button (`App.tsx`'s `.app-topbar__actions`, next to
 * the auth badge): click -> disable + "Publishing…" while `api.publish()`
 * is in flight, then show either a link to the opened/reused PR or the
 * server's error message inline. See `deletePage.test.tsx` for the same
 * "mocked api via makeApi(fakeFetch)" pattern this file follows.
 */
import { expect, test } from "bun:test";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { App } from "./App";
import { makeApi } from "./api";
import type { ManualPageMeta } from "../backend/types";

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

function fakeFetch(opts: {
  publishResponse: () => Response;
  listPagesCalls: number[];
}): typeof fetch {
  let listCallCount = 0;
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    if (url.startsWith("/api/pages")) {
      listCallCount += 1;
      opts.listPagesCalls.push(listCallCount);
      return new Response(JSON.stringify(pages), {
        headers: { "content-type": "application/json" },
      });
    }
    if (url.startsWith("/api/publish") && method === "POST") {
      return opts.publishResponse();
    }
    throw new Error(`unexpected fetch: ${method} ${url}`);
  }) as typeof fetch;
}

test("clicking Publish disables the button and shows 'Publishing…' while in flight, then a PR link on success", async () => {
  const listPagesCalls: number[] = [];
  let resolvePublish!: () => void;
  const gate = new Promise<void>((resolve) => {
    resolvePublish = resolve;
  });

  const api = makeApi(
    fakeFetch({
      listPagesCalls,
      publishResponse: () => {
        throw new Error("unused: publish() is overridden directly below");
      },
    }),
  );

  // Override publish() directly on the built api object so we control
  // exactly when it resolves (fakeFetch's synchronous Response can't model
  // an in-flight window).
  (api as any).publish = () =>
    gate.then(() => ({
      prUrl: `https://github.com/audacity/audacity.github.io/pull/7`,
      prNumber: 7,
    }));

  render(<App api={api} />);
  await waitFor(() => screen.getByTestId("page-basics/installing-ffmpeg"));

  const listCallsBefore = listPagesCalls.length;

  const publishButton = screen.getByTestId(
    "publish-button",
  ) as HTMLButtonElement;
  expect(publishButton.disabled).toBe(false);
  expect(publishButton.textContent).toBe("Publish");

  fireEvent.click(publishButton);

  await waitFor(() => {
    expect(publishButton.disabled).toBe(true);
    expect(publishButton.textContent).toBe("Publishing…");
  });

  resolvePublish();

  const link = (await waitFor(() =>
    screen.getByTestId("publish-result"),
  )) as HTMLAnchorElement;
  expect(link.textContent).toBe("PR #7 opened ↗");
  expect(link.getAttribute("href")).toBe(
    "https://github.com/audacity/audacity.github.io/pull/7",
  );
  expect(link.getAttribute("target")).toBe("_blank");

  await waitFor(() =>
    expect(listPagesCalls.length).toBeGreaterThan(listCallsBefore),
  );

  await waitFor(() => {
    expect(publishButton.disabled).toBe(false);
    expect(publishButton.textContent).toBe("Publish");
  });
});

test("a failed publish shows the server's error message and re-enables the button", async () => {
  const listPagesCalls: number[] = [];
  const api = makeApi(
    fakeFetch({
      listPagesCalls,
      publishResponse: () =>
        new Response(
          JSON.stringify({ error: "Nothing to publish — no draft changes" }),
          { status: 409, headers: { "content-type": "application/json" } },
        ),
    }),
  );

  render(<App api={api} />);
  await waitFor(() => screen.getByTestId("page-basics/installing-ffmpeg"));

  const publishButton = screen.getByTestId(
    "publish-button",
  ) as HTMLButtonElement;
  fireEvent.click(publishButton);

  const error = await waitFor(() => screen.getByTestId("publish-error"));
  expect(error.textContent).toContain("Nothing to publish");
  expect(screen.queryByTestId("publish-result")).toBeNull();
  expect(publishButton.disabled).toBe(false);
  expect(publishButton.textContent).toBe("Publish");
});
