import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Clip,
  ThemeProvider,
  darkTheme,
  generateSpeechWaveform,
} from "@dilsonspickles/components";

const PHASES = [
  { edge: "right", from: 1, to: 1, duration: 700 },
  { edge: "right", from: 1, to: 0.62, duration: 1000 },
  { edge: "right", from: 0.62, to: 0.62, duration: 600 },
  { edge: "right", from: 0.62, to: 1, duration: 800 },
  { edge: "left", from: 1, to: 1, duration: 500 },
  { edge: "left", from: 1, to: 0.62, duration: 1000 },
  { edge: "left", from: 0.62, to: 0.62, duration: 600 },
  { edge: "left", from: 0.62, to: 1, duration: 800 },
];

const easeInOut = (t) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

function ClipShowcase({
  color = "cyan",
  name = "Audio clip",
  width = 420,
  height = 220,
}) {
  const waveformData = useMemo(() => generateSpeechWaveform(8), []);
  const waveformDataRms = useMemo(
    () => waveformData.map((v) => v * 0.6),
    [waveformData],
  );

  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [scale, setScale] = useState(1);
  const [edge, setEdge] = useState("right");

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
    let raf;
    let phaseIdx = 0;
    let phaseStart = performance.now();
    const tick = (now) => {
      const phase = PHASES[phaseIdx];
      const elapsed = now - phaseStart;
      const t = Math.min(1, elapsed / phase.duration);
      const value = phase.from + (phase.to - phase.from) * easeInOut(t);
      setScale(value);
      setEdge(phase.edge);
      if (t >= 1) {
        phaseIdx = (phaseIdx + 1) % PHASES.length;
        phaseStart = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isVisible]);

  const animatedWidth = Math.max(80, Math.round(width * scale));

  return (
    <ThemeProvider theme={darkTheme}>
      <div
        ref={containerRef}
        className="w-full h-full flex items-center justify-center"
      >
        <div
          style={{
            width,
            height,
            display: "flex",
            alignItems: "center",
            justifyContent: edge === "right" ? "flex-start" : "flex-end",
          }}
        >
          <Clip
            color={color}
            name={name}
            selected
            width={animatedWidth}
            height={height}
            variant="waveform"
            channelMode="mono"
            waveformData={waveformData}
            waveformDataRms={waveformDataRms}
            onTrimEdge={() => {}}
          />
        </div>
      </div>
    </ThemeProvider>
  );
}

export default ClipShowcase;
