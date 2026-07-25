/**
 * The "Reset to published" header flow (see the reset-to-published spec):
 * visibility gating, the confirm step, and — the correctness core — the
 * autosave-ordering contract: a pending debounced autosave is DISCARDED
 * (never fired), and an in-flight save is awaited before /api/reset goes
 * out. Harness mirrors autosave.test.tsx (short real debounce, recording
 * fake fetch).
 */
import { expect, test } from "bun:test";
import type { Editor as TiptapEditor } from "@tiptap/core";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { Editor } from "./Editor";
import { makeApi } from "./api";

const pagePath = "src/content/manual/x/y.mdx";
const pageSource =
  "---\ntitle: My Page\nsection: Basics\n---\n\nHello world.\n";

interface RecordedCall {
  url: string;
  body: unknown;
}

/**
 * Records /api/draft and /api/reset calls in arrival order. `draftGate`
 * (when provided) delays draft responses until the test resolves it —
 * simulating an in-flight save.
 */
function fakeFetch(
  calls: RecordedCall[],
  draftGate?: Promise<void>,
): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    if (url.startsWith("/api/draft")) {
      calls.push({ url: "/api/draft", body });
      if (draftGate) await draftGate;
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "content-type": "application/json" },
      });
    }
    if (url.startsWith("/api/reset")) {
      calls.push({ url: "/api/reset", body });
      return new Response(
        JSON.stringify({ path: pagePath, source: pageSource }),
        { headers: { "content-type": "application/json" } },
      );
    }
    throw new Error(`unexpected fetch in reset test: ${url}`);
  }) as typeof fetch;
}

async function mountEditor(
  overrides: Partial<Parameters<typeof Editor>[0]> = {},
  calls: RecordedCall[] = [],
  draftGate?: Promise<void>,
) {
  const api = makeApi(fakeFetch(calls, draftGate));
  let editor: TiptapEditor | null = null;
  render(
    <Editor
      source={pageSource}
      path={pagePath}
      api={api}
      autosaveDelayMs={30}
      onEditorReady={(created) => {
        editor = created;
      }}
      onAddSubpage={() => {}}
      hasChildren={false}
      onDeleted={() => {}}
      hasDraft={true}
      existsOnBase={true}
      {...overrides}
    />,
  );
  await waitFor(() => expect(editor).not.toBeNull());
  return { calls, getEditor: () => editor as unknown as TiptapEditor };
}

test("reset button shows only when hasDraft AND existsOnBase", async () => {
  await mountEditor({ hasDraft: true, existsOnBase: true });
  expect(screen.getByTestId("editor-reset-page")).toBeDefined();
});

test("reset button hidden for a clean page", async () => {
  await mountEditor({ hasDraft: false, existsOnBase: true });
  expect(screen.queryByTestId("editor-reset-page")).toBeNull();
});

test("reset button hidden for a never-published page", async () => {
  await mountEditor({ hasDraft: true, existsOnBase: false });
  expect(screen.queryByTestId("editor-reset-page")).toBeNull();
});

test("clicking reset shows the confirm step; cancel returns without any API call", async () => {
  const { calls } = await mountEditor();
  fireEvent.click(screen.getByTestId("editor-reset-page"));
  expect(screen.getByTestId("editor-reset-confirm")).toBeDefined();
  fireEvent.click(screen.getByTestId("editor-reset-cancel"));
  expect(screen.queryByTestId("editor-reset-confirm")).toBeNull();
  expect(screen.getByTestId("editor-reset-page")).toBeDefined();
  expect(calls.length).toBe(0);
});

test("confirming reset DISCARDS a pending autosave: reset fires, the draft save never does", async () => {
  const resets: string[] = [];
  const { calls, getEditor } = await mountEditor({
    autosaveDelayMs: 5000, // long debounce: stays pending until reset
    onReset: (p) => resets.push(p),
  });
  const editor = getEditor();

  act(() => {
    editor.commands.focus("end");
    editor.commands.insertContent(" doomed edit");
  });

  fireEvent.click(screen.getByTestId("editor-reset-page"));
  fireEvent.click(screen.getByTestId("editor-reset-confirm"));

  await waitFor(() => expect(resets).toEqual([pagePath]));
  // Give the (discarded) debounce ample time to have fired if the discard
  // were broken — autosaveDelayMs is 5s, but a broken discard-as-flush
  // would fire immediately.
  await new Promise((r) => setTimeout(r, 100));
  expect(calls.map((c) => c.url)).toEqual(["/api/reset"]);
});

test("confirming reset during an in-flight save waits for it to settle first", async () => {
  let releaseDraft!: () => void;
  const draftGate = new Promise<void>((resolve) => {
    releaseDraft = resolve;
  });
  const resets: string[] = [];
  const calls: RecordedCall[] = [];
  const { getEditor } = await mountEditor(
    { autosaveDelayMs: 15, onReset: (p) => resets.push(p) },
    calls,
    draftGate,
  );
  const editor = getEditor();

  act(() => {
    editor.commands.focus("end");
    editor.commands.insertContent(" racing edit");
  });

  // Wait until the debounce fired and the save request is in flight
  // (recorded but unresolved).
  await waitFor(() =>
    expect(calls.some((c) => c.url === "/api/draft")).toBe(true),
  );

  fireEvent.click(screen.getByTestId("editor-reset-page"));
  fireEvent.click(screen.getByTestId("editor-reset-confirm"));

  // The reset request must NOT be issued while the save is unresolved.
  await new Promise((r) => setTimeout(r, 50));
  expect(calls.map((c) => c.url)).toEqual(["/api/draft"]);

  releaseDraft();
  await waitFor(() => expect(resets).toEqual([pagePath]));
  expect(calls.map((c) => c.url)).toEqual(["/api/draft", "/api/reset"]);
});
