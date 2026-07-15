import { EditorContent, useEditor } from "@tiptap/react";
import type { Editor as TiptapEditor } from "@tiptap/core";
import { useEffect, useMemo, useState } from "react";
import { mdastToDoc } from "../adapter/mdastToDoc";
import {
  serializeFrontmatter,
  type FrontmatterData,
} from "../adapter/frontmatterSerialize";
import { parseFrontmatter } from "../backend/frontmatter";
import { buildAppExtensions } from "./editorExtensions";
import { parseMdx } from "../mdx/pipeline";
import { FrontmatterForm } from "./FrontmatterForm";
import { api as defaultApi, type makeApi } from "./api";

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
 * `onFrontmatterSourceReady`, and also feeds D6's autosave path below.
 *
 * D6 autosave: any editor content change (`editor.on("update")`) or
 * frontmatter form change bumps `saveVersion`, which (re)arms a debounce
 * timer (`autosaveDelayMs`, default 1.2s). When it fires, the current PM doc
 * JSON + serialized frontmatter are posted via
 * `api.saveDraftDoc(path, doc, frontmatter)` to `/api/draft`, which calls
 * the real `docToSource(doc, frontmatter)` — never hand-assembled — on the
 * *server* to build the final MDX before committing it to the dev backend.
 * This save path deliberately does NOT call `docToSource` (or import
 * anything from `../adapter/docToMdast`) here in browser code: `docToSource`
 * -> `formatMdx` (`../mdx/normalize.ts`) does `import path from "node:path"`
 * and resolves the repo's `.prettierrc.json` off disk at module scope, both
 * Bun/Node-only — bundled into the client and evaluated in a real browser,
 * that import throws immediately (Vite's `node:path` browser shim throws on
 * property access), which took down the entire app (blank page, nothing
 * rendered) the moment this module was reachable from `Editor.tsx`'s import
 * graph. Netlify functions run under Bun/Node, so the exact same
 * `docToSource` call is safe and correct there — see `draft.ts`.
 *
 * The effect closes over `path` from its own render, and its cleanup
 * (unmount, or a `saveVersion`/`path` change before the timer fires) both
 * cancels the pending timeout and flips a `cancelled` flag so an in-flight
 * save from a page that's since been navigated away from can't clobber the
 * new page's status indicator — see the effect body. On success,
 * `onDraftSaved(path)` lets `App` know to refresh the page list's
 * `hasDraft` dot.
 */
export function Editor({
  source,
  path,
  sections = [],
  onFrontmatterSourceReady,
  api = defaultApi,
  onDraftSaved,
  autosaveDelayMs = 1200,
  onEditorReady,
  onAddSubpage,
  hasChildren,
  onDeleted,
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
  /** Injectable for tests; defaults to the real fetch-backed client. */
  api?: ReturnType<typeof makeApi>;
  /** Called with `path` after a debounced autosave succeeds. */
  onDraftSaved?: (path: string) => void;
  /** Debounce idle time before autosaving, in ms. Overridable for tests. */
  autosaveDelayMs?: number;
  /** Test-only hook exposing the live TipTap instance once created. */
  onEditorReady?: (editor: TiptapEditor) => void;
  /** Called when the header's "Add sub-page" button is clicked. */
  onAddSubpage: () => void;
  /**
   * True when the active page has sub-pages. Blocks deletion (the header's
   * "Delete page" button renders disabled with a guard tooltip) since
   * deleting a parent would orphan its children in the tree.
   */
  hasChildren: boolean;
  /**
   * Called after a successful `api.deletePage(path)`. `App` responds by
   * clearing `source`/`activePath`, which unmounts this `Editor` instance —
   * the debounce effect above already cancels any in-flight/pending autosave
   * on unmount (see its cleanup), so no extra guard is needed here for the
   * delete-then-unmount sequence.
   */
  onDeleted: () => void;
}) {
  const [frontmatterData, setFrontmatterData] = useState<FrontmatterData>(() =>
    toFrontmatterData(parseFrontmatter(source).data),
  );
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "dirty" | "saving" | "saved" | "error" | "delete-error"
  >("idle");
  const [saveVersion, setSaveVersion] = useState(0);
  // Header delete action's tiny local state machine: plain button ->
  // (click) -> inline confirm -> (confirm) -> `api.deletePage` in flight ->
  // success calls `onDeleted` (which unmounts this component via `App`
  // clearing `source`), failure falls back to the plain button with
  // `saveStatus` flipped to "error" (reusing the existing save-status
  // styling rather than inventing a second error affordance).
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
      onCreate: ({ editor: created }) => onEditorReady?.(created),
    },
    [path],
  );

  // Marks the doc dirty (and (re)arms the autosave debounce below) on every
  // content-changing transaction. Registered/torn down per `editor`
  // instance, which is recreated whenever `path` changes (see `useEditor`'s
  // deps above), so a stale listener never fires against a page that's no
  // longer mounted.
  useEffect(() => {
    if (!editor) return;
    const handleUpdate = () => {
      setSaveStatus("dirty");
      setSaveVersion((v) => v + 1);
    };
    editor.on("update", handleUpdate);
    return () => {
      editor.off("update", handleUpdate);
    };
  }, [editor]);

  // The debounced autosave itself. `saveVersion` is the trigger: it only
  // increments once an actual edit has happened (content or frontmatter),
  // so the initial mount (`saveVersion === 0`) never autosaves an unedited
  // page. Re-running effects re-arm the timer, which is the debounce.
  useEffect(() => {
    if (saveVersion === 0 || !editor) return;
    const savingPath = path;
    let cancelled = false;
    const timer = setTimeout(() => {
      void (async () => {
        setSaveStatus("saving");
        try {
          await api.saveDraftDoc(
            savingPath,
            editor.getJSON(),
            serializeFrontmatter(frontmatterData),
          );
          if (cancelled) return;
          setSaveStatus("saved");
          onDraftSaved?.(savingPath);
        } catch {
          if (!cancelled) setSaveStatus("error");
        }
      })();
    }, autosaveDelayMs);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // `editor`, `frontmatterData`, `api`, `onDraftSaved`, `autosaveDelayMs`
    // are deliberately read from this render's closure rather than listed:
    // any of them changing mid-debounce is already covered by `saveVersion`
    // (content/frontmatter edits) or `path` (page switch) re-arming the
    // timer with fresh values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveVersion, path]);

  async function handleConfirmDelete() {
    setDeleting(true);
    try {
      await api.deletePage(path);
      onDeleted();
    } catch {
      setDeleting(false);
      setConfirmingDelete(false);
      // Distinct from autosave "error": nothing was edited — the DELETE failed.
      setSaveStatus("delete-error");
    }
  }

  function handleFrontmatterChange(next: FrontmatterData) {
    setFrontmatterData(next);
    onFrontmatterSourceReady?.(serializeFrontmatter(next));
    setSaveStatus("dirty");
    setSaveVersion((v) => v + 1);
  }

  const saveStatusLabel =
    saveStatus === "saving"
      ? "Saving…"
      : saveStatus === "saved"
        ? "Saved draft ●"
        : saveStatus === "dirty"
          ? "Edited"
          : saveStatus === "error"
            ? "Save failed"
            : saveStatus === "delete-error"
              ? "Delete failed"
              : "";

  return (
    <div className="editor-frame" data-testid="editor">
      {/* Full-bleed chrome header: page metadata reads as app chrome, not
          as part of the rich-text document. Stays put while the document
          scrolls below it. */}
      <div className="editor-header">
        <FrontmatterForm
          data={frontmatterData}
          sections={sections}
          onChange={handleFrontmatterChange}
        />
        <button
          type="button"
          data-testid="editor-add-subpage"
          className="editor-header__add-subpage"
          onClick={onAddSubpage}
        >
          Add sub-page
        </button>
        {hasChildren ? (
          <button
            type="button"
            data-testid="editor-delete-page"
            className="editor-header__delete"
            disabled
            title="Delete or move its sub-pages first"
          >
            Delete page
          </button>
        ) : confirmingDelete ? (
          <span className="editor-header__delete-confirm">
            <span className="editor-header__delete-confirm-label">
              Delete this page?
            </span>
            <button
              type="button"
              data-testid="editor-delete-confirm"
              className="editor-header__delete-confirm-button"
              disabled={deleting}
              onClick={handleConfirmDelete}
            >
              Delete
            </button>
            <button
              type="button"
              data-testid="editor-delete-cancel"
              className="editor-header__delete-cancel-button"
              disabled={deleting}
              onClick={() => setConfirmingDelete(false)}
            >
              Cancel
            </button>
          </span>
        ) : (
          <button
            type="button"
            data-testid="editor-delete-page"
            className="editor-header__delete"
            onClick={() => setConfirmingDelete(true)}
          >
            Delete page
          </button>
        )}
        <span
          data-testid="save-status"
          className={`editor-topbar__save-status editor-topbar__save-status--${saveStatus}`}
        >
          {saveStatusLabel}
        </span>
      </div>
      <div className="editor-scroll">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
