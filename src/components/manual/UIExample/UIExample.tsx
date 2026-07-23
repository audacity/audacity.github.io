// src/components/manual/UIExample/UIExample.tsx
/**
 * The component manual MDX pages import:
 *   <UIExample component="knob" variant="at-75" interactive client:load />
 *
 * Resolves the id pair through the curated registry and renders the real
 * design-system component with that variant's preset props — synchronously,
 * so static (no-directive, zero-JS) usage server-renders correctly.
 *
 * `interactive` only controls pointer events: a static example is visually
 * identical but inert. Hydration itself is Astro's business via the
 * `client:load` directive the editor emits alongside `interactive`.
 */
import { resolveUIExample } from "./registry";

export default function UIExample({
  component,
  variant,
  interactive = false,
}: {
  component: string;
  variant: string;
  interactive?: boolean;
}) {
  const resolved = resolveUIExample(component, variant);
  if (!resolved) {
    // Stale reference (registry entry removed after publish): degrade
    // quietly on the page, never fail the build — but still surface a
    // build warning so the stale reference gets noticed and cleaned up.
    console.warn(
      `UIExample: no registry entry for component="${component}" variant="${variant}"; rendering placeholder.`,
    );
    return <em>Example unavailable</em>;
  }
  const { Component, props } = resolved;
  return (
    <div
      className="ui-example"
      style={interactive ? undefined : { pointerEvents: "none" }}
    >
      <Component {...props} />
    </div>
  );
}
