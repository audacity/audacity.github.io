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

/*
  Navigation callbacks for interactive specimens — the toolbar-page
  pattern: a specimen's control takes you to the page documenting it.
  Plain functions (no imports) so this module stays test-loadable; they
  touch window only when called, never at module scope.
*/
const go = (href: string) => {
  if (typeof window !== "undefined") window.location.href = href;
};
const GO_MENU = (item: string) =>
  go(`/manual/manual-index/header/${item.toLowerCase()}`);
const GO_PROJECT_TAB = (item: string) =>
  go(
    item === "export"
      ? "/manual/manual-index/header/export-menu"
      : `/manual/manual-index/project-management-menu/${item}`,
  );
const GO_AUDIO_SETUP = () => go("/manual/manual-index/hotbar#audio-setup");
const GO_SHARE_AUDIO = () => go("/manual/manual-index/hotbar#share-audio");
const GO_GET_EFFECTS = () => go("/manual/manual-index/hotbar#get-effects");
const GO_UNDO = () => go("/manual/manual-index/header/edit#undo");
const GO_REDO = () => go("/manual/manual-index/header/edit#redo");
const GO_WORKSPACE = (value: string) =>
  go(`/manual/manual-index/workspaces/${value}`);
const GO_TCP = (anchor: string) => () =>
  go(`/manual/manual-index/track-control-panel/audio-track-item#${anchor}`);

export const UI_EXAMPLE_VARIANT_PROPS: Record<
  string,
  Record<string, Record<string, unknown>>
> = {
  "application-header": {
    windows: {
      os: "windows",
      appName: "Audacity",
      onMenuItemClick: GO_MENU,
      menuItems: [
        "File",
        "Edit",
        "Select",
        "View",
        "Record",
        "Tracks",
        "Generate",
        "Effect",
        "Analyze",
        "Tools",
        "Help",
      ],
    },
    macos: { os: "macos", appName: "Audacity" },
  },
  "project-toolbar": {
    default: {
      activeItem: "project",
      onMenuItemClick: GO_PROJECT_TAB,
      centerActions: [
        { icon: "cog", label: "Audio setup", onClick: GO_AUDIO_SETUP },
        { icon: "cloud", label: "Share audio", onClick: GO_SHARE_AUDIO },
        { icon: "plugins", label: "Get effects", onClick: GO_GET_EFFECTS },
      ],
      historyActions: { onUndo: GO_UNDO, onRedo: GO_REDO },
      workspaceSelector: {
        value: "modern",
        label: "",
        width: "120px",
        options: [
          { value: "modern", label: "Modern" },
          { value: "classic", label: "Classic" },
          { value: "music", label: "Music" },
        ],
        onChange: GO_WORKSPACE,
      },
    },
  },
  "track-control-panel": {
    stereo: {
      trackName: "Vocals",
      trackType: "stereo",
      volume: 75,
      pan: 0,
      meterLevelLeft: 62,
      meterLevelRight: 55,
      onMuteToggle: GO_TCP("mute"),
      onSoloToggle: GO_TCP("solo"),
      onVolumeChange: GO_TCP("volume"),
      onPanChange: GO_TCP("panning"),
      onEffectsClick: GO_TCP("effects"),
      onMenuClick: GO_TCP("track-options"),
    },
    mono: {
      trackName: "Music",
      trackType: "mono",
      volume: 60,
      pan: -20,
      meterLevel: 40,
      onMuteToggle: GO_TCP("mute"),
      onSoloToggle: GO_TCP("solo"),
      onVolumeChange: GO_TCP("volume"),
      onPanChange: GO_TCP("panning"),
      onEffectsClick: GO_TCP("effects"),
      onMenuClick: GO_TCP("track-options"),
    },
  },
  "timeline-ruler": {
    default: { pixelsPerSecond: 24, totalDuration: 40, width: 640 },
  },
  "vertical-ruler": {
    default: { height: 200 },
  },
  "selection-toolbar": {
    default: {
      status: "Stopped",
      instructionText: "Click and drag to select audio",
    },
  },
  timecode: {
    zero: { value: 0 },
    running: { value: 83.5 },
  },
  button: {
    primary: { variant: "primary", children: "Export" },
    secondary: { variant: "secondary", children: "Cancel" },
    disabled: { variant: "primary", children: "Export", disabled: true },
  },
  /*
    Icons and labels mirror TransportToolbar's own calls, so an example on a
    manual page reads the same as the button in the app.
  */
  "tool-button": {
    "zoom-in": { icon: "zoom-in", ariaLabel: "Zoom in" },
    "zoom-out": { icon: "zoom-out", ariaLabel: "Zoom out" },
    "fit-selection": { icon: "zoom-to-selection", ariaLabel: "Fit selection" },
    "fit-project": { icon: "zoom-to-fit", ariaLabel: "Fit project" },
    "zoom-toggle": { icon: "zoom-toggle", ariaLabel: "Zoom toggle" },
    cut: { icon: "cut", ariaLabel: "Cut" },
    copy: { icon: "copy", ariaLabel: "Copy" },
    paste: { icon: "paste", ariaLabel: "Paste" },
    trim: { icon: "trim", ariaLabel: "Trim" },
    silence: { icon: "silence", ariaLabel: "Silence" },
    microphone: { icon: "microphone", ariaLabel: "Microphone settings" },
    volume: { icon: "volume", ariaLabel: "Playback volume settings" },
    disabled: { icon: "cut", ariaLabel: "Cut", disabled: true },
  },
  "toggle-tool-button": {
    envelope: { icon: "automation", ariaLabel: "Clip envelope" },
    "envelope-on": {
      icon: "automation",
      ariaLabel: "Clip envelope",
      isActive: true,
    },
    split: { icon: "split", ariaLabel: "Cut / Split" },
    "split-on": { icon: "split", ariaLabel: "Cut / Split", isActive: true },
    spectral: { icon: "spectrogram", ariaLabel: "Spectral view" },
    "spectral-on": {
      icon: "spectrogram",
      ariaLabel: "Spectral view",
      isActive: true,
    },
    waveform: { icon: "waveform", ariaLabel: "Waveform" },
  },
  "transport-button": {
    play: { icon: "play", ariaLabel: "Play" },
    playing: { icon: "pause", ariaLabel: "Pause" },
    stop: { icon: "stop", ariaLabel: "Stop" },
    record: { icon: "record", ariaLabel: "Record" },
    recording: { icon: "record", ariaLabel: "Stop recording", recording: true },
    "step-backward": { icon: "skip-back", ariaLabel: "Step backward" },
    "step-forward": { icon: "skip-forward", ariaLabel: "Step forward" },
    loop: { icon: "loop", ariaLabel: "Loop" },
    "loop-on": { icon: "loop", ariaLabel: "Loop", active: true },
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
