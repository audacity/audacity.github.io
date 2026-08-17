import { expect, test } from "bun:test";
import { Editor, getSchema } from "@tiptap/core";
import { buildExtensions } from "../adapter/schema";
import { buildAppExtensions } from "./editorExtensions";
import type { PMNodeJSON } from "../adapter/mdastToDoc";

/**
 * `buildAppExtensions()` attaches React node views (D2) to `admonition` and
 * `shortcut` for the live app, but must produce EXACTLY the same document
 * schema as the pure adapter `buildExtensions()` — node views only change
 * how the browser renders a node, never the document model. If they drifted,
 * a doc built by the adapter for the pure schema could fail to validate (or
 * silently mean something different) once mounted in the real app editor.
 */
test("buildAppExtensions produces the same node/mark schema as buildExtensions", () => {
  const pureSchema = getSchema(buildExtensions());
  const appSchema = getSchema(buildAppExtensions());

  expect(Object.keys(appSchema.nodes).sort()).toEqual(
    Object.keys(pureSchema.nodes).sort(),
  );
  expect(Object.keys(appSchema.marks).sort()).toEqual(
    Object.keys(pureSchema.marks).sort(),
  );

  for (const name of Object.keys(pureSchema.nodes)) {
    const pureSpec = pureSchema.nodes[name]!.spec;
    const appSpec = appSchema.nodes[name]!.spec;
    expect(appSpec.content ?? "").toBe(pureSpec.content ?? "");
    expect(appSpec.group ?? "").toBe(pureSpec.group ?? "");
    expect(appSpec.inline ?? false).toBe(pureSpec.inline ?? false);
    expect(appSpec.atom ?? false).toBe(pureSpec.atom ?? false);
    expect(Object.keys(appSpec.attrs ?? {}).sort()).toEqual(
      Object.keys(pureSpec.attrs ?? {}).sort(),
    );
  }
});

/**
 * Migrated from the retired `Toolbar.tsx`'s "clicking Bold toggles the
 * mark" test (Task 2 — the toolbar button is gone, but `toggleBold` is
 * native `@tiptap/starter-kit` behavior riding on `buildAppExtensions()`'s
 * schema, not custom app code, so it belongs here as a schema/extension
 * sanity check rather than in `insertCommands.test.tsx` — `insertCommands.ts`
 * only wraps the app's own custom inserts). Drives `editor.commands`
 * directly instead of a button click, since there's no UI layer left to
 * click through.
 */
test("toggleBold on a buildAppExtensions() editor marks subsequently inserted text as bold", () => {
  const editor = new Editor({
    element: document.createElement("div"),
    extensions: buildAppExtensions(),
    content: "<p>Some text.</p>",
  });

  editor.commands.focus("end");
  editor.commands.toggleBold();
  editor.commands.insertContent("bold-word");

  const json = editor.getJSON() as unknown as PMNodeJSON;
  const paragraph = json.content?.find((n) => n.type === "paragraph");
  const boldTextNode = paragraph?.content?.find(
    (n) => n.type === "text" && n.text === "bold-word",
  );
  expect(boldTextNode).toBeDefined();
  expect(boldTextNode?.marks?.some((m) => m.type === "bold")).toBe(true);

  editor.destroy();
});

/**
 * Task 2 wires the D1 `BlockReorder` extension (Alt+Up/Down keyboard block
 * moves) into the live app editor. Confirmed here via the extension
 * manager's registered extension list rather than by exercising the
 * keyboard shortcut itself — `blockMove.test.tsx` already covers
 * `moveBlock`/`BlockReorder` behavior directly; this only guards that
 * `buildAppExtensions()` actually includes it (schema-parity-safe, since
 * `BlockReorder` is a plugin-only `Extension` with no nodes/marks — see the
 * parity test above).
 */
test("buildAppExtensions includes the blockReorder extension", () => {
  const editor = new Editor({
    element: document.createElement("div"),
    extensions: buildAppExtensions(),
    content: "<p>Some text.</p>",
  });

  expect(
    editor.extensionManager.extensions.some((e) => e.name === "blockReorder"),
  ).toBe(true);

  editor.destroy();
});
