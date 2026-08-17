import { NodeViewWrapper } from "@tiptap/react";
import type { ReactNodeViewProps } from "@tiptap/react";

/**
 * Matches `asset.mts`'s `ASSET_PREFIX` gate (`src/assets/img/manual/`), plus
 * the two other shapes a persisted `image` node's `src` can already carry
 * from the existing corpus: absolute URLs (`https://...`, root-relative
 * `/...`) and `data:` URIs. Anything matching this is rendered as-is;
 * everything else (the repo-relative paths new uploads persist — see the
 * plan's Global Constraints) is routed through the proxy below.
 */
const ABSOLUTE_SRC = /^https?:|^data:|^\//;

/**
 * Maps a persisted `image` node's `src` to what the `<img>` should actually
 * request. New uploads persist a repo-relative path
 * (`src/assets/img/manual/...`) that resolves to nothing in the browser —
 * this app has no bundler serving the main site's `src/assets` tree — so
 * those are routed through `GET /api/asset?path=` (`asset.mts`), which
 * streams the bytes from whichever backend/branch has them. Existing corpus
 * images already use absolute or `data:` URLs and bypass the proxy
 * entirely. This is a DISPLAY-ONLY mapping: the node's `src` attribute
 * itself, and what gets serialized back to MDX, is always the original
 * persisted value (see the plan's Global Constraints) — nothing here ever
 * writes a proxied URL back into the doc.
 */
export function displaySrc(src: string): string {
  if (!src || ABSOLUTE_SRC.test(src)) return src;
  return `/api/asset?path=${encodeURIComponent(src)}`;
}

/**
 * Node view for the `image` block atom (`![alt](src "title")`). Renders the
 * (possibly proxied) image plus a muted caption line showing its alt text.
 * Unlike `AdmonitionView`/`ShortcutView` there's no inline editing UI here —
 * alt text is set once, at insert time, via `imageUpload.ts`'s required
 * prompt — so this view is read-only (`contentEditable={false}`, no
 * `NodeViewContent`, matching `PreservedView`'s pattern for atom nodes with
 * no PM content model). Selected-state styling rides on ProseMirror's
 * default `ProseMirror-selectednode` class (applied automatically to a node
 * view's DOM root when it's the target of a `NodeSelection` — no custom
 * `selectNode`/`deselectNode` override needed here), styled in `editor.css`.
 */
export function ImageView({ node }: ReactNodeViewProps) {
  const src = (node.attrs.src as string | null) ?? "";
  const alt = (node.attrs.alt as string | null) ?? "";

  return (
    <NodeViewWrapper
      className="image-block"
      data-testid="image-block"
      contentEditable={false}
    >
      <img className="image-block__img" src={displaySrc(src)} alt={alt} />
      {alt.trim() ? <p className="image-block__caption">{alt}</p> : null}
    </NodeViewWrapper>
  );
}

export default ImageView;
