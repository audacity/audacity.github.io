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
   * emits `client:load` even for static inserts.
   * First set by the `clip` entry; the static+client:load round-trip is
   * covered in `../adapter/uiExampleRoundtrip.test.ts`.
   */
  needsBrowser?: boolean;
  /** First variant is the default used on insert. Never empty. */
  variants: UIExampleVariantMeta[];
}

export const UI_EXAMPLE_META: UIExampleMeta[] = [
  {
    id: "application-header",
    label: "Application header",
    keywords: ["header", "menu", "menubar", "window", "titlebar"],
    allowInteractive: true,
    variants: [
      { id: "windows", label: "Windows" },
      { id: "macos", label: "macOS" },
    ],
  },
  {
    id: "project-toolbar",
    label: "Project toolbar",
    keywords: ["project", "toolbar", "hotbar", "workspace", "tabs", "undo"],
    allowInteractive: true,
    variants: [{ id: "default", label: "Default" }],
  },
  {
    id: "track-control-panel",
    label: "Track control panel",
    keywords: ["track", "panel", "mute", "solo", "volume", "pan", "meter"],
    allowInteractive: true,
    variants: [
      { id: "stereo", label: "Stereo" },
      { id: "mono", label: "Mono" },
    ],
  },
  {
    id: "timeline-ruler",
    label: "Timeline ruler",
    keywords: ["timeline", "ruler", "time", "scale"],
    allowInteractive: false,
    needsBrowser: true,
    variants: [{ id: "default", label: "Default" }],
  },
  {
    id: "vertical-ruler",
    label: "Vertical ruler",
    keywords: ["vertical", "ruler", "scale", "amplitude", "db"],
    allowInteractive: false,
    needsBrowser: true,
    variants: [{ id: "default", label: "Default" }],
  },
  {
    id: "selection-toolbar",
    label: "Selection toolbar",
    keywords: ["selection", "status", "duration", "timecode", "status bar"],
    allowInteractive: false,
    variants: [{ id: "default", label: "Default" }],
  },
  {
    id: "timecode",
    label: "Timecode",
    keywords: ["timecode", "time", "position", "readout", "digits"],
    allowInteractive: false,
    variants: [
      { id: "zero", label: "At zero" },
      { id: "running", label: "Mid-project" },
    ],
  },
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
    id: "transport-button",
    label: "Transport button",
    keywords: ["transport", "play", "stop", "record", "toolbar", "button"],
    allowInteractive: false,
    variants: [
      { id: "play", label: "Play" },
      { id: "playing", label: "Playing (pause)" },
      { id: "stop", label: "Stop" },
      { id: "record", label: "Record" },
      { id: "recording", label: "Recording" },
      { id: "step-backward", label: "Step backward" },
      { id: "step-forward", label: "Step forward" },
      { id: "loop", label: "Loop" },
      { id: "loop-on", label: "Loop (on)" },
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
  {
    id: "ghost-button",
    label: "Ghost button",
    keywords: ["ghost", "icon", "toolbar", "button", "menu"],
    allowInteractive: true,
    variants: [
      { id: "default", label: "Default" },
      { id: "with-label", label: "With label" },
      { id: "active", label: "Active" },
    ],
  },
  {
    id: "pan-knob",
    label: "Pan knob",
    keywords: ["pan", "knob", "stereo", "balance", "left", "right"],
    allowInteractive: true,
    variants: [
      { id: "center", label: "Centered" },
      { id: "panned-left", label: "Panned left" },
      { id: "panned-right", label: "Panned right" },
    ],
  },
  {
    id: "number-stepper",
    label: "Number stepper",
    keywords: ["number", "stepper", "input", "increment", "bpm"],
    allowInteractive: true,
    variants: [
      { id: "default", label: "Default" },
      { id: "disabled", label: "Disabled" },
    ],
  },
  {
    id: "filter-chip",
    label: "Filter chip",
    keywords: ["filter", "chip", "tag", "toggle", "pill"],
    allowInteractive: true,
    variants: [
      { id: "default", label: "Default" },
      { id: "selected", label: "Selected" },
    ],
  },
  {
    id: "master-meter",
    label: "Master meter",
    keywords: ["meter", "master", "level", "db", "clipping", "volume"],
    allowInteractive: true,
    variants: [
      { id: "default", label: "Default" },
      { id: "clipping", label: "Clipping" },
    ],
  },
  {
    id: "clip",
    label: "Clip",
    keywords: ["clip", "waveform", "audio", "envelope", "stereo", "vocals"],
    allowInteractive: true,
    needsBrowser: true,
    variants: [
      { id: "default", label: "Default" },
      { id: "selected", label: "Selected" },
      { id: "with-envelope", label: "With envelope" },
      { id: "stereo", label: "Stereo" },
    ],
  },
  {
    id: "tool-button",
    label: "Tool button",
    keywords: [
      "tool",
      "toolbar",
      "zoom",
      "cut",
      "copy",
      "paste",
      "trim",
      "silence",
      "button",
    ],
    allowInteractive: false,
    variants: [
      { id: "zoom-in", label: "Zoom in" },
      { id: "zoom-out", label: "Zoom out" },
      { id: "fit-selection", label: "Fit selection" },
      { id: "fit-project", label: "Fit project" },
      { id: "zoom-toggle", label: "Zoom toggle" },
      { id: "cut", label: "Cut" },
      { id: "copy", label: "Copy" },
      { id: "paste", label: "Paste" },
      { id: "trim", label: "Trim" },
      { id: "silence", label: "Silence" },
      { id: "microphone", label: "Microphone settings" },
      { id: "volume", label: "Playback volume settings" },
      { id: "disabled", label: "Disabled" },
    ],
  },
  {
    id: "toggle-tool-button",
    label: "Toggle tool button",
    keywords: [
      "toggle",
      "tool",
      "toolbar",
      "envelope",
      "split",
      "spectral",
      "button",
    ],
    allowInteractive: false,
    variants: [
      { id: "envelope", label: "Clip envelope" },
      { id: "envelope-on", label: "Clip envelope (on)" },
      { id: "split", label: "Cut / Split" },
      { id: "split-on", label: "Cut / Split (on)" },
      { id: "spectral", label: "Spectral view" },
      { id: "spectral-on", label: "Spectral view (on)" },
      { id: "waveform", label: "Waveform" },
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
