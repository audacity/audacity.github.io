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
 * simulating an in-flight save. `resetGate` (when provided) does the same
 * for /api/reset. `resetStatus` (default 200) lets a test force the reset
 * request to fail.
 */
function fakeFetch(
  calls: RecordedCall[],
  draftGate?: Promise<void>,
  resetGate?: Promise<void>,
  resetStatus = 200,
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
      if (resetGate) await resetGate;
      if (resetStatus !== 200) {
        return new Response(JSON.stringify({ error: "reset failed" }), {
          status: resetStatus,
          headers: { "content-type": "application/json" },
        });
      }
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
  resetGate?: Promise<void>,
  resetStatus = 200,
) {
  const api = makeApi(fakeFetch(calls, draftGate, resetGate, resetStatus));
  let editor: TiptapEditor | null = null;
  const rendered = render(
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
  return {
    calls,
    getEditor: () => editor as unknown as TiptapEditor,
    unmount: rendered.unmount,
  };
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
    autosaveDelayMs: 200, // short enough that a broken (no-op) discard
    // would still fire the draft save well within the post-reset settle
    // window below, catching a discard that silently left the timer armed.
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
  // Settle past the (discarded) debounce's original 200ms delay: a broken
  // discard-as-no-op would fire the draft save inside this window.
  await new Promise((r) => setTimeout(r, 350));
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

test("post-confirm typing cannot resurrect the discarded edit (Fix 1: resettingRef guard)", async () => {
  let releaseReset!: () => void;
  const resetGate = new Promise<void>((resolve) => {
    releaseReset = resolve;
  });
  const resets: string[] = [];
  const calls: RecordedCall[] = [];
  const { getEditor, unmount } = await mountEditor(
    { autosaveDelayMs: 30, onReset: (p) => resets.push(p) },
    calls,
    undefined,
    resetGate,
  );
  const editor = getEditor();

  act(() => {
    editor.commands.focus("end");
    editor.commands.insertContent(" doomed edit");
  });

  fireEvent.click(screen.getByTestId("editor-reset-page"));
  fireEvent.click(screen.getByTestId("editor-reset-confirm"));

  // While the /api/reset response is gated (reset still in flight), type
  // ANOTHER edit. Without the `resettingRef` guard this would bump
  // `saveVersion` and arm a fresh autosave.
  act(() => {
    editor.commands.insertContent(" resurrection attempt");
  });

  releaseReset();
  await waitFor(() => expect(resets).toEqual([pagePath]));

  // Mirrors `App` unmounting the Editor once `onReset` fires. Without the
  // guard on the flush-on-unmount effect, this unmount would flush the
  // edit typed above straight to `/api/draft`, resurrecting it after the
  // reset commit.
  unmount();

  await new Promise((r) => setTimeout(r, 100));
  expect(calls.map((c) => c.url)).toEqual(["/api/reset"]);
});

test("failed reset re-arms autosave protection for the still-present edit (Fix 2)", async () => {
  const calls: RecordedCall[] = [];
  const { getEditor } = await mountEditor(
    { autosaveDelayMs: 100 },
    calls,
    undefined,
    undefined,
    500, // /api/reset fails
  );
  const editor = getEditor();

  act(() => {
    editor.commands.focus("end");
    editor.commands.insertContent(" edit that must survive");
  });

  // Reset+confirm immediately, before the 100ms debounce fires, so the
  // edit is discarded (not autosaved) ahead of the failed reset.
  fireEvent.click(screen.getByTestId("editor-reset-page"));
  fireEvent.click(screen.getByTestId("editor-reset-confirm"));

  await waitFor(() =>
    expect(screen.getByTestId("save-status").textContent).toBe("Reset failed"),
  );

  // The re-arm bumps `saveVersion`, so a fresh autosave for the
  // still-present edit should fire shortly after the failed reset.
  await waitFor(
    () => expect(calls.some((c) => c.url === "/api/draft")).toBe(true),
    { timeout: 500 },
  );

  expect(calls.map((c) => c.url)).toEqual(["/api/reset", "/api/draft"]);
});

test("cross-instance flush: reset on a freshly remounted instance still awaits a save that outlived the OLD instance (Fix 2: module-scope registry)", async () => {
  let releaseDraft!: () => void;
  const draftGate = new Promise<void>((resolve) => {
    releaseDraft = resolve;
  });
  const calls: RecordedCall[] = [];

  // Long debounce: the timer never fires on its own within this test, so
  // the ONLY way the draft save goes out is the unmount-flush effect below.
  const first = await mountEditor({ autosaveDelayMs: 5000 }, calls, draftGate);
  const editor1 = first.getEditor();

  act(() => {
    editor1.commands.focus("end");
    editor1.commands.insertContent(" edit that outlives this instance");
  });

  // Unmounting fires the pending autosave (gated by draftGate) instead of
  // dropping it — see the unmount-flush effect's doc comment in Editor.tsx.
  // The request lands on the wire and is registered in the module-scope
  // registry keyed by `pagePath`, which survives this instance going away.
  first.unmount();
  expect(calls.map((c) => c.url)).toEqual(["/api/draft"]);

  // A fresh Editor instance for the SAME path: brand-new (empty)
  // per-instance refs. Without the module-scope registry this instance has
  // no way to know about the old instance's still-in-flight save.
  const resets: string[] = [];
  const second = await mountEditor({ onReset: (p) => resets.push(p) }, calls);

  fireEvent.click(screen.getByTestId("editor-reset-page"));
  fireEvent.click(screen.getByTestId("editor-reset-confirm"));

  // The reset request must NOT be issued while the old instance's save is
  // still unresolved.
  await new Promise((r) => setTimeout(r, 50));
  expect(calls.map((c) => c.url)).toEqual(["/api/draft"]);

  releaseDraft();
  await waitFor(() => expect(resets).toEqual([pagePath]));
  expect(calls.map((c) => c.url)).toEqual(["/api/draft", "/api/reset"]);

  second.unmount();
});

test("post-confirm frontmatter edit cannot resurrect the discarded edit (Fix: handleFrontmatterChange guard)", async () => {
  let releaseReset!: () => void;
  const resetGate = new Promise<void>((resolve) => {
    releaseReset = resolve;
  });
  const resets: string[] = [];
  const calls: RecordedCall[] = [];
  const { getEditor, unmount } = await mountEditor(
    { autosaveDelayMs: 30, onReset: (p) => resets.push(p) },
    calls,
    undefined,
    resetGate,
  );
  const editor = getEditor();

  // Open the frontmatter form so the title input is reachable.
  fireEvent.click(screen.getByTestId("edit-page-details"));

  act(() => {
    editor.commands.focus("end");
    editor.commands.insertContent(" doomed edit");
  });

  fireEvent.click(screen.getByTestId("editor-reset-page"));
  fireEvent.click(screen.getByTestId("editor-reset-confirm"));

  // While the /api/reset response is gated (reset still in flight), edit
  // the frontmatter title. Without the `handleFrontmatterChange` guard
  // this would bump `saveVersion` and arm a fresh autosave.
  fireEvent.change(screen.getByLabelText(/title/i), {
    target: { value: "Resurrected Title" },
  });

  releaseReset();
  await waitFor(() => expect(resets).toEqual([pagePath]));

  // Mirrors `App` unmounting the Editor once `onReset` fires.
  unmount();

  await new Promise((r) => setTimeout(r, 350));
  expect(calls.map((c) => c.url)).toEqual(["/api/reset"]);
});
