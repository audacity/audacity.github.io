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
