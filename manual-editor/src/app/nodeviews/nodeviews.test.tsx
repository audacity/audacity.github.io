import { expect, test } from "bun:test";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { EditorContent, useEditor } from "@tiptap/react";
import type { Editor as TiptapEditor } from "@tiptap/core";
import { Editor } from "../Editor";
import { buildAppExtensions } from "../editorExtensions";
import { mdastToDoc } from "../../adapter/mdastToDoc";
import { parseMdx } from "../../mdx/pipeline";
import { resolveActiveTabIndex } from "./tabsActiveStore";

/**
 * Mounts a self-contained (not corpus-derived) MDX doc through the real
 * `Editor` component — same path `App.test.tsx` exercises — so these tests
 * cover the whole chain (parseMdx -> mdastToDoc -> buildAppExtensions ->
 * TipTap `useEditor`) for the two D3 node views, not just the components in
 * isolation. Uses a small synthetic source (not `installing-ffmpeg.mdx`)
 * to keep the doc under test minimal and the assertions legible; the full
 * corpus (including the real heavy-Tabs page) is separately covered by
 * `editor-mount.test.tsx`'s schema-validity + mount gate.
 */
const source = `# Test page

<Tabs>
  <Tab label="Windows">

Windows steps.

  </Tab>
  <Tab label="macOS">

macOS steps.

  </Tab>
</Tabs>

<UIMap client:load src="foo.png" hotspots={[{ n: 1 }]} />
`;

test("tabs node view renders switchable headers and shows only the active panel", async () => {
  render(
    <Editor
      source={source}
      path="tabs-test"
      onAddSubpage={() => {}}
      hasChildren={false}
      onDeleted={() => {}}
    />,
  );
  const editorEl = await waitFor(() => screen.getByTestId("editor"));

  const tabs = await waitFor(() => within(editorEl).getByTestId("tabs"));
  const panels = within(tabs).getAllByTestId("tab");
  expect(panels).toHaveLength(2);

  // First panel active by default, second hidden.
  expect(panels[0]?.getAttribute("data-active")).toBe("true");
  expect(panels[1]?.getAttribute("data-active")).toBe("false");
  expect(panels[0]?.textContent).toContain("Windows steps.");

  const headers = within(tabs).getAllByRole("button");
  expect(headers.map((h) => h.textContent)).toEqual(["Windows", "macOS"]);

  fireEvent.click(headers[1]!);

  await waitFor(() => {
    expect(panels[0]?.getAttribute("data-active")).toBe("false");
    expect(panels[1]?.getAttribute("data-active")).toBe("true");
  });
});

/**
 * A three-tab source for the tab-deletion regression below — the plain
 * two-tab `source` above can't reproduce the bug because deleting either of
 * its two tabs never leaves an active index pointing past the end.
 */
const threeTabSource = `# Test page

<Tabs>
  <Tab label="Windows">

Windows steps.

  </Tab>
  <Tab label="macOS">

macOS steps.

  </Tab>
  <Tab label="Linux">

Linux steps.

  </Tab>
</Tabs>
`;

/**
 * Same construction `Editor.tsx` uses internally (`parseMdx` ->
 * `mdastToDoc` -> `buildAppExtensions` -> `useEditor`), duplicated here
 * rather than reused from `Editor.tsx` because that component doesn't (and
 * per D3's scope, shouldn't need to) expose its underlying TipTap `Editor`
 * instance — the regression test below needs direct access to dispatch a
 * real deletion transaction via `editor.commands`, not just the rendered
 * DOM `Editor.tsx` exposes to every other test in this file.
 */
function TestHarness({
  source: harnessSource,
  onReady,
}: {
  source: string;
  onReady: (editor: TiptapEditor) => void;
}) {
  const { doc } = mdastToDoc(parseMdx(harnessSource));
  const editor = useEditor(
    {
      extensions: buildAppExtensions(),
      content: doc,
      onCreate: ({ editor: created }) => onReady(created),
    },
    [],
  );
  return (
    <div data-testid="editor">
      <EditorContent editor={editor} />
    </div>
  );
}

test("deleting the active (last) tab leaves exactly one panel active, not zero", async () => {
  let editor: TiptapEditor | null = null;
  render(
    <TestHarness
      source={threeTabSource}
      onReady={(created) => {
        editor = created;
      }}
    />,
  );
  const editorEl = await waitFor(() => screen.getByTestId("editor"));
  const tabs = await waitFor(() => within(editorEl).getByTestId("tabs"));

  let panels = within(tabs).getAllByTestId("tab");
  expect(panels).toHaveLength(3);

  // Activate the last tab (index 2).
  const headers = within(tabs).getAllByRole("button");
  fireEvent.click(headers[2]!);
  await waitFor(() => {
    expect(panels[2]?.getAttribute("data-active")).toBe("true");
  });

  // Delete that same (now-active, and last) tab via a real editor
  // transaction — the ordinary-editing path (e.g. Backspace across a tab
  // boundary) that leaves `tabsActiveStore`'s index pointing past the new
  // end of the shrunken `tabs` node.
  expect(editor).not.toBeNull();
  const liveEditor = editor as unknown as TiptapEditor;
  let tabsPos = -1;
  let tabsNode: ReturnType<TiptapEditor["state"]["doc"]["nodeAt"]> = null;
  liveEditor.state.doc.descendants((node, pos) => {
    if (node.type.name === "tabs") {
      tabsPos = pos;
      tabsNode = node;
      return false;
    }
    return true;
  });
  expect(tabsPos).toBeGreaterThanOrEqual(0);
  expect(tabsNode).not.toBeNull();
  const parentNode = tabsNode!;
  let childPos = tabsPos + 1;
  for (let i = 0; i < parentNode.childCount - 1; i++) {
    childPos += parentNode.child(i).nodeSize;
  }
  const lastTab = parentNode.child(parentNode.childCount - 1);
  const from = childPos;
  const to = childPos + lastTab.nodeSize;

  act(() => {
    liveEditor.commands.deleteRange({ from, to });
  });

  await waitFor(() => {
    panels = within(tabs).getAllByTestId("tab");
    expect(panels).toHaveLength(2);
  });

  // The bug: with only the parent's DISPLAYED index clamped and not written
  // back to the shared store, every remaining `TabView` compares itself
  // against the stale raw index (2) that no longer matches any sibling, so
  // ALL panels render `data-active="false"` and the tab body goes blank.
  // Fixed: exactly one (in-range) panel is active.
  const activeFlags = panels.map((p) => p.getAttribute("data-active"));
  expect(activeFlags.filter((flag) => flag === "true")).toHaveLength(1);
  expect(activeFlags.filter((flag) => flag === "false")).toHaveLength(1);
});

test("resolveActiveTabIndex clamps a stale stored index to the last live child", () => {
  // Direct unit coverage for the resolution helper itself, per the task's
  // "at minimum" fallback — kept alongside the full mount-and-delete
  // regression above rather than instead of it.
  expect(resolveActiveTabIndex(2, 2)).toBe(1);
  expect(resolveActiveTabIndex(2, 3)).toBe(2);
  expect(resolveActiveTabIndex(0, 1)).toBe(0);
  expect(resolveActiveTabIndex(5, 0)).toBe(-1);
});

test("preserved node view shows a read-only card with the component name and MDX source", async () => {
  render(
    <Editor
      source={source}
      path="preserved-test"
      onAddSubpage={() => {}}
      hasChildren={false}
      onDeleted={() => {}}
    />,
  );
  const editorEl = await waitFor(() => screen.getByTestId("editor"));

  const preserved = await waitFor(() =>
    within(editorEl).getByTestId("preserved"),
  );
  expect(preserved.getAttribute("data-preserved-name")).toBe("UIMap");
  expect(preserved.getAttribute("contenteditable")).toBe("false");
  expect(preserved.textContent).toContain("Preserved: UIMap");

  const details = preserved.querySelector("details");
  expect(details).not.toBeNull();
  fireEvent.click(preserved.querySelector("summary")!);
  await waitFor(() => {
    expect(details?.open).toBe(true);
  });
  expect(preserved.querySelector("pre")?.textContent).toContain("UIMap");
});
