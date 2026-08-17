import { EditorContent, useEditor } from "@tiptap/react";
import { useMemo } from "react";
import { mdastToDoc } from "../adapter/mdastToDoc";
import { parseMdx } from "../mdx/pipeline";
import { buildAppExtensions } from "./editorExtensions";

/**
 * Renders a page source as a non-editable TipTap view. Used by the compare
 * pane to show the published (base-branch) version alongside the live draft.
 * Keyed on `source` so the editor is recreated when the source changes.
 */
export function ReadOnlyDoc({ source }: { source: string }) {
  const doc = useMemo(() => {
    const { doc } = mdastToDoc(parseMdx(source));
    return doc;
  }, [source]);

  const editor = useEditor(
    {
      extensions: buildAppExtensions(),
      content: doc,
      editable: false,
    },
    [source],
  );

  return <EditorContent editor={editor} />;
}
