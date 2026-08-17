import { expect, test } from "bun:test";
import { getSchema } from "@tiptap/core";
import { DOMSerializer } from "@tiptap/pm/model";
import { buildExtensions } from "./schema";

test("schema includes custom manual node types", () => {
  const schema = getSchema(buildExtensions());
  for (const t of ["admonition", "tabs", "tab", "shortcut", "preserved"]) {
    expect(schema.nodes[t]).toBeDefined();
  }
  expect(schema.marks.link).toBeDefined();
});

test("preserved node keeps mdast attribute out of DOM rendering", () => {
  const schema = getSchema(buildExtensions());
  const testMdast = {
    type: "mdxJsxFlowElement",
    name: "UIMap",
    attributes: [],
  };

  // Create a preserved node with an mdast object.
  const node = schema.nodes.preserved.create({ mdast: testMdast });

  // Serialize to DOM.
  const dom = DOMSerializer.fromSchema(schema).serializeNode(node);

  // Verify mdast is NOT in DOM attributes (would appear as "[object Object]" string).
  expect((dom as Element).getAttribute("mdast")).toBeNull();

  // Verify mdast is still in the PM node's attrs.
  expect(node.attrs.mdast).toBeDefined();
  expect(node.attrs.mdast.name).toBe("UIMap");
});
