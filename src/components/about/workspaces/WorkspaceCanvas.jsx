import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ApplicationHeader,
  ProjectToolbar,
  TransportToolbar,
  TrackNew,
  TrackControlPanel,
  TrackControlSidePanel,
  TimelineRuler,
  PlayheadCursor,
  SelectionToolbar,
  ThemeProvider,
  darkTheme,
  generateSpeechWaveform,
  generateDecayingSineWave,
  generateSineWave,
  CLIP_CONTENT_OFFSET,
} from "@dilsonspickles/components";

const NATIVE_W = 1280;
const NATIVE_H = 720;
const RULER_H = 40;
const PIXELS_PER_SECOND = 40;
const TRACK_CONTROL_W = 280;

const MENU_ITEMS = [
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
  "Extra",
  "Help",
];

function useScaleToFit(ref) {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        setScale(e.contentRect.width / NATIVE_W);
      }
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, [ref]);
  return scale;
}

const NOOP = () => {};

/*
  Replaces the previous hand-assembled transport row with the design
  system's all-in-one TransportToolbar (added in @dilsonspickles/
  components 0.8). Keeps a little local state so the controlled props
  (loop region, snap, etc.) have somewhere to land — none of it does
  real work, this is a marketing mockup.
*/
function TransportRow({ config }) {
  const tb = config.toolbar || {};
  const timeCodeFormat = tb.timeCodeFormat || "hh:mm:ss";
  const [loopRegionEnabled, setLoopRegionEnabled] = useState(false);
  const [loopRegionStart, setLoopRegionStart] = useState(null);
  const [loopRegionEnd, setLoopRegionEnd] = useState(null);

  // The package's TransportToolbar takes a Workspace enum and renders the
  // corresponding tool layout internally. Each workspace config opts into a
  // value ('classic' | 'spectral-editing' | 'modern' | 'music'); presets
  // without a 1:1 package equivalent (e.g. 'custom') fall back to classic.
  const workspace = config.workspace || "classic";

  return (
    <TransportToolbar
      activeMenuItem="project"
      workspace={workspace}
      isPlaying={false}
      isRecording={false}
      onPlay={NOOP}
      onStop={NOOP}
      onRecord={NOOP}
      snapEnabled
      snapMode="musical"
      loopRegionEnabled={loopRegionEnabled}
      loopRegionStart={loopRegionStart}
      loopRegionEnd={loopRegionEnd}
      setLoopRegionEnabled={setLoopRegionEnabled}
      setLoopRegionStart={setLoopRegionStart}
      setLoopRegionEnd={setLoopRegionEnd}
      timeSelection={null}
      bpm={120}
      beatsPerMeasure={4}
      noteValue={4}
      envelopeMode={!!config.envelopeMode}
      spectrogramMode={false}
      onToggleEnvelope={NOOP}
      onToggleSpectrogram={NOOP}
      onZoomIn={NOOP}
      onZoomOut={NOOP}
      onZoomToSelection={NOOP}
      onZoomToFitProject={NOOP}
      onZoomToggle={NOOP}
      currentTime={config.playheadPosition}
      timeCodeFormat={timeCodeFormat}
      onTimeCodeChange={NOOP}
      onTimeCodeFormatChange={NOOP}
      onShareClick={NOOP}
      onExportAudioClick={NOOP}
      onExportLoopRegionClick={NOOP}
      masterLevelLeft={-12}
      masterLevelRight={-14}
      masterRecentPeakLeft={-8}
      masterRecentPeakRight={-10}
      masterVolume={0.8}
    />
  );
}

const PROJECT_TOOLBAR_CENTER_ACTIONS = [
  { icon: "cog", label: "Audio setup" },
  { icon: "cloud", label: "Share audio" },
  { icon: "plugins", label: "Get effects" },
];

const NOOP_HISTORY = { onUndo: NOOP, onRedo: NOOP };

function renderProjectToolbar({
  config,
  workspaceKey,
  workspaceOptions,
  onWorkspaceChange,
}) {
  const hasPicker =
    workspaceKey && workspaceOptions?.length && onWorkspaceChange;
  const workspaceSelector = hasPicker
    ? {
        value: workspaceKey,
        options: workspaceOptions,
        onChange: onWorkspaceChange,
      }
    : {
        value: "current",
        options: [{ value: "current", label: config.label }],
        onChange: NOOP,
      };

  return (
    <ProjectToolbar
      activeItem="project"
      centerActions={PROJECT_TOOLBAR_CENTER_ACTIONS}
      workspaceSelector={workspaceSelector}
      historyActions={NOOP_HISTORY}
    />
  );
}

function withWaveforms(tracks) {
  return tracks.map((t, ti) => ({
    ...t,
    clips: t.clips.map((c, ci) => {
      if (c.waveform || t.isLabelTrack) return c;
      const seed = Math.max(2, Math.round(c.duration * 4)) + ti + ci;
      let waveform;
      if (ti % 3 === 1) waveform = generateDecayingSineWave(c.duration);
      else if (ti % 3 === 2 && ci % 2 === 0)
        waveform = generateSineWave(c.duration, 6 + ci);
      else waveform = generateSpeechWaveform(seed);
      return { ...c, waveform };
    }),
  }));
}

function WorkspaceCanvas({
  config,
  clipOverrides,
  extraClips,
  envelopeModeOverride,
  compact = false,
  workspaceKey,
  workspaceOptions,
  onWorkspaceChange,
  // Tour-only: when the laptop tour's split animation has the tool
  // "armed", flip a data attribute on the root so the CSS rule below
  // styles the package's `Cut / Split` ToolButton in its pressed state.
  // The package ships split as a plain ToolButton (not a ToggleToolButton)
  // so it has no built-in `isActive` prop — this is the workaround.
  splitToolActive = false,
}) {
  const containerRef = useRef(null);
  const scale = useScaleToFit(containerRef);

  const effectiveEnvelopeMode =
    envelopeModeOverride !== undefined
      ? envelopeModeOverride
      : !!config.envelopeMode;

  // Key the waveform generation on the tracks array itself, not the whole
  // config object. Workspace switches give us a new config wrapper around the
  // same tracks reference (only the toolbar/envelopeMode differ), so this
  // memo now stays stable across switches — waveforms don't re-render, only
  // the toolbar above does.
  const baseTracks = useMemo(
    () => withWaveforms(config.tracks),
    [config.tracks],
  );
  const tracks = useMemo(() => {
    return baseTracks.map((t, i) => {
      const patched = clipOverrides
        ? t.clips.map((c) =>
            clipOverrides[c.id] ? { ...c, ...clipOverrides[c.id] } : c,
          )
        : t.clips;
      const extras = extraClips?.[i] ?? [];
      const clips = [...patched, ...extras];
      const hasSelected = clips.some((c) => c.selected);
      const hasFocused = clips.some((c) => c.focused);
      const isActive = hasSelected || hasFocused;
      return {
        ...t,
        clips,
        isSelected: isActive,
        isFocused: hasFocused,
        controlProps: {
          ...t.controlProps,
          state: isActive ? "active" : t.controlProps?.state,
        },
      };
    });
  }, [baseTracks, clipOverrides, extraClips]);
  const trackHeights = tracks.map((t) => t.height ?? 110);
  const totalTrackHeight = trackHeights.reduce((a, b) => a + b, 0);

  const canvasW = NATIVE_W - TRACK_CONTROL_W;

  return (
    <ThemeProvider theme={darkTheme}>
      <style
        dangerouslySetInnerHTML={{
          __html:
            ".workspace-canvas .track-control-side-panel{height:100%}" +
            ".workspace-canvas .clip-header__menu-button," +
            ".workspace-canvas .clip-header__menu-button .musescore-icon" +
            "{color:var(--clip-header-text)}" +
            ".workspace-canvas .clip-display__handle{z-index:9999}" +
            ".workspace-canvas [data-clip-id]:has(.clip-display--selected)" +
            "{z-index:9999!important}" +
            ".workspace-canvas .time-code,.workspace-canvas .time-code *" +
            "{--timecode-bg:#171F25;--timecode-unit-bg:#171F25}" +
            ".workspace-canvas .dropdown__trigger{" +
            "background-color:#2A2F38;" +
            "border-color:rgba(255,255,255,0.08);" +
            "color:#E4E5E7;}" +
            ".workspace-canvas .dropdown__trigger:hover:not(.dropdown--disabled)" +
            "{border-color:rgba(255,255,255,0.18);}" +
            ".workspace-canvas .dropdown__menu{" +
            "background-color:#22262F;" +
            "border-color:rgba(255,255,255,0.08);}" +
            // Narrow the master meter inside the TransportToolbar so
            // the toolbar fits on a single row even at trimmed mockup
            // widths. The component's `defaultWidth` is 360, and its
            // root CSS is `width: 100%`, so we constrain via max-width
            // here rather than passing a prop.
            ".workspace-canvas .master-meter{" +
            "max-width:200px;flex:0 0 200px;}" +
            // ApplicationHeader (OS chrome + file-menu rows) ships
            // with `var(--header-bg)` = theme.background.surface.default,
            // which reads as a lighter band above the rest of the
            // chrome. Use the dark-theme toolbar hex directly here —
            // `var(--toolbar-bg)` would fall back to the global :root
            // default (light) because the variable isn't set on a
            // shared ancestor of both `.application-header` and the
            // toolbars below it.
            ".workspace-canvas .application-header{" +
            "background-color:#2E353C;}" +
            // Split tool "armed" state — the package ships split as a
            // plain ToolButton (no isActive prop), so when the laptop
            // tour wants to show the tool as active we paint it in the
            // same primary-blue the ToggleToolButton's "on" state uses
            // for the envelope toggle next to it. Secondary's pressed
            // color is too close to idle to read as active.
            '.workspace-canvas[data-split-tool-active="true"] ' +
            '.tool-button[aria-label="Cut / Split"]{' +
            "background-color:#4a90e2!important;" +
            "color:#fff!important;}" +
            '.workspace-canvas[data-split-tool-active="true"] ' +
            '.tool-button[aria-label="Cut / Split"]:hover{' +
            "background-color:#5ba3ff!important;}",
        }}
      />
      <div
        ref={containerRef}
        className="workspace-canvas w-full h-full overflow-hidden"
        data-split-tool-active={splitToolActive ? "true" : undefined}
      >
        <div
          style={{
            width: NATIVE_W,
            height: NATIVE_H,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: NATIVE_W,
              height: NATIVE_H,
              background: "#171F25",
              color: "#fff",
              display: "flex",
              flexDirection: "column",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            {!compact && (
              <ApplicationHeader
                os="windows"
                appName="Audacity"
                menuItems={MENU_ITEMS}
              />
            )}
            {renderProjectToolbar({
              config,
              workspaceKey,
              workspaceOptions,
              onWorkspaceChange,
            })}
            <TransportRow
              config={{ ...config, envelopeMode: effectiveEnvelopeMode }}
            />

            <div
              style={{
                flex: 1,
                display: "flex",
                minHeight: 0,
                overflow: "hidden",
              }}
            >
              <div style={{ width: TRACK_CONTROL_W, flexShrink: 0 }}>
                <TrackControlSidePanel
                  trackHeights={trackHeights}
                  focusedTrackIndex={tracks.findIndex((t) => t.isFocused)}
                >
                  {tracks.map((t, i) => (
                    <TrackControlPanel
                      key={i}
                      {...t.controlProps}
                      trackHeight={trackHeights[i]}
                      meterLevelLeft={t.controlProps?.meterLevelLeft ?? -18}
                      meterLevelRight={t.controlProps?.meterLevelRight ?? -20}
                      // The design-system volume prop is a 0–100 percent
                      // (default 75 = unity / 0dB). Workspace configs were
                      // written with dB values, which render as far-left.
                      // Park every demo slider at 0dB for the marketing view.
                      volume={75}
                    />
                  ))}
                </TrackControlSidePanel>
              </div>

              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  minWidth: 0,
                  position: "relative",
                }}
              >
                <TimelineRuler
                  width={canvasW}
                  height={RULER_H}
                  pixelsPerSecond={PIXELS_PER_SECOND}
                  totalDuration={config.duration}
                  timeFormat={
                    config.toolbar?.rulerFormat === "beats-measures"
                      ? "beats-measures"
                      : "minutes-seconds"
                  }
                  bpm={120}
                  beatsPerMeasure={4}
                />
                <div style={{ flex: 1, paddingTop: 2 }}>
                  {tracks.map((t, i) => (
                    <div
                      key={i}
                      style={{
                        position: "relative",
                        height: trackHeights[i],
                        marginBottom: 2,
                      }}
                    >
                      <TrackNew
                        clips={t.clips}
                        trackIndex={t.trackIndex ?? i}
                        width={canvasW}
                        height={trackHeights[i]}
                        pixelsPerSecond={PIXELS_PER_SECOND}
                        envelopeMode={effectiveEnvelopeMode}
                        isLabelTrack={t.isLabelTrack}
                        isSelected={t.isSelected}
                        isFocused={t.isFocused}
                        onClipTrimEdge={() => {}}
                      />
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    position: "absolute",
                    top: RULER_H + 2,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    pointerEvents: "none",
                    zIndex: 0,
                  }}
                  aria-hidden="true"
                >
                  {Array.from({
                    length:
                      Math.floor(
                        (canvasW - CLIP_CONTENT_OFFSET) / PIXELS_PER_SECOND,
                      ) + 1,
                  }).map((_, i) => {
                    const isMajor = i % 5 === 0;
                    return (
                      <div
                        key={i}
                        style={{
                          position: "absolute",
                          left:
                            CLIP_CONTENT_OFFSET + i * PIXELS_PER_SECOND - 0.5,
                          top: 0,
                          bottom: 0,
                          width: 1,
                          background: isMajor
                            ? "rgba(255,255,255,0.1)"
                            : "rgba(255,255,255,0.04)",
                        }}
                      />
                    );
                  })}
                </div>
                <div
                  style={{
                    // Wrapper at the lane top (just below the ruler) so
                    // the stalk doesn't paint behind the time labels in
                    // the top half of the ruler. The icon is then
                    // rendered upwards into the ruler via a negative
                    // iconTopOffset.
                    position: "absolute",
                    top: RULER_H,
                    left: 0,
                    pointerEvents: "none",
                  }}
                >
                  <PlayheadCursor
                    position={config.playheadPosition}
                    pixelsPerSecond={PIXELS_PER_SECOND}
                    // Oversized so the stalk fills the full canvas
                    // beneath the ruler; the workspace container's
                    // overflow:hidden clips the bottom.
                    height={9999}
                    showTopIcon
                    // Wrapper at ruler bottom; offset -14 lands the
                    // icon tucked into the bottom of the 40px ruler
                    // (top at ruler y=26).
                    iconTopOffset={-14}
                  />
                </div>
              </div>
            </div>

            <div style={{ flexShrink: 0 }}>
              <SelectionToolbar
                status="Stopped"
                instructionText="Click and drag to select audio"
                selectionStart={null}
                selectionEnd={null}
              />
            </div>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default React.memo(WorkspaceCanvas);
