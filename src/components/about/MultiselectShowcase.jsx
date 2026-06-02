import React, { useEffect, useMemo, useState } from "react";
import {
  Track,
  ThemeProvider,
  darkTheme,
  generateSpeechWaveform,
} from "@dilsonspickles/components";

const TRACK_WIDTH = 540;
const TRACK_HEIGHT = 140;
const PIXELS_PER_SECOND = 100;
const STEP_MS = 900;

const BASE_CLIPS = [
  { id: "a", name: "Verse", start: 0.1, duration: 1.5 },
  { id: "b", name: "Chorus", start: 1.9, duration: 1.6 },
  { id: "c", name: "Bridge", start: 3.7, duration: 1.7 },
];

function MultiselectShowcase() {
  const clipsWithWaveforms = useMemo(
    () =>
      BASE_CLIPS.map((clip, i) => ({
        ...clip,
        waveform: generateSpeechWaveform(
          Math.max(2, Math.round(clip.duration * 4)) + i,
        ),
      })),
    [],
  );

  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setStep((s) => (s + 1) % 5);
    }, STEP_MS);
    return () => clearInterval(id);
  }, []);

  const selectedCount = step <= 3 ? step : 0;

  const clips = clipsWithWaveforms.map((clip, i) => ({
    ...clip,
    selected: i < selectedCount,
  }));

  return (
    <ThemeProvider theme={darkTheme}>
      <div className="w-full h-full flex items-center justify-center px-3">
        <Track
          clips={clips}
          trackIndex={0}
          width={TRACK_WIDTH}
          height={TRACK_HEIGHT}
          pixelsPerSecond={PIXELS_PER_SECOND}
        />
      </div>
    </ThemeProvider>
  );
}

export default MultiselectShowcase;
