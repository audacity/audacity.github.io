import React, { useEffect, useMemo, useRef, useState } from "react";
import { useInView } from "../../hooks/useInView.js";
import { useEntrance } from "../../hooks/useEntrance.js";
import {
  Clip,
  TransportToolbar,
  TrackNew,
  TrackControlPanel,
  TrackControlSidePanel,
  TimelineRuler,
  PlayheadCursor,
  MasterMeter,
  MasterMeterVertical,
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

// Inner workspace UI rendered once per theme layer. Pulled out so we can
// stack two copies (source + destination) and wipe between them on theme
// flip — see ThemeDemo for the wipe choreography.
function ThemeWorkspaceLayer({
  theme,
  tracks,
  trackHeights,
  innerW,
  innerH,
  TRACK_CONTROL_W,
  CANVAS_W,
  RULER_H,
  TRACK_H,
  PPS,
  loopState,
}) {
  const {
    loopEnabled,
    loopStart,
    loopEnd,
    setLoopEnabled,
    setLoopStart,
    setLoopEnd,
  } = loopState;
  return (
    <ThemeProvider theme={theme}>
      <div
        style={{
          width: innerW,
          height: innerH,
          display: "flex",
          flexDirection: "column",
          background: theme.background.surface.subtle,
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
                position: "absolute",
                top: RULER_H,
                left: 0,
                pointerEvents: "none",
              }}
            >
              <PlayheadCursor
                position={5.4}
                pixelsPerSecond={PPS}
                height={9999}
                showTopIcon
                iconTopOffset={-14}
              />
            </div>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}

// Sun ↔ moon icon. Two glyphs crossfade + counter-rotate as the theme
// flips so the pill animates in sync with the horizon sweep.
function SunMoonIcon({ isDark, color }) {
  const baseStyle = {
    position: "absolute",
    inset: 0,
    transition:
      "opacity 760ms cubic-bezier(0.4, 0, 0.2, 1), transform 760ms cubic-bezier(0.4, 0, 0.2, 1)",
    color,
  };
  return (
    <span
      style={{
        position: "relative",
        width: 12,
        height: 12,
        display: "inline-block",
      }}
    >
      {/* Sun */}
      <svg
        viewBox="0 0 24 24"
        width="12"
        height="12"
        style={{
          ...baseStyle,
          opacity: isDark ? 0 : 1,
          transform: isDark
            ? "rotate(-90deg) scale(0.6)"
            : "rotate(0deg) scale(1)",
        }}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      >
        <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />
        <line x1="12" y1="2" x2="12" y2="5" />
        <line x1="12" y1="19" x2="12" y2="22" />
        <line x1="2" y1="12" x2="5" y2="12" />
        <line x1="19" y1="12" x2="22" y2="12" />
        <line x1="4.93" y1="4.93" x2="6.7" y2="6.7" />
        <line x1="17.3" y1="17.3" x2="19.07" y2="19.07" />
        <line x1="4.93" y1="19.07" x2="6.7" y2="17.3" />
        <line x1="17.3" y1="6.7" x2="19.07" y2="4.93" />
      </svg>
      {/* Moon */}
      <svg
        viewBox="0 0 24 24"
        width="12"
        height="12"
        style={{
          ...baseStyle,
          opacity: isDark ? 1 : 0,
          transform: isDark
            ? "rotate(0deg) scale(1)"
            : "rotate(90deg) scale(0.6)",
        }}
        fill="currentColor"
      >
        <path d="M20.7 14.5a8 8 0 11-11.2-11 1 1 0 011.2 1.3 6 6 0 008.7 7.5 1 1 0 011.3 1.2z" />
      </svg>
    </span>
  );
}

function ThemeDemo() {
  const rootRef = useRef(null);
  const inView = useInView(rootRef);
  const tickI = useCycleIndex(2, 3500, inView);

  // Two-layer wipe: `currentI` is the settled theme, `tickI` is where we
  // want to land. When they differ, the source layer wipes away to reveal
  // the destination layer underneath. The horizon sweep travels with the
  // wipe edge so the eye reads it as a sunrise/sunset rolling across.
  const [currentI, setCurrentI] = useState(0);
  const animating = currentI !== tickI;

  // Set during render (not in useEffect) so the source layer mounts with
  // the wipe class in the same paint as the bottom layer's theme prop
  // update. Bumping a counter in useEffect would lag by one render, so
  // the user would briefly see the bottom layer's new theme while the
  // top layer is still pinned-clipped-invisible from the previous wipe.
  const hasEverWipedRef = useRef(false);
  if (animating) hasEverWipedRef.current = true;

  const sourceTheme = currentI === 0 ? darkTheme : lightTheme;
  const destTheme = tickI === 0 ? darkTheme : lightTheme;
  const destIsDark = tickI === 0;
  const destName = destIsDark ? "Dark" : "Light";

  // Loop region state for the TransportToolbar — controlled, but nothing
  // here interacts with it. Shared across both layers so the toolbar
  // state stays consistent during the wipe.
  const [loopEnabled, setLoopEnabled] = useState(false);
  const [loopStart, setLoopStart] = useState(null);
  const [loopEnd, setLoopEnd] = useState(null);
  const loopState = {
    loopEnabled,
    loopStart,
    loopEnd,
    setLoopEnabled,
    setLoopStart,
    setLoopEnd,
  };

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

  // Match the design system's natural sizes — see prior comment block for
  // why these specific numbers.
  const TRACK_CONTROL_W = 280;
  const CANVAS_W = 720;
  const RULER_H = 40;
  const TRACK_H = 110;
  const PPS = 36;
  const TOOLBAR_H_BUDGET = 64;

  const trackHeights = tracks.map(() => TRACK_H);
  const totalTracksH =
    trackHeights.reduce((a, b) => a + b, 0) + tracks.length * 2;
  const innerW = 1500;
  const innerH = TOOLBAR_H_BUDGET + RULER_H + totalTracksH + 20;

  const layerProps = {
    tracks,
    trackHeights,
    innerW,
    innerH,
    TRACK_CONTROL_W,
    CANVAS_W,
    RULER_H,
    TRACK_H,
    PPS,
    loopState,
  };

  // Warm gradient for sunrise (going light), cool for moonrise (going dark).
  const sweepGradient = destIsDark
    ? "linear-gradient(90deg, rgba(60,40,120,0) 0%, rgba(110,90,190,0.5) 35%, rgba(70,60,170,0.85) 50%, rgba(110,90,190,0.5) 65%, rgba(60,40,120,0) 100%)"
    : "linear-gradient(90deg, rgba(255,180,90,0) 0%, rgba(255,195,130,0.55) 35%, rgba(255,150,90,0.9) 50%, rgba(255,200,140,0.55) 65%, rgba(255,180,90,0) 100%)";

  return (
    <div
      ref={rootRef}
      className="absolute inset-0 overflow-hidden"
      style={{
        background: "#08090C",
      }}
    >
      {/* Bottom layer — destination theme, always painted underneath. */}
      <div style={{ position: "absolute", top: 0, left: 0 }}>
        <ThemeWorkspaceLayer theme={destTheme} {...layerProps} />
      </div>

      {/* Top layer — source theme, with a clip-path that wipes left→right
          on each tick. Key is `tickI` so the element remounts in the
          SAME render that tickI changes — the wipe's fresh start and
          the bottom layer's theme update land in one paint. After the
          animation ends the layer stays pinned at the `forwards` end
          state (fully clipped, invisible) so the source-theme repaint
          that follows happens out of sight. */}
      <div
        key={`source-${tickI}`}
        className={hasEverWipedRef.current ? "theme-wipe-source" : ""}
        onAnimationEnd={(e) => {
          if (e.animationName === "themeWipeSource") setCurrentI(tickI);
        }}
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        <ThemeWorkspaceLayer theme={sourceTheme} {...layerProps} />
      </div>

      {/* Horizon gradient sweep — travels with the wipe edge, warm or
          cool depending on which direction we're heading. */}
      {animating && (
        <div
          key={`sweep-${tickI}`}
          className="theme-wipe-band"
          style={{ background: sweepGradient }}
        />
      )}

      {/* Pill — anchors the metaphor (this control changes the theme)
          and morphs sun ↔ moon in time with the sweep. */}
      <div
        style={{
          position: "absolute",
          left: 14,
          bottom: 12,
          padding: "5px 12px 5px 10px",
          fontFamily: "ui-monospace, monospace",
          fontSize: 10,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: destTheme.foreground.text.primary,
          background: destTheme.background.surface.elevated,
          border: `1px solid ${destTheme.border.onElevated}`,
          borderRadius: 999,
          boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          transition:
            "color 760ms cubic-bezier(0.4, 0, 0.2, 1), background 760ms cubic-bezier(0.4, 0, 0.2, 1), border-color 760ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <SunMoonIcon
          isDark={destIsDark}
          color={destTheme.foreground.text.primary}
        />
        {destName}
      </div>

      <style>{`
        @keyframes themeWipeSource {
          from { clip-path: inset(0 0 0 0); }
          to   { clip-path: inset(0 0 0 100%); }
        }
        .theme-wipe-source {
          animation: themeWipeSource 950ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        @keyframes themeBandSweep {
          from { transform: translateX(-100%); opacity: 0; }
          12%  { opacity: 1; }
          88%  { opacity: 1; }
          to   { transform: translateX(200%); opacity: 0; }
        }
        .theme-wipe-band {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 0;
          width: 60%;
          mix-blend-mode: screen;
          pointer-events: none;
          filter: blur(10px);
          animation: themeBandSweep 950ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}</style>
    </div>
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

// One clip with its own clock — flips between its palette colour and
// classic on its own schedule. Periods and initial delays are derived
// per-clip from the index so the wall reads as a slow shimmer instead
// of a synchronised toggle.
function IndependentClip({
  paletteColor,
  name,
  width,
  height,
  pps,
  waveform,
  period,
  initialDelay,
  inView,
}) {
  const [useClassic, setUseClassic] = useState(false);

  useEffect(() => {
    if (!inView) return;
    let cancelled = false;
    let timerId = window.setTimeout(function tick() {
      if (cancelled) return;
      setUseClassic((prev) => !prev);
      timerId = window.setTimeout(tick, period);
    }, initialDelay);
    return () => {
      cancelled = true;
      window.clearTimeout(timerId);
    };
  }, [inView, period, initialDelay]);

  const color = useClassic ? "classic" : paletteColor;
  const duration = width / pps;
  return (
    <div
      style={{
        filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.5))",
      }}
    >
      <Clip
        color={color}
        name={name}
        width={width}
        height={height}
        waveformData={waveform}
        clipDuration={duration}
        pixelsPerSecond={pps}
        onTrimEdge={() => {}}
      />
    </div>
  );
}

function ClipColoursDemo() {
  const rootRef = useRef(null);
  const inView = useInView(rootRef);

  // Stable waveforms — same shape across colour flips so neither face
  // ever needs to repaint when the card turns. samplesPerSecond bumped
  // to ~900 so each clip reads as a dense, "solid" peak block, and we
  // rotate between three generators (speech / decaying-sine / sine) so
  // adjacent clips look genuinely different rather than minor
  // reshuffles.
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
            <div
              key={ri}
              style={{
                display: "flex",
                gap: 6,
              }}
            >
              {row.map((c) => {
                clipIdx += 1;
                const paletteColor =
                  CLIP_PALETTE[clipIdx % CLIP_PALETTE.length];
                // Stable per-clip period (3.5–6s) and initial delay
                // (0–5s) seeded by index — varied enough that the
                // clips never fall into lockstep.
                const period = 3500 + ((clipIdx * 1373) % 2500);
                const initialDelay = (clipIdx * 437) % 5000;
                return (
                  <IndependentClip
                    key={`${ri}-${c.name}`}
                    paletteColor={paletteColor}
                    name={c.name}
                    width={c.w}
                    height={CLIP_H}
                    pps={PPS}
                    waveform={waveforms[clipIdx]}
                    period={period}
                    initialDelay={initialDelay}
                    inView={inView}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </ThemeProvider>
  );
}

// ── Meter dock ─────────────────────────────────────────────────────────────
// Real MasterMeter and MasterMeterVertical from the package, cycling
// between a horizontal mount inside a faux transport row and a vertical
// dock parked beside the tracks lane. The surrounding layout (toolbar
// gap on the right, tracks lane on the left) animates in lockstep so the
// meter visibly "moves" between the two positions rather than just
// snapping.
function useLiveLevels(inView) {
  const [levels, setLevels] = useState({
    levelLeft: -10,
    levelRight: -12,
    peakLeft: -6,
    peakRight: -8,
  });
  useEffect(() => {
    if (!inView) return;
    let raf;
    const t0 = performance.now();
    const loop = (t) => {
      const dt = t - t0;
      setLevels({
        levelLeft: -10 + Math.sin(dt / 280) * 7,
        levelRight: -12 + Math.sin(dt / 260) * 7,
        peakLeft: -5 + Math.sin(dt / 440) * 3,
        peakRight: -7 + Math.sin(dt / 460) * 3,
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [inView]);
  return levels;
}

const METER_DOCK_TRACKS = [
  { name: "Voice", type: "mono", color: "blue" },
  { name: "Music", type: "stereo", color: "violet" },
  { name: "FX", type: "mono", color: "orange" },
  { name: "Drums", type: "mono", color: "red" },
  { name: "Bass", type: "mono", color: "green" },
];

function MeterDockDemo() {
  const rootRef = useRef(null);
  const inView = useInView(rootRef);
  const i = useCycleIndex(2, 3400, inView);
  const isVertical = i === 1;
  const levels = useLiveLevels(inView);

  // Controlled state for the TransportToolbar — nothing here actually
  // interacts with it, but the toolbar's props are controlled so we
  // have to park the values somewhere.
  const [loopEnabled, setLoopEnabled] = useState(false);
  const [loopStart, setLoopStart] = useState(null);
  const [loopEnd, setLoopEnd] = useState(null);

  // Stable waveforms for the lanes so the canvas reads as a real
  // mockup rather than empty boxes.
  const waveforms = useMemo(
    () => [
      generateSpeechWaveform(11),
      generateSineWave(8, 110),
      generateDecayingSineWave(7),
      generateSpeechWaveform(17),
      generateSineWave(6, 90),
    ],
    [],
  );

  // Inner workspace sizes — aperture-of-the-UI style (cf. ThemeDemo):
  // the workspace is rendered at full native width and right-anchored
  // inside the card, so the right portion (toolbar's master meter +
  // the vertical-dock slot) sits flush with the card's right edge.
  // The left portion just clips off naturally. No responsive plumbing.
  const RULER_H = 32;
  const TRACK_H = 110;
  const PPS = 30;
  // MasterMeterVertical's intrinsic width: bars (22) + gap (2) +
  // scale column (24) + padding (12 left + 12 right) = 72. Matching
  // the slot width exactly leaves no gap on either side.
  const VERT_METER_W = 72;
  // Workspace = wide enough that the TransportToolbar never hits its
  // responsive wrap (cf. ThemeDemo's 1500px). Body matches so the
  // meter's two positions both anchor to the same right edge.
  const WORKSPACE_W = 1500;
  // Canvas renders at full workspace width; the vertical-meter slot
  // then "covers" the canvas's right edge as it docks in.
  const CANVAS_RENDER_W = WORKSPACE_W;
  const EASE = "cubic-bezier(0.4, 0, 0.2, 1)";

  return (
    <ThemeProvider theme={darkTheme}>
      <div
        ref={rootRef}
        className="meter-dock absolute inset-0 overflow-hidden"
        style={{ background: "#08090C" }}
        data-vertical={isVertical ? "true" : "false"}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: WORKSPACE_W,
            // No fixed height — workspace renders at its natural
            // intrinsic size (toolbar + tracks). With enough tracks
            // it overflows the aperture vertically, which is the
            // intended "aperture into a bigger UI" feel.
            display: "flex",
            flexDirection: "column",
            background: darkTheme.background.canvas.default,
            transform: "scale(0.82)",
            transformOrigin: "top right",
          }}
        >
          {/* Real TransportToolbar at full workspace width. No wrapping,
              no shifting, no responsive plumbing — the card is just an
              aperture into a bigger UI, so anything that overflows
              clips naturally. */}
          <div>
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
              currentTime={4.2}
              timeCodeFormat="hh:mm:ss"
              onTimeCodeChange={NOOP}
              onTimeCodeFormatChange={NOOP}
              onShareClick={NOOP}
              onExportAudioClick={NOOP}
              onExportLoopRegionClick={NOOP}
              masterLevelLeft={levels.levelLeft}
              masterLevelRight={levels.levelRight}
              masterRecentPeakLeft={levels.peakLeft}
              masterRecentPeakRight={levels.peakRight}
              masterVolume={0.8}
            />
          </div>

          {/* Body: canvas + vertical meter dock. Body takes its
              natural height from the track lanes — no `flex: 1`,
              nothing responsive. The meter then stretches to the
              body's intrinsic height. */}
          <div style={{ display: "flex", minHeight: 0 }}>
            <div
              style={{
                flex: 1,
                position: "relative",
                background: darkTheme.background.canvas.default,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <TimelineRuler
                width={CANVAS_RENDER_W}
                height={RULER_H}
                pixelsPerSecond={PPS}
                totalDuration={CANVAS_RENDER_W / PPS}
                timeFormat="minutes-seconds"
              />
              <div style={{ flex: 1, paddingTop: 2 }}>
                {METER_DOCK_TRACKS.map((t, idx) => (
                  <div
                    key={idx}
                    style={{
                      position: "relative",
                      height: TRACK_H,
                      marginBottom: 2,
                    }}
                  >
                    <TrackNew
                      clips={[
                        {
                          id: `mdt-${idx}-1`,
                          name: t.name,
                          start: 0.3,
                          duration: 5.4,
                          waveform: waveforms[idx],
                        },
                        {
                          id: `mdt-${idx}-2`,
                          name: `${t.name} 2`,
                          start: 6.6,
                          duration: 5.2,
                          waveform: waveforms[idx],
                        },
                        {
                          id: `mdt-${idx}-3`,
                          name: `${t.name} 3`,
                          start: 12.6,
                          duration: 4.6,
                          waveform: waveforms[idx],
                        },
                      ]}
                      trackIndex={idx}
                      width={CANVAS_RENDER_W}
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
                  position: "absolute",
                  top: RULER_H,
                  left: 0,
                  pointerEvents: "none",
                }}
              >
                <PlayheadCursor
                  position={4.2}
                  pixelsPerSecond={PPS}
                  height={9999}
                  showTopIcon
                  iconTopOffset={-12}
                />
              </div>
            </div>

            {/* Vertical meter slot — expands from 0 when the meter
                docks here. The meter itself slides in from upper-left
                so the motion reads as "the meter arrived from the
                toolbar," not just "a meter appeared." */}
            <div
              style={{
                width: isVertical ? VERT_METER_W : 0,
                transition: `width 750ms ${EASE}`,
                overflow: "hidden",
                flexShrink: 0,
                display: "flex",
                alignItems: "stretch",
                justifyContent: "center",
                background: darkTheme.background.canvas.default,
              }}
            >
              <div
                className="meter-dock__vert"
                style={{
                  width: VERT_METER_W,
                  display: "flex",
                  alignItems: "stretch",
                  justifyContent: "center",
                  opacity: isVertical ? 1 : 0,
                  transform: isVertical
                    ? "translate(0, 0) scale(1)"
                    : "translate(-14px, -16px) scale(0.92)",
                  transition: `opacity 420ms ease ${
                    isVertical ? "240ms" : "0ms"
                  }, transform 720ms ${EASE} ${isVertical ? "180ms" : "0ms"}`,
                  filter: isVertical
                    ? "drop-shadow(0 0 18px rgba(91,163,245,0.28))"
                    : "drop-shadow(0 0 0 rgba(91,163,245,0))",
                }}
              >
                <MasterMeterVertical
                  levelLeft={levels.levelLeft}
                  levelRight={levels.levelRight}
                  recentPeakLeft={levels.peakLeft}
                  recentPeakRight={levels.peakRight}
                  volume={0.8}
                />
              </div>
            </div>
          </div>
        </div>

        {/* When isVertical, the TransportToolbar's built-in horizontal
            meter slides DOWN AND RIGHT as it fades — toward where the
            vertical dock lives — so the eye reads the two transitions
            as one continuous motion rather than two unrelated fades.
            The slot stays in the toolbar so the transport row keeps
            its shape. A soft glow on the active meter makes it the
            clear focal point of the demo. */}
        <style>{`
          .meter-dock .master-meter {
            transition: opacity 420ms ease, transform 720ms ${EASE}, filter 480ms ease;
            filter: drop-shadow(0 0 14px rgba(91,163,245,0.22));
          }
          .meter-dock[data-vertical="true"] .master-meter {
            opacity: 0;
            transform: translate(16px, 14px) scale(0.92);
            pointer-events: none;
            filter: drop-shadow(0 0 0 rgba(91,163,245,0));
          }
        `}</style>
      </div>
    </ThemeProvider>
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
    id: "meter-dock",
    title: "Master meter, your way",
    description:
      "Keep the master meter docked horizontally inside the transport, or stand it up vertically beside the tracks. Long-requested, finally here.",
    Demo: MeterDockDemo,
  },
];

// Per-card wrapper so each grid cell can have its own scroll-in
// entrance (slight cascade across the grid via `delayMs`). The hook
// has to be called per card, hence the sub-component instead of
// inlining inside the .map.
function CustomisableUICard({ card, idx }) {
  const entrance = useEntrance({ delayMs: idx * 90 });
  return (
    <li
      ref={entrance.ref}
      className="flex flex-col min-h-0"
      style={entrance.style}
    >
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
  );
}

function CustomisableUI() {
  const headerEntrance = useEntrance();
  return (
    <section className="bg-background-dark customisable-section px-6 lg:px-10">
      <div className="max-w-[1400px] mx-auto w-full h-full flex flex-col">
        <header
          ref={headerEntrance.ref}
          className="max-w-3xl shrink-0"
          style={headerEntrance.style}
        >
          <h2 className="font-harmony text-text-contrast text-4xl md:text-5xl lg:text-6xl leading-[1.05]">
            Fully customisable UI
          </h2>
          <p className="mt-4 text-text-contrast/70 text-base md:text-lg">
            Workspaces are the starting point. From there, almost everything
            bends to fit.
          </p>
        </header>

        <ul className="mt-8 lg:mt-10 flex-1 min-h-0 grid grid-cols-1 sm:grid-cols-2 grid-rows-[1fr_1fr] gap-5 lg:gap-7">
          {CARDS.map((card, idx) => (
            <CustomisableUICard key={card.id} card={card} idx={idx} />
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
