import React, { useEffect, useMemo, useRef, useState } from "react";
import { useInView } from "../../hooks/useInView.js";
import {
  Clip,
  Toolbar,
  ToolbarButtonGroup,
  ToolbarDivider,
  TransportButton,
  ToolButton,
  TrackNew,
  TrackControlPanel,
  TrackControlSidePanel,
  TimelineRuler,
  PlayheadCursor,
  MasterMeter,
  Button,
  Slider,
  Radio,
  ToggleButton,
  PanKnob,
  ThemeProvider,
  darkTheme,
  lightTheme,
  generateSpeechWaveform,
  generateDecayingSineWave,
  generateSineWave,
} from "@dilsonspickles/components";

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
const ACCENTS = [
  { name: "Coral", value: "#F87171" },
  { name: "Mint", value: "#34D399" },
  { name: "Violet", value: "#A78BFA" },
  { name: "Sky", value: "#7CC4FF" },
  { name: "Amber", value: "#FBBF24" },
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
  const i = useCycleIndex(ACCENTS.length, 2400, inView && isActive);
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
        .accent-demo-card .radio__pip { background: var(--accent) !important; }
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
        .accent-demo-card .button--primary { background: var(--accent) !important; }
        .accent-demo-card .button--primary:hover { background: var(--accent) !important; filter: brightness(1.08); }
        .accent-demo-card .toggle-button--active { background: var(--accent) !important; }
        .accent-demo-card .slider__fill,
        .accent-demo-card .radio__pip,
        .accent-demo-card .knob__value-sweep,
        .accent-demo-card .button--primary,
        .accent-demo-card .toggle-button--active {
          transition: background 360ms ease;
        }
      `}</style>
      <div
        ref={rootRef}
        className="accent-demo-card absolute inset-0 flex flex-col items-center justify-center gap-7 p-7"
        style={{
          ...accentVars(accent),
          transition: "background-color 360ms ease",
        }}
      >
        {/* Pan knob + volume slider sit together — the side-panel kit. */}
        <div className="flex items-center gap-8">
          <div className="flex flex-col items-center gap-2">
            {/* Pan held at -60 (60% left). The design system paints the
                bipolar value-sweep with hardcoded blues via an inline
                conic-gradient — overridden below with a matching-angle
                gradient that reads from --accent so the indicator-of-
                how-much arc actually picks up the cycling colour. */}
            <PanKnob value={-60} />
            <span
              className="font-mono text-[9px] tracking-[0.22em] uppercase text-text-contrast/45"
              aria-hidden
            >
              Pan
            </span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div style={{ width: 160 }}>
              <Slider value={72} ariaLabel="Track volume" />
            </div>
            <span
              className="font-mono text-[9px] tracking-[0.22em] uppercase text-text-contrast/45"
              aria-hidden
            >
              Volume
            </span>
          </div>
        </div>

        {/* Primary button — the obvious accent recipient. */}
        <Button variant="primary" size="large">
          Record
        </Button>

        {/* Effect bypass + radio sit together — the "small chrome" row. */}
        <div className="flex items-center gap-8">
          <div className="flex flex-col items-center gap-2">
            <ToggleButton
              active
              icon="power"
              size={28}
              activeColor={accent}
              ariaLabel="Bypass effect"
            />
            <span
              className="font-mono text-[9px] tracking-[0.22em] uppercase text-text-contrast/45"
              aria-hidden
            >
              Bypass
            </span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Radio checked onChange={() => {}} name="accent-demo" />
            <span
              className="font-mono text-[9px] tracking-[0.22em] uppercase text-text-contrast/45"
              aria-hidden
            >
              Selected
            </span>
          </div>
        </div>

        {/* Accent name pill, coloured by the current accent. */}
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

  const TRACK_CONTROL_W = 240;
  const CANVAS_W = 720;
  const RULER_H = 32;
  const TRACK_H = 78;
  const PPS = 36;

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
            width: TRACK_CONTROL_W + CANVAS_W + 40,
            // Slightly taller than the card so it clips at the bottom too,
            // reading as a window onto a larger workspace.
            height: 60 + RULER_H + totalTracksH + 20,
            display: "flex",
            flexDirection: "column",
            background: theme.background.surface.subtle,
            transition: "background 480ms ease",
          }}
        >
          <Toolbar
            rightContent={
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  paddingRight: 8,
                }}
              >
                <ToolButton icon="microphone" ariaLabel="Recording level" />
                <div style={{ width: 160 }}>
                  <MasterMeter
                    levelLeft={-12}
                    levelRight={-14}
                    recentPeakLeft={-8}
                    recentPeakRight={-10}
                    volume={0.8}
                  />
                </div>
              </div>
            }
          >
            <ToolbarButtonGroup>
              <TransportButton icon="play" ariaLabel="Play" />
              <TransportButton icon="stop" ariaLabel="Stop" />
              <TransportButton icon="record" ariaLabel="Record" />
              <TransportButton icon="skip-back" ariaLabel="Skip to start" />
              <TransportButton icon="skip-forward" ariaLabel="Skip to end" />
            </ToolbarButtonGroup>
            <ToolbarDivider />
            <ToolbarButtonGroup>
              <ToolButton icon="cut" ariaLabel="Cut" />
              <ToolButton icon="copy" ariaLabel="Copy" />
              <ToolButton icon="paste" ariaLabel="Paste" />
            </ToolbarButtonGroup>
            <ToolbarDivider />
            <ToolbarButtonGroup>
              <ToolButton icon="zoom-in" ariaLabel="Zoom in" />
              <ToolButton icon="zoom-out" ariaLabel="Zoom out" />
              <ToolButton icon="zoom-to-fit" ariaLabel="Zoom to fit" />
            </ToolbarButtonGroup>
          </Toolbar>

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
                  top: 0,
                  left: 0,
                  pointerEvents: "none",
                }}
              >
                <PlayheadCursor
                  position={5.4}
                  pixelsPerSecond={PPS}
                  height={RULER_H + totalTracksH}
                  showTopIcon
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
        className="absolute inset-0 overflow-hidden flex flex-col items-center justify-center gap-2 p-2"
        style={{ background: darkTheme.background.canvas.default }}
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
                    filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.35))",
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
const POSITIONS = ["top", "bottom", "left", "right"];

function ToolbarPositionDemo() {
  const rootRef = useRef(null);
  const inView = useInView(rootRef);
  const i = useCycleIndex(POSITIONS.length, 2200, inView);
  const pos = POSITIONS[i];

  const toolbar = (orientation) => (
    <div
      style={{
        background: "rgba(124, 196, 255, 0.18)",
        border: "1px solid rgba(124, 196, 255, 0.35)",
        borderRadius: 4,
        display: "flex",
        flexDirection: orientation === "vertical" ? "column" : "row",
        gap: 4,
        padding: 4,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {[0, 1, 2, 3, 4].map((n) => (
        <div
          key={n}
          style={{
            width: 8,
            height: 8,
            borderRadius: 2,
            background: "rgba(255,255,255,0.55)",
          }}
        />
      ))}
    </div>
  );

  const isVertical = pos === "left" || pos === "right";

  return (
    <div
      ref={rootRef}
      className="absolute inset-0 flex items-center justify-center p-7"
    >
      <div
        className="rounded-lg overflow-hidden flex"
        style={{
          width: 260,
          height: 175,
          background: "#0F151B",
          border: "1px solid rgba(255,255,255,0.08)",
          padding: 10,
          gap: 8,
          flexDirection:
            pos === "top"
              ? "column"
              : pos === "bottom"
                ? "column-reverse"
                : pos === "left"
                  ? "row"
                  : "row-reverse",
          transition: "flex-direction 360ms ease",
        }}
      >
        <div
          style={{
            flex: isVertical ? "0 0 28px" : "0 0 24px",
            transition: "flex-basis 360ms ease",
          }}
        >
          {toolbar(isVertical ? "vertical" : "horizontal")}
        </div>
        <div className="flex-1 flex flex-col gap-1.5">
          <div
            style={{
              flex: 1,
              background: "rgba(255,255,255,0.04)",
              borderRadius: 3,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 4,
                right: 4,
                top: "50%",
                height: 1,
                background: "rgba(124,196,255,0.5)",
              }}
            />
          </div>
          <div
            style={{
              flex: 1,
              background: "rgba(255,255,255,0.04)",
              borderRadius: 3,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 4,
                right: 4,
                top: "50%",
                height: 1,
                background: "rgba(167,139,250,0.5)",
              }}
            />
          </div>
        </div>
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
    id: "toolbar",
    title: "Toolbar position",
    description: "Top, bottom, or stuck to either side.",
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
