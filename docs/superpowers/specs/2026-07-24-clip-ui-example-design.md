# Clip UI Example — Design

**Date:** 2026-07-24
**Status:** Approved pending final review
**Owner:** Alex (design lead) — variant/visual curation; engineering — data pipeline + tests

## Goal

Add the design system's `Clip` component to the manual editor's curated UI
examples ("Audacity UI" slash group) — the flagship living example,
replacing waveform screenshots on the pages that discuss clips, selection,
envelopes, and stereo audio. In doing so, exercise and test the
`needsBrowser` machinery reserved during the UIExample build.

## Context (verified against @dilsonspickles/components 0.10.1)

- `Clip` renders via canvas (`ClipBody`'s chunk calls `getContext`) — it
  cannot server-render. This is the first `needsBrowser: true` entry.
- The package's waveform generators (`generateSpeechWaveform`,
  `generateSineWave`, …) are exported **only from the package index** — no
  deep subpath. The index is banned from our bundles (pulls every chunk +
  stylesheet), which rules out calling the generators from the registry.
- `EnvelopePointData` is `{ time: number; db: number }`. `ClipColor` is a
  10-name union with a component default.

## Decisions (agreed in brainstorming)

1. **Variants (4):** Default (mono), Selected, With envelope, Stereo.
   Clip name `"Vocals"`, color left at the component default — both are
   registry one-liners Alex adjusts during curation.
2. **Waveform data is precomputed and committed**, not generated at
   runtime/build: a repo script with its own deterministic seeded synth
   (no DS imports) writes the sample arrays to a pure-data module. The
   spec'd "lazy props loader" extension is **not built** — it turned out
   unnecessary once the data is static.
3. `needsBrowser: true`, `allowInteractive: true`.

## New/changed files

- **`scripts/generate-ui-example-waveforms.ts`** (repo root `scripts/`):
  deterministic seeded waveform synth (speech-like bursts: seeded PRNG
  noise shaped by an attack/decay burst envelope), ~800 samples per array,
  normalized to −1..1. Writes `waveformData.ts` in full, with a
  "GENERATED — do not hand-edit; run `bun scripts/generate-ui-example-waveforms.ts`"
  header. Run with bun at curation time only; deliberately has no
  `@dilsonspickles/components` import (the package's generators are
  index-only, and the index's CSS side-effect imports don't load under
  bun anyway). If the DS later ships a `utils` subpath export, the script
  may switch to the real `generateSpeechWaveform` — optional, out of scope.
- **`src/components/manual/UIExample/waveformData.ts`** (generated,
  committed): exports `CLIP_WAVEFORM_MONO`, `CLIP_WAVEFORM_LEFT`,
  `CLIP_WAVEFORM_RIGHT` (`number[]`, ~800 samples each). Pure data — no
  imports — so it stays importable from `registryData.ts` under bun.
- **`manual-editor/src/uiExample/meta.ts`**: `clip` entry appended
  (label "Clip", keywords, `allowInteractive: true`, `needsBrowser: true`,
  variants `default` / `selected` / `with-envelope` / `stereo`). The
  "no seed entry sets needsBrowser yet" comment is updated to point at the
  now-existing test instead.
- **`src/components/manual/UIExample/registryData.ts`**: `clip` variant
  props (see below), importing the waveform arrays.
- **`src/components/manual/UIExample/registry.tsx`**: deep import
  `@dilsonspickles/components/Clip`, component-map entry.
- **`manual-editor/src/adapter/uiExampleRoundtrip.test.ts`**: the deferred
  `needsBrowser` round-trip test (see Testing).

## Variant props (registryData)

Common: `name: "Vocals"`, `width: 520`, `height: 140`.

- `default`: `waveformData: CLIP_WAVEFORM_MONO`
- `selected`: same + `selected: true`
- `with-envelope`: mono waveform + `showEnvelope: true`, `clipDuration: 3`,
  `envelope: [{ time: 0, db: 0 }, { time: 1.2, db: -6 }, { time: 2, db: -3 }, { time: 3, db: -12 }]`
- `stereo`: `waveformLeft: CLIP_WAVEFORM_LEFT`, `waveformRight: CLIP_WAVEFORM_RIGHT`

Exact prop names verified against `ClipProps` in the installed package.
Alex tunes values (color, size, envelope shape) in the registry during
visual curation; ids are permanent, values are not.

## Serialization (exercises existing, untested machinery)

`needsBrowser` makes the serializer emit `client:load` even for static
inserts (implemented in the UIExample build, untested until now — a
standing code comment in `meta.ts`/`docToMdast.ts` requires the test to
land with the first `needsBrowser` entry):

- Static: `<UIExample component="clip" variant="default" client:load />`
- Interactive: `<UIExample component="clip" variant="default" interactive client:load />`

No adapter/serializer code changes — only the new test, now against real
registry data (no mocking needed since `clip` genuinely sets the flag).

## What deliberately doesn't change

- No lazy-props machinery; no editor (node view / slash menu) changes
  beyond the automatic pickup from meta; no site-wrapper changes.
- Bundle rules intact: clip pages load the Clip chunk only.
- Known cosmetic limit: server HTML contains an unpainted canvas until
  hydration draws it — clip examples briefly render empty on slow
  connections. Inherent to canvas components; accepted.

## Testing

- Existing automatic coverage picks the entry up: meta validity (unique
  ids/variants), registryData coverage (every variant has props).
- New: `waveformData` sanity test (arrays non-empty, every sample within
  −1..1, generated header present in the file) — cheap guard against a
  hand-edit or a broken regeneration.
- New (the deferred one): static `clip` round-trip is byte-stable WITH
  `client:load`; interactive form also stable; a static `clip` PM node
  parsed back from its own serialization keeps `interactive: false`.
- Script determinism: verified once during implementation by running the
  generator twice and diffing the output (seeded PRNG → identical bytes);
  no standing test (the committed file plus the sanity test above is the
  ongoing guard).
- Visual pass (Alex): all four variants in the editor and on a built page.

## Out of scope

- Other rich-data components (MixerChannel, EnvelopeOverlay, PianoRoll) —
  same pattern, later entries.
- A DS `utils` subpath export for the real generators.
- Editable props (phase 2 unchanged).
