import { expect, test } from "bun:test";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { EditorContent, useEditor } from "@tiptap/react";
import type { Editor as TiptapEditor } from "@tiptap/core";
import { Toolbar } from "./Toolbar";
import { buildAppExtensions } from "./editorExtensions";
import { mdastToDoc } from "../adapter/mdastToDoc";
import type { PMNodeJSON } from "../adapter/mdastToDoc";
import { parseMdx } from "../mdx/pipeline";
import type { JsxAttr } from "../adapter/registry";

/**
 * `editor.getJSON()` is typed against TipTap's schema-derived `NodeType |
 * TextType` union, which is too narrow/awkward to destructure in a generic
 * test. `PMNodeJSON` (the adapter's own loosely-typed PM JSON shape, used
 * throughout `src/adapter`'s tests) is a strictly wider supertype of
 * whatever `getJSON()` actually returns, so this cast is sound.
 */
function getJSON(editor: TiptapEditor): PMNodeJSON {
  return editor.getJSON() as unknown as PMNodeJSON;
}

/**
 * Minimal harness mounting a real `useEditor` + the real `Toolbar` (same
 * construction `Editor.tsx` uses), with `onReady` exposing the live TipTap
 * instance so assertions can inspect `editor.getJSON()` directly rather than
 * only the rendered DOM — same pattern as `nodeviews.test.tsx`'s
 * `TestHarness`, kept local here since `Editor.tsx` deliberately doesn't
 * expose its editor instance as a public prop.
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
      <Toolbar editor={editor} />
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

test("clicking Bold toggles the mark so subsequently inserted text is bold", async () => {
  const getEditor = await mount(paragraphSource);
  const editor = getEditor();

  // Place the cursor at the end of the document (end of "Some text.").
  act(() => {
    editor.commands.focus("end");
  });

  const boldButton = screen.getByRole("button", { name: "Bold" });
  expect(boldButton.className).not.toContain("is-active");

  fireEvent.click(boldButton);

  await waitFor(() => {
    expect(screen.getByRole("button", { name: "Bold" }).className).toContain(
      "is-active",
    );
  });

  // Simulate the resulting keystrokes the same way the existing node-view
  // tests exercise editor state changes: via a real editor command, not a
  // DOM-level keyboard simulation happy-dom can't drive through ProseMirror.
  act(() => {
    editor.commands.insertContent("bold-word");
  });

  const json = getJSON(editor);
  const paragraphs = json.content?.filter((n) => n.type === "paragraph") ?? [];
  const lastParagraph = paragraphs[paragraphs.length - 1];
  const boldTextNode = lastParagraph?.content?.find(
    (n) => n.type === "text" && n.text === "bold-word",
  );
  expect(boldTextNode).toBeDefined();
  expect(boldTextNode?.marks?.some((m) => m.type === "bold")).toBe(true);
});

test("Insert Callout inserts an admonition node with component Callout", async () => {
  const getEditor = await mount(paragraphSource);
  const editor = getEditor();

  act(() => {
    editor.commands.focus("end");
  });

  fireEvent.click(screen.getByRole("button", { name: "Callout" }));

  const json = getJSON(editor);
  const admonition = json.content?.find((n) => n.type === "admonition");
  expect(admonition).toBeDefined();
  expect(admonition?.attrs?.component).toBe("Callout");
  expect(admonition?.attrs?.type).toBe("info");
  // Immediately editable: carries an empty paragraph child.
  expect(admonition?.content?.[0]?.type).toBe("paragraph");
});

test("Insert Note inserts an admonition node with component Notes", async () => {
  const getEditor = await mount(paragraphSource);
  const editor = getEditor();

  act(() => {
    editor.commands.focus("end");
  });

  fireEvent.click(screen.getByRole("button", { name: "Note" }));

  const json = getJSON(editor);
  const admonition = json.content?.find((n) => n.type === "admonition");
  expect(admonition?.attrs?.component).toBe("Notes");
});

test("Insert Tabs inserts a tabs node with two starter tab children", async () => {
  const getEditor = await mount(paragraphSource);
  const editor = getEditor();

  act(() => {
    editor.commands.focus("end");
  });

  fireEvent.click(screen.getByRole("button", { name: "Tabs" }));

  const json = getJSON(editor);
  const tabs = json.content?.find((n) => n.type === "tabs");
  expect(tabs).toBeDefined();
  expect(tabs?.content?.map((t) => t.attrs?.label)).toEqual([
    "Windows",
    "macOS",
  ]);
});

test("Insert Shortcut inserts a shortcut node with client:load and a default keys attribute", async () => {
  const getEditor = await mount(paragraphSource);
  const editor = getEditor();

  act(() => {
    editor.commands.focus("end");
  });

  fireEvent.click(screen.getByRole("button", { name: "Shortcut" }));

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
  expect(attributes.find((a) => a.name === "client:load")).toBeDefined();
  const keysAttr = attributes.find((a) => a.name === "keys");
  expect(keysAttr).toBeDefined();
  expect(keysAttr?.value).toBe("Ctrl+K");
});

test("toolbar buttons are disabled when the editor is null", () => {
  render(<Toolbar editor={null} />);
  const boldButton = screen.getByRole("button", { name: "Bold" });
  expect((boldButton as HTMLButtonElement).disabled).toBe(true);
  const calloutButton = screen.getByRole("button", { name: "Callout" });
  expect((calloutButton as HTMLButtonElement).disabled).toBe(true);
});
