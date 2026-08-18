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
 * here via DS imports. The established pattern (see the `clip` entry): a
 * deterministic generator script (`scripts/generate-ui-example-waveforms.ts`)
 * commits the data to a pure-data module (`./waveformData.ts`), imported
 * here like any other value. Follow it for future rich-data entries
 * (MixerChannel, EnvelopeOverlay, PianoRoll, …).
 */
import {
  UI_EXAMPLE_META,
  hasUIExampleVariant,
  uiExampleMeta,
} from "../../../../manual-editor/src/uiExample/meta";
import {
  CLIP_WAVEFORM_LEFT,
  CLIP_WAVEFORM_MONO,
  CLIP_WAVEFORM_RIGHT,
} from "./waveformData";

export const UI_EXAMPLE_VARIANT_PROPS: Record<
  string,
  Record<string, Record<string, unknown>>
> = {
  button: {
    primary: { variant: "primary", children: "Export" },
    secondary: { variant: "secondary", children: "Cancel" },
    disabled: { variant: "primary", children: "Export", disabled: true },
  },
  "transport-button": {
    play: { icon: "play", ariaLabel: "Play" },
    playing: { icon: "play", ariaLabel: "Play", active: true },
    stop: { icon: "stop", ariaLabel: "Stop" },
    record: { icon: "record", ariaLabel: "Record" },
    recording: { icon: "record", ariaLabel: "Stop recording", recording: true },
    disabled: { icon: "play", ariaLabel: "Play", disabled: true },
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
  clip: {
    default: {
      name: "Vocals",
      width: 520,
      height: 140,
      waveformData: CLIP_WAVEFORM_MONO,
    },
    selected: {
      name: "Vocals",
      width: 520,
      height: 140,
      waveformData: CLIP_WAVEFORM_MONO,
      selected: true,
    },
    "with-envelope": {
      name: "Vocals",
      width: 520,
      height: 140,
      waveformData: CLIP_WAVEFORM_MONO,
      showEnvelope: true,
      clipDuration: 3,
      envelope: [
        { time: 0, db: 0 },
        { time: 1.2, db: -6 },
        { time: 2, db: -3 },
        { time: 3, db: -12 },
      ],
    },
    stereo: {
      name: "Vocals",
      width: 520,
      height: 140,
      waveformLeft: CLIP_WAVEFORM_LEFT,
      waveformRight: CLIP_WAVEFORM_RIGHT,
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
