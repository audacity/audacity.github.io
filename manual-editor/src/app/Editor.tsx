import { EditorContent, useEditor } from "@tiptap/react";
import { useMemo, useState } from "react";
import { mdastToDoc } from "../adapter/mdastToDoc";
import {
  serializeFrontmatter,
  type FrontmatterData,
} from "../adapter/frontmatterSerialize";
import { parseFrontmatter } from "../backend/frontmatter";
import { buildAppExtensions } from "./editorExtensions";
import { parseMdx } from "../mdx/pipeline";
import { FrontmatterForm } from "./FrontmatterForm";
import { Toolbar } from "./Toolbar";

/** Matches the manual content collection schema's `sectionOrder`/`order` default. */
const DEFAULT_ORDER = 99;

/**
 * Coerces the loosely-typed `parseFrontmatter` output into the form's
 * `FrontmatterData` shape, filling in the same defaults the content
 * collection schema applies (`src/content/config.ts` in the main repo) so
 * the form always starts from a valid, schema-consistent record even for a
 * page missing optional keys.
 */
function toFrontmatterData(data: Record<string, unknown>): FrontmatterData {
  return {
    title: typeof data.title === "string" ? data.title : "",
    description:
      typeof data.description === "string" && data.description !== ""
        ? data.description
        : undefined,
    section: typeof data.section === "string" ? data.section : "",
    sectionOrder:
      typeof data.sectionOrder === "number" ? data.sectionOrder : DEFAULT_ORDER,
    order: typeof data.order === "number" ? data.order : DEFAULT_ORDER,
    draft: data.draft === true,
  };
}

/**
 * Mounts a live TipTap editor (plus its frontmatter form) for a single
 * manual page.
 *
 * Converts the page's raw MDX `source` into a ProseMirror doc via the
 * adapter (`parseMdx` -> `mdastToDoc`) and hands it to `useEditor` as
 * initial content. `path` is the recreation key: a new page selection gets
 * a fresh editor instance rather than reusing/patching the previous one.
 * `App` only ever renders `Editor` once `source` is loaded (clearing it back
 * to `null` — and unmounting `Editor` — between page selections), so plain
 * `useState` initializers below are safe: each page selection is a genuine
 * fresh mount, not a prop update on a persisting instance.
 *
 * Frontmatter is parsed into structured `FrontmatterData` (via
 * `parseFrontmatter` + `toFrontmatterData`) and driven by `FrontmatterForm`,
 * replacing the original raw frontmatter string entirely — metadata edits
 * now persist. `serializeFrontmatter(frontmatterData)` is exposed via
 * `getFrontmatterSource` for D6's save path
 * (`docToSource(doc, serializeFrontmatter(frontmatterData))`), so it does
 * not currently need to be its own piece of state.
 */
export function Editor({
  source,
  path,
  sections = [],
  onFrontmatterSourceReady,
}: {
  source: string;
  path: string;
  /**
   * Existing section names across the manual, for the form's datalist.
   * Defaults to `[]` so callers that don't care about the datalist (e.g.
   * node-view tests exercising the editor in isolation) don't need to wire
   * it through.
   */
  sections?: string[];
  /**
   * Optional hook exposing the live serialized frontmatter string to a
   * caller (e.g. a future save action) each time the form data changes.
   */
  onFrontmatterSourceReady?: (frontmatterSource: string) => void;
}) {
  const [frontmatterData, setFrontmatterData] = useState<FrontmatterData>(() =>
    toFrontmatterData(parseFrontmatter(source).data),
  );

  const doc = useMemo(() => {
    const { doc } = mdastToDoc(parseMdx(source));
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

  function handleFrontmatterChange(next: FrontmatterData) {
    setFrontmatterData(next);
    onFrontmatterSourceReady?.(serializeFrontmatter(next));
  }

  return (
    <div data-testid="editor">
      <FrontmatterForm
        data={frontmatterData}
        sections={sections}
        onChange={handleFrontmatterChange}
      />
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
