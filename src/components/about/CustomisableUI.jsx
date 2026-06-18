import React, { useEffect, useState } from "react";
import {
  Clip,
  ThemeProvider,
  darkTheme,
  generateSpeechWaveform,
} from "@dilsonspickles/components";

function useCycleIndex(count, intervalMs) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % count), intervalMs);
    return () => clearInterval(t);
  }, [count, intervalMs]);
  return i;
}

// ── Accent colour ──────────────────────────────────────────────────────────
const ACCENTS = [
  { name: "Coral", value: "#F87171" },
  { name: "Mint", value: "#34D399" },
  { name: "Violet", value: "#A78BFA" },
  { name: "Sky", value: "#7CC4FF" },
  { name: "Amber", value: "#FBBF24" },
];

function AccentDemo() {
  const i = useCycleIndex(ACCENTS.length, 2200);
  const accent = ACCENTS[i].value;
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 p-7">
      <div
        className="px-5 py-2.5 rounded-md font-mono text-sm tracking-wide"
        style={{
          background: accent,
          color: "#0E1218",
          fontWeight: 600,
          transition: "background 360ms ease",
        }}
      >
        Record
      </div>
      <div className="flex items-center gap-4">
        <div
          className="w-5 h-5 rounded flex items-center justify-center"
          style={{
            background: accent,
            transition: "background 360ms ease",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path
              d="M2 6 L5 9 L10 3"
              fill="none"
              stroke="#0E1218"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div
          className="relative w-32 h-1.5 rounded-full"
          style={{ background: "rgba(255,255,255,0.1)" }}
        >
          <div
            className="absolute left-0 top-0 h-full rounded-full"
            style={{
              width: "62%",
              background: accent,
              transition: "background 360ms ease",
            }}
          />
          <div
            className="absolute top-1/2 w-3.5 h-3.5 rounded-full"
            style={{
              left: "62%",
              transform: "translate(-50%, -50%)",
              background: "#fff",
              boxShadow: `0 0 0 3px ${accent}55`,
              transition: "box-shadow 360ms ease",
            }}
          />
        </div>
      </div>
      <div
        className="font-mono text-[10px] tracking-[0.3em] uppercase"
        style={{ color: accent, opacity: 0.85, transition: "color 360ms ease" }}
      >
        {ACCENTS[i].name}
      </div>
    </div>
  );
}

// ── Theme change ───────────────────────────────────────────────────────────
const THEMES = [
  {
    name: "Dark",
    bg: "#171F25",
    panel: "#1F2A33",
    text: "#E4E5E7",
    muted: "#7C8590",
    track: "#1A242C",
    accent: "#7CC4FF",
    wave: "#7CC4FF",
  },
  {
    name: "Light",
    bg: "#F4F4F6",
    panel: "#FFFFFF",
    text: "#181A1F",
    muted: "#6B7280",
    track: "#E8EAEE",
    accent: "#5B6BCC",
    wave: "#5B6BCC",
  },
];

function ThemeDemo() {
  const i = useCycleIndex(THEMES.length, 3000);
  const th = THEMES[i];
  return (
    <div
      className="absolute inset-0 flex items-center justify-center p-7"
      style={{ transition: "background 480ms ease", background: th.bg }}
    >
      <div
        className="w-full max-w-[320px] rounded-lg overflow-hidden"
        style={{
          background: th.panel,
          boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
          transition: "background 480ms ease",
        }}
      >
        {/* Transport strip */}
        <div
          className="flex items-center gap-2 px-3 py-2"
          style={{
            background: th.panel,
            borderBottom: `1px solid ${th.muted}33`,
            transition: "background 480ms ease, border-color 480ms ease",
          }}
        >
          <div
            className="w-4 h-4 rounded-full"
            style={{
              background: th.accent,
              transition: "background 480ms ease",
            }}
          />
          <div
            className="w-4 h-4 rounded-sm"
            style={{
              background: th.muted,
              transition: "background 480ms ease",
            }}
          />
          <div
            className="ml-auto font-mono text-[10px]"
            style={{ color: th.text, transition: "color 480ms ease" }}
          >
            00:00:14
          </div>
        </div>
        {/* Tracks */}
        {[0, 1].map((row) => (
          <div
            key={row}
            className="flex items-stretch"
            style={{
              borderBottom: row === 0 ? `1px solid ${th.muted}22` : "none",
              transition: "border-color 480ms ease",
            }}
          >
            <div
              className="px-3 py-2 text-[10px] font-mono"
              style={{
                width: 64,
                background: th.track,
                color: th.text,
                transition: "background 480ms ease, color 480ms ease",
              }}
            >
              Track {row + 1}
            </div>
            <div
              className="flex-1 relative py-3"
              style={{
                background: th.bg,
                transition: "background 480ms ease",
              }}
            >
              <svg
                viewBox="0 0 120 20"
                preserveAspectRatio="none"
                style={{ width: "100%", height: 20 }}
              >
                <path
                  d="M0 10 Q 10 4 20 10 T 40 10 T 60 10 T 80 10 T 100 10 T 120 10"
                  fill="none"
                  stroke={th.wave}
                  strokeWidth="1.4"
                  opacity={0.7}
                  style={{ transition: "stroke 480ms ease" }}
                />
              </svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Clip colours ───────────────────────────────────────────────────────────
const CLIP_COLORS = [
  "blue",
  "green",
  "violet",
  "red",
  "orange",
  "yellow",
  "cyan",
  "pink",
  "gray",
];

function ClipColoursDemo() {
  const i = useCycleIndex(CLIP_COLORS.length, 1600);
  const waveforms = React.useMemo(
    () => [
      generateSpeechWaveform(2.8, 100),
      generateSpeechWaveform(2.8, 110),
      generateSpeechWaveform(2.8, 120),
    ],
    [],
  );
  return (
    <ThemeProvider theme={darkTheme}>
      <div className="absolute inset-0 flex items-center justify-center gap-3 p-7">
        <div style={{ filter: "drop-shadow(0 10px 18px rgba(0,0,0,0.45))" }}>
          <Clip
            color="blue"
            name="Take 1"
            width={130}
            height={92}
            waveformData={waveforms[0]}
            clipDuration={2.8}
            pixelsPerSecond={46}
            onTrimEdge={() => {}}
          />
        </div>
        <div
          style={{
            filter: "drop-shadow(0 14px 22px rgba(0,0,0,0.55))",
            transition: "transform 240ms ease",
          }}
        >
          <Clip
            color={CLIP_COLORS[i]}
            name="Take 2"
            width={130}
            height={92}
            waveformData={waveforms[1]}
            clipDuration={2.8}
            pixelsPerSecond={46}
            selected
            onTrimEdge={() => {}}
          />
        </div>
        <div style={{ filter: "drop-shadow(0 10px 18px rgba(0,0,0,0.45))" }}>
          <Clip
            color="green"
            name="Take 3"
            width={130}
            height={92}
            waveformData={waveforms[2]}
            clipDuration={2.8}
            pixelsPerSecond={46}
            onTrimEdge={() => {}}
          />
        </div>
      </div>
    </ThemeProvider>
  );
}

// ── Toolbar positioning ────────────────────────────────────────────────────
const POSITIONS = ["top", "bottom", "left", "right"];

function ToolbarPositionDemo() {
  const i = useCycleIndex(POSITIONS.length, 2200);
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
    <div className="absolute inset-0 flex items-center justify-center p-7">
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
      <div className="max-w-[1600px] mx-auto w-full h-full flex flex-col">
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
