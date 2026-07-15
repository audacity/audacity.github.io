import { Extension } from "@tiptap/core";
import Suggestion, { type SuggestionOptions } from "@tiptap/suggestion";
import { filterSlashItems, type SlashItem } from "./slashItems";
import { renderSlashMenu, type SlashCommandSelection } from "./SlashMenu";

export interface SlashCommandOptions {
  suggestion: Omit<
    SuggestionOptions<SlashItem, SlashCommandSelection>,
    "editor"
  >;
}

/**
 * TipTap extension wrapping `@tiptap/suggestion`: typing `/` at the start of
 * a query (spaces not allowed mid-query, so the trigger closes as soon as
 * the user types a space) opens `SlashMenuList` via `renderSlashMenu`'s
 * glue. Selecting an item deletes the `/query` range and runs the item
 * against the live editor — the exact same `insertCommands`-backed
 * functions `Toolbar.tsx`'s buttons call.
 *
 * Not wired into `buildAppExtensions()` yet — see Task 2.
 */
export const SlashCommand = Extension.create<SlashCommandOptions>({
  name: "slashCommand",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        allowSpaces: false,
        startOfLine: false,
        items: ({ query }) => filterSlashItems(query),
        render: renderSlashMenu,
        command: ({ editor, range, props }) => {
          editor.chain().focus().deleteRange(range).run();
          props.item.run(editor);
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

export default SlashCommand;
