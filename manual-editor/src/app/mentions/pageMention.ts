import type { Editor } from "@tiptap/core";
import { Extension } from "@tiptap/core";
import { PluginKey } from "@tiptap/pm/state";
import Suggestion, { type SuggestionOptions } from "@tiptap/suggestion";
import type { ManualPageMeta } from "../../backend/types";
import {
  renderPageMentionMenu,
  type PageMentionSelection,
} from "./PageMentionMenu";

/** Caps how many rows the popup shows for any query — mirrors a typical command-palette result count. */
const MAX_RESULTS = 8;

/**
 * Per-editor registry of the manual's page list, bridging `@` mention
 * filtering (`suggestion.items`, invoked deep inside `PageMention`'s
 * ProseMirror plugin) to the `ManualPageMeta[]` that only `Editor.tsx`/`App`
 * have loaded — same `WeakMap<Editor, ...>` pattern as `imageUpload.ts`'s
 * `imageContexts` (see that module's doc comment for why a `WeakMap` rather
 * than React context is the right bridge here), and for the same reason: a
 * `SuggestionOptions.items` callback only receives `{ query, editor }`, with
 * no path back to the component tree that owns the loaded page list.
 *
 * `registerPageContext` is safe to call repeatedly for the same `editor` —
 * each call simply replaces the previously-registered array (a plain
 * `WeakMap.set`), so `Editor.tsx` re-registering whenever its `pages` prop
 * changes (e.g. after a new page is created or the sidebar refreshes) keeps
 * the mention list current without any extra bookkeeping.
 */
const pageContexts = new WeakMap<Editor, ManualPageMeta[]>();

/** Registers (or replaces) the page list `editor`'s `@` mention menu filters against. */
export function registerPageContext(
  editor: Editor,
  pages: ManualPageMeta[],
): void {
  pageContexts.set(editor, pages);
}

/** Looks up the page list registered for `editor`, if any. */
export function getPageContext(editor: Editor): ManualPageMeta[] | undefined {
  return pageContexts.get(editor);
}

/**
 * Case-insensitive filter over `pages`, matching against `title` or `slug`
 * (substring match). Title matches are ranked ahead of slug-only matches
 * (each group otherwise keeping `pages`' own order), capped at
 * `MAX_RESULTS`. An empty/whitespace-only query returns the first
 * `MAX_RESULTS` pages in their declared order, unfiltered — same "show
 * something useful before the user types anything" behavior as
 * `slashItems.ts`'s `filterSlashItems`.
 */
export function filterPages(
  pages: ManualPageMeta[],
  query: string,
): ManualPageMeta[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return pages.slice(0, MAX_RESULTS);

  const titleMatches: ManualPageMeta[] = [];
  const slugMatches: ManualPageMeta[] = [];
  for (const page of pages) {
    if (page.title.toLowerCase().includes(normalized)) {
      titleMatches.push(page);
    } else if (page.slug.toLowerCase().includes(normalized)) {
      slugMatches.push(page);
    }
  }
  return [...titleMatches, ...slugMatches].slice(0, MAX_RESULTS);
}

/**
 * `@tiptap/suggestion`'s `Suggestion()` defaults `pluginKey` to a SHARED
 * module-level `PluginKey("suggestion")` when the caller doesn't supply one
 * — fine when only one `Suggestion()`-backed extension is registered, but
 * `buildAppExtensions()` also registers `slash/SlashCommand.ts`'s `/` menu
 * (which likewise doesn't override the default), and ProseMirror's
 * `Configuration` throws ("Adding different instances of a keyed plugin")
 * if two plugins share a key. A distinct key is required for `PageMention`
 * to coexist with `SlashCommand` on the same editor.
 */
const pageMentionPluginKey = new PluginKey("pageMention");

export interface PageMentionOptions {
  suggestion: Omit<
    SuggestionOptions<ManualPageMeta, PageMentionSelection>,
    "editor"
  >;
}

/**
 * TipTap extension wrapping `@tiptap/suggestion`, mirroring
 * `slash/SlashCommand.ts`'s architecture exactly (same `Suggestion` util,
 * same `render`/glue split into a companion menu module) but triggered by
 * `"@"` instead of `"/"`, and filtering the registered page list
 * (`getPageContext`) instead of a static command registry.
 *
 * Selecting a page deletes the `@query` range and inserts a **link-marked
 * text run**: the page's title as text, carrying a `link` mark pointing at
 * `/manual/<slug>` (the corpus' internal-link convention), followed by a
 * plain space — inserted as a SEPARATE content item with no marks, so it
 * doesn't inherit the link mark (adjacent text nodes with different marks
 * never merge in ProseMirror). That plain space is what stops the link from
 * "growing" to swallow whatever the author types next.
 */
export const PageMention = Extension.create<PageMentionOptions>({
  name: "pageMention",

  addOptions() {
    return {
      suggestion: {
        pluginKey: pageMentionPluginKey,
        char: "@",
        allowSpaces: false,
        startOfLine: false,
        items: ({ query, editor }) =>
          filterPages(getPageContext(editor) ?? [], query),
        render: renderPageMentionMenu,
        command: ({ editor, range, props }) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent([
              {
                type: "text",
                text: props.page.title,
                marks: [
                  {
                    type: "link",
                    attrs: { href: `/manual/${props.page.slug}` },
                  },
                ],
              },
              { type: "text", text: " " },
            ])
            .run();
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});

export default PageMention;
