import React, { useEffect, useMemo, useRef, useState } from "react";
import { useInView } from "../../hooks/useInView.js";
import {
  Clip,
  TransportToolbar,
  TrackNew,
  TrackControlPanel,
  TrackControlSidePanel,
  TimelineRuler,
  PlayheadCursor,
  ThemeProvider,
  darkTheme,
  lightTheme,
  generateSpeechWaveform,
  generateDecayingSineWave,
  generateSineWave,
} from "@dilsonspickles/components";

const NOOP = () => {};

function useCycleIndex(count, intervalMs, enabled = true) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    const t = setInterval(() => setI((n) => (n + 1) % count), intervalMs);
    return () => clearInterval(t);
  }, [count, intervalMs, enabled]);
  return i;
}

// ── Accent colour ──────────────────────────────────────────────────────────
// Cycles real design-system controls (pan knob, volume slider, primary
// button, effect bypass toggle, radio) through the onboarding accent
// palette. Each control inherits its colour from CSS custom properties
// scoped to a wrapper div — overriding them per-tick repaints all five
// controls in sync without re-rendering them.
// Matches the nine-colour accent picker shown in the onboarding modal,
// in the same order.
const ACCENTS = [
  { name: "Blue", value: "#5BA3F5" },
  { name: "Violet", value: "#B594F0" },
  { name: "Magenta", value: "#E380C0" },
  { name: "Red", value: "#ED6F6F" },
  { name: "Orange", value: "#F1A05B" },
  { name: "Yellow", value: "#ECC247" },
  { name: "Green", value: "#5FAF54" },
  { name: "Turquoise", value: "#3FAB91" },
  { name: "Cyan", value: "#5FB7C9" },
];

// Each design-system control sets its own colour CSS vars inline on its
// root element from the theme, so wrapper-scoped --slider-fill-bg etc.
// are shadowed. Instead we publish a single --accent custom property
// here and target the inner BEM classes with !important rules below so
// every accent-bearing surface flips in lockstep.
function accentVars(accent) {
  return {
    "--accent": accent,
    "--accent-soft": `${accent}55`,
  };
}

function AccentDemo({ isActive = true }) {
  const rootRef = useRef(null);
  const inView = useInView(rootRef);
  const i = useCycleIndex(ACCENTS.length, 1800, inView && isActive);
  const accent = ACCENTS[i].value;

  return (
    <ThemeProvider theme={darkTheme}>
      <style>{`
        /*
          Beat the design-system components' inline-styled CSS vars by
          targeting their inner BEM classes directly. !important is the
          escape hatch — these rules only live inside the accent demo
          card so they can't leak into the rest of the page.
        */
        .accent-demo-card .slider__fill { background: var(--accent) !important; }
        /*
          Leave the outer gauge ring alone (it stays at the theme's
          default neutral) and override the bipolar value-sweep arc with
          the accent. The sweep angles below match value=-60 in bipolar
          mode: bipolarNormalized = -0.6 → sweepDegrees = 81°, start at
          -81° (matches the design system's formula in chunk-BQKLGEAZ).
        */
        .accent-demo-card .knob__value-sweep {
          background: conic-gradient(
            from -81deg,
            var(--accent) 0deg,
            var(--accent) 81deg,
            transparent 81deg
          ) !important;
        }
        .accent-demo-card .toggle-button--active { background: var(--accent) !important; }
        /*
          Meters: volume fill picks up the accent at full strength, RMS
          sits inside at reduced opacity so it reads as a denser core.
          The clipping modifier keeps its own red — never override it,
          it's a safety signal not a brand colour.
        */
        .accent-demo-card .track-meter__volume:not(.track-meter__volume--clipping) {
          background: var(--accent) !important;
        }
        .accent-demo-card .track-meter__rms {
          background: var(--accent) !important;
          opacity: 0.55;
        }
        .accent-demo-card .slider__fill,
        .accent-demo-card .knob__value-sweep,
        .accent-demo-card .toggle-button--active,
        .accent-demo-card .track-meter__volume,
        .accent-demo-card .track-meter__rms {
          transition: background 360ms ease;
        }
      `}</style>
      <div
        ref={rootRef}
        className="accent-demo-card absolute inset-0 flex flex-col items-center justify-center gap-5 p-6"
        style={{
          ...accentVars(accent),
          background: "#0B0D14",
        }}
      >
        {/* Centerpiece: the real TrackControlPanel sitting on a stack of
            accent-coloured paint chips. The chips peek out from behind
            the panel so the card reads as "this colour applies to that
            chrome", more deliberate than a soft glow. The panel itself
            uses a punchier rotateY/X than the soft designer-tilt — feels
            like a 3D product render rather than a portfolio mockup. */}
        <div
          style={{
            position: "relative",
            perspective: "2400px",
            width: 268,
          }}
        >
          {/* Paint-chip stack — three accent rectangles offset behind
              the panel, each slightly larger and more transparent than
              the last so they fan out like swatch cards. */}
          {[
            { dx: 18, dy: 14, scale: 1.04, opacity: 0.35 },
            { dx: -22, dy: 24, scale: 1.08, opacity: 0.22 },
            { dx: 6, dy: 38, scale: 1.12, opacity: 0.12 },
          ].map((chip, idx) => (
            <div
              key={idx}
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                background: accent,
                opacity: chip.opacity,
                borderRadius: 12,
                transform: `translate3d(${chip.dx}px, ${chip.dy}px, 0) scale(${chip.scale}) rotateY(-22deg) rotateX(10deg)`,
                transformOrigin: "center center",
                transition: "background 480ms ease, opacity 480ms ease",
                pointerEvents: "none",
              }}
            />
          ))}
          <div
            className="rounded-lg border border-white/[0.12] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.6)] relative"
            style={{
              width: 268,
              transform: "rotateY(-22deg) rotateX(10deg)",
              transformOrigin: "center center",
            }}
          >
            <TrackControlPanel
              trackName="Music bed"
              trackType="stereo"
              volume={72}
              pan={-60}
              isSolo
              meterLevelLeft={48}
              meterLevelRight={44}
              meterRecentPeakLeft={62}
              meterRecentPeakRight={58}
              trackHeight={120}
            />
          </div>
        </div>

        {/* Onboarding-style picker — sits below the panel so the panel
            reads as the focus and the swatches as the control feeding
            into it. */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm">
          {ACCENTS.map((a, idx) => {
            const isPicked = idx === i;
            return (
              <div
                key={a.value}
                aria-hidden
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: a.value,
                  outline: isPicked ? `2px solid ${a.value}` : "none",
                  outlineOffset: 2,
                  transform: isPicked ? "scale(1)" : "scale(0.78)",
                  opacity: isPicked ? 1 : 0.55,
                  transition:
                    "outline-color 280ms ease, opacity 280ms ease, transform 280ms ease",
                }}
              />
            );
          })}
        </div>

        {/* Accent name pinned bottom-left, coloured by the active swatch. */}
        <div
          className="absolute left-4 bottom-3 font-mono text-[10px] tracking-[0.22em] uppercase"
          style={{
            color: accent,
            transition: "color 360ms ease",
          }}
          aria-hidden
        >
          {ACCENTS[i].name}
        </div>
      </div>
    </ThemeProvider>
  );
}

// ── Theme change ───────────────────────────────────────────────────────────
// Real workspace, two themes. Wraps the actual design-system primitives in
// ThemeProvider and lets the components repaint themselves — same UI you
// see in the laptop tour, just flipped between dark and light.

const THEMED_TRACKS = [
  {
    name: "Voice",
    type: "mono",
    color: "blue",
    clips: [
      { id: "tv1", name: "Take 1", start: 0.4, duration: 4.2 },
      { id: "tv2", name: "Take 2", start: 5.2, duration: 3.8 },
    ],
  },
  {
    name: "Music",
    type: "stereo",
    color: "violet",
    clips: [{ id: "tm1", name: "Bed", start: 0.2, duration: 16 }],
  },
  {
    name: "Ambient",
    type: "mono",
    color: "green",
    clips: [{ id: "ta1", name: "Room tone", start: 1.0, duration: 14 }],
  },
  {
    name: "FX",
    type: "mono",
    color: "orange",
    clips: [
      { id: "tf1", name: "Hit", start: 3.2, duration: 2.6 },
      { id: "tf2", name: "Sweep", start: 6.8, duration: 4.4 },
    ],
  },
];

function ThemeDemo() {
  const rootRef = useRef(null);
  const inView = useInView(rootRef);
  const i = useCycleIndex(2, 3500, inView);
  const theme = i === 0 ? darkTheme : lightTheme;
  const themeName = i === 0 ? "Dark" : "Light";

  // Loop region state for the TransportToolbar — has to be controlled,
  // so we park it in local state even though nothing here actually
  // interacts with it.
  const [loopEnabled, setLoopEnabled] = useState(false);
  const [loopStart, setLoopStart] = useState(null);
  const [loopEnd, setLoopEnd] = useState(null);

  // Stable waveforms — same shape across theme flips so only the colours
  // change. Big seeds give the dense peak pattern TrackNew expects.
  const waveforms = useMemo(
    () => [
      generateSpeechWaveform(11),
      generateSpeechWaveform(13),
      generateSpeechWaveform(17),
      generateSpeechWaveform(19),
    ],
    [],
  );

  const tracks = useMemo(
    () =>
      THEMED_TRACKS.map((t, ti) => ({
        ...t,
        clips: t.clips.map((c) => ({ ...c, waveform: waveforms[ti] })),
      })),
    [waveforms],
  );

  // Match the design system's natural sizes so the side panel and the
  // lane line up cleanly:
  //   - TrackControlPanel hardcodes its inner width at 268px; the
  //     wrapper needs to be ≥ that or content overflows.
  //   - "Tracks" header is locked at 40px → RULER_H must match.
  //   - --tcp-height-default is 114px, --tcp-height-truncated 82px;
  //     anything in between renders the squeezed truncated layout.
  //     110 keeps the panel in its default layout so the mic-icon row
  //     sits at the same Y as the clip head.
  const TRACK_CONTROL_W = 280;
  const CANVAS_W = 720;
  const RULER_H = 40;
  const TRACK_H = 110;
  const PPS = 36;
  // Single-row TransportToolbar at our forced 1500px width is ~52px.
  // Leave a touch of padding for the project tabs / header above it.
  const TOOLBAR_H_BUDGET = 64;

  const trackHeights = tracks.map(() => TRACK_H);
  const totalTracksH =
    trackHeights.reduce((a, b) => a + b, 0) + tracks.length * 2;

  return (
    <ThemeProvider theme={theme}>
      <div
        ref={rootRef}
        className="absolute inset-0 overflow-hidden"
        style={{
          // Near-black backdrop so the seam at the bottom of the
          // workspace container reads as a hard, dramatic cut — same
          // colour in both light and dark mode.
          background: "#08090C",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            // Wide enough that the TransportToolbar's responsive wrap
            // never kicks in — the card is overflow-hidden so the
            // toolbar's right edge is clipped anyway, but it stays on
            // one row and reads as "an aperture into a bigger UI".
            width: 1500,
            // Slightly taller than the card so it clips at the bottom too,
            // reading as a window onto a larger workspace.
            height: TOOLBAR_H_BUDGET + RULER_H + totalTracksH + 20,
            display: "flex",
            flexDirection: "column",
            background: theme.background.surface.subtle,
            transition: "background 480ms ease",
          }}
        >
          <TransportToolbar
            activeMenuItem="project"
            workspace="classic"
            isPlaying={false}
            isRecording={false}
            onPlay={NOOP}
            onStop={NOOP}
            onRecord={NOOP}
            snapEnabled
            snapMode="musical"
            loopRegionEnabled={loopEnabled}
            loopRegionStart={loopStart}
            loopRegionEnd={loopEnd}
            setLoopRegionEnabled={setLoopEnabled}
            setLoopRegionStart={setLoopStart}
            setLoopRegionEnd={setLoopEnd}
            timeSelection={null}
            bpm={120}
            beatsPerMeasure={4}
            noteValue={4}
            envelopeMode={false}
            spectrogramMode={false}
            onToggleEnvelope={NOOP}
            onToggleSpectrogram={NOOP}
            onZoomIn={NOOP}
            onZoomOut={NOOP}
            onZoomToSelection={NOOP}
            onZoomToFitProject={NOOP}
            onZoomToggle={NOOP}
            currentTime={5.4}
            timeCodeFormat="hh:mm:ss"
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

          <div
            style={{
              flex: 1,
              display: "flex",
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            <div style={{ width: TRACK_CONTROL_W, flexShrink: 0 }}>
              <TrackControlSidePanel trackHeights={trackHeights}>
                {tracks.map((t, idx) => (
                  <TrackControlPanel
                    key={idx}
                    trackName={t.name}
                    trackType={t.type}
                    volume={75}
                    meterLevelLeft={48 - idx * 4}
                    meterLevelRight={44 - idx * 4}
                    meterRecentPeakLeft={62 - idx * 4}
                    meterRecentPeakRight={58 - idx * 4}
                    trackHeight={TRACK_H}
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
                // The audio canvas stays dark even in light mode —
                // theme.background.canvas.default carries that token
                // straight from the design system (#252837).
                background: theme.background.canvas.default,
              }}
            >
              <TimelineRuler
                width={CANVAS_W}
                height={RULER_H}
                pixelsPerSecond={PPS}
                totalDuration={CANVAS_W / PPS}
                timeFormat="minutes-seconds"
              />
              <div style={{ flex: 1, paddingTop: 2 }}>
                {tracks.map((t, idx) => (
                  <div
                    key={idx}
                    style={{
                      position: "relative",
                      height: TRACK_H,
                      marginBottom: 2,
                    }}
                  >
                    <TrackNew
                      clips={t.clips}
                      trackIndex={idx}
                      width={CANVAS_W}
                      height={TRACK_H}
                      pixelsPerSecond={PPS}
                      color={t.color}
                      onClipTrimEdge={() => {}}
                    />
                  </div>
                ))}
              </div>
              <div
                style={{
                  // Wrapper at the lane top (just below the ruler) so
                  // the stalk doesn't paint behind the time labels in
                  // the top half of the ruler — only the head/icon
                  // sits in the ruler, drawn upwards via a negative
                  // iconTopOffset.
                  position: "absolute",
                  top: RULER_H,
                  left: 0,
                  pointerEvents: "none",
                }}
              >
                <PlayheadCursor
                  position={5.4}
                  pixelsPerSecond={PPS}
                  // Oversized — stalk fills the full canvas below the
                  // ruler; outer overflow:hidden clips the overshoot.
                  height={9999}
                  showTopIcon
                  // Wrapper at ruler bottom → -14 tucks the icon into
                  // the bottom of the 40px ruler (top at ruler y=26).
                  iconTopOffset={-14}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Theme name pill — small badge so you know which mode you're
            seeing while it cycles. */}
        <div
          style={{
            position: "absolute",
            left: 14,
            bottom: 12,
            padding: "5px 12px",
            fontFamily: "ui-monospace, monospace",
            fontSize: 10,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: theme.foreground.text.primary,
            background: theme.background.surface.elevated,
            border: `1px solid ${theme.border.onElevated}`,
            borderRadius: 999,
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          }}
        >
          {themeName}
        </div>
      </div>
    </ThemeProvider>
  );
}

// ── Clip colours ───────────────────────────────────────────────────────────
// Masonry of clips alternating between the design system's named palette
// (cyan/blue/violet/magenta/red/orange/yellow/green/teal) and the "classic"
// preset — the Audacity-3-style single-blue look the design system ships.
const CLIP_PALETTE = [
  "cyan",
  "blue",
  "violet",
  "magenta",
  "red",
  "orange",
  "yellow",
  "green",
  "teal",
];

const MASONRY_ROWS = [
  [
    { w: 215, name: "VO take 1" },
    { w: 175, name: "VO take 2" },
    { w: 265, name: "Music bed" },
    { w: 125, name: "FX" },
  ],
  [
    { w: 315, name: "Drums" },
    { w: 165, name: "Bass" },
    { w: 275, name: "Synth" },
  ],
  [
    { w: 175, name: "Lead" },
    { w: 140, name: "Pad" },
    { w: 215, name: "Hi-hat" },
    { w: 225, name: "Verse" },
  ],
  [
    { w: 250, name: "Chorus" },
    { w: 300, name: "Bridge" },
    { w: 215, name: "Outro" },
  ],
];

function ClipColoursDemo() {
  const rootRef = useRef(null);
  const inView = useInView(rootRef);
  const i = useCycleIndex(2, 3200, inView);
  const useClassic = i === 1;

  // One waveform per clip slot — generated once and stable across the
  // colour flip. samplesPerSecond bumped to ~900 so each clip reads as a
  // dense, "solid" peak block rather than a sparse line, and we rotate
  // between three generators (speech / decaying-sine / sine) so adjacent
  // clips look genuinely different rather than minor reshuffles.
  const flatClips = useMemo(() => MASONRY_ROWS.flatMap((row) => row), []);
  const waveforms = useMemo(
    () =>
      flatClips.map((c, idx) => {
        const duration = Math.max(0.8, c.w / 60);
        const sps = 900;
        const kind = idx % 3;
        if (kind === 0) return generateSpeechWaveform(duration, sps);
        if (kind === 1) return generateDecayingSineWave(duration, sps);
        const freq = 90 + ((idx * 37) % 220);
        return generateSineWave(duration, freq, sps);
      }),
    [flatClips],
  );

  const CLIP_H = 86;
  const PPS = 60;
  let clipIdx = -1;

  return (
    <ThemeProvider theme={darkTheme}>
      <div
        ref={rootRef}
        className="absolute inset-0 overflow-hidden flex items-center justify-center p-2"
        style={{
          background: darkTheme.background.canvas.default,
          // Perspective lives on the outer container so the entire wall
          // tilts in 3D as one object instead of each row tilting
          // independently.
          perspective: "1600px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            transform: "rotateY(-12deg) rotateX(8deg)",
            transformOrigin: "center center",
            transformStyle: "preserve-3d",
          }}
        >
          {MASONRY_ROWS.map((row, ri) => (
            <div key={ri} style={{ display: "flex", gap: 6 }}>
              {row.map((c) => {
                clipIdx += 1;
                const color = useClassic
                  ? "classic"
                  : CLIP_PALETTE[clipIdx % CLIP_PALETTE.length];
                const duration = c.w / PPS;
                return (
                  <div
                    key={`${ri}-${c.name}`}
                    style={{
                      transition: "filter 320ms ease",
                      filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.5))",
                    }}
                  >
                    <Clip
                      color={color}
                      name={c.name}
                      width={c.w}
                      height={CLIP_H}
                      waveformData={waveforms[clipIdx]}
                      clipDuration={duration}
                      pixelsPerSecond={PPS}
                      onTrimEdge={() => {}}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Mode label — tiny pill so the alternation is legible at a glance. */}
        <div
          style={{
            position: "absolute",
            left: 14,
            bottom: 12,
            padding: "5px 12px",
            fontFamily: "ui-monospace, monospace",
            fontSize: 10,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#fff",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.16)",
            borderRadius: 999,
          }}
        >
          {useClassic ? "Classic" : "Palette"}
        </div>
      </div>
    </ThemeProvider>
  );
}

// ── Toolbar positioning ────────────────────────────────────────────────────
// Layout demo: diagrammatic wireframe of the workspace regions, cycling
// the toolbar between top/bottom and the master meter between
// horizontal (inside the toolbar) and vertical (parked beside the
// tracks). Intentionally no real components — gives the section its
// one bit of editorial/schematic visual variety so it doesn't read as
// "four screenshots of the same workspace".
const LAYOUT_STATES = [
  { id: "top-horiz", toolbar: "top", meter: "horizontal" },
  { id: "bottom-horiz", toolbar: "bottom", meter: "horizontal" },
  { id: "bottom-vert", toolbar: "bottom", meter: "vertical" },
  { id: "top-vert", toolbar: "top", meter: "vertical" },
];

const WIREFRAME_LINE = "rgba(255,255,255,0.14)";
const WIREFRAME_FILL = "rgba(255,255,255,0.04)";
const WIREFRAME_FILL_STRONG = "rgba(255,255,255,0.07)";
const WIREFRAME_LABEL = "rgba(255,255,255,0.55)";

function WireframeRegion({ label, style, accent, children }) {
  return (
    <div
      style={{
        position: "absolute",
        background: accent ? WIREFRAME_FILL_STRONG : WIREFRAME_FILL,
        border: `1px solid ${WIREFRAME_LINE}`,
        borderRadius: 4,
        transition: "all 480ms cubic-bezier(0.4, 0, 0.2, 1)",
        ...style,
      }}
    >
      {label && (
        <div
          style={{
            position: "absolute",
            top: 6,
            left: 8,
            fontFamily: "ui-monospace, monospace",
            fontSize: 9,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: WIREFRAME_LABEL,
            pointerEvents: "none",
          }}
          aria-hidden
        >
          {label}
        </div>
      )}
      {children}
    </div>
  );
}

function MeterFill({ vertical }) {
  // Green→yellow→red gradient so the meter region reads as a level
  // indicator even at low opacity.
  const gradient = vertical
    ? "linear-gradient(to top, rgba(74,222,128,0.7), rgba(250,204,21,0.7) 70%, rgba(248,113,113,0.7))"
    : "linear-gradient(to right, rgba(74,222,128,0.7), rgba(250,204,21,0.7) 70%, rgba(248,113,113,0.7))";
  return (
    <div
      style={{
        position: "absolute",
        inset: 6,
        borderRadius: 3,
        background: gradient,
        transition: "all 480ms cubic-bezier(0.4, 0, 0.2, 1)",
        opacity: 0.65,
      }}
      aria-hidden
    />
  );
}

function ToolbarPositionDemo() {
  const rootRef = useRef(null);
  const inView = useInView(rootRef);
  const i = useCycleIndex(LAYOUT_STATES.length, 2600, inView);
  const state = LAYOUT_STATES[i];

  // Diagram lives in a fixed coordinate space so the regions can
  // animate cleanly between layouts. Inner padding gives the regions
  // some breathing room inside the card.
  const W = 520;
  const H = 320;
  const PAD = 18;
  const GAP = 6;
  const TOOLBAR_H = 32;
  const SIDEBAR_W = 96;
  const METER_VERTICAL_W = 28;
  const METER_HORIZONTAL_W = 140;

  // Inner coordinate space (after padding).
  const innerW = W - PAD * 2;
  const innerH = H - PAD * 2;

  // Toolbar Y position.
  const toolbarTop = state.toolbar === "top" ? PAD : PAD + innerH - TOOLBAR_H;
  // Body (sidebar + tracks + maybe vertical meter) sits in the
  // remaining vertical space.
  const bodyTop = state.toolbar === "top" ? PAD + TOOLBAR_H + GAP : PAD;
  const bodyH = innerH - TOOLBAR_H - GAP;

  // Tracks region right edge depends on whether the meter is parked
  // beside it (vertical) or inside the toolbar (horizontal).
  const tracksRight =
    state.meter === "vertical"
      ? PAD + innerW - METER_VERTICAL_W - GAP
      : PAD + innerW;
  const tracksLeft = PAD + SIDEBAR_W + GAP;
  const tracksW = tracksRight - tracksLeft;

  return (
    <div
      ref={rootRef}
      className="absolute inset-0 overflow-hidden flex items-center justify-center"
      style={{ background: "#08090C" }}
    >
      <div
        style={{
          position: "relative",
          width: W,
          height: H,
        }}
      >
        {/* Toolbar — slides between top and bottom. */}
        <WireframeRegion
          label="Transport"
          accent
          style={{
            top: toolbarTop,
            left: PAD,
            width: innerW,
            height: TOOLBAR_H,
          }}
        >
          {/* Small filled "control" tiles inside the toolbar so it
              reads as the transport area, not just an empty box. */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: 70,
              transform: "translateY(-50%)",
              display: "flex",
              gap: 4,
            }}
            aria-hidden
          >
            {[0, 1, 2, 3].map((n) => (
              <div
                key={n}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: WIREFRAME_LINE,
                }}
              />
            ))}
          </div>

          {/* Horizontal meter lives INSIDE the toolbar; only visible
              when state.meter === 'horizontal'. */}
          <div
            style={{
              position: "absolute",
              top: 6,
              right: 8,
              bottom: 6,
              width: METER_HORIZONTAL_W,
              borderRadius: 3,
              background: WIREFRAME_FILL,
              border: `1px solid ${WIREFRAME_LINE}`,
              opacity: state.meter === "horizontal" ? 1 : 0,
              transform:
                state.meter === "horizontal"
                  ? "translateX(0)"
                  : "translateX(20px)",
              transition: "all 480ms cubic-bezier(0.4, 0, 0.2, 1)",
              pointerEvents: "none",
            }}
            aria-hidden
          >
            <MeterFill vertical={false} />
          </div>
        </WireframeRegion>

        {/* Sidebar */}
        <WireframeRegion
          label="Tracks"
          style={{
            top: bodyTop,
            left: PAD,
            width: SIDEBAR_W,
            height: bodyH,
          }}
        />

        {/* Tracks lane — shrinks when meter is vertical to leave room
            for the meter on its right. */}
        <WireframeRegion
          label="Canvas"
          style={{
            top: bodyTop,
            left: tracksLeft,
            width: tracksW,
            height: bodyH,
          }}
        >
          {/* Faux ruler + track rows inside the canvas region so it
              reads as audio, not an empty box. */}
          <div
            style={{
              position: "absolute",
              top: 24,
              left: 8,
              right: 8,
              height: 1,
              background: WIREFRAME_LINE,
              opacity: 0.5,
            }}
          />
          {[0, 1].map((n) => (
            <div
              key={n}
              style={{
                position: "absolute",
                top: 38 + n * 28,
                left: 14,
                right: 14,
                height: 18,
                borderRadius: 2,
                background: WIREFRAME_FILL,
                border: `1px solid ${WIREFRAME_LINE}`,
              }}
            />
          ))}
        </WireframeRegion>

        {/* Vertical meter — slides in from the right when active. */}
        <div
          style={{
            position: "absolute",
            top: bodyTop,
            left: PAD + innerW - METER_VERTICAL_W,
            width: METER_VERTICAL_W,
            height: bodyH,
            borderRadius: 4,
            background: WIREFRAME_FILL_STRONG,
            border: `1px solid ${WIREFRAME_LINE}`,
            opacity: state.meter === "vertical" ? 1 : 0,
            transform:
              state.meter === "vertical" ? "translateX(0)" : "translateX(20px)",
            transition: "all 480ms cubic-bezier(0.4, 0, 0.2, 1)",
            pointerEvents: "none",
          }}
          aria-hidden
        >
          <MeterFill vertical />
          <div
            style={{
              position: "absolute",
              bottom: -16,
              left: "50%",
              transform: "translateX(-50%)",
              fontFamily: "ui-monospace, monospace",
              fontSize: 9,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: WIREFRAME_LABEL,
              whiteSpace: "nowrap",
            }}
          >
            Meter
          </div>
        </div>
      </div>

      {/* State label */}
      <div
        className="absolute left-4 bottom-3 font-mono text-[10px] tracking-[0.22em] uppercase text-white/85"
        style={{
          padding: "5px 12px",
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.16)",
          borderRadius: 999,
        }}
        aria-hidden
      >
        Transport · {state.toolbar} · Meter · {state.meter}
      </div>
    </div>
  );
}

const CARDS = [
  {
    id: "accent",
    title: "Accent colour",
    description: "Tag the whole app with the colour you like.",
    Demo: AccentDemo,
  },
  {
    id: "themes",
    title: "Themes",
    description: "Light, dark, and high contrast — your call.",
    Demo: ThemeDemo,
  },
  {
    id: "clip-colours",
    title: "Clip colours",
    description: "Colour-code clips so projects read at a glance.",
    Demo: ClipColoursDemo,
  },
  {
    id: "layout",
    title: "Layout",
    description:
      "Park the transport above or below the canvas, and stand the master meter up vertically — same controls, your shape.",
    Demo: ToolbarPositionDemo,
  },
];

function CustomisableUI() {
  return (
    <section className="bg-background-dark customisable-section px-6 lg:px-10">
      <div className="max-w-[1400px] mx-auto w-full h-full flex flex-col">
        <header className="max-w-3xl shrink-0">
          <h2 className="font-harmony text-text-contrast text-4xl md:text-5xl lg:text-6xl leading-[1.05]">
            Fully customisable UI
          </h2>
          <p className="mt-4 text-text-contrast/70 text-base md:text-lg">
            Workspaces are the starting point. From there, almost everything
            bends to fit.
          </p>
        </header>

        <ul className="mt-8 lg:mt-10 flex-1 min-h-0 grid grid-cols-1 sm:grid-cols-2 grid-rows-[1fr_1fr] gap-5 lg:gap-7">
          {CARDS.map((card) => (
            <li key={card.id} className="flex flex-col min-h-0">
              <div
                className="flex-1 min-h-0 rounded-xl border border-white/10 bg-white/[0.03] relative overflow-hidden"
                aria-hidden
              >
                <card.Demo />
              </div>
              <div className="mt-4 shrink-0 customisable-text-block">
                <h3 className="font-harmony text-text-contrast text-lg md:text-xl leading-tight">
                  {card.title}
                </h3>
                <p className="mt-1.5 text-text-contrast/65 text-sm md:text-base">
                  {card.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <style>{`
        .customisable-section {
          height: 100vh;
          min-height: 100vh !important;
          max-height: 100vh;
          display: flex !important;
          flex-direction: column;
          justify-content: center !important;
          padding-top: 6vh;
          padding-bottom: 6vh;
          scroll-snap-align: start;
          scroll-snap-stop: normal;
        }
        .customisable-section .customisable-text-block {
          min-height: 76px;
        }
      `}</style>
    </section>
  );
}

export default CustomisableUI;
