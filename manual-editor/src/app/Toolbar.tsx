import type { Editor } from "@tiptap/core";
import { useEditorState } from "@tiptap/react";
import {
  type AdmonitionComponent,
  insertAdmonition,
  insertShortcut,
  insertTabs,
} from "./insertCommands";

/**
 * The five mdast components that map onto the `admonition` PM node (see
 * `registry.ts`'s `KNOWN_FLOW`). Only `Callout` carries a meaningful `type`;
 * the rest render as a static heading (`AdmonitionView`), so their insert
 * just needs the bare `component` name.
 */
const ADMONITION_INSERTS: ReadonlyArray<{
  label: string;
  component: AdmonitionComponent;
  type?: string;
}> = [
  { label: "Callout", component: "Callout", type: "info" },
  { label: "Note", component: "Notes" },
  { label: "Pitfall", component: "Pitfalls" },
  { label: "Tip", component: "TipsAndTricks" },
  { label: "Best practice", component: "BestPractices" },
];

function promptForLink(editor: Editor) {
  if (editor.isActive("link")) {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    return;
  }
  // eslint-disable-next-line no-alert -- internal QA tooling, no design system to reach for a modal.
  const href = window.prompt("Link URL");
  if (!href) return;
  editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
}

/** Snapshot of the editor state the toolbar reacts to (active marks/blocks). */
interface ToolbarState {
  bold: boolean;
  italic: boolean;
  code: boolean;
  link: boolean;
  h2: boolean;
  h3: boolean;
  bulletList: boolean;
  orderedList: boolean;
}

const INACTIVE_STATE: ToolbarState = {
  bold: false,
  italic: false,
  code: false,
  link: false,
  h2: false,
  h3: false,
  bulletList: false,
  orderedList: false,
};

/**
 * Formatting toolbar + insert menu for the manual editor. Operates directly
 * on the TipTap `editor` instance passed down from `Editor.tsx`; renders
 * disabled (but present) when `editor` is still `null` during initial mount.
 *
 * Active-state reactivity: `useEditorState` subscribes to the editor's
 * transaction stream (it's a thin wrapper over `editor.on("transaction", …)`)
 * and re-renders this component whenever the selector's result changes —
 * covers both mark toggles and plain cursor movement into/out of a heading
 * or list, which a one-shot `editor.isActive()` read on mount would miss.
 */
export function Toolbar({ editor }: { editor: Editor | null }) {
  // `useEditorState`'s `editor: Editor | null` overload types its return as
  // `TSelectorResult | null` even though the selector below always returns a
  // concrete `ToolbarState` (falling back to `INACTIVE_STATE`, never
  // `null`, when `current` is null) — fall back to `INACTIVE_STATE` again
  // here purely to satisfy that overload's type, not because it's reachable.
  const state =
    useEditorState<ToolbarState>({
      editor,
      selector: ({ editor: current }) => {
        if (!current) return INACTIVE_STATE;
        return {
          bold: current.isActive("bold"),
          italic: current.isActive("italic"),
          code: current.isActive("code"),
          link: current.isActive("link"),
          h2: current.isActive("heading", { level: 2 }),
          h3: current.isActive("heading", { level: 3 }),
          bulletList: current.isActive("bulletList"),
          orderedList: current.isActive("orderedList"),
        };
      },
    }) ?? INACTIVE_STATE;

  const disabled = !editor;

  function markButton(
    key: keyof ToolbarState,
    label: string,
    run: (chain: ReturnType<Editor["chain"]>) => ReturnType<Editor["chain"]>,
  ) {
    const canRun = !!editor && run(editor.can().chain().focus()).run();
    return (
      <button
        key={key}
        type="button"
        className={`toolbar__button${state[key] ? " is-active" : ""}`}
        aria-pressed={state[key]}
        disabled={disabled || !canRun}
        onClick={() => editor && run(editor.chain().focus()).run()}
      >
        {label}
      </button>
    );
  }

  return (
    <div className="toolbar" role="toolbar" aria-label="Formatting">
      <div className="toolbar__group">
        {markButton("bold", "Bold", (c) => c.toggleBold())}
        {markButton("italic", "Italic", (c) => c.toggleItalic())}
        {markButton("code", "Code", (c) => c.toggleCode())}
        <button
          type="button"
          className={`toolbar__button${state.link ? " is-active" : ""}`}
          aria-pressed={state.link}
          disabled={disabled}
          onClick={() => editor && promptForLink(editor)}
        >
          Link
        </button>
      </div>

      <div className="toolbar__group">
        {markButton("h2", "H2", (c) => c.toggleHeading({ level: 2 }))}
        {markButton("h3", "H3", (c) => c.toggleHeading({ level: 3 }))}
        {markButton("bulletList", "Bullet list", (c) => c.toggleBulletList())}
        {markButton("orderedList", "Numbered list", (c) =>
          c.toggleOrderedList(),
        )}
      </div>

      <div className="toolbar__group toolbar__group--insert">
        <span className="toolbar__label">Insert</span>
        {ADMONITION_INSERTS.map((item) => (
          <button
            key={item.component}
            type="button"
            className="toolbar__button"
            disabled={disabled}
            onClick={() =>
              editor && insertAdmonition(editor, item.component, item.type)
            }
          >
            {item.label}
          </button>
        ))}
        <button
          type="button"
          className="toolbar__button"
          disabled={disabled}
          onClick={() => editor && insertTabs(editor)}
        >
          Tabs
        </button>
        <button
          type="button"
          className="toolbar__button"
          disabled={disabled}
          onClick={() => editor && insertShortcut(editor)}
        >
          Shortcut
        </button>
      </div>
    </div>
  );
}

export default Toolbar;
