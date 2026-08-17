/**
 * Schema-validity gate: proves every corpus page's adapter output
 * (`mdastToDoc(parseMdx(source))`) is not just structurally-plausible JSON
 * (per the C4 golden test) but an ACTUALLY VALID ProseMirror document under
 * the real schema built from `buildExtensions()`.
 *
 * `mdastToDoc`'s own tests and the roundtrip golden test operate purely on
 * JSON and never construct a ProseMirror `Node`, so a content-model mismatch
 * (e.g. a node whose `content` expression rejects its own children) would
 * slip through both and only surface here — or worse, only in the browser
 * when `useEditor`/`setContent` throws. `schema.nodeFromJSON` performs the
 * same content-model validation ProseMirror runs internally, so it's a cheap,
 * strong, fully headless way to catch that class of bug for the whole corpus.
 */
import { getSchema } from "@tiptap/core";
import { Editor } from "@tiptap/core";
import { describe, expect, test } from "bun:test";
import { mdastToDoc } from "../adapter/mdastToDoc";
import { buildExtensions } from "../adapter/schema";
import { listManualFiles, readManualFile } from "../mdx/corpus";
import { parseMdx } from "../mdx/pipeline";

const schema = getSchema(buildExtensions());
const files = listManualFiles();

test("corpus is non-empty (guards against a wrong path)", () => {
  expect(files.length).toBeGreaterThan(200);
});

// The cheap, strong gate: for EVERY corpus file, the PM doc JSON the adapter
// produces must construct a valid `schema.nodeFromJSON` without throwing.
// `nodeFromJSON` performs full content-model validation (children match the
// node's `content` expression, marks are allowed where applied, etc) — this
// is exactly the class of error that can slip past JSON-only tests. Any file
// that fails here names a genuine adapter/schema bug to fix in
// `src/adapter/*`, never something to skip or swallow.
for (const file of files) {
  test(`produces a schema-valid PM doc: ${file}`, () => {
    const source = readManualFile(file);
    const { doc } = mdastToDoc(parseMdx(source));
    expect(() => schema.nodeFromJSON(doc)).not.toThrow();
  });
}

// Belt-and-braces: actually mount a handful of representative pages (heavy
// nesting, admonitions, ordered-list `start`, and an inline Shortcut atom) in
// a real headless `@tiptap/core` Editor instance, the same construction path
// `Editor.tsx`'s `useEditor` uses under the hood. This exercises the full
// editor init (schema build + doc parse + initial view state), not just
// `nodeFromJSON`'s content-model check.
describe("representative pages mount in a real TipTap Editor", () => {
  const representative = [
    "basics/installing-ffmpeg.mdx", // heavy Tabs/Tab + nested Callouts + code
    "basics/audacity-editing.mdx", // Callouts
    "audio-editing/using-realtime-effects.mdx", // Notes/TipsAndTricks + ordered-list start
  ];

  for (const suffix of representative) {
    test(suffix, () => {
      const file = files.find((f) => f.replace(/\\/g, "/").endsWith(suffix));
      expect(file).toBeDefined();
      const source = readManualFile(file!);
      const { doc } = mdastToDoc(parseMdx(source));
      expect(() => {
        const editor = new Editor({
          element: document.createElement("div"),
          extensions: buildExtensions(),
          content: doc,
        });
        editor.destroy();
      }).not.toThrow();
    });
  }

  test("a page with <Shortcut> mounts", () => {
    const file = files.find((f) =>
      f.replace(/\\/g, "/").endsWith("accessibility/track-view.mdx"),
    );
    expect(file).toBeDefined();
    const source = readManualFile(file!);
    expect(source).toContain("<Shortcut");
    const { doc } = mdastToDoc(parseMdx(source));
    expect(() => {
      const editor = new Editor({
        element: document.createElement("div"),
        extensions: buildExtensions(),
        content: doc,
      });
      editor.destroy();
    }).not.toThrow();
  });
});
