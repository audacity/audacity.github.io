import { EditorContent, useEditor } from "@tiptap/react";
import { useMemo, useRef } from "react";
import { mdastToDoc } from "../adapter/mdastToDoc";
import { buildAppExtensions } from "./editorExtensions";
import { parseMdx } from "../mdx/pipeline";

/**
 * Mounts a live TipTap editor for a single manual page.
 *
 * Converts the page's raw MDX `source` into a ProseMirror doc via the
 * adapter (`parseMdx` -> `mdastToDoc`) and hands it to `useEditor` as
 * initial content. `path` is the recreation key: a new page selection gets
 * a fresh editor instance rather than reusing/patching the previous one.
 *
 * Frontmatter has no UI yet (D5/D6), so it's stashed in a ref rather than
 * state — nothing currently needs to trigger a re-render off it.
 */
export function Editor({ source, path }: { source: string; path: string }) {
  const frontmatterRef = useRef<string | null>(null);

  const doc = useMemo(() => {
    const { doc, frontmatter } = mdastToDoc(parseMdx(source));
    frontmatterRef.current = frontmatter;
    return doc;
    // `path` is included so a same-source-different-path edge case (unlikely
    // in practice, since App clears `source` between selections) still
    // recomputes rather than reusing a stale doc.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, path]);

  const editor = useEditor(
    {
      extensions: buildAppExtensions(),
      content: doc,
    },
    [path],
  );

  return (
    <div data-testid="editor">
      <EditorContent editor={editor} />
    </div>
  );
}
