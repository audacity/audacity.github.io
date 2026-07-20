import { expect, test } from "bun:test";
import { act, render, screen, waitFor } from "@testing-library/react";
import { EditorContent, useEditor } from "@tiptap/react";
import type { Editor as TiptapEditor } from "@tiptap/core";
import {
  insertAdmonition,
  insertShortcut,
  insertTabs,
  setCodeBlock,
  setHeading,
  setParagraph,
  toggleBulletList,
  toggleOrderedList,
} from "./insertCommands";
import { buildAppExtensions } from "./editorExtensions";
import { mdastToDoc } from "../adapter/mdastToDoc";
import type { PMNodeJSON } from "../adapter/mdastToDoc";
import { parseMdx } from "../mdx/pipeline";
import type { JsxAttr } from "../adapter/registry";

/**
 * `editor.getJSON()` is typed against TipTap's schema-derived `NodeType |
 * TextType` union, which is too narrow/awkward to destructure in a generic
 * test. `PMNodeJSON` (the adapter's own loosely-typed PM JSON shape) is a
 * strictly wider supertype of whatever `getJSON()` actually returns, so this
 * cast is sound.
 */
function getJSON(editor: TiptapEditor): PMNodeJSON {
  return editor.getJSON() as unknown as PMNodeJSON;
}

/**
 * Minimal harness mounting a real `useEditor` (same construction `Editor.tsx`
 * uses) — these tests call the extracted `insertCommands` functions
 * directly against the live editor instance (no UI layer to drive through).
 */
function TestHarness({
  source,
  onReady,
}: {
  source: string;
  onReady: (editor: TiptapEditor) => void;
}) {
  const { doc } = mdastToDoc(parseMdx(source));
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

const paragraphSource = `# Test page

Some text.
`;

async function mount(source: string) {
  let editor: TiptapEditor | null = null;
  render(
    <TestHarness
      source={source}
      onReady={(created) => {
        editor = created;
      }}
    />,
  );
  await waitFor(() => screen.getByTestId("editor"));
  await waitFor(() => expect(editor).not.toBeNull());
  return () => editor as unknown as TiptapEditor;
}

test("insertAdmonition inserts an admonition node with the given component/type and an empty child paragraph", async () => {
  const getEditor = await mount(paragraphSource);
  const editor = getEditor();

  act(() => {
    editor.commands.focus("end");
  });
  act(() => {
    insertAdmonition(editor, "Callout", "info");
  });

  const json = getJSON(editor);
  const admonition = json.content?.find((n) => n.type === "admonition");
  expect(admonition).toBeDefined();
  expect(admonition?.attrs?.component).toBe("Callout");
  expect(admonition?.attrs?.type).toBe("info");
  expect(admonition?.content?.[0]?.type).toBe("paragraph");
});

test("insertAdmonition with no type (e.g. Notes) omits a meaningful type attr", async () => {
  const getEditor = await mount(paragraphSource);
  const editor = getEditor();

  act(() => {
    editor.commands.focus("end");
  });
  act(() => {
    insertAdmonition(editor, "Notes");
  });

  const json = getJSON(editor);
  const admonition = json.content?.find((n) => n.type === "admonition");
  expect(admonition?.attrs?.component).toBe("Notes");
});

test("insertTabs inserts a tabs node with two starter tab children (Windows/macOS), each with a paragraph", async () => {
  const getEditor = await mount(paragraphSource);
  const editor = getEditor();

  act(() => {
    editor.commands.focus("end");
  });
  act(() => {
    insertTabs(editor);
  });

  const json = getJSON(editor);
  const tabs = json.content?.find((n) => n.type === "tabs");
  expect(tabs).toBeDefined();
  expect(tabs?.content?.map((t) => t.attrs?.label)).toEqual([
    "Windows",
    "macOS",
  ]);
  for (const tab of tabs?.content ?? []) {
    expect(tab.content?.[0]?.type).toBe("paragraph");
  }
});

test("insertShortcut inserts a shortcut node with both client:load and a default keys attribute", async () => {
  const getEditor = await mount(paragraphSource);
  const editor = getEditor();

  act(() => {
    editor.commands.focus("end");
  });
  act(() => {
    insertShortcut(editor);
  });

  const json = getJSON(editor);
  let shortcut: { type?: string; attrs?: Record<string, unknown> } | undefined;
  function findShortcut(nodes: typeof json.content) {
    for (const node of nodes ?? []) {
      if (node.type === "shortcut") {
        shortcut = node;
        return;
      }
      if (node.content) findShortcut(node.content);
    }
  }
  findShortcut(json.content);

  expect(shortcut).toBeDefined();
  const attributes = (shortcut?.attrs?.attributes ?? []) as JsxAttr[];
  const clientLoadAttr = attributes.find((a) => a.name === "client:load");
  expect(clientLoadAttr).toBeDefined();
  expect(clientLoadAttr?.value).toBeNull();
  const keysAttr = attributes.find((a) => a.name === "keys");
  expect(keysAttr).toBeDefined();
  expect(keysAttr?.value).toBe("Ctrl+K");
});

test("setParagraph turns a heading into a plain paragraph", async () => {
  const getEditor = await mount(paragraphSource);
  const editor = getEditor();

  act(() => {
    editor.commands.setTextSelection(3); // inside "Test page" heading
  });
  act(() => {
    setParagraph(editor);
  });

  const json = getJSON(editor);
  expect(json.content?.some((n) => n.type === "heading")).toBe(false);
  expect(
    json.content?.some(
      (n) =>
        n.type === "paragraph" &&
        n.content?.some((c) => c.text === "Test page"),
    ),
  ).toBe(true);
});

test("setHeading turns the current block into a heading of the given level", async () => {
  const getEditor = await mount(paragraphSource);
  const editor = getEditor();

  act(() => {
    editor.commands.focus("end"); // inside "Some text." paragraph
  });
  act(() => {
    setHeading(editor, 3);
  });

  const json = getJSON(editor);
  const heading = json.content?.find(
    (n) =>
      n.type === "heading" && n.content?.some((c) => c.text === "Some text."),
  );
  expect(heading).toBeDefined();
  expect(heading?.attrs?.level).toBe(3);
});

test("toggleBulletList wraps the current block in a bulleted list", async () => {
  const getEditor = await mount(paragraphSource);
  const editor = getEditor();

  act(() => {
    editor.commands.focus("end");
  });
  act(() => {
    toggleBulletList(editor);
  });

  const json = getJSON(editor);
  expect(json.content?.some((n) => n.type === "bulletList")).toBe(true);
});

test("toggleOrderedList wraps the current block in a numbered list", async () => {
  const getEditor = await mount(paragraphSource);
  const editor = getEditor();

  act(() => {
    editor.commands.focus("end");
  });
  act(() => {
    toggleOrderedList(editor);
  });

  const json = getJSON(editor);
  expect(json.content?.some((n) => n.type === "orderedList")).toBe(true);
});

test("setCodeBlock turns the current block into a code block", async () => {
  const getEditor = await mount(paragraphSource);
  const editor = getEditor();

  act(() => {
    editor.commands.focus("end");
  });
  act(() => {
    setCodeBlock(editor);
  });

  const json = getJSON(editor);
  expect(json.content?.some((n) => n.type === "codeBlock")).toBe(true);
});
