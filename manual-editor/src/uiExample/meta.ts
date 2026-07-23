/**
 * Pure-data metadata for the curated design-system examples writers can
 * insert via the slash menu ("Audacity UI" group). This module must stay
 * free of React and `@dilsonspickles/components` imports: it is consumed by
 * the MDX adapter (both directions), the slash menu, import injection, and
 * the Netlify draft function — including under `bun test`, which cannot
 * load the DS package's CSS side-effect imports.
 *
 * Ids (`id`, `variants[].id`) are serialized into published MDX
 * (`<UIExample component="button" variant="primary" />`) and are permanent:
 * never rename one once pages may reference it.
 *
 * The per-variant PROPS live in the site-side registry
 * (`src/components/manual/UIExample/registry.tsx` at the repo root), keyed
 * by these ids — `registryData.ts` there must cover every id listed here
 * (enforced by `registryData.test.ts`).
 */

export interface UIExampleVariantMeta {
  /** Serialized into MDX (`variant="primary"`). Permanent. */
  id: string;
  /** Shown in the editor block's variant dropdown. */
  label: string;
}

export interface UIExampleMeta {
  /** Serialized into MDX (`component="button"`). Permanent. */
  id: string;
  /** Slash-menu row label and block chrome title. */
  label: string;
  /** Right-aligned slash-menu hint. */
  hint?: string;
  /** Extra fuzzy-filter terms for the slash menu. */
  keywords: string[];
  /** Offer the Static/Interactive toggle in the editor block chrome. */
  allowInteractive: boolean;
  /**
   * Component cannot server-render (canvas/effect drawing): the serializer
   * emits `client:load` even for static inserts. No seed entry sets this
   * yet — the first curated entry that does MUST add the round-trip test
   * covering the static+client:load form (see Task 2 note).
   */
  needsBrowser?: boolean;
  /** First variant is the default used on insert. Never empty. */
  variants: UIExampleVariantMeta[];
}

export const UI_EXAMPLE_META: UIExampleMeta[] = [
  {
    id: "button",
    label: "Button",
    keywords: ["button", "cta", "primary", "secondary"],
    allowInteractive: true,
    variants: [
      { id: "primary", label: "Primary" },
      { id: "secondary", label: "Secondary" },
      { id: "disabled", label: "Disabled" },
    ],
  },
  {
    id: "checkbox",
    label: "Checkbox",
    keywords: ["checkbox", "check", "toggle", "tick"],
    allowInteractive: true,
    variants: [
      { id: "checked", label: "Checked" },
      { id: "unchecked", label: "Unchecked" },
      { id: "disabled", label: "Disabled" },
    ],
  },
  {
    id: "knob",
    label: "Knob",
    keywords: ["knob", "rotary", "dial", "gain"],
    allowInteractive: true,
    variants: [
      { id: "default", label: "Default" },
      { id: "at-75", label: "At 75%" },
    ],
  },
];

export function uiExampleMeta(id: string): UIExampleMeta | undefined {
  return UI_EXAMPLE_META.find((m) => m.id === id);
}

export function hasUIExampleVariant(
  meta: UIExampleMeta,
  variantId: string,
): boolean {
  return meta.variants.some((v) => v.id === variantId);
}
