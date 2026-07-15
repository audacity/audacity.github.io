import { expect, test } from "bun:test";
import { getSchema } from "@tiptap/core";
import { buildExtensions } from "./schema";

test("schema includes custom manual node types", () => {
  const schema = getSchema(buildExtensions());
  for (const t of ["admonition", "tabs", "tab", "shortcut", "preserved"]) {
    expect(schema.nodes[t]).toBeDefined();
  }
  expect(schema.marks.link).toBeDefined();
});
