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

  // Header row also renders a trailing "+" add-tab button (see
  // `TabsView.tsx`'s `data-testid="tabs-add-tab"`), so header-only assertions
  // scope to `.tabs__header` rather than every button in the row.
  const headers = tabs.querySelectorAll<HTMLButtonElement>(".tabs__header");
  expect(Array.from(headers).map((h) => h.textContent)).toEqual([
    "Windows",
    "macOS",
  ]);

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

  // Activate the last tab (index 2). Scoped to `.tabs__header` (not
  // `getAllByRole("button")`) so the trailing "+" add-tab button — and,
  // since Task 1, the active-only "×" remove-tab button — don't shift these
  // indices off the three actual tab headers (see the first test's own
  // comment on the same scoping issue).
  const headers = tabs.querySelectorAll<HTMLButtonElement>(".tabs__header");
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

test('"+" add-tab button appends a new tab at the end, labeled "New tab", and activates it', async () => {
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

  expect(within(tabs).getAllByTestId("tab")).toHaveLength(3);

  const addButton = within(tabs).getByTestId("tabs-add-tab");
  act(() => {
    fireEvent.click(addButton);
  });

  await waitFor(() => {
    expect(within(tabs).getAllByTestId("tab")).toHaveLength(4);
  });

  const panels = within(tabs).getAllByTestId("tab");
  const activeFlags = panels.map((p) => p.getAttribute("data-active"));
  // The newly appended (4th, last) tab is now the active one.
  expect(activeFlags).toEqual(["false", "false", "false", "true"]);

  const headers = tabs.querySelectorAll<HTMLButtonElement>(".tabs__header");
  expect(headers[3]?.textContent).toBe("New tab");

  // Underlying doc: a real `tab` node with a `label: "New tab"` attr and a
  // single (empty) paragraph child, appended as the tabs node's last child —
  // not just a DOM/store-level illusion.
  expect(editor).not.toBeNull();
  const liveEditor = editor as unknown as TiptapEditor;
  let tabsNode: ReturnType<TiptapEditor["state"]["doc"]["nodeAt"]> = null;
  liveEditor.state.doc.descendants((node) => {
    if (node.type.name === "tabs") {
      tabsNode = node;
      return false;
    }
    return true;
  });
  expect(tabsNode).not.toBeNull();
  const parentNode = tabsNode!;
  expect(parentNode.childCount).toBe(4);
  const newTab = parentNode.child(3);
  expect(newTab.attrs.label).toBe("New tab");
  expect(newTab.childCount).toBe(1);
  expect(newTab.child(0).type.name).toBe("paragraph");
});

/** Finds the (first, top-level) `tabs` node in `liveEditor`'s current doc,
 * same `descendants` walk the tests above already use inline — pulled out
 * here since the ×-removal tests below need it more than once each (before
 * removal, after removal, after undo). */
function findTabsNode(
  liveEditor: TiptapEditor,
): ReturnType<TiptapEditor["state"]["doc"]["nodeAt"]> {
  let tabsNode: ReturnType<TiptapEditor["state"]["doc"]["nodeAt"]> = null;
  liveEditor.state.doc.descendants((node) => {
    if (node.type.name === "tabs") {
      tabsNode = node;
      return false;
    }
    return true;
  });
  return tabsNode;
}

test("the × on the active header removes that tab, activates the nearest neighbor, and one undo restores all three", async () => {
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
  expect(editor).not.toBeNull();
  const liveEditor = editor as unknown as TiptapEditor;

  // Activate the MIDDLE tab (macOS, index 1) so its removal exercises the
  // "a later sibling slides into the removed index" neighbor-activation
  // branch, not the simpler "removed the last tab" one already covered by
  // the pre-existing deletion regression test above.
  let headers = tabs.querySelectorAll<HTMLButtonElement>(".tabs__header");
  fireEvent.click(headers[1]!);
  await waitFor(() => {
    const panels = within(tabs).getAllByTestId("tab");
    expect(panels[1]?.getAttribute("data-active")).toBe("true");
  });

  // Only the active header shows a "×" — exactly one in the whole strip.
  expect(within(tabs).getAllByTestId("tabs-remove-tab")).toHaveLength(1);
  const removeButton = within(tabs).getByTestId("tabs-remove-tab");

  act(() => {
    fireEvent.click(removeButton);
  });

  await waitFor(() => {
    expect(within(tabs).getAllByTestId("tab")).toHaveLength(2);
  });

  // Structure: macOS gone, Windows/Linux remain, in original order.
  headers = tabs.querySelectorAll<HTMLButtonElement>(".tabs__header");
  expect(Array.from(headers).map((h) => h.textContent)).toEqual([
    "Windows",
    "Linux",
  ]);
  const tabsNodeAfterRemoval = findTabsNode(liveEditor);
  expect(tabsNodeAfterRemoval).not.toBeNull();
  expect(tabsNodeAfterRemoval!.childCount).toBe(2);

  // Neighbor activation: Linux slid into the removed macOS's index (1), so
  // it — not Windows — is now the active tab. Polled (not read once right
  // after the length `waitFor` above) for the same passive-effect-timing
  // reason as the post-undo check further down.
  await waitFor(() => {
    const panelsAfterRemoval = within(tabs).getAllByTestId("tab");
    expect(panelsAfterRemoval[0]?.getAttribute("data-active")).toBe("false");
    expect(panelsAfterRemoval[1]?.getAttribute("data-active")).toBe("true");
  });

  // One undo (the removal was a single transaction) restores all three, in
  // their original order, with the store's active index still sane — in
  // range for the restored doc, not left dangling past its end. `undo` runs
  // entirely through ProseMirror's own history plugin, not through this
  // file's `removeTab`, so it's `TabsView`'s (not any individual `TabView`'s)
  // state this asserts against: `TabsView` is bound directly to the `tabs`
  // node itself, so — unlike each `TabView`'s separate React root — it's
  // guaranteed to recompute its `data-active-index` fresh on every doc
  // change, undo included.
  act(() => {
    liveEditor.commands.undo();
  });

  await waitFor(() => {
    expect(within(tabs).getAllByTestId("tab")).toHaveLength(3);
  });

  headers = tabs.querySelectorAll<HTMLButtonElement>(".tabs__header");
  expect(Array.from(headers).map((h) => h.textContent)).toEqual([
    "Windows",
    "macOS",
    "Linux",
  ]);
  const tabsNodeAfterUndo = findTabsNode(liveEditor);
  expect(tabsNodeAfterUndo).not.toBeNull();
  expect(tabsNodeAfterUndo!.childCount).toBe(3);

  const activeIndexAttr = tabs.getAttribute("data-active-index");
  expect(activeIndexAttr).not.toBeNull();
  const activeIndex = Number(activeIndexAttr);
  expect(activeIndex).toBeGreaterThanOrEqual(0);
  expect(activeIndex).toBeLessThan(3);
});

/** A single-tab source for the "remove the only tab" test below — the
 * schema requires `tab+`, so removing the only tab can't leave an empty
 * `tabs` node; it has to remove the whole block (see `removeTab`'s doc
 * comment in `TabsView.tsx`). */
const oneTabSource = `# Test page

<Tabs>
  <Tab label="Only tab">

Only tab content.

  </Tab>
</Tabs>
`;

test("the × on the only tab removes the whole tabs block; undo restores it", async () => {
  let editor: TiptapEditor | null = null;
  render(
    <TestHarness
      source={oneTabSource}
      onReady={(created) => {
        editor = created;
      }}
    />,
  );
  const editorEl = await waitFor(() => screen.getByTestId("editor"));
  const tabs = await waitFor(() => within(editorEl).getByTestId("tabs"));
  expect(editor).not.toBeNull();
  const liveEditor = editor as unknown as TiptapEditor;

  expect(within(tabs).getAllByTestId("tab")).toHaveLength(1);
  expect(findTabsNode(liveEditor)).not.toBeNull();

  const removeButton = within(tabs).getByTestId("tabs-remove-tab");
  act(() => {
    fireEvent.click(removeButton);
  });

  await waitFor(() => {
    expect(within(editorEl).queryByTestId("tabs")).toBeNull();
  });
  expect(findTabsNode(liveEditor)).toBeNull();

  act(() => {
    liveEditor.commands.undo();
  });

  const restoredTabs = await waitFor(() =>
    within(editorEl).getByTestId("tabs"),
  );
  expect(within(restoredTabs).getAllByTestId("tab")).toHaveLength(1);
  expect(findTabsNode(liveEditor)).not.toBeNull();
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

test("import-only ESM blocks are hidden, not shown as a preserved card", async () => {
  const importSource = `import Callout from "../../../components/manual/Callout.astro";
import Tabs from "../../../components/manual/Tabs/Tabs.astro";

# Page

<Callout type="info">

Body text.

</Callout>
`;
  render(
    <Editor
      source={importSource}
      path="import-hide-test"
      onAddSubpage={() => {}}
      hasChildren={false}
      onDeleted={() => {}}
    />,
  );
  const editorEl = await waitFor(() => screen.getByTestId("editor"));

  const hidden = await waitFor(() =>
    within(editorEl).getByTestId("preserved-hidden-imports"),
  );
  expect(hidden.style.display).toBe("none");
  expect(hidden.textContent).toBe("");
  // no visible "Preserved" card for the import block
  expect(within(editorEl).queryByTestId("preserved")).toBeNull();
  // the content itself still renders and stays editable
  expect(within(editorEl).getByTestId("admonition")).toBeTruthy();
});

test("ESM with more than imports still shows the preserved card", async () => {
  const esmSource = `import Callout from "../../../components/manual/Callout.astro";
export const answer = 42;

# Page

Text.
`;
  render(
    <Editor
      source={esmSource}
      path="esm-card-test"
      onAddSubpage={() => {}}
      hasChildren={false}
      onDeleted={() => {}}
    />,
  );
  const editorEl = await waitFor(() => screen.getByTestId("editor"));
  const preserved = await waitFor(() =>
    within(editorEl).getByTestId("preserved"),
  );
  expect(preserved.getAttribute("data-preserved-name")).toBe("mdxjsEsm");
});
