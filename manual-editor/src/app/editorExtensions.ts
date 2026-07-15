import type { Extensions, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { buildExtensions } from "../adapter/schema";
import { AdmonitionView } from "./nodeviews/AdmonitionView";
import { PreservedView } from "./nodeviews/PreservedView";
import { ShortcutView } from "./nodeviews/ShortcutView";
import { TabsView, TabView } from "./nodeviews/TabsView";

/**
 * App-level extension list: the SAME ProseMirror schema as the pure adapter
 * `buildExtensions()` (used by `src/adapter`'s own tests and by
 * `editor-mount.test.tsx`), but with React node views attached to
 * `admonition`, `shortcut`, `preserved`, `tabs` and `tab` so the live app
 * renders them as a styled box, keycaps, a read-only "preserved" card, and a
 * switchable tab strip, respectively, instead of bare content.
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
    return extension;
  });
}
