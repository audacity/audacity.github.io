import { Extension } from "@tiptap/core";

/**
 * `TabEnterGuard` — stops `Enter` from ever reaching ProseMirror's default
 * Enter handling (`@tiptap/core`'s built-in `Keymap` extension: `Enter` ->
 * `newlineInCode` -> `createParagraphNear` -> `liftEmptyBlock` ->
 * `splitBlock`, in that order) while the cursor sits in an EMPTY textblock
 * somewhere inside a `tab` node.
 *
 * Why this matters: `tabs`' content is `"tab+"` (see `../adapter/schema.ts`
 * — frozen, not touched here), so a `tab` node is a valid split target.
 * `prosemirror-commands`' `liftEmptyBlock`, when the cursor is in an empty
 * textblock that ISN'T the last child of its block parent, calls
 * `tr.split(before)` at the nearest splittable ancestor boundary rather than
 * lifting — and because `tabs` accepts another `tab` sibling, that boundary
 * can be the enclosing `tab` itself, silently splitting one `tab` into two.
 * (When the empty textblock IS the last child, `liftEmptyBlock` instead
 * tries `liftTarget`, which fails since `tabs` doesn't accept a bare
 * paragraph, and the chain falls through to `splitBlock` — which itself is
 * safe, just adding another empty paragraph inside the SAME tab. It's only
 * the non-last-child `liftEmptyBlock` path that actually manufactures a new
 * `tab`.) Rather than special-case which of those two now sits behind an
 * empty textblock, this swallows `Enter` unconditionally whenever the
 * textblock is empty and some ancestor is a `tab` — no lift, no split, no
 * escape. A NON-empty textblock (e.g. splitting "foo|bar" into two
 * paragraphs) is untouched: `splitBlock` there only ever inserts a sibling
 * paragraph inside the same `tab`, which is ordinary, expected editing.
 *
 * Registered LAST in `buildAppExtensions()` (see that module): TipTap's
 * `ExtensionManager.plugins` builds one keymap plugin per extension in
 * `[...coreExtensions, ...userExtensions]` order, then reverses that list
 * before a stable priority-sort (`get plugins()` in `@tiptap/core`) — so at
 * the shared default priority, LATER-declared user extensions win EARLIER
 * plugin-list slots, and are checked by ProseMirror's `handleKeyDown` before
 * the core `Keymap` extension's own `Enter` binding ever runs. Declaring
 * this last is what lets it intercept before `liftEmptyBlock`/`splitBlock`
 * fire at all, rather than racing them.
 *
 * Only ever touches `Enter`. Backspace is deliberately left alone (per this
 * feature's own scope) — merging an empty tab's content backward across its
 * boundary is a different, not-yet-scoped problem.
 */
export const TabEnterGuard = Extension.create({
  name: "tabEnterGuard",

  addKeyboardShortcuts() {
    return {
      Enter: () => {
        const { selection } = this.editor.state;
        const { $from, empty } = selection;
        if (!empty) return false;
        if ($from.parent.content.size !== 0) return false;

        for (let depth = $from.depth; depth >= 0; depth--) {
          if ($from.node(depth).type.name === "tab") return true;
        }
        return false;
      },
    };
  },
});

export default TabEnterGuard;
