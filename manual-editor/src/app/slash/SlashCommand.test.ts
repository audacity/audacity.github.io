import { expect, test } from "bun:test";
import { Editor } from "@tiptap/core";
import type { Range } from "@tiptap/core";
import { buildAppExtensions } from "../editorExtensions";
import type { SlashCommandOptions } from "./SlashCommand";
import { SLASH_ITEMS } from "./slashItems";
import type { PMNodeJSON } from "../../adapter/mdastToDoc";

/**
 * `SlashCommand`'s `addProseMirrorPlugins()`/live-`/`-trigger behavior (the
 * actual ProseMirror decoration + keydown pipeline, and caret-relative
 * positioning) is browser-verified by the controller in Task 2, per the
 * task brief — happy-dom can't drive real DOM selection/composition events
 * through ProseMirror's suggestion plugin. What IS headlessly testable, and
 * covered here, is the extension's own wiring: `addOptions()` builds a
 * `suggestion.items`/`suggestion.command` pair that correctly delegates to
 * `filterSlashItems` and the selected item's `run(editor)`.
 *
 * `buildAppExtensions()` (wired up in Task 2) already includes `SlashCommand`
 * — appending it again here would register the extension (and its
 * `Suggestion` plugin, keyed `suggestion$`) twice and crash ProseMirror's
 * `Configuration` on construction, so this reads the instance
 * `buildAppExtensions()` itself builds rather than adding a second one.
 */
function buildEditor() {
  const editor = new Editor({
    element: document.createElement("div"),
    extensions: buildAppExtensions(),
    content: "<p>hello</p>",
  });
  const extension = editor.extensionManager.extensions.find(
    (e) => e.name === "slashCommand",
  );
  if (!extension) throw new Error("slashCommand extension not registered");
  const { suggestion } = extension.options as SlashCommandOptions;
  return { editor, suggestion };
}

test("suggestion.items delegates to filterSlashItems", () => {
  const { editor, suggestion } = buildEditor();
  const items = suggestion.items?.({
    query: "call",
    editor,
    signal: new AbortController().signal,
  });
  expect(Array.isArray(items) ? items.map((i) => i.id) : items).toEqual([
    "callout",
  ]);
  editor.destroy();
});

test("suggestion.items with an empty query returns the full registry", () => {
  const { editor, suggestion } = buildEditor();
  const items = suggestion.items?.({
    query: "",
    editor,
    signal: new AbortController().signal,
  });
  expect(items).toHaveLength(SLASH_ITEMS.length);
  editor.destroy();
});

test("suggestion.command deletes the trigger range and runs the selected item", () => {
  const { editor, suggestion } = buildEditor();

  // "hello" occupies doc positions 1..6 inside the single paragraph;
  // simulate the range the plugin would report for a "/tab" query typed at
  // the end of that word (deleting it entirely for a clean assertion).
  const range: Range = { from: 1, to: 6 };
  const tabsItem = SLASH_ITEMS.find((item) => item.id === "tabs");
  expect(tabsItem).toBeDefined();

  suggestion.command?.({ editor, range, props: { item: tabsItem! } });

  const json = editor.getJSON() as unknown as PMNodeJSON;
  // The original paragraph text is gone (deleteRange ran)...
  const paragraphWithHello = json.content?.find(
    (n) =>
      n.type === "paragraph" &&
      n.content?.some((c) => c.text?.includes("hello")),
  );
  expect(paragraphWithHello).toBeUndefined();
  // ...and the tabs node the item's `run` inserts is present.
  const tabs = json.content?.find((n) => n.type === "tabs");
  expect(tabs).toBeDefined();
  expect(tabs?.content?.map((t) => t.attrs?.label)).toEqual([
    "Windows",
    "macOS",
  ]);

  editor.destroy();
});

test("extension defaults: char '/', allowSpaces false, startOfLine false", () => {
  const { editor, suggestion } = buildEditor();
  expect(suggestion.char).toBe("/");
  expect(suggestion.allowSpaces).toBe(false);
  expect(suggestion.startOfLine).toBe(false);
  editor.destroy();
});
