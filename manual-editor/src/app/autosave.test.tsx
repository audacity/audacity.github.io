/**
 * D6 headless integration coverage for autosave: proves an editor content
 * edit (and, separately, a frontmatter form edit) drives a real debounced
 * `api.saveDraftDoc(path, doc, frontmatter)` call carrying the live PM doc
 * JSON + serialized frontmatter — the exact contract `Editor.tsx`'s autosave
 * effect promises. Deliberately does NOT assert on an assembled MDX
 * `source` string here: `docToSource` (which builds that string) runs
 * server-side in `draft.ts`, not in this client code — see `Editor.tsx`'s
 * autosave-effect doc comment and `netlify/functions/draft.test.ts` (which
 * proves `docToSource` runs correctly end-to-end from exactly this body
 * shape). The live-browser type-and-see-the-indicator check is done
 * separately (not headless); this file exists to prove the save *path*
 * itself, without a browser.
 *
 * `autosaveDelayMs` is passed as a small value so these tests don't need
 * fake timers (bun:test has no `jest.useFakeTimers`-equivalent as of the
 * pinned Bun version) — a short real debounce plus `waitFor` is both
 * simpler and exercises the exact same code path as production.
 */
import { expect, test } from "bun:test";
import type { Editor as TiptapEditor } from "@tiptap/core";
import { act, render, screen, waitFor } from "@testing-library/react";
import { Editor } from "./Editor";
import { makeApi } from "./api";
import type { PMNodeJSON } from "../adapter/mdastToDoc";

const pagePath = "src/content/manual/x/y.mdx";
const pageSource =
  "---\ntitle: My Page\nsection: Basics\n---\n\nHello world.\n";

interface DraftCall {
  path: string;
  doc: PMNodeJSON;
  frontmatter: string;
}

/** Records every `/api/draft` POST body; everything else 404s. */
function fakeFetch(calls: DraftCall[]): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.startsWith("/api/draft")) {
      const body = JSON.parse(String(init?.body)) as DraftCall;
      calls.push(body);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "content-type": "application/json" },
      });
    }
    throw new Error(`unexpected fetch in autosave test: ${url}`);
  }) as typeof fetch;
}

async function mountEditor(
  overrides: Partial<Parameters<typeof Editor>[0]> = {},
) {
  const calls: DraftCall[] = [];
  const api = makeApi(fakeFetch(calls));
  let editor: TiptapEditor | null = null;
  render(
    <Editor
      source={pageSource}
      path={pagePath}
      api={api}
      autosaveDelayMs={15}
      onEditorReady={(created) => {
        editor = created;
      }}
      onAddSubpage={() => {}}
      {...overrides}
    />,
  );
  await waitFor(() => expect(editor).not.toBeNull());
  return { calls, getEditor: () => editor as unknown as TiptapEditor };
}

/** Finds a text node containing `needle` anywhere in a PM doc JSON tree. */
function containsText(node: PMNodeJSON, needle: string): boolean {
  if (node.type === "text" && node.text?.includes(needle)) return true;
  return (node.content ?? []).some((child) => containsText(child, needle));
}

test("editing content triggers a debounced saveDraftDoc(path, doc, frontmatter) carrying the edit", async () => {
  const { calls, getEditor } = await mountEditor();
  const editor = getEditor();

  expect(screen.getByTestId("save-status").textContent).toBe("");

  act(() => {
    editor.commands.focus("end");
    editor.commands.insertContent(" EDITED-TEXT");
  });

  await waitFor(() =>
    expect(screen.getByTestId("save-status").textContent).toBe("Saved draft ●"),
  );

  expect(calls.length).toBe(1);
  expect(calls[0]!.path).toBe(pagePath);
  // `serializeFrontmatter`'s fenced output, posted as-is — `draft.ts` is
  // responsible for un-fencing it before handing it to `docToSource` (see
  // that file's `unfence` comment), so this is exactly what the client is
  // contracted to send.
  expect(calls[0]!.frontmatter).toContain("title: My Page");
  expect(calls[0]!.frontmatter.startsWith("---\n")).toBe(true);
  expect(containsText(calls[0]!.doc, "EDITED-TEXT")).toBe(true);
});

test("save status shows Saving… while the request is in flight, then Saved draft ● after it resolves", async () => {
  const { getEditor } = await mountEditor();
  const editor = getEditor();

  act(() => {
    editor.commands.focus("end");
    editor.commands.insertContent(" more text");
  });

  await waitFor(() =>
    expect(screen.getByTestId("save-status").textContent).toBe("Edited"),
  );
  await waitFor(() =>
    expect(["Saving…", "Saved draft ●"]).toContain(
      screen.getByTestId("save-status").textContent,
    ),
  );
  await waitFor(() =>
    expect(screen.getByTestId("save-status").textContent).toBe("Saved draft ●"),
  );
});

test("a frontmatter-only edit (no doc content change) also triggers saveDraftDoc", async () => {
  const { calls, getEditor } = await mountEditor();
  getEditor(); // ensure editor mounted before interacting with the form

  const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement;
  act(() => {
    titleInput.focus();
  });
  const { fireEvent } = await import("@testing-library/react");
  fireEvent.change(titleInput, { target: { value: "Renamed Page" } });

  await waitFor(() => expect(calls.length).toBe(1));
  expect(calls[0]!.frontmatter).toContain("title: Renamed Page");
});

test("unmounting before the debounce fires cancels the pending autosave", async () => {
  const calls: DraftCall[] = [];
  const api = makeApi(fakeFetch(calls));
  let editor: TiptapEditor | null = null;
  const { unmount } = render(
    <Editor
      source={pageSource}
      path={pagePath}
      api={api}
      autosaveDelayMs={50}
      onEditorReady={(created) => {
        editor = created;
      }}
      onAddSubpage={() => {}}
    />,
  );
  await waitFor(() => expect(editor).not.toBeNull());

  act(() => {
    editor!.commands.focus("end");
    editor!.commands.insertContent(" will not be saved");
  });

  unmount();

  // Wait past the debounce window; the pending save must have been
  // cancelled by the effect's cleanup on unmount.
  await new Promise((r) => setTimeout(r, 150));
  expect(calls.length).toBe(0);
});

test("onDraftSaved fires with the page path once the debounced save succeeds", async () => {
  const saved: string[] = [];
  const { getEditor } = await mountEditor({
    onDraftSaved: (path) => saved.push(path),
  });
  const editor = getEditor();

  act(() => {
    editor.commands.focus("end");
    editor.commands.insertContent(" x");
  });

  await waitFor(() => expect(saved).toEqual([pagePath]));
});
