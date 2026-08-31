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
  // Containment matches the manual's other block components (see
  // Callout.astro's `border rounded-lg … my-6 not-prose` idiom), in a
  // neutral palette so the example itself carries the color. `not-prose`
  // keeps the page's typographic styles from leaking into the specimen.
  return (
    /*
      Fenced: some specimens (the timeline ruler) have a fixed width wider
      than the article column on narrow viewports, and the old flex
      justify-center let them bleed over the page — including the sidebar.
      overflow-x-auto keeps a too-wide specimen scrollable inside its own
      box, and w-fit/mx-auto centres a narrow one without the flex trap
      where centred overflow clips both edges unreachably.
    */
    <div
      className="ui-example not-prose my-6 max-w-full overflow-x-auto rounded-lg border border-text-primary/10 bg-background-light px-6 py-8"
      style={interactive ? undefined : { pointerEvents: "none" }}
    >
      <div className="w-fit mx-auto">
        <Component {...props} />
      </div>
    </div>
  );
}
