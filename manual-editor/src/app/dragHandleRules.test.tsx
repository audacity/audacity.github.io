/**
 * Regression tests for the drag handle's nested-mode scope
 * (`NESTED_DRAG_HANDLE_OPTIONS` in `Editor.tsx`).
 *
 * The original nested-mode config used `NestedOptions.allowedContainers:
 * ["admonition", "tab"]`, which the package applies as a filter on EVERY
 * candidate ("has one of these node types as an ancestor") — and since a
 * top-level paragraph's only ancestor is `doc`, that config rejected every
 * top-level block and the grab handle stopped appearing anywhere outside
 * admonitions/tabs. These tests exercise the replacement scoring rules
 * against real documents so that failure mode can't come back.
 *
 * The rules are evaluated the way the package's `calculateScore` does: a
 * rule returning >= 1000 (BASE_SCORE) excludes the candidate.
 */
import { describe, expect, test } from "bun:test";
import { Editor } from "@tiptap/core";
import type { Node as PMNode, ResolvedPos } from "@tiptap/pm/model";
import { buildAppExtensions } from "./editorExtensions";
import { NESTED_DRAG_HANDLE_OPTIONS } from "./Editor";

const BASE_SCORE = 1000;

function makeEditor(content: string | object) {
  return new Editor({ extensions: buildAppExtensions(), content });
}

/**
 * Mirrors `findBestDragTarget`'s candidate walk for the text position
 * `$pos`: evaluates every ancestor depth (deepest first) against the
 * configured rules and returns the surviving candidates' node type names,
 * ordered the way the package orders equal scores (deepest wins).
 */
function eligibleTypesAt(editor: Editor, textPos: number): string[] {
  const $pos = editor.state.doc.resolve(textPos) as ResolvedPos;
  const rules = NESTED_DRAG_HANDLE_OPTIONS.rules ?? [];
  const out: Array<{ type: string; depth: number; score: number }> = [];
  for (let depth = $pos.depth; depth >= 1; depth -= 1) {
    const node = $pos.node(depth) as PMNode;
    const parent = depth > 0 ? ($pos.node(depth - 1) as PMNode) : null;
    const index = depth > 0 ? $pos.index(depth - 1) : 0;
    const siblingCount = parent ? parent.childCount : 1;
    const context = {
      node,
      pos: $pos.before(depth),
      depth,
      parent,
      index,
      isFirst: index === 0,
      isLast: index === siblingCount - 1,
      $pos,
      view: null as never, // rules under test never touch the view
    };
    let score = BASE_SCORE;
    for (const rule of rules) {
      score -= rule.evaluate(context as never);
      if (score <= 0) break;
    }
    if (score > 0) out.push({ type: node.type.name, depth, score });
  }
  out.sort((a, b) =>
    b.score !== a.score ? b.score - a.score : b.depth - a.depth,
  );
  return out.map((c) => c.type);
}

/** Position of the first text character inside the first node of `type`. */
function firstTextPosIn(editor: Editor, type: string): number {
  let found = -1;
  editor.state.doc.descendants((node, pos) => {
    if (found !== -1) return false;
    if (node.type.name === type) {
      found = pos + 2; // inside the node's first textblock child or itself
      return false;
    }
    return true;
  });
  if (found === -1) throw new Error(`no ${type} in doc`);
  return found;
}

describe("nested drag-handle scope rules", () => {
  test("edge detection stays off — the default left-edge deduction excludes depth-2 blocks on the pointer's approach path to the handle, yanking it away", () => {
    expect(NESTED_DRAG_HANDLE_OPTIONS.edgeDetection).toBe("none");
  });

  test("a top-level paragraph is an eligible drag target (the lost-handles regression)", () => {
    const editor = makeEditor("<p>plain top-level text</p>");
    const types = eligibleTypesAt(editor, 3);
    expect(types).toContain("paragraph");
    editor.destroy();
  });

  test("a paragraph inside an admonition offers BOTH the paragraph and the admonition, deepest first", () => {
    const editor = makeEditor({
      type: "doc",
      content: [
        {
          type: "admonition",
          attrs: { component: "Callout", type: "info", title: null },
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "inside a callout" }],
            },
          ],
        },
      ],
    });
    const pos = firstTextPosIn(editor, "admonition");
    const types = eligibleTypesAt(editor, pos);
    expect(types[0]).toBe("paragraph");
    expect(types).toContain("admonition");
    editor.destroy();
  });

  test("lists move whole: items and their paragraphs are excluded, the wrapper survives", () => {
    const editor = makeEditor("<ul><li><p>first item</p></li></ul>");
    const pos = firstTextPosIn(editor, "listItem");
    const types = eligibleTypesAt(editor, pos + 1);
    expect(types).toEqual(["bulletList"]);
    editor.destroy();
  });

  test("deep blocks outside admonition/tab fall back to the top-level wrapper (blockquote)", () => {
    const editor = makeEditor("<blockquote><p>quoted</p></blockquote>");
    const pos = firstTextPosIn(editor, "blockquote");
    const types = eligibleTypesAt(editor, pos);
    expect(types).toEqual(["blockquote"]);
    editor.destroy();
  });
});
