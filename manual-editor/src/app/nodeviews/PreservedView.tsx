import { useState } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import type { ReactNodeViewProps } from "@tiptap/react";
import { stringifyMdx } from "../../mdx/pipeline";
import type { Root } from "mdast";

/** Loose shape covering the mdast node shapes `preserve()` (mdastToDoc.ts) wraps. */
interface PreservedMdastNode {
  type: string;
  name?: string | null;
  [key: string]: unknown;
}

/**
 * A human-readable label for the stored node: the JSX component name for
 * `mdxJsxFlowElement`/`mdxJsxTextElement` (e.g. "UIMap"), otherwise the raw
 * mdast node `type` (e.g. "mdxjsEsm", "code").
 */
function preservedLabel(node: PreservedMdastNode): string {
  return node.name ?? node.type;
}

/**
 * Renders the stored mdast node back to MDX/markdown source for the
 * "Show source" panel. Wraps it in a one-node `root` since `stringifyMdx`
 * stringifies a full tree. Stringifying an arbitrary preserved subtree is
 * inherently best-effort (it can be any mdast construct we don't otherwise
 * understand), so failures fall back to a plain description instead of
 * throwing and breaking the node view.
 */
function stringifyPreserved(node: PreservedMdastNode): string {
  try {
    return stringifyMdx({
      type: "root",
      children: [node as unknown as Root["children"][number]],
    });
  } catch {
    return `<< unable to render source for mdast node of type "${node.type}" >>`;
  }
}

/**
 * True when an `mdxjsEsm` node's source consists solely of `import`
 * statements (and blank lines) — the "component imports" block every manual
 * page carries. Exported for PreservedView tests.
 */
export function isImportOnlyEsm(node: PreservedMdastNode): boolean {
  if (node.type !== "mdxjsEsm" || typeof node.value !== "string") return false;
  const lines = node.value.split("\n").filter((l) => l.trim() !== "");
  return lines.length > 0 && lines.every((l) => /^\s*import\b/.test(l.trim()));
}

/**
 * Node view for the `preserved` block atom: any mdast construct the
 * mdast<->PM adapter doesn't understand (see `registry.ts` / `mdastToDoc.ts`
 * `preserve()`). It carries the original mdast subtree verbatim in
 * `node.attrs.mdast` so it survives an edit/save round trip unmodified, so
 * this view is intentionally read-only — no `NodeViewContent`, since the
 * node has no PM content model to edit in the first place (`atom: true`).
 */
export function PreservedView({ node }: ReactNodeViewProps) {
  const [showSource, setShowSource] = useState(false);
  const mdast = (node.attrs.mdast ?? { type: "unknown" }) as PreservedMdastNode;
  const label = preservedLabel(mdast);

  // Import-only ESM blocks are plumbing, not content: the site's MDX needs
  // its `import Callout from …` lines, but a writer should never see (or
  // worry about) them. Hide the block entirely — it stays in the document
  // and round-trips into the saved MDX like any preserved node, it just
  // doesn't render. Safe even if a writer removes it via a block-selection
  // sweep: `ensureComponentImports` (draft save, server-side) re-adds
  // whatever the page's components need on the next save. ESM carrying
  // anything BEYOND imports (exports, consts) still shows as a normal
  // preserved card.
  if (isImportOnlyEsm(mdast)) {
    return (
      <NodeViewWrapper
        className="preserved preserved--hidden-imports"
        data-testid="preserved-hidden-imports"
        contentEditable={false}
        style={{ display: "none" }}
      />
    );
  }

  return (
    <NodeViewWrapper
      className="preserved"
      data-testid="preserved"
      data-preserved-name={label}
      contentEditable={false}
    >
      <div className="preserved__header">
        <span className="preserved__badge">Preserved: {label}</span>
        <span className="preserved__note">
          This component is kept exactly as-is and isn&apos;t editable here.
        </span>
      </div>
      <details
        className="preserved__details"
        open={showSource}
        onToggle={(event) =>
          setShowSource((event.target as HTMLDetailsElement).open)
        }
      >
        <summary className="preserved__summary">Show source</summary>
        <pre className="preserved__source">
          <code>{stringifyPreserved(mdast)}</code>
        </pre>
      </details>
    </NodeViewWrapper>
  );
}

export default PreservedView;
