/**
 * UI polish 1: covers the two header refinements to `Editor.tsx`.
 *
 * 1. The frontmatter form is collapsed by default behind an
 *    `edit-page-details` toggle, with the page title rendered as a heading
 *    in the collapsed row (live-updating from the form while expanded, and
 *    falling back to a muted "Untitled" placeholder for an empty title).
 * 2. The save-status indicator lives in a floating pill
 *    (`save-status-pill`) rather than inline in the header, hidden while
 *    idle but still exposing the existing `save-status` testid/state
 *    classes other suites (`autosave.test.tsx`, `deletePage.test.tsx`)
 *    already assert on.
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
const untitledPageSource = "---\nsection: Basics\n---\n\nHello world.\n";

/** No-op fetch: these tests never let a save request actually fire. */
function fakeFetch(): typeof fetch {
  return (async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    void init;
    throw new Error(`unexpected fetch in editorHeader test: ${String(input)}`);
  }) as typeof fetch;
}

async function mountEditor(source: string) {
  let editor: TiptapEditor | null = null;
  render(
    <Editor
      source={source}
      path={pagePath}
      api={makeApi(fakeFetch())}
      onEditorReady={(created) => {
        editor = created;
      }}
      onAddSubpage={() => {}}
      hasChildren={false}
      onDeleted={() => {}}
    />,
  );
  await waitFor(() => expect(editor).not.toBeNull());
  return { getEditor: () => editor as unknown as TiptapEditor };
}

test("header is collapsed by default: form is absent, title heading shows the frontmatter title", async () => {
  await mountEditor(pageSource);

  expect(screen.getByTestId("page-title").textContent).toBe("My Page");
  expect(screen.queryByTestId("frontmatter-form")).toBeNull();

  const toggle = screen.getByTestId("edit-page-details");
  expect(toggle.textContent).toContain("Edit details");
  expect(toggle.getAttribute("aria-expanded")).toBe("false");
});

test("clicking Edit details reveals the frontmatter form and flips the toggle to Done", async () => {
  await mountEditor(pageSource);

  fireEvent.click(screen.getByTestId("edit-page-details"));

  expect(screen.getByTestId("frontmatter-form")).toBeDefined();
  const toggle = screen.getByTestId("edit-page-details");
  expect(toggle.textContent).toBe("Done");
  expect(toggle.getAttribute("aria-expanded")).toBe("true");

  // Clicking again collapses it back.
  fireEvent.click(toggle);
  expect(screen.queryByTestId("frontmatter-form")).toBeNull();
  expect(
    screen.getByTestId("edit-page-details").getAttribute("aria-expanded"),
  ).toBe("false");
});

test("editing the title field while expanded live-updates the collapsed-row heading", async () => {
  await mountEditor(pageSource);

  fireEvent.click(screen.getByTestId("edit-page-details"));
  const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement;
  fireEvent.change(titleInput, { target: { value: "Renamed Live" } });

  expect(screen.getByTestId("page-title").textContent).toBe("Renamed Live");
});

test("an empty title shows a muted Untitled placeholder in the collapsed row", async () => {
  await mountEditor(untitledPageSource);

  expect(screen.getByTestId("page-title").textContent).toBe("Untitled");
});

test("the save-status pill hides while idle and exposes the save-status testid once dirtied", async () => {
  const { getEditor } = await mountEditor(pageSource);
  const editor = getEditor();

  const pill = screen.getByTestId("save-status-pill");
  expect(pill.className).toContain("editor-save-pill--hidden");
  expect(screen.getByTestId("save-status").textContent).toBe("");

  act(() => {
    editor.commands.focus("end");
    editor.commands.insertContent(" edited");
  });

  await waitFor(() =>
    expect(screen.getByTestId("save-status").textContent).toBe(
      "Unsaved changes",
    ),
  );
  expect(screen.getByTestId("save-status-pill").className).not.toContain(
    "editor-save-pill--hidden",
  );
});
