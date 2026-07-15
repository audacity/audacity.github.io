import type { Extensions, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { buildExtensions } from "../adapter/schema";
import { AdmonitionView } from "./nodeviews/AdmonitionView";
import { ShortcutView } from "./nodeviews/ShortcutView";

/**
 * App-level extension list: the SAME ProseMirror schema as the pure adapter
 * `buildExtensions()` (used by `src/adapter`'s own tests and by
 * `editor-mount.test.tsx`), but with React node views attached to
 * `admonition` and `shortcut` so the live app renders them as a styled box
 * and keycaps instead of bare content.
 *
 * Rather than redeclaring the node definitions here (which would risk the
 * two schemas drifting apart), this calls `.extend()` on the exact `Node`
 * instances `buildExtensions()` already builds. `.extend({ addNodeView })`
 * only adds a rendering hook — name/group/content/attrs/parseHTML/renderHTML
 * are inherited unchanged, so the resulting schema is identical. See
 * `editorExtensions.test.ts` for the parity assertion.
 */
export function buildAppExtensions(): Extensions {
  return buildExtensions().map((extension) => {
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
    return extension;
  });
}
