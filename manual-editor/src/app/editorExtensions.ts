import type { Extension, Extensions, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { buildExtensions } from "../adapter/schema";
import { AdmonitionView } from "./nodeviews/AdmonitionView";
import { ImageView } from "./nodeviews/ImageView";
import { PreservedView } from "./nodeviews/PreservedView";
import { ShortcutView } from "./nodeviews/ShortcutView";
import { TabsView, TabView } from "./nodeviews/TabsView";
import { LinkShortcut } from "./linkShortcut";
import { SlashCommand } from "./slash/SlashCommand";
import { PageMention } from "./mentions/pageMention";
import { BlockReorder } from "./blockMove";
import { BlockSelection } from "./blockSelection";
import { TabEnterGuard } from "./tabKeymap";

/**
 * App-level extension list: the SAME ProseMirror schema as the pure adapter
 * `buildExtensions()` (used by `src/adapter`'s own tests and by
 * `editor-mount.test.tsx`), but with React node views attached to
 * `admonition`, `shortcut`, `preserved`, `tabs`, `tab` and `image` so the
 * live app renders them as a styled box, keycaps, a read-only "preserved"
 * card, a switchable tab strip, and a captioned image, respectively, instead
 * of bare content. Also appends
 * three plugin-only extensions with no schema footprint of their own —
 * `SlashCommand` (the `/` insert menu), `PageMention` (the `@` internal-link
 * insert menu — `./mentions/pageMention`) and `LinkShortcut` (⌘K to link the
 * selection) — which is why they're appended after the `.map()` below rather
 * than folded into it: they don't correspond to any node/mark
 * `buildExtensions()` already builds, so there's nothing to `.extend()`.
 * Since none add nodes or marks, `editorExtensions.test.ts`'s schema
 * parity assertion (which only compares `buildExtensions()` against this
 * function) is unaffected by their presence. `BlockReorder` (Alt+Up/Down
 * keyboard block moves, from `./blockMove`) is appended for the same
 * reason — it's a plugin-only `Extension` with no schema footprint. The
 * `starterKit` entry is additionally `.configure()`d (not `.extend()`d,
 * since it's an `Extension` bundling sub-extensions rather than a `Node`)
 * to recolor its bundled `dropcursor` to match the app's indigo accent —
 * `.configure()` only changes options, never the schema, so this is
 * likewise parity-safe. `BlockSelection` (from `./blockSelection` — Notion-
 * style multi-block selection: Cmd/Ctrl+Click toggle, Shift+Cmd/Ctrl+Click
 * range-fill, Esc to clear, plus the batch turn-into/duplicate/delete
 * commands the floating `SelectionBar` drives) is likewise plugin-only, so
 * it's appended here too rather than folded into the `.map()` above.
 * `TabEnterGuard` (from `./tabKeymap`) is appended last, after
 * `BlockReorder`/`BlockSelection`, for the same plugin-ordering reason its
 * own doc comment explains — being last in this array is what lets its
 * `Enter` binding intercept before the core `Keymap` extension's default
 * Enter chain (`liftEmptyBlock`/`splitBlock`) ever runs.
 *
 * Rather than redeclaring the node definitions here (which would risk the
 * two schemas drifting apart), this calls `.extend()` on the exact `Node`
 * instances `buildExtensions()` already builds. `.extend({ addNodeView })`
 * only adds a rendering hook — name/group/content/attrs/parseHTML/renderHTML
 * are inherited unchanged, so the resulting schema is identical. See
 * `editorExtensions.test.ts` for the parity assertion.
 */
export function buildAppExtensions(): Extensions {
  const extensions = buildExtensions().map((extension) => {
    if (extension.name === "starterKit") {
      return (extension as Extension).configure({
        dropcursor: { color: "#4f46e5", width: 2 },
      });
    }
    if (extension.name === "admonition") {
      return (extension as Node).extend({
        addNodeView() {
          return ReactNodeViewRenderer(AdmonitionView);
        },
      });
    }
    if (extension.name === "shortcut") {
      return (extension as Node).extend({
        addNodeView() {
          return ReactNodeViewRenderer(ShortcutView);
        },
      });
    }
    if (extension.name === "preserved") {
      return (extension as Node).extend({
        addNodeView() {
          return ReactNodeViewRenderer(PreservedView);
        },
      });
    }
    if (extension.name === "tabs") {
      return (extension as Node).extend({
        addNodeView() {
          return ReactNodeViewRenderer(TabsView);
        },
      });
    }
    if (extension.name === "tab") {
      return (extension as Node).extend({
        addNodeView() {
          return ReactNodeViewRenderer(TabView);
        },
      });
    }
    if (extension.name === "image") {
      return (extension as Node).extend({
        addNodeView() {
          return ReactNodeViewRenderer(ImageView);
        },
      });
    }
    return extension;
  });

  return [
    ...extensions,
    SlashCommand,
    PageMention,
    LinkShortcut,
    BlockReorder,
    BlockSelection,
    TabEnterGuard,
  ];
}
