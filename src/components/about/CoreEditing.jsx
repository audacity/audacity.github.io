import React, { useEffect, useMemo, useState } from "react";
import {
  TrackMeter,
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
      // Three independent quasi-rhythmic signals
      const a =
        50 +
        24 * Math.sin(t * 4.2 + seed) +
        18 * Math.sin(t * 11.3 + seed * 2) +
        10 * Math.abs(Math.sin(t * 1.7));
      const b =
        42 +
        20 * Math.sin(t * 3.1 + seed + 1) +
        14 * Math.sin(t * 9.0 + seed) +
        8 * Math.abs(Math.cos(t * 2.4));
      const c = 35 + 18 * Math.sin(t * 2.6 + seed + 2) + 12 * Math.sin(t * 7.5);
      const clamp = (n) => Math.max(0, Math.min(96, n));
      const next = { a: clamp(a), b: clamp(b), c: clamp(c) };
      setLevels(next);
      setPeaks((prev) => ({
        a: Math.max(next.a, prev.a - 0.4),
        b: Math.max(next.b, prev.b - 0.4),
        c: Math.max(next.c, prev.c - 0.4),
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
  return (
    <ThemeProvider theme={darkTheme}>
      <div className="absolute inset-0 flex items-center justify-center gap-8 p-7">
        <div className="flex flex-col items-center gap-3">
          <div
            style={{
              height: 220,
              display: "flex",
              alignItems: "stretch",
            }}
          >
            <TrackMeter
              variant="stereo"
              volume={levels.a}
              recentPeak={peaks.a}
              maxPeak={Math.min(96, peaks.a + 6)}
            />
            <div style={{ width: 2 }} />
            <TrackMeter
              variant="stereo"
              volume={Math.max(0, levels.a - 6)}
              recentPeak={Math.max(0, peaks.a - 4)}
              maxPeak={Math.min(96, peaks.a + 4)}
            />
          </div>
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-text-contrast/45">
            Host
          </span>
        </div>
        <div className="flex flex-col items-center gap-3">
          <div
            style={{
              height: 220,
              display: "flex",
              alignItems: "stretch",
            }}
          >
            <TrackMeter
              variant="stereo"
              volume={levels.b}
              recentPeak={peaks.b}
              maxPeak={Math.min(96, peaks.b + 6)}
            />
            <div style={{ width: 2 }} />
            <TrackMeter
              variant="stereo"
              volume={Math.max(0, levels.b - 4)}
              recentPeak={Math.max(0, peaks.b - 3)}
              maxPeak={Math.min(96, peaks.b + 4)}
            />
          </div>
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-text-contrast/45">
            Guest
          </span>
        </div>
        <div className="flex flex-col items-center gap-3">
          <div
            style={{
              height: 220,
              display: "flex",
              alignItems: "stretch",
            }}
          >
            <TrackMeter
              variant="mono"
              volume={levels.c}
              recentPeak={peaks.c}
              maxPeak={Math.min(96, peaks.c + 6)}
            />
          </div>
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-text-contrast/45">
            Music
          </span>
        </div>
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
    <ThemeProvider theme={darkTheme}>
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ padding: "0 28px" }}
      >
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: 110,
          }}
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
      </div>
    </ThemeProvider>
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
                className="flex-1 min-h-0 rounded-2xl border border-white/10 bg-[rgb(8,9,16)] relative overflow-hidden"
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
