import React, { useMemo } from "react";
import {
  Clip,
  ThemeProvider,
  darkTheme,
  generateSpeechWaveform,
} from "@dilsonspickles/components";

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

  return (
    <ThemeProvider theme={darkTheme}>
      <div className="w-full h-full flex items-center justify-center">
        <Clip
          color={color}
          name={name}
          width={width}
          height={height}
          variant="waveform"
          channelMode="mono"
          waveformData={waveformData}
          waveformDataRms={waveformDataRms}
        />
      </div>
    </ThemeProvider>
  );
}

export default ClipShowcase;
