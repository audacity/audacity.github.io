import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  TrackNew,
  Clip,
  ThemeProvider,
  darkTheme,
  generateSpeechWaveform,
} from "@dilsonspickles/components";

const TRACK_GAP = 4;
const PIXELS_PER_SECOND = 60;
const CLIP_CONTENT_OFFSET = 12;

const PHASES = [
  { name: "before", duration: 1500 },
  { name: "dropping", duration: 1300 },
  { name: "after", duration: 2400 },
];

const DROP_START = 2.4;
const DROP_DURATION = 1.8;
const HOST_START = 0.4;
const HOST_END = 6.8;

const HOST_INTACT = [
  {
    id: "host",
    name: "Vocal take",
    start: HOST_START,
    duration: HOST_END - HOST_START,
  },
];

const HOST_SPLIT = [
  {
    id: "left",
    name: "Vocal take",
    start: HOST_START,
    duration: DROP_START - HOST_START,
  },
  {
    id: "drop",
    name: "Bridge",
    start: DROP_START,
    duration: DROP_DURATION,
    selected: true,
  },
  {
    id: "right",
    name: "Vocal take",
    start: DROP_START + DROP_DURATION,
    duration: HOST_END - (DROP_START + DROP_DURATION),
  },
];

const DRUMS = [
  { id: "d1", name: "Loop A", start: 0.4, duration: 1.8 },
  { id: "d2", name: "Loop A", start: 2.4, duration: 1.8 },
  { id: "d3", name: "Loop B", start: 4.4, duration: 1.6 },
  { id: "d4", name: "Fill", start: 6.2, duration: 0.6 },
];

const DROP_ANIM = `
@keyframes drop-and-trim-slide-in {
  0%   { transform: translateX(800px); opacity: 0; }
  100% { transform: translateX(0);     opacity: 0.92; }
}
`;

function DropAndTrimShowcase() {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 400, height: 240 });

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        setSize({
          width: Math.floor(e.contentRect.width),
          height: Math.floor(e.contentRect.height),
        });
      }
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  const hostIntact = useMemo(
    () =>
      HOST_INTACT.map((c, i) => ({
        ...c,
        waveform: generateSpeechWaveform(Math.round(c.duration * 4) + i),
      })),
    [],
  );

  const hostSplit = useMemo(
    () =>
      HOST_SPLIT.map((c, i) => ({
        ...c,
        waveform: generateSpeechWaveform(Math.round(c.duration * 4) + i + 4),
      })),
    [],
  );

  const drums = useMemo(
    () =>
      DRUMS.map((c, i) => ({
        ...c,
        waveform: generateSpeechWaveform(Math.round(c.duration * 6) + 30 + i),
      })),
    [],
  );

  const dropWave = useMemo(
    () => generateSpeechWaveform(Math.round(DROP_DURATION * 4) + 8),
    [],
  );

  const [phaseIdx, setPhaseIdx] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      setPhaseIdx((p) => (p + 1) % PHASES.length);
    }, PHASES[phaseIdx].duration);
    return () => clearTimeout(t);
  }, [phaseIdx]);

  const phaseName = PHASES[phaseIdx].name;
  const trackWidth = Math.max(320, size.width);
  const trackHeight = Math.max(60, Math.floor((size.height - TRACK_GAP) / 2));

  const ghostLeft = CLIP_CONTENT_OFFSET + DROP_START * PIXELS_PER_SECOND;
  const ghostWidth = DROP_DURATION * PIXELS_PER_SECOND;

  return (
    <ThemeProvider theme={darkTheme}>
      <style dangerouslySetInnerHTML={{ __html: DROP_ANIM }} />
      <div ref={containerRef} className="w-full h-full flex flex-col">
        <div style={{ position: "relative" }}>
          <TrackNew
            clips={phaseName === "after" ? hostSplit : hostIntact}
            trackIndex={0}
            width={trackWidth}
            height={trackHeight}
            pixelsPerSecond={PIXELS_PER_SECOND}
          />
          {phaseName === "dropping" && (
            <div
              key="ghost"
              style={{
                position: "absolute",
                top: 0,
                left: ghostLeft,
                width: ghostWidth,
                height: trackHeight,
                pointerEvents: "none",
                zIndex: 20,
                animation:
                  "drop-and-trim-slide-in 700ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
              }}
            >
              <Clip
                name="Bridge"
                color="violet"
                selected
                width={ghostWidth}
                height={trackHeight}
                variant="waveform"
                channelMode="mono"
                waveformData={dropWave}
              />
            </div>
          )}
        </div>
        <div style={{ height: TRACK_GAP }} />
        <TrackNew
          clips={drums}
          trackIndex={2}
          width={trackWidth}
          height={trackHeight}
          pixelsPerSecond={PIXELS_PER_SECOND}
        />
      </div>
    </ThemeProvider>
  );
}

export default DropAndTrimShowcase;
