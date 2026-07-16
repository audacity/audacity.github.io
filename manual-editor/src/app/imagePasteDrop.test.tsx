/**
 * Wiring coverage for `Editor.tsx`'s `editorProps.handlePaste`/`handleDrop`
 * (Task 2) — proves the actual registered ProseMirror hooks, not just
 * `imageUpload.ts`'s flow function in isolation (`imageUpload.test.tsx`
 * covers that). Invokes the hooks the same way ProseMirror itself would:
 * via `view.someProp(name, f => f(...))` (see `prosemirror-view`'s
 * `EditorView.someProp` — `editorProps` passed to `useEditor` become the
 * view's own direct props, which `someProp` checks), with synthetic
 * `ClipboardEvent`/`DragEvent`-shaped objects standing in for the real
 * browser events happy-dom doesn't construct with `dataTransfer`/
 * `clipboardData` populated.
 *
 * The `moved` guard is the critical regression to prove: `Editor.tsx`
 * mounts the Notion-style block `DragHandle`, which relies on ProseMirror's
 * OWN default `handleDrop` behavior (node relocation) for drags that
 * started inside the same view — signaled by `moved: true`. If our image
 * `handleDrop` didn't check `moved` first, a block-handle drag that happens
 * to end over/near other content would risk being swallowed by this image
 * flow instead of falling through to the default reorder. The dedicated
 * test below drives `handleDrop` with `moved: true` (no different from a
 * real drag-handle move — this hook has no way to distinguish "started
 * inside" drags other than that flag) and proves it's an immediate,
 * unexamined `false` — never even reading `dataTransfer`.
 */
import { afterEach, beforeEach, expect, test } from "bun:test";
import type { Editor as TiptapEditor } from "@tiptap/core";
import { Slice } from "@tiptap/pm/model";
import { render, screen, waitFor } from "@testing-library/react";
import { Editor } from "./Editor";
import { makeApi } from "./api";

const pagePath = "src/content/manual/basics/x.mdx";
const pageSource = "---\ntitle: X\nsection: Basics\n---\n\nHello world.\n";

interface UploadCall {
  pageSlug: string;
  filename: string;
  dataBase64: string;
}

function fakeFetch(calls: UploadCall[], responsePath: string): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url === "/api/image") {
      calls.push(JSON.parse(String(init?.body)) as UploadCall);
      return new Response(JSON.stringify({ path: responsePath }), {
        headers: { "content-type": "application/json" },
      });
    }
    throw new Error(`unexpected fetch in imagePasteDrop test: ${url}`);
  }) as typeof fetch;
}

async function mountEditor(calls: UploadCall[], responsePath: string) {
  const api = makeApi(fakeFetch(calls, responsePath));
  let editor: TiptapEditor | null = null;
  render(
    <Editor
      source={pageSource}
      path={pagePath}
      api={api}
      onEditorReady={(created) => {
        editor = created;
      }}
      onAddSubpage={() => {}}
      hasChildren={false}
      onDeleted={() => {}}
    />,
  );
  await waitFor(() => screen.getByTestId("editor"));
  await waitFor(() => expect(editor).not.toBeNull());
  return editor as unknown as TiptapEditor;
}

/** Invokes a `view.someProp`-registered hook and captures its own return
 * value (distinct from `someProp`'s aggregate return, which only surfaces
 * truthy results — see this file's doc comment). */
function callProp<Args extends unknown[]>(
  editor: TiptapEditor,
  name: "handlePaste" | "handleDrop",
  ...args: Args
): boolean | undefined {
  let captured: boolean | undefined;
  editor.view.someProp(name, (fn) => {
    // @ts-expect-error -- args shape matches the specific prop being invoked.
    captured = fn(editor.view, ...args);
    return true; // stop someProp from trying any other registered handler
  });
  return captured;
}

function imageCount(editor: TiptapEditor): number {
  let count = 0;
  editor.state.doc.descendants((node) => {
    if (node.type.name === "image") count += 1;
  });
  return count;
}

let originalPrompt: typeof window.prompt;
let promptReturn: string | null;
let promptCallCount: number;

beforeEach(() => {
  originalPrompt = window.prompt;
  promptCallCount = 0;
  promptReturn = "An image";
  window.prompt = (() => {
    promptCallCount += 1;
    return promptReturn;
  }) as typeof window.prompt;
});

afterEach(() => {
  window.prompt = originalPrompt;
});

test("handlePaste with a pasted image file uploads it and inserts an image node", async () => {
  const calls: UploadCall[] = [];
  const responsePath = "src/assets/img/manual/basics/x/pasted-ab12.png";
  const editor = await mountEditor(calls, responsePath);

  const file = new File(["fake-bytes"], "pasted.png", { type: "image/png" });
  const fakeEvent = {
    clipboardData: { files: [file] },
  } as unknown as ClipboardEvent;

  const handled = callProp(editor, "handlePaste", fakeEvent, Slice.empty);

  expect(handled).toBe(true);
  await waitFor(() => expect(calls.length).toBe(1));
  expect(calls[0]!.filename).toBe("pasted.png");
  expect(calls[0]!.pageSlug).toBe("basics/x");
  await waitFor(() => expect(imageCount(editor)).toBe(1));
});

test("handlePaste with no files falls through (returns false, no upload)", async () => {
  const calls: UploadCall[] = [];
  const editor = await mountEditor(
    calls,
    "src/assets/img/manual/basics/x/n.png",
  );

  const fakeEvent = { clipboardData: null } as unknown as ClipboardEvent;
  const handled = callProp(editor, "handlePaste", fakeEvent, Slice.empty);

  expect(handled).toBe(false);
  expect(calls.length).toBe(0);
  expect(promptCallCount).toBe(0);
});

test("handleDrop with a dropped image file (moved: false) uploads it and inserts an image node", async () => {
  const calls: UploadCall[] = [];
  const responsePath = "src/assets/img/manual/basics/x/dropped-cd34.png";
  const editor = await mountEditor(calls, responsePath);

  const file = new File(["fake-bytes"], "dropped.png", { type: "image/png" });
  let prevented = false;
  const fakeEvent = {
    dataTransfer: { files: [file] },
    clientX: 5,
    clientY: 5,
    preventDefault: () => {
      prevented = true;
    },
  } as unknown as DragEvent;

  const handled = callProp(editor, "handleDrop", fakeEvent, Slice.empty, false);

  expect(handled).toBe(true);
  expect(prevented).toBe(true);
  await waitFor(() => expect(calls.length).toBe(1));
  expect(calls[0]!.filename).toBe("dropped.png");
  await waitFor(() => expect(imageCount(editor)).toBe(1));
});

test("handleDrop with moved: true (internal drag-handle move) is an immediate false — never uploads", async () => {
  const calls: UploadCall[] = [];
  const editor = await mountEditor(
    calls,
    "src/assets/img/manual/basics/x/n.png",
  );

  // Same file/event shape as the successful drop above — the ONLY
  // difference is `moved: true`. If the guard were missing (or checked
  // after reading `dataTransfer`), this would behave identically to the
  // drop-succeeds test above; the guard makes it a no-op instead.
  const file = new File(["fake-bytes"], "would-be-dropped.png", {
    type: "image/png",
  });
  const fakeEvent = {
    dataTransfer: { files: [file] },
    clientX: 5,
    clientY: 5,
    preventDefault: () => {
      throw new Error(
        "preventDefault must not be called for an internal (moved) drop",
      );
    },
  } as unknown as DragEvent;

  const handled = callProp(editor, "handleDrop", fakeEvent, Slice.empty, true);

  expect(handled).toBe(false);
  // Give any (incorrectly) fired async flow a turn to run before asserting
  // nothing happened.
  await new Promise((resolve) => setTimeout(resolve, 20));
  expect(calls.length).toBe(0);
  expect(promptCallCount).toBe(0);
  expect(imageCount(editor)).toBe(0);
});

test("handleDrop with no files falls through (returns false, no upload)", async () => {
  const calls: UploadCall[] = [];
  const editor = await mountEditor(
    calls,
    "src/assets/img/manual/basics/x/n.png",
  );

  const fakeEvent = { dataTransfer: null } as unknown as DragEvent;
  const handled = callProp(editor, "handleDrop", fakeEvent, Slice.empty, false);

  expect(handled).toBe(false);
  expect(calls.length).toBe(0);
});
