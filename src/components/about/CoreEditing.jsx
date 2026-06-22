import React, { useEffect, useMemo, useState } from "react";
import {
  TrackMeter,
  TrackControlPanel,
  Clip,
  LabelMarker,
  TransportButton,
  ToggleToolButton,
  ThemeProvider,
  darkTheme,
  generateSpeechWaveform,
  generateSineWave,
} from "@dilsonspickles/components";
import "@dilsonspickles/components/style.css";

function useAnimatedLevels(seed = 0) {
  const [levels, setLevels] = useState({ a: 30, b: 25, c: 18 });
  const [peaks, setPeaks] = useState({ a: 60, b: 50, c: 40 });

  useEffect(() => {
    let raf;
    const t0 = performance.now();
    const tick = (now) => {
      const t = (now - t0) / 1000;
      // Three independent quasi-rhythmic signals. Wider amplitude + spikier
      // transient term so the meters visibly bounce on transients rather
      // than just drifting around a middle value.
      const spike = (freq, depth) =>
        depth * Math.pow(Math.max(0, Math.sin(t * freq + seed)), 6);
      const a =
        55 +
        28 * Math.sin(t * 4.2 + seed) +
        14 * Math.sin(t * 11.3 + seed * 2) +
        spike(2.3, 30);
      const b =
        48 +
        24 * Math.sin(t * 3.1 + seed + 1) +
        16 * Math.sin(t * 9.0 + seed) +
        spike(1.7, 26);
      const c =
        42 +
        20 * Math.sin(t * 2.6 + seed + 2) +
        14 * Math.sin(t * 7.5) +
        spike(1.2, 22);
      const clamp = (n) => Math.max(0, Math.min(96, n));
      const next = { a: clamp(a), b: clamp(b), c: clamp(c) };
      setLevels(next);
      setPeaks((prev) => ({
        a: Math.max(next.a, prev.a - 0.6),
        b: Math.max(next.b, prev.b - 0.6),
        c: Math.max(next.c, prev.c - 0.6),
      }));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seed]);

  return { levels, peaks };
}

function TrackMetersDemo() {
  const { levels, peaks } = useAnimatedLevels();
  // useAnimatedLevels speaks in a 0-96 dial; TrackControlPanel meters want
  // dB. Map linearly into a useful playback range (-48 dB silence-ish → 0 dB
  // hot) so the meter bar lives in its expressive zone.
  const toDb = (v) => -48 + (Math.max(0, Math.min(96, v)) / 96) * 48;
  const tracks = [
    {
      name: "Host",
      type: "stereo",
      l: levels.a,
      r: Math.max(0, levels.a - 4),
      lp: peaks.a,
      rp: Math.max(0, peaks.a - 3),
    },
    {
      name: "Guest",
      type: "stereo",
      l: levels.b,
      r: Math.max(0, levels.b - 5),
      lp: peaks.b,
      rp: Math.max(0, peaks.b - 4),
    },
    {
      name: "Music bed",
      type: "mono",
      l: levels.c,
      r: levels.c,
      lp: peaks.c,
      rp: peaks.c,
    },
  ];

  return (
    <ThemeProvider theme={darkTheme}>
      <div className="absolute inset-0 flex flex-col gap-px bg-[rgb(11,13,22)] overflow-hidden">
        {tracks.map((t, i) => (
          <div key={i} className="flex items-stretch bg-white/[0.02]">
            <div className="shrink-0">
              <TrackControlPanel
                trackName={t.name}
                trackType={t.type}
                volume={75}
                meterLevelLeft={toDb(t.l)}
                meterLevelRight={toDb(t.r)}
                meterRecentPeakLeft={toDb(t.lp)}
                meterRecentPeakRight={toDb(t.rp)}
                trackHeight={112}
              />
            </div>

            {/* Prominent meter — the bouncing bars ARE the demo, so we
                surface a full-height TrackMeter right next to the
                control panel where it can't be missed. */}
            <div
              className="shrink-0 flex items-stretch py-2 pl-1 pr-2"
              aria-hidden
            >
              <TrackMeter
                variant={t.type === "mono" ? "mono" : "stereo"}
                volume={t.l}
                recentPeak={t.lp}
                maxPeak={Math.min(96, t.lp + 4)}
              />
              {t.type !== "mono" && (
                <>
                  <div style={{ width: 2 }} />
                  <TrackMeter
                    variant="stereo"
                    volume={t.r}
                    recentPeak={t.rp}
                    maxPeak={Math.min(96, t.rp + 4)}
                  />
                </>
              )}
            </div>

            {/* Sliver of canvas to the right — gives the meters context
                as actual tracks with audio. Static cosmetic clip + fake
                waveform; the meters do the moving. */}
            <div
              className="flex-1 relative"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(90deg, transparent 0 40px, rgba(255,255,255,0.05) 40px 41px)",
              }}
            >
              <div
                className="absolute inset-y-3 left-3 rounded-md"
                style={{
                  width: `${60 + i * 12}%`,
                  background:
                    i === 2
                      ? "linear-gradient(180deg, rgba(255,150,200,0.32), rgba(255,150,200,0.12))"
                      : "linear-gradient(180deg, rgba(150,210,255,0.32), rgba(150,210,255,0.12))",
                  border:
                    i === 2
                      ? "1px solid rgba(255,150,200,0.42)"
                      : "1px solid rgba(150,210,255,0.42)",
                }}
              >
                <svg
                  viewBox="0 0 400 80"
                  preserveAspectRatio="none"
                  className="absolute inset-0 w-full h-full opacity-70"
                  aria-hidden
                >
                  {Array.from({ length: 80 }).map((_, j) => {
                    const x = (j / 80) * 400;
                    const h = 8 + (Math.sin(j * 0.5 + i) * 0.5 + 0.5) * 60;
                    return (
                      <rect
                        key={j}
                        x={x}
                        y={40 - h / 2}
                        width={3}
                        height={h}
                        fill={i === 2 ? "#ff96c8" : "#96d2ff"}
                      />
                    );
                  })}
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ThemeProvider>
  );
}

function useLoopProgress(durationMs = 5000) {
  const [t, setT] = useState(0);
  useEffect(() => {
    let raf;
    const t0 = performance.now();
    const tick = (now) => {
      setT(((now - t0) % durationMs) / durationMs);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [durationMs]);
  return t;
}

/*
  Wraps a demo in a simplified track-on-canvas chrome: a ruler/track-name
  bar at the top, a track head on the left, and a gridded lane area where
  the demo content lives — so the animation reads as something happening
  inside Audacity, not floating on a card.
*/
function TrackLane({ name = "Audio 1", children }) {
  return (
    <ThemeProvider theme={darkTheme}>
      <div className="absolute inset-0 flex flex-col bg-[rgb(11,13,22)]">
        {/* Ruler bar */}
        <div
          className="h-5 shrink-0 border-b border-white/[0.06]"
          style={{
            background:
              "repeating-linear-gradient(90deg, transparent 0 40px, rgba(255,255,255,0.12) 40px 41px)",
          }}
        />

        {/* Track row: head + lane */}
        <div className="flex-1 flex min-h-0">
          {/* Track head */}
          <div className="w-[120px] shrink-0 border-r border-white/[0.06] bg-white/[0.02] px-3 py-3 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-text-contrast/55">
                {name}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded bg-white/[0.06]" />
              <span className="w-5 h-5 rounded bg-white/[0.06]" />
            </div>
            <div className="h-[3px] rounded bg-white/[0.06] mt-1">
              <div
                className="h-full rounded bg-white/30"
                style={{ width: "70%" }}
              />
            </div>
          </div>

          {/* Lane */}
          <div
            className="flex-1 relative"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, transparent 0 40px, rgba(255,255,255,0.05) 40px 41px)",
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}

function ClipHandlesDemo() {
  const t = useLoopProgress(6000);
  const waveform = useMemo(() => generateSpeechWaveform(3.2, 100), []);
  const PPS = 80;
  const FULL_DURATION = 3.2;
  const FULL_WIDTH = FULL_DURATION * PPS;

  // Two-phase loop: 0-0.5 trim cycle, 0.5-1 stretch cycle
  let width = FULL_WIDTH;
  let stretchFactor = 1;
  const ease = (u) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);

  if (t < 0.5) {
    // trim: full → 65% → full
    const p = t / 0.5;
    if (p < 0.5) {
      width = FULL_WIDTH * (1 - 0.35 * ease(p * 2));
    } else {
      width = FULL_WIDTH * (1 - 0.35 * ease((1 - p) * 2));
    }
  } else {
    // stretch: 1.0x → 1.4x → 1.0x
    const p = (t - 0.5) / 0.5;
    if (p < 0.5) {
      stretchFactor = 1 + 0.4 * ease(p * 2);
    } else {
      stretchFactor = 1 + 0.4 * ease((1 - p) * 2);
    }
    width = FULL_WIDTH * stretchFactor;
  }

  return (
    <TrackLane name="Vocals">
      <div
        className="absolute inset-0 flex items-center"
        style={{ paddingLeft: 18 }}
      >
        <Clip
          color="green"
          name="Take 2"
          width={width}
          height={110}
          waveformData={waveform}
          selected
          clipDuration={FULL_DURATION}
          clipFullDuration={FULL_DURATION}
          clipStretchFactor={stretchFactor}
          pixelsPerSecond={PPS}
          onTrimEdge={() => {}}
          onStretchEdge={() => {}}
        />
      </div>
    </TrackLane>
  );
}

function LabelsDemo() {
  const t = useLoopProgress(8000);
  const labels = [
    { text: "Intro", at: 0.05, type: "point", x: 24 },
    { text: "Hook", at: 0.18, type: "point", x: 130 },
    { text: "Chorus", at: 0.32, type: "region", x: 200, w: 90 },
    { text: "Verse", at: 0.5, type: "point", x: 320 },
  ];
  const visible = labels.filter((l) => t >= l.at);

  return (
    <ThemeProvider theme={darkTheme}>
      <div
        className="absolute inset-0 flex items-center"
        style={{ padding: "0 28px" }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            height: 80,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: "50%",
              height: 1,
              background: "rgba(255,255,255,0.15)",
            }}
          />
          {visible.map((l, i) => {
            const ageT = Math.min(1, (t - l.at) / 0.05);
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: l.x,
                  top: "50%",
                  transform: `translateY(-50%) scale(${0.6 + 0.4 * ageT})`,
                  opacity: ageT,
                  transition: "opacity 120ms ease-out",
                }}
              >
                <LabelMarker
                  text={l.text}
                  type={l.type}
                  width={l.w}
                  stalkHeight={26}
                />
              </div>
            );
          })}
        </div>
      </div>
    </ThemeProvider>
  );
}

function LoopingDemo() {
  const t = useLoopProgress(4000);
  const REGION_LEFT = 90;
  const REGION_WIDTH = 200;
  const playheadX = REGION_LEFT + REGION_WIDTH * t;
  const waveform = useMemo(() => generateSineWave(4.0, 8), []);

  return (
    <ThemeProvider theme={darkTheme}>
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ padding: "0 28px", flexDirection: "column", gap: 16 }}
      >
        <div
          style={{
            display: "flex",
            gap: 6,
            alignItems: "center",
          }}
        >
          <ToggleToolButton icon="loop" isActive ariaLabel="Loop" />
          <span
            className="font-mono text-xs tracking-[0.2em] uppercase text-text-contrast/60"
            style={{ marginLeft: 10 }}
          >
            Loop on
          </span>
        </div>
        <div
          style={{
            position: "relative",
            width: 360,
            height: 84,
          }}
        >
          <Clip
            color="cyan"
            name="Take 1"
            width={360}
            height={84}
            waveformData={waveform}
            clipDuration={4.0}
            pixelsPerSecond={90}
            onTrimEdge={() => {}}
          />
          {/* Loop range overlay */}
          <div
            style={{
              position: "absolute",
              left: REGION_LEFT,
              top: -6,
              width: REGION_WIDTH,
              height: 96,
              border: "1.5px solid #FACC15",
              borderRadius: 4,
              background: "rgba(250, 204, 21, 0.08)",
              pointerEvents: "none",
            }}
          />
          {/* Playhead bouncing within loop */}
          <div
            style={{
              position: "absolute",
              left: playheadX,
              top: -6,
              width: 2,
              height: 96,
              background: "#F87171",
              boxShadow: "0 0 8px rgba(248, 113, 113, 0.6)",
              pointerEvents: "none",
            }}
          />
        </div>
      </div>
    </ThemeProvider>
  );
}

function SampleEditingDemo() {
  const t = useLoopProgress(5000);
  // 24 sample dots arranged across; one of them gets dragged up and back
  const SAMPLE_COUNT = 24;
  const dragIdx = 14;
  const targetT = Math.sin(t * Math.PI * 2) * 0.5 + 0.5; // 0→1→0
  // baseline values
  const samples = Array.from({ length: SAMPLE_COUNT }, (_, i) => {
    if (i === dragIdx) {
      return -0.35 - targetT * 0.4; // dragged sample moves up
    }
    return Math.sin(i * 0.55) * 0.28 + Math.cos(i * 0.31) * 0.12;
  });

  return (
    <ThemeProvider theme={darkTheme}>
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ padding: "0 28px" }}
      >
        <div
          style={{
            position: "relative",
            width: 340,
            height: 200,
            background: "linear-gradient(180deg, #0f1419 0%, #0a0d12 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          {/* zero line */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: "50%",
              height: 1,
              background: "rgba(255,255,255,0.15)",
            }}
          />
          {/* sample dots and connecting line */}
          <svg
            width={340}
            height={200}
            style={{ position: "absolute", inset: 0 }}
          >
            <polyline
              points={samples
                .map(
                  (s, i) =>
                    `${(i + 0.5) * (340 / SAMPLE_COUNT)},${100 + s * 80}`,
                )
                .join(" ")}
              fill="none"
              stroke="#7CC4FF"
              strokeWidth="1.5"
              opacity="0.6"
            />
            {samples.map((s, i) => {
              const x = (i + 0.5) * (340 / SAMPLE_COUNT);
              const y = 100 + s * 80;
              const isDragged = i === dragIdx;
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r={isDragged ? 5 : 3.5}
                  fill={isDragged ? "#FBBF24" : "#7CC4FF"}
                  stroke={isDragged ? "#FBBF24" : "none"}
                  strokeWidth={isDragged ? 2 : 0}
                />
              );
            })}
          </svg>
        </div>
      </div>
    </ThemeProvider>
  );
}

const CARDS = [
  {
    id: "clip-handles",
    eyebrow: "Clip handles",
    title: "Trim or stretch, same gesture",
    description:
      "Grab a handle on either edge of a clip. Drag to trim, or hold to time-stretch — the source is always there if you change your mind.",
    Demo: ClipHandlesDemo,
  },
  {
    id: "track-meters",
    eyebrow: "Track meters",
    title: "See every level at a glance",
    description:
      "Per-track meters next to every channel and a master meter in the transport — peaks held, recents shown, calibrated to dBFS.",
    Demo: TrackMetersDemo,
  },
  {
    id: "labels",
    eyebrow: "Label tracks",
    title: "Mark up your project",
    description:
      "Drop labels on the timeline to mark takes, edits or sections. They travel with the audio and survive every move.",
    Demo: LabelsDemo,
  },
  {
    id: "looping",
    eyebrow: "Looping",
    title: "Loop any region, instantly",
    description:
      "Set a loop range with two clicks and iterate. The range stays visible and you can drag the edges to refine without losing your place.",
    Demo: LoopingDemo,
  },
  {
    id: "sample-editing",
    eyebrow: "Sample editing",
    title: "Zoom in, edit samples directly",
    description:
      "No mode to enter, no setting to flip. Zoom all the way in and Audacity hands you the samples — drag them by hand and zoom back out.",
    Demo: SampleEditingDemo,
  },
];

function CoreEditing() {
  return (
    <section className="bg-background-dark core-editing-section">
      <div className="max-w-screen-xl mx-auto px-6 lg:px-10 shrink-0">
        <header className="max-w-3xl">
          <div
            className="font-mono text-sm tracking-[0.2em] uppercase text-text-contrast/40"
            aria-hidden
          >
            Also
          </div>
          <h2 className="mt-4 font-harmony text-text-contrast text-4xl md:text-5xl lg:text-6xl leading-[1.05]">
            Hundreds of smaller things
          </h2>
          <p className="mt-5 text-text-contrast/70 text-base md:text-lg max-w-2xl">
            We've touched almost every corner of the app. Here are a few you'll
            run into in your first session.
          </p>
        </header>
      </div>

      <div className="mt-8 lg:mt-10 flex-1 min-h-0 flex">
        <ul
          className="flex items-stretch gap-5 lg:gap-7 overflow-x-auto snap-x snap-mandatory px-6 lg:px-10 scrollbar-hide w-full"
          style={{
            scrollPaddingLeft: "calc((100vw - min(100vw, 80rem)) / 2 + 1.5rem)",
          }}
        >
          {CARDS.map((card) => (
            <li
              key={card.id}
              className="snap-start shrink-0 w-[min(82vw,420px)] flex flex-col"
            >
              <div
                className="flex-1 min-h-0 rounded-2xl border border-white/10 bg-[rgb(20,16,56)] relative overflow-hidden"
                aria-hidden
              >
                {card.Demo ? (
                  <card.Demo />
                ) : (
                  <div className="absolute inset-0 flex items-end p-7">
                    <div className="font-mono text-xs tracking-[0.2em] uppercase text-text-contrast/50">
                      {card.eyebrow}
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-5 px-1 shrink-0 card-text-block">
                <h3 className="font-harmony text-text-contrast text-xl md:text-2xl leading-[1.1]">
                  {card.title}
                </h3>
                <p className="mt-2 text-text-contrast/65 text-sm md:text-base leading-relaxed">
                  {card.description}
                </p>
              </div>
            </li>
          ))}
          <li
            aria-hidden
            className="shrink-0 w-6 lg:w-10"
            style={{ scrollSnapAlign: "none" }}
          />
        </ul>
      </div>

      <style>{`
        .core-editing-section {
          height: 100vh;
          min-height: 100vh !important;
          max-height: 100vh;
          display: flex !important;
          flex-direction: column;
          justify-content: center !important;
          padding-top: 6vh;
          padding-bottom: 6vh;
          gap: 0;
          scroll-snap-align: start;
          scroll-snap-stop: normal;
        }
        .core-editing-section .card-text-block {
          min-height: 132px;
        }
        @media (min-width: 768px) {
          .core-editing-section .card-text-block {
            min-height: 148px;
          }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { scrollbar-width: none; }
      `}</style>
    </section>
  );
}

export default CoreEditing;
