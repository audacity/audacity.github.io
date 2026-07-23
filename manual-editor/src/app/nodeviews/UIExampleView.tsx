import { useEffect, useState } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import type { ReactNodeViewProps } from "@tiptap/react";
import { Component as ReactComponent } from "react";
import type { ReactNode } from "react";
import { uiExampleMeta } from "../../uiExample/meta";
import type { ResolvedUIExample } from "../../../../src/components/manual/UIExample/registry";

/**
 * Renders the real design-system component inside the editor.
 *
 * The registry (repo-root `registry.tsx`) is loaded with a RUNTIME dynamic
 * import, never statically: it imports `@dilsonspickles/components`, whose
 * dist files carry CSS side-effect imports that bun's test runner cannot
 * load — and this module is reachable from `editorExtensions.ts`, which
 * nearly every editor test imports. The dynamic import also gives tests a
 * mockable seam (see UIExampleView.test.tsx). Vite turns it into a normal
 * code-split chunk in the running app.
 */
export function UIExampleView({ node, updateAttributes }: ReactNodeViewProps) {
  const component = (node.attrs.component as string) ?? "";
  const variant = (node.attrs.variant as string) ?? "";
  const interactive = node.attrs.interactive === true;

  const meta = uiExampleMeta(component);
  const [resolved, setResolved] = useState<
    ResolvedUIExample | "loading" | null
  >("loading");

  useEffect(() => {
    let cancelled = false;
    import("../../../../src/components/manual/UIExample/registry")
      .then((m) => {
        if (!cancelled) setResolved(m.resolveUIExample(component, variant));
      })
      .catch(() => {
        if (!cancelled) setResolved(null);
      });
    return () => {
      cancelled = true;
    };
  }, [component, variant]);

  return (
    <NodeViewWrapper
      className="ui-example-block"
      data-testid="ui-example-block"
      contentEditable={false}
    >
      <div className="ui-example-block__chrome">
        <span className="ui-example-block__label">
          {meta?.label ?? component}
        </span>
        {meta ? (
          <select
            className="ui-example-block__variant"
            data-testid="ui-example-variant"
            value={variant}
            onChange={(e) => updateAttributes({ variant: e.target.value })}
          >
            {meta.variants.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
        ) : null}
        {meta?.allowInteractive ? (
          <button
            type="button"
            className="ui-example-block__interactive"
            data-testid="ui-example-interactive"
            aria-pressed={interactive}
            onClick={() => updateAttributes({ interactive: !interactive })}
          >
            {interactive ? "Interactive" : "Static"}
          </button>
        ) : null}
      </div>
      {resolved === "loading" ? (
        <p className="ui-example-block__status">Loading example…</p>
      ) : resolved === null ? (
        <p className="ui-example-block__status">
          Example unavailable — this component is no longer in the registry.
        </p>
      ) : (
        <div
          className="ui-example-block__stage"
          data-testid="ui-example-stage"
          style={interactive ? undefined : { pointerEvents: "none" }}
        >
          <RenderBoundary key={`${component}:${variant}`}>
            <resolved.Component {...resolved.props} />
          </RenderBoundary>
        </div>
      )}
    </NodeViewWrapper>
  );
}

/**
 * A DS component that throws must not take the document down — show a
 * quiet failure card instead (keyed remount above retries on variant
 * change).
 */
class RenderBoundary extends ReactComponent<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) {
      return <p className="ui-example-block__status">Failed to render.</p>;
    }
    return this.props.children;
  }
}

export default UIExampleView;
