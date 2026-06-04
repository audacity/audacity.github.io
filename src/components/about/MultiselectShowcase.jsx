import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  TrackNew,
  ThemeProvider,
  darkTheme,
  generateSpeechWaveform,
} from "@dilsonspickles/components";

const TRACK_GAP = 4;
const PIXELS_PER_SECOND = 55;
const STEP_MS = 1400;

// Vocals: arrangement-style clips (verse / chorus / verse / outro).
const VOCALS_CLIPS = [
  { id: "v1", name: "Verse 1", start: 0.2, duration: 1.8 },
  { id: "v2", name: "Chorus", start: 2.2, duration: 1.8 },
  { id: "v3", name: "Verse 2", start: 4.2, duration: 1.8 },
  { id: "v4", name: "Outro", start: 6.2, duration: 1.4 },
];

// Drums: tighter loops underneath, sitting under the vocal phrases.
const DRUMS_CLIPS = [
  { id: "d1", name: "Loop A", start: 0.2, duration: 1.8 },
  { id: "d2", name: "Loop B", start: 2.2, duration: 1.8 },
  { id: "d3", name: "Loop A", start: 4.2, duration: 1.8 },
  { id: "d4", name: "Fill", start: 6.2, duration: 1.4 },
];

// Selection patterns the animation cycles through. Each step lists the
// clip ids that should appear selected — covering both contiguous
// (shift-click) and non-contiguous (cmd-click) multi-select cases.
const PATTERNS = [
  { vocals: [], drums: [] },
  { vocals: ["v2", "v3"], drums: ["d2", "d3"] },
  { vocals: ["v1", "v3"], drums: [] },
  { vocals: [], drums: ["d1", "d2", "d3"] },
  { vocals: ["v2"], drums: ["d2"] },
];

function MultiselectShowcase() {
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

  const vocals = useMemo(
    () =>
      VOCALS_CLIPS.map((c, i) => ({
        ...c,
        waveform: generateSpeechWaveform(Math.round(c.duration * 4) + i),
      })),
    [],
  );
  const drums = useMemo(
    () =>
      DRUMS_CLIPS.map((c, i) => ({
        ...c,
        waveform: generateSpeechWaveform(Math.round(c.duration * 6) + 30 + i),
      })),
    [],
  );

  const [step, setStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const io = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.05 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!isVisible) return;
    const id = setInterval(() => {
      setStep((s) => (s + 1) % PATTERNS.length);
    }, STEP_MS);
    return () => clearInterval(id);
  }, [isVisible]);

  const pattern = PATTERNS[step];
  const vocalsSelected = new Set(pattern.vocals);
  const drumsSelected = new Set(pattern.drums);

  const trackWidth = Math.max(320, size.width);
  const trackHeight = Math.max(60, Math.floor((size.height - TRACK_GAP) / 2));

  return (
    <ThemeProvider theme={darkTheme}>
      <div ref={containerRef} className="w-full h-full flex flex-col">
        <TrackNew
          clips={vocals.map((c) => ({
            ...c,
            selected: vocalsSelected.has(c.id),
          }))}
          trackIndex={0}
          width={trackWidth}
          height={trackHeight}
          pixelsPerSecond={PIXELS_PER_SECOND}
        />
        <div style={{ height: TRACK_GAP }} />
        <TrackNew
          clips={drums.map((c) => ({
            ...c,
            selected: drumsSelected.has(c.id),
          }))}
          trackIndex={2}
          width={trackWidth}
          height={trackHeight}
          pixelsPerSecond={PIXELS_PER_SECOND}
        />
      </div>
    </ThemeProvider>
  );
}

export default MultiselectShowcase;
