import { expect, test } from "bun:test";
import { Editor } from "@tiptap/core";
import type { Range } from "@tiptap/core";
import type { Node as PMNode } from "@tiptap/pm/model";
import { buildAppExtensions } from "../editorExtensions";
import { LinkShortcut } from "../linkShortcut";
import type { SlashCommandOptions } from "./SlashCommand";
import type { PMNodeJSON } from "../../adapter/mdastToDoc";

/**
 * End-to-end proof that Task 2's wiring actually works: `buildAppExtensions()`
 * itself (not a manually re-added extension alongside it, as
 * `SlashCommand.test.ts`/`SlashMenu.test.tsx` exercise in isolation from Task
 * 1) carries a working `/` slash menu and a working ⌘K link shortcut.
 *
 * The live suggestion *popup* (real caret-relative positioning, DOM keydown
 * events reaching ProseMirror's suggestion plugin) is browser-verified by the
 * controller after this task, per the brief — happy-dom can't drive real
 * selection/composition events through ProseMirror's suggestion plugin. What
 * IS reliably testable headlessly, and covered below, is: (a) a real `/call`
 * insert transaction against the live doc, filtered through the wired
 * extension's own `suggestion.items`, executed through its own
 * `suggestion.command` — proving the query text is actually removed and the
 * right node is actually inserted; (b) `LinkShortcut`'s `Mod-k` handler
 * against a real editor + mocked `window.prompt`.
 *
 * (b) deliberately does NOT go through `editor.commands.keyboardShortcut()`
 * (ProseMirror's synthetic-KeyboardEvent replay path): `prosemirror-keymap`
 * computes its `mac` platform flag as a MODULE-LEVEL constant the first time
 * it's imported, which happens via `@tiptap/core`'s static import graph
 * before `happy-dom`'s `GlobalRegistrator.register()` (in `test-setup.ts`)
 * has necessarily run against *this* module instance — so the registered
 * keymap plugin can end up expecting a different modifier (`Meta-k` vs.
 * `Ctrl-k`) than the synthetic event `keyboardShortcut()` constructs from
 * `@tiptap/core`'s own (call-time, not import-time) `isMacOS()` check,
 * silently failing to match in this environment despite both being correct
 * on a real browser. Calling `LinkShortcut`'s own `addKeyboardShortcuts()`
 * handler directly (same "test the command path directly" fallback the task
 * brief allows for the suggestion popup) sidesteps that mismatch entirely and
 * tests the extension's actual logic rather than ProseMirror's keymap
 * plumbing.
 */

function buildEditor(contentHtml: string) {
  return new Editor({
    element: document.createElement("div"),
    extensions: buildAppExtensions(),
    content: contentHtml,
  });
}

function getJSON(editor: Editor): PMNodeJSON {
  return editor.getJSON() as unknown as PMNodeJSON;
}

/** Locates the doc-position range of the first occurrence of `needle` in a text node. */
function findTextRange(doc: PMNode, needle: string): Range {
  let found: Range | null = null;
  doc.descendants((node, pos) => {
    if (found) return false;
    if (!node.isText || !node.text) return true;
    const idx = node.text.indexOf(needle);
    if (idx === -1) return true;
    found = { from: pos + idx, to: pos + idx + needle.length };
    return false;
  });
  if (!found) throw new Error(`"${needle}" not found in document`);
  return found;
}

/** Calls `LinkShortcut`'s `Mod-k` handler directly against a live editor — see the file doc comment for why. */
function pressModK(editor: Editor): boolean | void {
  const shortcuts = LinkShortcut.config.addKeyboardShortcuts?.call({
    editor,
  } as unknown as ThisParameterType<
    NonNullable<typeof LinkShortcut.config.addKeyboardShortcuts>
  >);
  return shortcuts?.["Mod-k"]?.({ editor });
}

test("buildAppExtensions() registers slashCommand configured with the shared registry (char '/')", () => {
  const editor = buildEditor("<p></p>");
  const extension = editor.extensionManager.extensions.find(
    (e) => e.name === "slashCommand",
  );
  expect(extension).toBeDefined();
  const { suggestion } = extension!.options as SlashCommandOptions;
  expect(suggestion.char).toBe("/");
  editor.destroy();
});

test("typing /call and choosing Callout removes the /call text and inserts a Callout admonition", () => {
  const editor = buildEditor("<p></p>");

  // A real transaction against the live doc — same as a user typing "/call"
  // into an empty paragraph — not a hand-authored initial doc.
  editor.commands.focus("end");
  editor.commands.insertContent("/call");

  const extension = editor.extensionManager.extensions.find(
    (e) => e.name === "slashCommand",
  );
  expect(extension).toBeDefined();
  const { suggestion } = extension!.options as SlashCommandOptions;

  const items = suggestion.items?.({
    query: "call",
    editor,
    signal: new AbortController().signal,
  });
  const itemList = Array.isArray(items) ? items : [];
  expect(itemList.map((item) => item.id)).toEqual(["callout"]);

  const range = findTextRange(editor.state.doc, "/call");
  suggestion.command?.({ editor, range, props: { item: itemList[0]! } });

  const json = getJSON(editor);
  // The "/call" query text is gone from the doc entirely...
  expect(JSON.stringify(json).includes("/call")).toBe(false);
  // ...and the Callout admonition the item's `run` inserts is present.
  const admonition = json.content?.find((n) => n.type === "admonition");
  expect(admonition).toBeDefined();
  expect(admonition?.attrs?.component).toBe("Callout");
  expect(admonition?.attrs?.type).toBe("info");
  expect(admonition?.content?.[0]?.type).toBe("paragraph");

  editor.destroy();
});

test("Mod-k on a non-empty selection sets the link mark to window.prompt's return value", () => {
  const editor = buildEditor("<p>hello world</p>");
  editor.commands.setTextSelection({ from: 1, to: 6 }); // "hello"

  const originalPrompt = window.prompt;
  window.prompt = (() => "https://example.com") as typeof window.prompt;

  const handled = pressModK(editor);

  expect(handled).toBe(true);
  expect(editor.getAttributes("link").href).toBe("https://example.com");

  window.prompt = originalPrompt;
  editor.destroy();
});

test("Mod-k with the prompt returning an empty string unsets an existing link", () => {
  const editor = buildEditor("<p>hello world</p>");
  editor.commands.setTextSelection({ from: 1, to: 6 });
  editor
    .chain()
    .focus()
    .extendMarkRange("link")
    .setLink({ href: "https://example.com" })
    .run();
  expect(editor.isActive("link")).toBe(true);

  const originalPrompt = window.prompt;
  window.prompt = (() => "") as typeof window.prompt;

  editor.commands.setTextSelection({ from: 1, to: 6 });
  const handled = pressModK(editor);

  expect(handled).toBe(true);
  expect(editor.isActive("link")).toBe(false);

  window.prompt = originalPrompt;
  editor.destroy();
});

test("Mod-k with the prompt cancelled (null) leaves the selection unchanged", () => {
  const editor = buildEditor("<p>hello world</p>");
  editor.commands.setTextSelection({ from: 1, to: 6 });
  editor
    .chain()
    .focus()
    .extendMarkRange("link")
    .setLink({ href: "https://example.com" })
    .run();

  const originalPrompt = window.prompt;
  window.prompt = (() => null) as typeof window.prompt;

  editor.commands.setTextSelection({ from: 1, to: 6 });
  const handled = pressModK(editor);

  expect(handled).toBe(true);
  // Still linked to the original href — a cancelled prompt is a true no-op.
  expect(editor.getAttributes("link").href).toBe("https://example.com");

  window.prompt = originalPrompt;
  editor.destroy();
});

test("Mod-k on a collapsed selection is a no-op and never opens the prompt", () => {
  const editor = buildEditor("<p>hello world</p>");
  editor.commands.setTextSelection(3); // collapsed, inside "hello"

  let promptCalled = false;
  const originalPrompt = window.prompt;
  window.prompt = (() => {
    promptCalled = true;
    return "https://example.com";
  }) as typeof window.prompt;

  const handled = pressModK(editor);

  expect(handled).toBe(false);
  expect(promptCalled).toBe(false);
  expect(editor.isActive("link")).toBe(false);

  window.prompt = originalPrompt;
  editor.destroy();
});
