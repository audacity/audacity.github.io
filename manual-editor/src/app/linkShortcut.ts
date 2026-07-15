import { Extension } from "@tiptap/core";

/**
 * ⌘K (`Mod-k`) keymap: prompts for a link URL and applies/removes the
 * `link` mark on the current selection. Replaces the retired
 * `Toolbar.tsx`'s `promptForLink` button (see `docs/superpowers/plans`'
 * slash-menu plan, Task 2) as the app's only entry point for linking text —
 * the slash menu has no "Link" item since a slash command can't act on an
 * existing selection.
 *
 * - Collapsed (empty) selection: no-op, returns `false` so the key event
 *   isn't swallowed for no reason (nothing to link).
 * - Non-empty selection: `window.prompt("Link URL", existingHref ?? "")`,
 *   seeded with the selection's current href if it's already linked.
 *   - `null` (Cancel): no-op.
 *   - `""` (cleared the field): unsets the `link` mark.
 *   - Any other string: sets the `link` mark to that href.
 */
export const LinkShortcut = Extension.create({
  name: "linkShortcut",

  addKeyboardShortcuts() {
    return {
      "Mod-k": () => {
        const { editor } = this;
        const { from, to } = editor.state.selection;
        if (from === to) return false;

        const existingHref = editor.getAttributes("link").href as
          | string
          | undefined;
        // eslint-disable-next-line no-alert -- internal QA tooling, no design system to reach for a modal.
        const href = window.prompt("Link URL", existingHref ?? "");
        if (href === null) return true;
        if (href === "") {
          editor.chain().focus().extendMarkRange("link").unsetLink().run();
          return true;
        }
        editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
        return true;
      },
    };
  },
});

export default LinkShortcut;
