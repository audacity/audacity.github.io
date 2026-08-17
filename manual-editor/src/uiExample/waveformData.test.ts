import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  CLIP_WAVEFORM_LEFT,
  CLIP_WAVEFORM_MONO,
  CLIP_WAVEFORM_RIGHT,
} from "../../../src/components/manual/UIExample/waveformData";

const arrays = {
  CLIP_WAVEFORM_MONO,
  CLIP_WAVEFORM_LEFT,
  CLIP_WAVEFORM_RIGHT,
};

test("every waveform array is non-trivial and normalized to -1..1", () => {
  for (const [name, arr] of Object.entries(arrays)) {
    expect(arr.length).toBeGreaterThanOrEqual(400);
    expect(arr.every((s) => s >= -1 && s <= 1)).toBe(true);
    // A waveform, not a flatline: some samples carry real amplitude.
    expect(arr.some((s) => Math.abs(s) > 0.2)).toBe(true);
    void name;
  }
});

test("the committed file carries the GENERATED header (regeneration contract)", () => {
  const file = readFileSync(
    fileURLToPath(
      new URL(
        "../../../src/components/manual/UIExample/waveformData.ts",
        import.meta.url,
      ),
    ),
    "utf8",
  );
  expect(file).toContain("GENERATED");
  expect(file).toContain("scripts/generate-ui-example-waveforms.ts");
});
