import { EditorContent, useEditor } from "@tiptap/react";
import type { Editor as TiptapEditor } from "@tiptap/core";
import { DragHandle } from "@tiptap/extension-drag-handle-react";
import { offset } from "@floating-ui/dom";
import type { Node as PMNode } from "@tiptap/pm/model";
import { TextSelection } from "@tiptap/pm/state";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
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
import {
  insertImageFromFile,
  pageSlugFromPath,
  registerImageContext,
} from "./imageUpload";
import { getBlockActions, type BlockAction } from "./blockActions";
import { HandleMenu } from "./HandleMenu";

/** Matches the manual content collection schema's `sectionOrder`/`order` default. */
const DEFAULT_ORDER = 99;

/**
 * Positioning config for the drag handle, handed to
 * `@tiptap/extension-drag-handle-react`'s `<DragHandle>` as
 * `computePositionConfig` (it merges this over the package's own
 * `defaultComputePositionConfig` — `{ placement: "left-start", strategy:
 * "absolute" }` — before passing the result straight to `floating-ui`'s
 * `computePosition`).
 *
 * Declared at module scope rather than inline in the JSX below: the
 * `<DragHandle>` component re-registers its whole ProseMirror plugin
 * (`editor.registerPlugin`/`unregisterPlugin`) every time
 * `computePositionConfig`'s object identity changes (see its
 * `useEffect` deps in `node_modules/@tiptap/extension-drag-handle-react`) —
 * a fresh object literal on every `Editor` render would thrash that
 * registration on every keystroke.
 *
 * `left-start` (the default) top/left-aligns the handle flush against the
 * hovered block's own bounding rect — exactly right for an atomic block
 * like `image`/`admonition`/`tabs`, whose rect top IS the visual top of
 * its content, but visibly high for a text block's FIRST line, since a
 * line box's top edge sits above the glyphs themselves (half-leading from
 * `line-height` being taller than the glyphs' em box) — worse still for
 * headings, whose larger `font-size` before a comparatively tighter
 * `line-height` produces the widest gap between "line box top" and "visual
 * text center". The `offset` middleware below only touches the ~4px range
 * that difference occupies for the common case: `mainAxis` opens a small
 * breathing gap between the handle and the text edge (Notion-style, rather
 * than the two visually touching), and a small positive `crossAxis`
 * (`+`, for a `left-*` placement, moves the floating element DOWN — see
 * `@floating-ui/core`'s `crossAxis = alignment === 'end' ? -1 : 1` times
 * `alignmentAxis`) nudges the handle down just enough to read as centered
 * against a typical paragraph/heading's first line without overshooting
 * into visibly hanging below an image/callout's flush top edge.
 */
const HANDLE_COMPUTE_POSITION_CONFIG = {
  placement: "left-start" as const,
  strategy: "absolute" as const,
  middleware: [offset({ mainAxis: 6, crossAxis: 3 })],
};

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
  enableDragHandle = true,
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
  /**
   * Renders the Notion-style block drag handle. Defaults on for the real
   * app; existing suites that mount `Editor` under happy-dom leave it on
   * too — `@tiptap/extension-drag-handle-react` registers its plugin (and
   * portals its handle content) without touching `floating-ui`'s DOM
   * measurement APIs until an actual pointer interaction occurs, which
   * happy-dom tolerates fine. The prop exists so a real-browser-only edge
   * case can still opt out per-test without changing the default.
   */
  enableDragHandle?: boolean;
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
  // Collapses the frontmatter form behind an "Edit details" toggle so the
  // header's default state is a single tidy title row. No persistence: each
  // page mount (a fresh `Editor` instance, per the component doc above)
  // starts collapsed.
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  const doc = useMemo(() => {
    const { doc } = mdastToDoc(parseMdx(source));
    return doc;
    // `path` is included so a same-source-different-path edge case (unlikely
    // in practice, since App clears `source` between selections) still
    // recomputes rather than reusing a stale doc.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, path]);

  const pageSlug = useMemo(() => pageSlugFromPath(path), [path]);

  // `handlePaste`/`handleDrop` below are captured into `editorProps` at
  // editor-CREATION time (i.e. whenever `[path]` — `useEditor`'s deps array
  // — changes), same as the autosave effect's closed-over `api`/
  // `onDraftSaved`/etc (see that effect's comment). But the TipTap `Editor`
  // instance itself doesn't exist yet while `useEditor`'s options object is
  // being built — it's the return value of the very call below — so
  // `insertImageFromFile` (which needs a real `Editor` to `.chain()` off of)
  // can't close over it directly. `editorRef` bridges that: `onCreate` fires
  // synchronously once the instance exists, before any real user
  // paste/drop can occur, and is re-set on every recreation. `onCreate` also
  // calls `registerImageContext` with this same `api`/`pageSlug` pair, for
  // the same underlying reason: the slash menu's "Image" item
  // (`slash/slashItems.ts`) only receives the bare `Editor` instance from
  // `SlashItem.run(editor)`, with no way to reach this component's `api`/
  // `pageSlug` closure directly.
  const editorRef = useRef<TiptapEditor | null>(null);

  // The block-handle context menu (Notion-style: click the drag handle to
  // open a menu of actions for the block it's hovering). `hoveredRef` tracks
  // the DragHandle package's currently-hovered `{node, pos}` — via `ref`
  // rather than `useState` since `onNodeChange` fires on every `mousemove`
  // over the document, and a re-render per pixel of mouse movement would be
  // wasteful when nothing visible needs to change until the handle is
  // actually clicked. `handleMenu` (real `useState`, since it DOES drive a
  // render) holds a snapshot — the action list plus the handle's own
  // bounding rect at click time — taken once, on click; the popup doesn't
  // track the hover state afterward, so it stays put even if the mouse
  // later leaves the handle (which clears `hoveredRef` via `onNodeChange`).
  const hoveredRef = useRef<{ node: PMNode; pos: number } | null>(null);
  // MUST be identity-stable: the <DragHandle> component lists `onNodeChange`
  // in the effect deps that (un)register its whole ProseMirror plugin and
  // reset the handle element to visibility:hidden — an inline arrow here
  // made every Editor re-render (save-status ticks etc.) tear the handle
  // down mid-hover, leaving it permanently invisible/untracked.
  const handleNodeChange = useCallback(
    ({ node, pos }: { node: PMNode | null; pos: number }) => {
      hoveredRef.current = node ? { node, pos } : null;
    },
    [],
  );
  const [handleMenu, setHandleMenu] = useState<{
    actions: BlockAction[];
    anchorRect: DOMRect;
  } | null>(null);

  function handleDragHandleClick(event: ReactMouseEvent<HTMLButtonElement>) {
    const hovered = hoveredRef.current;
    if (!editor || !hovered) return;
    setHandleMenu({
      actions: getBlockActions(editor, hovered.node, hovered.pos),
      anchorRect: event.currentTarget.getBoundingClientRect(),
    });
  }

  const editor = useEditor(
    {
      extensions: buildAppExtensions(),
      content: doc,
      editorProps: {
        // Pasted image(s) (e.g. a copied screenshot): runs the alt-prompt ->
        // upload -> insert flow for the FIRST image file and reports the
        // paste handled (`true`) so ProseMirror doesn't also fall through to
        // its default text-insertion behavior for the same clipboard event.
        // Anything without an image file (plain text, a copied block, ...)
        // returns `false` for ProseMirror's default handling. The flow
        // itself runs fire-and-forget (`void`) since this hook must answer
        // synchronously.
        handlePaste(_view, event) {
          const files = event.clipboardData?.files;
          if (!files) return false;
          for (const file of Array.from(files)) {
            if (file.type.startsWith("image/")) {
              const liveEditor = editorRef.current;
              if (liveEditor) {
                void insertImageFromFile(liveEditor, api, pageSlug, file);
              }
              return true;
            }
          }
          return false;
        },
        // Dropped image file(s) (e.g. dragged in from the Finder/desktop):
        // same flow as paste above, but first moves the selection to the
        // drop position (`view.posAtCoords`) so the image lands where the
        // user actually dropped it rather than wherever the caret happened
        // to be.
        //
        // `moved` is ProseMirror's own flag for "this drop is an in-editor
        // drag completing" (e.g. the Notion-style `DragHandle` block-move
        // above, or plain text/node drag-reordering) — it's `true` only for
        // drags that STARTED inside this same ProseMirror view, and such
        // drags never carry `dataTransfer.files` (there's no OS file
        // involved). Returning `false` immediately whenever `moved` is true
        // is therefore a pure guard against ever intercepting that path: it
        // hands the event straight back to ProseMirror's own default
        // drop-to-move handling, unexamined, before this code ever looks at
        // `dataTransfer` — the block drag-handle's DnD is untouched.
        handleDrop(view, event, _slice, moved) {
          if (moved) return false;
          const files = event.dataTransfer?.files;
          if (!files) return false;
          for (const file of Array.from(files)) {
            if (file.type.startsWith("image/")) {
              event.preventDefault();
              const liveEditor = editorRef.current;
              if (liveEditor) {
                const coords = view.posAtCoords({
                  left: event.clientX,
                  top: event.clientY,
                });
                if (coords) {
                  const { state } = view;
                  view.dispatch(
                    state.tr.setSelection(
                      TextSelection.near(state.doc.resolve(coords.pos)),
                    ),
                  );
                }
                void insertImageFromFile(liveEditor, api, pageSlug, file);
              }
              return true;
            }
          }
          return false;
        },
      },
      onCreate: ({ editor: created }) => {
        editorRef.current = created;
        registerImageContext(created, { api, pageSlug });
        onEditorReady?.(created);
      },
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
        <div className="editor-header__row">
          <div className="editor-header__title-group">
            <h1 className="editor-header__title" data-testid="page-title">
              {frontmatterData.title.trim() ? (
                frontmatterData.title
              ) : (
                <span className="editor-header__title--placeholder">
                  Untitled
                </span>
              )}
            </h1>
            <button
              type="button"
              data-testid="edit-page-details"
              className="editor-header__edit"
              aria-expanded={detailsExpanded}
              onClick={() => setDetailsExpanded((expanded) => !expanded)}
            >
              {detailsExpanded ? "Done" : "✎ Edit details"}
            </button>
          </div>
          <div className="editor-header__actions">
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
          </div>
        </div>
        {detailsExpanded ? (
          <FrontmatterForm
            data={frontmatterData}
            sections={sections}
            onChange={handleFrontmatterChange}
          />
        ) : null}
      </div>
      <div
        className="editor-scroll"
        // A stale menu anchored to a handle rect that's about to scroll out
        // from under it reads as broken (the popup floats over the wrong
        // block, or over nothing). Simplest fix: any scroll of the document
        // pane closes it outright rather than trying to keep it glued to a
        // moving anchor.
        onScroll={() => setHandleMenu(null)}
      >
        {enableDragHandle && editor ? (
          <DragHandle
            editor={editor}
            computePositionConfig={HANDLE_COMPUTE_POSITION_CONFIG}
            onNodeChange={handleNodeChange}
            className="drag-handle-wrapper"
          >
            <button
              type="button"
              className="drag-handle"
              data-testid="drag-handle"
              aria-label="Drag to move block"
              aria-haspopup="menu"
              title="Drag to move · Click for actions"
              tabIndex={-1}
              onClick={handleDragHandleClick}
            >
              ⠿
            </button>
          </DragHandle>
        ) : null}
        <EditorContent editor={editor} />
      </div>
      {handleMenu && editor ? (
        <HandleMenu
          editor={editor}
          actions={handleMenu.actions}
          anchorRect={handleMenu.anchorRect}
          onClose={() => setHandleMenu(null)}
        />
      ) : null}
      {/* Floating save-status pill: anchored to the pane's bottom-right
          corner (`.editor-frame` is the positioning context) rather than
          living in the chrome header, so it doesn't compete with page
          metadata for header space. Always rendered (so `save-status`
          keeps a stable DOM presence for existing assertions that read its
          `textContent` while idle) but visually hidden via
          `editor-save-pill--hidden` when there's nothing to show. */}
      <div
        className={
          saveStatusLabel
            ? "editor-save-pill"
            : "editor-save-pill editor-save-pill--hidden"
        }
        data-testid="save-status-pill"
      >
        <span
          data-testid="save-status"
          className={`editor-topbar__save-status editor-topbar__save-status--${saveStatus}`}
        >
          {saveStatusLabel}
        </span>
      </div>
    </div>
  );
}
