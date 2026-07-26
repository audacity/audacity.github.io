/**
 * Generates the committed waveform sample arrays for the manual editor's
 * Clip UI example (`src/components/manual/UIExample/waveformData.ts`).
 *
 * Deterministic on purpose (seeded PRNG): the docs' waveforms stay
 * byte-identical across regenerations unless a seed or shape parameter is
 * deliberately changed. Deliberately does NOT use the design-system
 * package's own generators: they are exported only from the package index,
 * whose CSS side-effect imports neither bun nor our bundle rules tolerate.
 * If the DS ever ships a `utils` subpath export, this script may switch to
 * `generateSpeechWaveform` — see the Clip UI example spec.
 *
 * Run: `bun scripts/generate-ui-example-waveforms.ts`
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SAMPLES = 800;

/** Mulberry32 — tiny deterministic PRNG, good enough for demo waveforms. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Speech-like bursts: voiced bursts (sine-shaped attack/decay envelope over
 * seeded noise) separated by near-silent gaps. Values stay well inside
 * -1..1 (|sample| <= peak <= 0.95).
 */
function synthWaveform(seed: number, samples = SAMPLES): number[] {
  const rand = mulberry32(seed);
  const out: number[] = [];
  while (out.length < samples) {
    const burstLen = Math.floor(40 + rand() * 120);
    const gapLen = Math.floor(10 + rand() * 50);
    const peak = 0.35 + rand() * 0.6;
    for (let j = 0; j < burstLen && out.length < samples; j++) {
      const envelope = Math.sin((j / burstLen) * Math.PI);
      const noise = rand() * 2 - 1;
      out.push(Number((noise * envelope * peak).toFixed(3)));
    }
    for (let j = 0; j < gapLen && out.length < samples; j++) {
      out.push(Number(((rand() * 2 - 1) * 0.03).toFixed(3)));
    }
  }
  return out;
}

function serialize(name: string, samples: number[]): string {
  return `export const ${name}: number[] = [\n  ${samples.join(", ")},\n];\n`;
}

const target = fileURLToPath(
  new URL(
    "../src/components/manual/UIExample/waveformData.ts",
    import.meta.url,
  ),
);

const banner = `// GENERATED — do not hand-edit.
// Regenerate with: bun scripts/generate-ui-example-waveforms.ts
// Committed waveform sample data for the Clip UI example (see the Clip UI
// example spec). Pure data on purpose: this module is imported by
// registryData.ts, which must stay loadable under bun test.

`;

writeFileSync(
  target,
  banner +
    serialize("CLIP_WAVEFORM_MONO", synthWaveform(1)) +
    "\n" +
    serialize("CLIP_WAVEFORM_LEFT", synthWaveform(2)) +
    "\n" +
    serialize("CLIP_WAVEFORM_RIGHT", synthWaveform(3)),
);
console.log(`wrote ${target}`);

const { execSync } = await import("node:child_process");
execSync(`bunx prettier --write "${target}"`, { stdio: "inherit" });
