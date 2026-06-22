import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ApplicationHeader,
  ProjectToolbar,
  Toolbar,
  ToolbarButtonGroup,
  ToolbarDivider,
  TransportButton,
  ToolButton,
  ToggleToolButton,
  TrackNew,
  TrackControlPanel,
  TrackControlSidePanel,
  TimelineRuler,
  PlayheadCursor,
  TimeCode,
  NumberStepper,
  Dropdown,
  Checkbox,
  GhostButton,
  MasterMeter,
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

function renderTransportRow(config) {
  const tb = config.toolbar || {};
  const showTrimSilence = tb.showTrimSilence !== false;
  const showBPM = !!tb.showBPM;
  const showTimeSignature = !!tb.showTimeSignature;
  const showLoop = tb.showLoop !== false;
  const showCutCopyPaste = !!tb.showCutCopyPaste;
  const showAdvancedZoom = tb.showAdvancedZoom !== false;
  const timeCodeFormat = tb.timeCodeFormat || "hh:mm:ss";

  return (
    <Toolbar
      rightContent={
        <div style={{ display: "flex", alignItems: "center", paddingRight: 8 }}>
          <ToolButton icon="cog" ariaLabel="Settings" />
        </div>
      }
    >
      <ToolbarButtonGroup>
        <TransportButton icon="play" ariaLabel="Play" />
        <TransportButton icon="stop" ariaLabel="Stop" />
        <TransportButton icon="record" ariaLabel="Record" />
        <TransportButton icon="skip-back" ariaLabel="Skip to start" />
        <TransportButton icon="skip-forward" ariaLabel="Skip to end" />
        {showLoop && <ToggleToolButton icon="loop" ariaLabel="Loop" />}
      </ToolbarButtonGroup>

      <ToolbarDivider />
      <ToolbarButtonGroup>
        <ToggleToolButton
          icon="automation"
          isActive={!!config.envelopeMode}
          ariaLabel="Envelope tool"
        />
        <ToggleToolButton
          icon="cut"
          isActive={!!config.splitMode}
          ariaLabel="Split tool"
        />
        <ToolButton icon="cut" ariaLabel="Multi-clip" />
        <ToolButton icon="waveform" ariaLabel="Wave tool" />
      </ToolbarButtonGroup>

      {showCutCopyPaste && (
        <>
          <ToolbarDivider />
          <ToolbarButtonGroup>
            <ToolButton icon="cut" ariaLabel="Cut" />
            <ToolButton icon="copy" ariaLabel="Copy" />
            <ToolButton icon="paste" ariaLabel="Paste" />
          </ToolbarButtonGroup>
        </>
      )}

      <ToolbarDivider />
      <ToolbarButtonGroup>
        <ToolButton icon="zoom-in" ariaLabel="Zoom in" />
        <ToolButton icon="zoom-out" ariaLabel="Zoom out" />
        <ToolButton icon="zoom-to-fit" ariaLabel="Zoom to fit" />
        {showAdvancedZoom && (
          <ToolButton icon="zoom-to-selection" ariaLabel="Zoom to selection" />
        )}
        {showAdvancedZoom && (
          <ToolButton icon="zoom-toggle" ariaLabel="Zoom toggle" />
        )}
      </ToolbarButtonGroup>

      {showTrimSilence && (
        <>
          <ToolbarDivider />
          <ToolbarButtonGroup>
            <ToolButton icon="trim" ariaLabel="Trim" />
            <ToolButton icon="silence" ariaLabel="Silence" />
          </ToolbarButtonGroup>
        </>
      )}

      <ToolbarDivider />
      <TimeCode value={config.playheadPosition} format={timeCodeFormat} />
      {showBPM && (
        <NumberStepper defaultValue="120" placeholder="bpm" width={86} />
      )}
      {showTimeSignature && (
        <Dropdown
          value="4-4"
          width="62px"
          options={[
            { value: "4-4", label: "4 / 4" },
            { value: "3-4", label: "3 / 4" },
            { value: "6-8", label: "6 / 8" },
          ]}
        />
      )}

      <ToolbarDivider />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontFamily: "Inter, sans-serif",
          fontSize: 12,
        }}
      >
        <span style={{ opacity: 0.7 }}>Snap</span>
        <Checkbox checked />
        <Dropdown
          value="bar"
          width="92px"
          options={[
            { value: "bar", label: "Bar" },
            { value: "beat", label: "Beat" },
            { value: "seconds", label: "Seconds" },
          ]}
        />
      </div>

      <ToolbarDivider />
      <ToolButton icon="microphone" ariaLabel="Recording level" />
      <div style={{ width: 220, paddingLeft: 4 }}>
        <MasterMeter
          levelLeft={-12}
          levelRight={-10}
          recentPeakLeft={-6}
          recentPeakRight={-5}
          volume={0.8}
        />
      </div>
    </Toolbar>
  );
}

function renderProjectToolbar(config) {
  return (
    <ProjectToolbar
      activeItem="project"
      centerContent={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <GhostButton icon="cog" label="Audio setup" size="small" />
          <GhostButton icon="cloud" label="Share audio" size="small" />
          <GhostButton icon="plugins" label="Get effects" size="small" />
        </div>
      }
      rightContent={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            paddingRight: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 4,
              fontFamily: "Inter, sans-serif",
              fontSize: 13,
              minWidth: 130,
            }}
          >
            <span style={{ opacity: 0.6 }}>Workspace</span>
            <span style={{ marginLeft: 4, fontWeight: 500 }}>
              {config.label}
            </span>
            <span style={{ marginLeft: "auto", opacity: 0.5 }}>▾</span>
          </div>
          <ToolButton icon="undo" ariaLabel="Undo" />
          <ToolButton icon="redo" ariaLabel="Redo" />
        </div>
      }
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
            "border-color:rgba(255,255,255,0.08);}",
        }}
      />
      <div
        ref={containerRef}
        className="workspace-canvas w-full h-full overflow-hidden"
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
            {!compact && renderProjectToolbar(config)}
            {renderTransportRow({
              ...config,
              envelopeMode: effectiveEnvelopeMode,
            })}

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
                    position: "absolute",
                    top: 0,
                    left: 0,
                    pointerEvents: "none",
                  }}
                >
                  <PlayheadCursor
                    position={config.playheadPosition}
                    pixelsPerSecond={PIXELS_PER_SECOND}
                    height={RULER_H + 2 + totalTrackHeight + tracks.length * 2}
                    showTopIcon
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
