import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import type { ReactNodeViewProps } from "@tiptap/react";

/**
 * Default heading text per Callout `type`, mirroring the palette intent of
 * the built site's `Callout.astro` (info/tip/warning -> Note/Tip/Warning).
 * Colors themselves live in `editor.css` (`.admonition[data-type="..."]`)
 * since this file has no styling toolchain to reach for (no Tailwind here).
 */
const DEFAULT_TITLE: Record<string, string> = {
  info: "Note",
  tip: "Tip",
  warning: "Warning",
};

/**
 * Node view for the `admonition` PM node, which `Callout`, `Notes`,
 * `Pitfalls`, `BestPractices` and `TipsAndTricks` mdast components all map
 * onto (see `registry.ts`). Only `Callout` carries a meaningful `type`/
 * `title`; the other components render their component name as a static
 * heading with no controls, since the adapter doesn't round-trip attrs for
 * them (`KNOWN_FLOW[...].attrs` is `[]`).
 */
export function AdmonitionView({ node, updateAttributes }: ReactNodeViewProps) {
  const component = (node.attrs.component as string) ?? "Callout";
  const isCallout = component === "Callout";
  const type = (node.attrs.type as string | null) ?? "info";
  const title = node.attrs.title as string | null;

  const heading = isCallout
    ? (title ?? DEFAULT_TITLE[type] ?? "Note")
    : component;

  return (
    <NodeViewWrapper
      className="admonition"
      data-testid="admonition"
      data-type={type}
    >
      <div
        className="admonition__header"
        // Keep the header's own DOM out of ProseMirror's content model so
        // clicking/typing in the select and title input behave like normal
        // form controls rather than editor commands.
        contentEditable={false}
      >
        {isCallout ? (
          <>
            <select
              className="admonition__type-select"
              aria-label="Callout type"
              value={type}
              onMouseDown={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
              onChange={(event) =>
                updateAttributes({ type: event.target.value })
              }
            >
              <option value="info">info</option>
              <option value="tip">tip</option>
              <option value="warning">warning</option>
            </select>
            <input
              className="admonition__title-input"
              aria-label="Callout title"
              type="text"
              value={title ?? ""}
              placeholder={DEFAULT_TITLE[type] ?? "Note"}
              onMouseDown={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
              onChange={(event) =>
                updateAttributes({ title: event.target.value || null })
              }
            />
          </>
        ) : (
          <span className="admonition__label">{heading}</span>
        )}
      </div>
      <NodeViewContent className="admonition__body" />
    </NodeViewWrapper>
  );
}

export default AdmonitionView;
