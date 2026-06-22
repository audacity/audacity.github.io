import React, { useEffect, useMemo, useState } from "react";
import {
  TrackControlPanel,
  TrackControlSidePanel,
  TrackNew,
  TimelineRuler,
  PlayheadCursor,
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

// Per-track waveforms for the meters demo — generated once so the clips
// look consistent and aren't regenerated every render. Single-integer
// seed so the function returns a long/dense sample array that TrackNew
// renders as proper waveform peaks (not sparse dots).
const METERS_WAVEFORMS = [
  generateSpeechWaveform(11),
  generateSpeechWaveform(13),
  generateSpeechWaveform(17),
];

function TrackMetersDemo() {
  const { levels, peaks } = useAnimatedLevels();
  // TrackControlPanel.meterLevel* is documented as dB but the component
  // pipes it straight into TrackMeter's `volume` (0–100 percent). Pass
  // the raw 0-96 from useAnimatedLevels so the meter inside the panel
  // actually bounces.
  const tracks = [
    {
      name: "Host",
      type: "stereo",
      color: "cyan",
      clips: [
        {
          id: 1,
          name: "Host",
          start: 0,
          duration: 4.2,
          waveform: METERS_WAVEFORMS[0],
        },
      ],
      l: levels.a,
      r: Math.max(0, levels.a - 4),
      lp: peaks.a,
      rp: Math.max(0, peaks.a - 3),
    },
    {
      name: "Guest",
      type: "stereo",
      color: "violet",
      clips: [
        {
          id: 2,
          name: "Guest",
          start: 0,
          duration: 3.6,
          waveform: METERS_WAVEFORMS[1],
        },
      ],
      l: levels.b,
      r: Math.max(0, levels.b - 5),
      lp: peaks.b,
      rp: Math.max(0, peaks.b - 4),
    },
    {
      name: "Music bed",
      type: "mono",
      color: "magenta",
      clips: [
        {
          id: 3,
          name: "Music bed",
          start: 0,
          duration: 5.0,
          waveform: METERS_WAVEFORMS[2],
        },
      ],
      l: levels.c,
      r: levels.c,
      lp: peaks.c,
      rp: peaks.c,
    },
  ];

  // Replicating WorkspaceCanvas's track-area layout EXACTLY — it has
  // worked for the laptop tour the whole time, no reason to reinvent.
  // Side panel column: 280px wide (matches WorkspaceCanvas's
  // TRACK_CONTROL_W). Each track uses TrackNew inside a fixed-height
  // wrapper that aligns 1:1 with the TrackControlSidePanel row.
  const TRACK_CONTROL_W = 280;
  const RULER_H = 40;
  const CANVAS_W = 760;
  // Taller tracks so the meter inside each TrackControlPanel takes a
  // proper share of the row — these meters are the centre-stage element
  // of this card.
  const trackHeights = tracks.map(() => 200);
  const PPS = 28;

  return (
    <ThemeProvider theme={darkTheme}>
      <style
        dangerouslySetInnerHTML={{
          __html:
            // Rack column fills the example container all the way down,
            // without forcing rows to stretch.
            ".track-meters-demo .track-control-side-panel{height:100%}",
        }}
      />
      <div
        className="track-meters-demo absolute inset-0 bg-[#171F25] overflow-hidden"
        style={{ display: "flex", minHeight: 0 }}
      >
        <div style={{ width: TRACK_CONTROL_W, flexShrink: 0, height: "100%" }}>
          <TrackControlSidePanel trackHeights={trackHeights}>
            {tracks.map((t, i) => (
              <TrackControlPanel
                key={i}
                trackName={t.name}
                trackType={t.type}
                volume={75}
                meterLevel={t.l}
                meterLevelLeft={t.l}
                meterLevelRight={t.r}
                meterRecentPeak={t.lp}
                meterRecentPeakLeft={t.lp}
                meterRecentPeakRight={t.rp}
                meterMaxPeak={Math.min(96, t.lp + 4)}
                meterMaxPeakLeft={Math.min(96, t.lp + 4)}
                meterMaxPeakRight={Math.min(96, t.rp + 4)}
                trackHeight={trackHeights[i]}
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
            totalDuration={20}
            timeFormat="minutes-seconds"
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
                  trackIndex={i}
                  width={CANVAS_W}
                  height={trackHeights[i]}
                  pixelsPerSecond={PPS}
                  color={t.color}
                  onClipTrimEdge={() => {}}
                />
              </div>
            ))}
          </div>
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

// Match WorkspaceCanvas's calling convention — pass a single integer
// "seed" so the function generates a long, dense waveform. Calling with
// (3.2, 100) only produces ~320 samples which TrackNew renders as sparse
// dots; a longer waveform gives the clip a proper dense peak pattern.
const CLIP_HANDLES_WAVEFORM = generateSpeechWaveform(12);

function ClipHandlesDemo() {
  const t = useLoopProgress(8000);
  const PPS = 100;
  const FULL_DURATION = 3.2;
  const RULER_H = 40;
  const CANVAS_W = 720;
  const TRACK_H = 200;
  // Clip pinned at the left; the right edge animates.
  const CLIP_START = 0.4;

  // Two-phase loop: 0-0.5 STRETCH (right edge out + back), 0.5-1 TRIM
  // (right edge in + back).
  let duration = FULL_DURATION;
  let stretchFactor = 1;
  const ease = (u) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);

  if (t < 0.5) {
    const p = t / 0.5;
    if (p < 0.5) {
      stretchFactor = 1 + 0.4 * ease(p * 2);
    } else {
      stretchFactor = 1 + 0.4 * ease((1 - p) * 2);
    }
    duration = FULL_DURATION * stretchFactor;
  } else {
    const p = (t - 0.5) / 0.5;
    if (p < 0.5) {
      duration = FULL_DURATION * (1 - 0.35 * ease(p * 2));
    } else {
      duration = FULL_DURATION * (1 - 0.35 * ease((1 - p) * 2));
    }
  }

  const clips = [
    {
      id: 1,
      name: "Take 2",
      start: CLIP_START,
      duration,
      fullDuration: FULL_DURATION,
      stretchFactor,
      waveform: CLIP_HANDLES_WAVEFORM,
      selected: true,
    },
  ];

  // Cursor sits on the clip's right edge — sells the gesture.
  const cursorX = (CLIP_START + duration) * PPS;
  const cursorY = RULER_H + 2 + TRACK_H / 2;
  const isStretching = t < 0.5;

  return (
    <ThemeProvider theme={darkTheme}>
      <div
        className="absolute inset-0 bg-[#171F25] overflow-hidden"
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
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
          <div style={{ position: "relative", height: TRACK_H }}>
            <TrackNew
              clips={clips}
              trackIndex={0}
              width={CANVAS_W}
              height={TRACK_H}
              pixelsPerSecond={PPS}
              color="green"
              onClipTrimEdge={() => {}}
            />
          </div>
        </div>

        {/* Faux cursor pinned to the clip's right edge. Stretch arrow
            when stretching, east-resize when trimming. */}
        <svg
          aria-hidden
          width="22"
          height="22"
          viewBox="0 0 22 22"
          style={{
            position: "absolute",
            left: cursorX,
            top: cursorY,
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.6))",
          }}
        >
          {isStretching ? (
            <path
              d="M2 11 L7 7 L7 9 L15 9 L15 7 L20 11 L15 15 L15 13 L7 13 L7 15 Z"
              fill="#fff"
              stroke="#0a0a0a"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
          ) : (
            <path
              d="M11 4 L14 7 L12 7 L12 15 L14 15 L11 18 L8 15 L10 15 L10 7 L8 7 Z"
              fill="#fff"
              stroke="#0a0a0a"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
          )}
        </svg>
      </div>
    </ThemeProvider>
  );
}

// A handful of waveforms reused across the demo's tracks.
const LABELS_WAVEFORMS = [
  generateSpeechWaveform(11),
  generateSpeechWaveform(13),
  generateSpeechWaveform(17),
  generateSpeechWaveform(19),
];

function LabelsDemo() {
  const t = useLoopProgress(8000);
  const PPS = 80;
  const CANVAS_W = 720;
  const LABEL_TRACK_H = 50;
  const AUDIO_TRACK_H = 78;

  // Labels mark a song structure — point markers for hits, a region for
  // the chorus. Each appears once the loop reaches its threshold.
  const LABELS = [
    { id: 1, text: "Intro", type: "point", at: 0.05, x: 20 },
    { id: 2, text: "Verse 1", type: "point", at: 0.15, x: 130 },
    { id: 3, text: "Chorus", type: "region", at: 0.32, x: 240, width: 140 },
    { id: 4, text: "Verse 2", type: "point", at: 0.5, x: 410 },
    { id: 5, text: "Bridge", type: "point", at: 0.62, x: 520 },
    { id: 6, text: "Outro", type: "point", at: 0.78, x: 620 },
  ];

  // Multi-track project — vocals, harmonies, drums, music bed — each
  // with multiple clips at different positions, so the labels feel like
  // they're annotating an actual session in progress.
  const TRACKS = [
    {
      name: "Vocals",
      color: "cyan",
      clips: [
        {
          id: 1,
          name: "V1",
          start: 0.2,
          duration: 2.4,
          waveform: LABELS_WAVEFORMS[0],
        },
        {
          id: 2,
          name: "V2",
          start: 3.0,
          duration: 1.8,
          waveform: LABELS_WAVEFORMS[0],
        },
        {
          id: 3,
          name: "V3",
          start: 5.2,
          duration: 2.4,
          waveform: LABELS_WAVEFORMS[0],
        },
      ],
    },
    {
      name: "Harmonies",
      color: "violet",
      clips: [
        {
          id: 10,
          name: "H1",
          start: 3.0,
          duration: 1.8,
          waveform: LABELS_WAVEFORMS[1],
        },
        {
          id: 11,
          name: "H2",
          start: 5.2,
          duration: 2.4,
          waveform: LABELS_WAVEFORMS[1],
        },
      ],
    },
    {
      name: "Drums",
      color: "orange",
      clips: [
        {
          id: 20,
          name: "Loop",
          start: 0.2,
          duration: 7.4,
          waveform: LABELS_WAVEFORMS[2],
        },
      ],
    },
    {
      name: "Music bed",
      color: "magenta",
      clips: [
        {
          id: 30,
          name: "Pad",
          start: 0.5,
          duration: 6.8,
          waveform: LABELS_WAVEFORMS[3],
        },
      ],
    },
  ];

  return (
    <ThemeProvider theme={darkTheme}>
      <div
        className="absolute inset-0 bg-[#171F25] overflow-hidden"
        style={{ display: "flex", flexDirection: "column", minHeight: 0 }}
      >
        <div style={{ flex: 1, paddingTop: 8 }}>
          {/* Label track strip — LabelMarker components reveal one-by-one. */}
          <div
            style={{
              position: "relative",
              height: LABEL_TRACK_H,
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {LABELS.map((l) => {
              const ageT = Math.min(1, Math.max(0, (t - l.at) / 0.05));
              if (ageT <= 0) return null;
              return (
                <div
                  key={l.id}
                  style={{
                    position: "absolute",
                    left: l.x,
                    bottom: 0,
                    opacity: ageT,
                    transform: `translateY(${(1 - ageT) * 8}px)`,
                    transition: "opacity 120ms ease-out",
                  }}
                >
                  <LabelMarker
                    text={l.text}
                    type={l.type}
                    width={l.width}
                    stalkHeight={LABEL_TRACK_H - 14}
                  />
                </div>
              );
            })}
          </div>

          {/* Multi-track session — gives the labels a real project to
              annotate, not just a single clip. */}
          {TRACKS.map((track, i) => (
            <div
              key={i}
              style={{
                position: "relative",
                height: AUDIO_TRACK_H,
                marginTop: 2,
              }}
            >
              <TrackNew
                clips={track.clips}
                trackIndex={i}
                width={CANVAS_W}
                height={AUDIO_TRACK_H}
                pixelsPerSecond={PPS}
                color={track.color}
                onClipTrimEdge={() => {}}
              />
            </div>
          ))}
        </div>
      </div>
    </ThemeProvider>
  );
}

const LOOPING_WAVEFORMS = [
  generateSpeechWaveform(11),
  generateSpeechWaveform(13),
  generateSpeechWaveform(17),
  generateSpeechWaveform(19),
];

function LoopingDemo() {
  const t = useLoopProgress(3500);
  const PPS = 80;
  const CANVAS_W = 720;
  const RULER_H = 40;
  const TRACK_H = 72;

  // Loop region in seconds — sits across the Chorus area of the project.
  const LOOP_START = 3.0;
  const LOOP_END = 5.4;

  // Playhead scrubs from LOOP_START to LOOP_END, then snaps back.
  const playheadTime = LOOP_START + (LOOP_END - LOOP_START) * t;

  // Same shape as the labels project — gives the loop region something
  // real to scrub through.
  const TRACKS = [
    {
      name: "Vocals",
      color: "cyan",
      clips: [
        {
          id: 1,
          name: "V1",
          start: 0.2,
          duration: 2.4,
          waveform: LOOPING_WAVEFORMS[0],
        },
        {
          id: 2,
          name: "V2",
          start: 3.0,
          duration: 1.8,
          waveform: LOOPING_WAVEFORMS[0],
        },
        {
          id: 3,
          name: "V3",
          start: 5.2,
          duration: 2.4,
          waveform: LOOPING_WAVEFORMS[0],
        },
      ],
    },
    {
      name: "Harmonies",
      color: "violet",
      clips: [
        {
          id: 10,
          name: "H1",
          start: 3.0,
          duration: 1.8,
          waveform: LOOPING_WAVEFORMS[1],
        },
        {
          id: 11,
          name: "H2",
          start: 5.2,
          duration: 2.4,
          waveform: LOOPING_WAVEFORMS[1],
        },
      ],
    },
    {
      name: "Drums",
      color: "orange",
      clips: [
        {
          id: 20,
          name: "Loop",
          start: 0.2,
          duration: 7.4,
          waveform: LOOPING_WAVEFORMS[2],
        },
      ],
    },
    {
      name: "Music bed",
      color: "magenta",
      clips: [
        {
          id: 30,
          name: "Pad",
          start: 0.5,
          duration: 6.8,
          waveform: LOOPING_WAVEFORMS[3],
        },
      ],
    },
  ];

  return (
    <ThemeProvider theme={darkTheme}>
      <div
        className="absolute inset-0 bg-[#171F25] overflow-hidden"
        style={{ display: "flex", flexDirection: "column", minHeight: 0 }}
      >
        {/* TimelineRuler with the loop region drawn in — the design
            system component renders the loop bracket natively. */}
        <TimelineRuler
          width={CANVAS_W}
          height={RULER_H}
          pixelsPerSecond={PPS}
          totalDuration={CANVAS_W / PPS}
          timeFormat="minutes-seconds"
          loopRegionEnabled
          loopRegionStart={LOOP_START}
          loopRegionEnd={LOOP_END}
        />
        <div style={{ flex: 1, position: "relative", paddingTop: 2 }}>
          {TRACKS.map((track, i) => (
            <div
              key={i}
              style={{
                position: "relative",
                height: TRACK_H,
                marginTop: i === 0 ? 0 : 2,
              }}
            >
              <TrackNew
                clips={track.clips}
                trackIndex={i}
                width={CANVAS_W}
                height={TRACK_H}
                pixelsPerSecond={PPS}
                color={track.color}
                onClipTrimEdge={() => {}}
              />
            </div>
          ))}

          {/* Loop region edge stalks — thin white verticals at the
              loop start and end positions running from the top of the
              card all the way down. */}
          {[LOOP_START, LOOP_END].map((time) => (
            <div
              key={time}
              style={{
                position: "absolute",
                left: time * PPS,
                top: -RULER_H - 2,
                bottom: 0,
                width: 1,
                background: "rgba(255, 255, 255, 0.55)",
                pointerEvents: "none",
              }}
            />
          ))}

          {/* Design system PlayheadCursor — icon in the ruler stays,
              stalk runs to the bottom of the card; overflow:hidden
              clips the overshoot. */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              pointerEvents: "none",
            }}
          >
            <PlayheadCursor
              position={playheadTime}
              pixelsPerSecond={PPS}
              height={9999}
              showTopIcon
            />
          </div>
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
