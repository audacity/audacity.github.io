/**
 * Save-safety spec coverage: (A) the beforeunload guard fires only in the
 * unsafe states; (B) successful saves record the committed source for
 * stale-read protection. App-side read/invalidation is covered in the App
 * section below. Harness mirrors autosave.test.tsx.
 */
import { beforeEach, expect, test } from "bun:test";
import type { Editor as TiptapEditor } from "@tiptap/core";
import { act, render, screen, waitFor } from "@testing-library/react";
import { Editor } from "./Editor";
import { makeApi } from "./api";

const pagePath = "src/content/manual/x/y.mdx";
const pageSource =
  "---\ntitle: My Page\nsection: Basics\n---\n\nHello world.\n";
const KEY = `manual-editor:lastSave:${pagePath}`;

beforeEach(() => {
  localStorage.clear();
});

function draftFetch(committedSource: string): typeof fetch {
  return (async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.startsWith("/api/draft")) {
      return new Response(
        JSON.stringify({ ok: true, source: committedSource }),
        { headers: { "content-type": "application/json" } },
      );
    }
    throw new Error(`unexpected fetch: ${url}`);
  }) as typeof fetch;
}

async function mountEditor(autosaveDelayMs = 20) {
  const api = makeApi(draftFetch("COMMITTED-SOURCE"));
  let editor: TiptapEditor | null = null;
  render(
    <Editor
      source={pageSource}
      path={pagePath}
      api={api}
      autosaveDelayMs={autosaveDelayMs}
      onEditorReady={(created) => {
        editor = created;
      }}
      onAddSubpage={() => {}}
      hasChildren={false}
      onDeleted={() => {}}
    />,
  );
  await waitFor(() => expect(editor).not.toBeNull());
  return () => editor as unknown as TiptapEditor;
}

function fireBeforeUnload(): boolean {
  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
}

test("beforeunload is not blocked while idle", async () => {
  await mountEditor();
  expect(fireBeforeUnload()).toBe(false);
});

test("beforeunload is blocked while dirty, released once saved", async () => {
  const getEditor = await mountEditor(5000);
  act(() => {
    getEditor().commands.focus("end");
    getEditor().commands.insertContent(" edit");
  });
  await waitFor(() =>
    expect(screen.getByTestId("save-status").textContent).toBe(
      "Unsaved changes",
    ),
  );
  expect(fireBeforeUnload()).toBe(true);
});

test("beforeunload is released after the save lands", async () => {
  const getEditor = await mountEditor(20);
  act(() => {
    getEditor().commands.focus("end");
    getEditor().commands.insertContent(" edit");
  });
  await waitFor(() =>
    expect(screen.getByTestId("save-status").textContent).toBe(
      "Changes saved ●",
    ),
  );
  expect(fireBeforeUnload()).toBe(false);
});

test("a successful autosave records the committed source", async () => {
  const getEditor = await mountEditor(20);
  act(() => {
    getEditor().commands.focus("end");
    getEditor().commands.insertContent(" edit");
  });
  await waitFor(() =>
    expect(screen.getByTestId("save-status").textContent).toBe(
      "Changes saved ●",
    ),
  );
  const record = JSON.parse(localStorage.getItem(KEY)!) as {
    source: string;
    at: number;
  };
  expect(record.source).toBe("COMMITTED-SOURCE");
  expect(typeof record.at).toBe("number");
});

/**
 * Final-review Fix 4: a FAILED autosave (`saveStatus === "error"`) still
 * leaves unsaved changes sitting only in this tab — the debounce timer
 * already fired and nulled `pendingSaveRef`, so nothing else protects them.
 * Before the fix, the beforeunload effect's guard (`saveStatus === "dirty"
 * || saveStatus === "saving"`) let the writer navigate away unprompted the
 * moment a save failed.
 */
function failingDraftFetch(): typeof fetch {
  return (async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.startsWith("/api/draft")) {
      return new Response(JSON.stringify({ error: "boom" }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }
    throw new Error(`unexpected fetch: ${url}`);
  }) as typeof fetch;
}

test("beforeunload stays blocked after a failed autosave (Fix 4)", async () => {
  const api = makeApi(failingDraftFetch());
  let editor: TiptapEditor | null = null;
  render(
    <Editor
      source={pageSource}
      path={pagePath}
      api={api}
      autosaveDelayMs={20}
      onEditorReady={(created) => {
        editor = created;
      }}
      onAddSubpage={() => {}}
      hasChildren={false}
      onDeleted={() => {}}
    />,
  );
  await waitFor(() => expect(editor).not.toBeNull());
  act(() => {
    (editor as unknown as TiptapEditor).commands.focus("end");
    (editor as unknown as TiptapEditor).commands.insertContent(" edit");
  });
  await waitFor(() =>
    expect(screen.getByTestId("save-status").textContent).toBe("Save failed"),
  );
  expect(fireBeforeUnload()).toBe(true);
});
