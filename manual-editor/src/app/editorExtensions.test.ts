import { expect, test } from "bun:test";
import { getSchema } from "@tiptap/core";
import { buildExtensions } from "../adapter/schema";
import { buildAppExtensions } from "./editorExtensions";

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
