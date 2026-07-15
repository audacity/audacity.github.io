# manual-editor

Standalone WYSIWYG editor for the Audacity 4 user manual. See the design spec at
`docs/superpowers/specs/2026-07-15-manual-wysiwyg-editor-design.md` and the plan
sequence under `docs/superpowers/plans/`.

## MDX round-trip core (`src/mdx`)

Pure, UI-independent library that safely reads and writes the manual's MDX files.

- `parseMdx(source)` / `stringifyMdx(tree)` — MDX <-> mdast.
- `roundTrip(source)` — stringify(parse(source)).
- `formatMdx(source)` — normalize with the repo's Prettier config (parser `mdx`).
- `safeRoundTrip(source)` — the editor's full read->write: `formatMdx(roundTrip(source))`.
- `listManualFiles()` / `readManualFile(path)` — enumerate/read the corpus.

Fidelity is guaranteed by `idempotency.test.ts`, which asserts every file in
`src/content/manual` survives `safeRoundTrip` with no content change.

## Commands

```bash
bun test          # run all tests (incl. corpus idempotency)
bun run typecheck # tsc --noEmit
```
