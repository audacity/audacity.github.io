/**
 * Per-variant props for the curated UI examples — PURE DATA, deliberately
 * split from `registry.tsx` (which holds the component references): this
 * module is imported by the manual editor's bun test suite, which cannot
 * load `@dilsonspickles/components` (CSS side-effect imports). Keep this
 * file free of DS-package and React imports.
 *
 * Keys mirror `manual-editor/src/uiExample/meta.ts` ids; the coverage test
 * (`manual-editor/src/uiExample/registryData.test.ts`) enforces that every
 * meta entry/variant has props here.
 *
 * Complex generated data (waveforms, envelope points) must not be computed
 * here via DS imports — when the first such entry is curated, add a lazy
 * per-entry props loader in `registry.tsx` instead.
 */
import {
  UI_EXAMPLE_META,
  hasUIExampleVariant,
  uiExampleMeta,
} from "../../../../manual-editor/src/uiExample/meta";

export const UI_EXAMPLE_VARIANT_PROPS: Record<
  string,
  Record<string, Record<string, unknown>>
> = {
  button: {
    primary: { variant: "primary", children: "Export" },
    secondary: { variant: "secondary", children: "Cancel" },
    disabled: { variant: "primary", children: "Export", disabled: true },
  },
  checkbox: {
    checked: { checked: true, "aria-label": "Enable option" },
    unchecked: { checked: false, "aria-label": "Enable option" },
    disabled: { checked: true, disabled: true, "aria-label": "Enable option" },
  },
  knob: {
    default: { value: 50, min: 0, max: 100, label: "Gain" },
    "at-75": { value: 75, min: 0, max: 100, label: "Gain" },
  },
  "ghost-button": {
    default: { size: "medium" },
    "with-label": { size: "medium", label: "Effects" },
    active: { size: "medium", active: true },
  },
  "pan-knob": {
    center: { value: 0, label: "Pan" },
    "panned-left": { value: -75, label: "Pan" },
    "panned-right": { value: 75, label: "Pan" },
  },
  "number-stepper": {
    default: { defaultValue: "120", step: 1, width: 72 },
    disabled: { defaultValue: "120", disabled: true, width: 72 },
  },
  "filter-chip": {
    default: { label: "Effects" },
    selected: { label: "Effects", selected: true },
  },
  "master-meter": {
    // `resizable: false`: the meter sits inside the page column, which
    // already controls its width — the drag grip would fight the layout.
    default: {
      levelLeft: -12,
      levelRight: -9,
      recentPeakLeft: -6,
      recentPeakRight: -4,
      volume: 0.8,
      resizable: false,
    },
    clipping: {
      levelLeft: -1,
      levelRight: 0,
      clippedLeft: true,
      clippedRight: true,
      recentPeakLeft: 0,
      recentPeakRight: 0,
      volume: 1,
      resizable: false,
    },
  },
};

export function resolveUIExampleProps(
  componentId: string,
  variantId: string,
): Record<string, unknown> | null {
  const meta = uiExampleMeta(componentId);
  if (!meta || !hasUIExampleVariant(meta, variantId)) return null;
  return UI_EXAMPLE_VARIANT_PROPS[componentId]?.[variantId] ?? null;
}

/** Re-exported so registry.tsx has a single import site for meta data. */
export { UI_EXAMPLE_META, uiExampleMeta };
