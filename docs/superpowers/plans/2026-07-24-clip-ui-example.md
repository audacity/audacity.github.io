# Clip UI Example — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the design-system `Clip` as a curated UI example (4 variants) with precomputed committed waveform data, and land the deferred `needsBrowser` serializer tests.

**Architecture:** A deterministic generator script commits sample arrays to a pure-data module; the existing meta → registryData → registry pipeline picks the entry up with zero machinery changes; `needsBrowser: true` exercises the already-implemented client:load derivation, now tested against real registry data.

**Tech Stack:** TypeScript, bun, existing UIExample pipeline.

**Spec:** `docs/superpowers/specs/2026-07-24-clip-ui-example-design.md`

## Global Constraints

- Bun everywhere (`bun test` from `manual-editor/`); Conventional Commits; commits from repo root.
- `waveformData.ts` and `registryData.ts` stay PURE DATA (no React, no `@dilsonspickles/components` imports) — both are bun-test-reachable.
- `registry.tsx` remains the sole DS importer, deep subpaths only (`@dilsonspickles/components/Clip`).
- Serialized ids (`clip`, variant ids `default`/`selected`/`with-envelope`/`stereo`) are permanent once published.
- The generator script must be deterministic (seeded PRNG — identical bytes on every run) and must not import the DS package.
- Waveform samples normalized within −1..1; ~800 samples per array (compact file, smooth render).

---

### Task 1: Waveform generator script + committed data

**Files:**

- Create: `scripts/generate-ui-example-waveforms.ts` (repo root `scripts/` — exists)
- Create (generated): `src/components/manual/UIExample/waveformData.ts`
- Test: `manual-editor/src/uiExample/waveformData.test.ts`

**Interfaces:**

- Consumes: nothing.
- Produces: `CLIP_WAVEFORM_MONO`, `CLIP_WAVEFORM_LEFT`, `CLIP_WAVEFORM_RIGHT` (`number[]`, ~800 samples, −1..1) from `waveformData.ts` — used by Task 2's registryData entry.

- [ ] **Step 1: Write the failing sanity test**

```ts
// manual-editor/src/uiExample/waveformData.test.ts
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
```

- [ ] **Step 2: Run it to make sure it fails**

Run (from `manual-editor/`): `bun test src/uiExample/waveformData.test.ts`
Expected: FAIL — cannot resolve `waveformData`.

- [ ] **Step 3: Write the generator script**

```ts
// scripts/generate-ui-example-waveforms.ts
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
```

- [ ] **Step 4: Generate, verify determinism, run the tests**

```bash
bun scripts/generate-ui-example-waveforms.ts
cp src/components/manual/UIExample/waveformData.ts /tmp/waveformData.first.ts
bun scripts/generate-ui-example-waveforms.ts
diff /tmp/waveformData.first.ts src/components/manual/UIExample/waveformData.ts
```

Expected: `diff` exits silently (identical bytes — determinism verified once, per spec).

Run: `bun test src/uiExample/waveformData.test.ts` (from `manual-editor/`)
Expected: 2 pass.

Note: the pre-commit prettier hook will reformat the generated file (e.g. array wrapping). That's fine — but then `bun scripts/generate-ui-example-waveforms.ts && git diff --quiet src/components/manual/UIExample/waveformData.ts` would show churn on regeneration. To keep regeneration diff-clean, run `bunx prettier --write src/components/manual/UIExample/waveformData.ts` as the script's final step instead of relying on the hook: add to the script's end (after `writeFileSync`):

```ts
const { execSync } = await import("node:child_process");
execSync(`bunx prettier --write "${target}"`, { stdio: "inherit" });
```

Re-run the two generation commands + diff above; still identical.

- [ ] **Step 5: Commit**

```bash
git add scripts/generate-ui-example-waveforms.ts src/components/manual/UIExample/waveformData.ts manual-editor/src/uiExample/waveformData.test.ts
git commit -m "feat(manual): add deterministic waveform data pipeline for the Clip UI example"
```

---

### Task 2: Clip registry entry + the deferred needsBrowser tests

**Files:**

- Modify: `manual-editor/src/uiExample/meta.ts`
- Modify: `src/components/manual/UIExample/registryData.ts`
- Modify: `src/components/manual/UIExample/registry.tsx`
- Modify: `manual-editor/src/adapter/uiExampleRoundtrip.test.ts`
- Modify (comment only): `manual-editor/src/adapter/docToMdast.ts`

**Interfaces:**

- Consumes: `CLIP_WAVEFORM_*` (Task 1); existing pipeline (meta → registryData coverage test → registry → slash menu/node view pick the entry up automatically).
- Produces: registry entry id `clip` with variants `default`/`selected`/`with-envelope`/`stereo`.

- [ ] **Step 1: Write the failing round-trip tests**

Append to `manual-editor/src/adapter/uiExampleRoundtrip.test.ts` (it has `roundTrip(src)` and `firstNode(src)` helpers):

```ts
// needsBrowser (first real entry: clip — canvas-drawn, cannot SSR): static
// inserts still hydrate, so client:load is emitted even without
// `interactive`. This is the derivation branch deferred (with a standing
// code note) since the UIExample build.
test("static clip round-trips byte-stable with derived client:load", async () => {
  const src = '<UIExample component="clip" variant="default" client:load />\n';
  const node = firstNode(src);
  expect(node.type).toBe("uiExample");
  expect(node.attrs).toEqual({
    component: "clip",
    variant: "default",
    interactive: false,
  });
  expect(await roundTrip(src)).toBe(src);
});

test("interactive clip round-trips byte-stable", async () => {
  const src =
    '<UIExample component="clip" variant="with-envelope" interactive client:load />\n';
  expect(firstNode(src).attrs?.interactive).toBe(true);
  expect(await roundTrip(src)).toBe(src);
});

test("a static clip missing client:load gains it on save (derived attribute)", async () => {
  const src = '<UIExample component="clip" variant="default" />\n';
  expect(await roundTrip(src)).toBe(
    '<UIExample component="clip" variant="default" client:load />\n',
  );
});
```

Run: `bun test src/adapter/uiExampleRoundtrip.test.ts`
Expected: the three new tests FAIL (no `clip` in meta → preserved routing).

- [ ] **Step 2: Meta entry + comment update**

In `manual-editor/src/uiExample/meta.ts`, append to `UI_EXAMPLE_META`:

```ts
  {
    id: "clip",
    label: "Clip",
    keywords: ["clip", "waveform", "audio", "envelope", "stereo", "vocals"],
    allowInteractive: true,
    needsBrowser: true,
    variants: [
      { id: "default", label: "Default" },
      { id: "selected", label: "Selected" },
      { id: "with-envelope", label: "With envelope" },
      { id: "stereo", label: "Stereo" },
    ],
  },
```

Update the `needsBrowser` field's doc comment (it currently says no seed entry sets the flag and demands a test with the first one). Replace that sentence with:

```
   * First set by the `clip` entry; the static+client:load round-trip is
   * covered in `../adapter/uiExampleRoundtrip.test.ts`.
```

In `manual-editor/src/adapter/docToMdast.ts`, find the comment near the `uiExample` case's `needsClient` derivation that references the untested branch / meta note (and any trailing NOTE block from the original plan) and update it to point at the now-existing tests instead.

- [ ] **Step 3: Registry data + component map**

In `src/components/manual/UIExample/registryData.ts`, add the import at the top (below the meta import):

```ts
import {
  CLIP_WAVEFORM_LEFT,
  CLIP_WAVEFORM_MONO,
  CLIP_WAVEFORM_RIGHT,
} from "./waveformData";
```

Append to `UI_EXAMPLE_VARIANT_PROPS`:

```ts
  clip: {
    default: {
      name: "Vocals",
      width: 520,
      height: 140,
      waveformData: CLIP_WAVEFORM_MONO,
    },
    selected: {
      name: "Vocals",
      width: 520,
      height: 140,
      waveformData: CLIP_WAVEFORM_MONO,
      selected: true,
    },
    "with-envelope": {
      name: "Vocals",
      width: 520,
      height: 140,
      waveformData: CLIP_WAVEFORM_MONO,
      showEnvelope: true,
      clipDuration: 3,
      envelope: [
        { time: 0, db: 0 },
        { time: 1.2, db: -6 },
        { time: 2, db: -3 },
        { time: 3, db: -12 },
      ],
    },
    stereo: {
      name: "Vocals",
      width: 520,
      height: 140,
      waveformLeft: CLIP_WAVEFORM_LEFT,
      waveformRight: CLIP_WAVEFORM_RIGHT,
    },
  },
```

In `src/components/manual/UIExample/registry.tsx`, add the deep import (with the other component imports) and map entry:

```ts
import { Clip } from "@dilsonspickles/components/Clip";
```

```ts
  clip: Clip as unknown as AnyComponent,
```

> If the named export differs, check `node_modules/@dilsonspickles/components/dist/Clip.mjs`'s export line and adjust (same procedure as previous entries).

- [ ] **Step 4: Run the focused suites**

Run (from `manual-editor/`):
`bun test src/adapter/uiExampleRoundtrip.test.ts src/uiExample/`
Expected: all pass — the three new round-trip tests, meta validity, registryData coverage (now including `clip`'s four variants), waveformData sanity.

- [ ] **Step 5: Full verification**

Run: `bun test` (from `manual-editor/`) — no new failures.
Run: `bunx tsc --noEmit` (from `manual-editor/`) — clean.
Run: `bun run build` (from `manual-editor/`) — editor bundle builds (registry chunk now includes Clip).
Run: `bunx astro build` (from repo root) — site builds.

- [ ] **Step 6: Commit**

```bash
git add manual-editor/src/uiExample/meta.ts manual-editor/src/adapter/ src/components/manual/UIExample/registryData.ts src/components/manual/UIExample/registry.tsx
git commit -m "feat(manual): add Clip UI example (default/selected/envelope/stereo) with needsBrowser round-trip tests"
```

---

## Verification after all tasks

1. `cd manual-editor && bun test` — full suite green.
2. `cd manual-editor && bunx tsc --noEmit` — clean.
3. Editor + site builds green (Task 2 Step 5).
4. Visual pass (Alex): insert Clip from `/`, flip all four variants in the editor; publish preview shows the canvas-drawn clip on the page (brief unpainted flash before hydration is expected); tune name/color/envelope in `registryData.ts` to taste.
