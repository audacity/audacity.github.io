# Known limitations: MDX round-trip idempotency

`src/mdx/idempotency.test.ts` asserts, for every file in the real manual
corpus (`src/content/manual/**/*.{md,mdx}`), that
`formatMdx(roundTrip(source)) === formatMdx(source)` — i.e. opening and
re-saving a file through the editor's pipeline changes nothing that a plain
Prettier pass on the original file wouldn't also change.

11 of the 238 corpus files cannot satisfy this comparison. This is not a bug
in `roundTrip`/`createProcessor()` (`src/mdx/pipeline.ts`) in the sense of
producing wrong or lossy markdown — in every case below, `roundTrip()`
produces markdown that is a **more correct** (spec-compliant) rendering of
the same content than the raw source has. The mismatch instead comes from
**Prettier's own MDX printer**, which the editor also runs
(`formatMdx`/`src/mdx/normalize.ts`) as the final formatting pass on both
sides of the comparison.

## Root cause

Prettier's `mdx` parser/printer does not always re-emit content purely from
its parsed AST. For certain spans — those containing inline JSX/HTML
elements, links with complex/encoded destinations, backslash escapes, or
(per the sub-case below) lists whose items are separated by whitespace-only
"blank" lines rather than zero-length ones — Prettier falls back to
echoing back the **raw input text** for that span more or less verbatim
(preserving its original indentation, escaping, and emphasis-marker style)
instead of reflowing/re-normalizing it.

That fallback is harmless when Prettier is run once, directly on a
hand-authored file — it just means Prettier leaves unusual formatting
alone. But our editor pipeline runs `roundTrip()` (parse+stringify via
`unified`/`remark-parse`/`remark-stringify`/`remark-mdx`) **before**
`formatMdx()`. `roundTrip()` necessarily changes some bytes even when the
semantic content is unchanged:

- `remark-stringify` is configured to canonicalize emphasis markers to `_`
  and always removes backslash-escapes that aren't required by CommonMark
  at that position (e.g. `1\.` in a heading, where `.` is only ambiguous at
  the start of a line, not after `## `).
- `mdast-util-mdx-jsx` (used by `remark-mdx`'s stringify extension)
  **unconditionally** indents the block-level children of a JSX flow
  element (e.g. `<Callout>...</Callout>`) by 2 spaces per nesting level.
  This has no configuration knob — see the library's own source comment:
  `mdast-util-mdx-jsx/lib/index.js` around `containerFlow()`: "To do: add
  `indent` support to `mdast-util-to-markdown`... it's fine for now."
- Whitespace-only lines between list items (a common artifact of this
  corpus's GitBook export — e.g. `-   Item one.\n    \n-   Item two.`) are
  genuine CommonMark blank lines, so `remark-parse` correctly treats such
  lists as _loose_ and `remark-stringify` correctly re-emits real blank
  lines between items.

When Prettier's _second_ pass (inside `formatMdx`) hits one of its
verbatim/no-reflow spans, it echoes back whichever bytes it was given. For
`formatMdx(source)` that's the **original** author bytes (original
indentation/escaping/marker style, and — critically — a Prettier-specific
bug where it does **not** reliably recognize whitespace-only lines as list
separators inside/adjacent to JSX, sometimes flattening a bulleted list
into one merged paragraph). For `formatMdx(roundTrip(source))` that's
**our normalized** bytes (forced 2-space JSX-child indent, no backslash
escape, `_`-style emphasis, and — because remark parsed the pseudo-blank
lines correctly — a properly loose list). Both are valid, semantically
equivalent MDX; they are not byte-identical, so the strict-equality test
fails.

This is not fixable via `createProcessor()` options in `pipeline.ts`:

- The JSX-child indentation is hard-coded in `mdast-util-mdx-jsx` with no
  exposed toggle.
- Forcing `remark-stringify` to always re-add backslash escapes (via a
  custom `unsafe` pattern) does not help: the corpus is **internally
  inconsistent** about this exact escape. See
  `special-uses/info-for-system-administrators.md`, which has both `\-`
  and unescaped `-` for the identical " - " construct in the same file — no
  single deterministic stringify rule can match both.
- Even where individual constructs could be patched (e.g. digit-period
  heading escapes), the affected files fail for _multiple_, independent
  instances of this same root cause, so a partial fix would not flip any
  file from failing to passing, while risking new false-positive escaping
  in the 227 currently-passing files (e.g. "Audacity 3.2." at a sentence
  end).

None of this indicates data loss or corruption risk for the editor: the
`roundTrip()` output is semantically identical to the source in every case
below (same text, same list items, same JSX attributes/components), and in
the list-flattening cases `roundTrip()` is strictly _more_ faithful to the
original author's intent than a naive direct Prettier pass would be.

## Affected files

1. **`accessibility/navigation-model.mdx`** — Two `<Callout>` blocks whose
   child paragraph starts immediately after the opening tag with inline
   JSX (`<Shortcut client:load ... />`, `<strong>`). Prettier
   verbatim-preserves the original (un-indented) text; `roundTrip()`'s
   forced 2-space JSX-child indent survives Prettier's echo, producing an
   indentation mismatch only.

2. **`accessibility/toolbars-and-panels.mdx`** — A `<Callout>` block
   containing `*last*` (asterisk emphasis). Prettier verbatim-preserves the
   original marker; `roundTrip()` canonicalizes it to `_last_`
   (`emphasis: "_"` in `pipeline.ts`) before Prettier's second pass, so the
   echoed marker differs.

3. **`audio-editing/reducing-dynamic-range-compressor-limiter.mdx`** —
   (a) `\->` (escaped arrow) at line ~16 loses its backslash on round trip
   (unnecessary per CommonMark outside a line-break position). (b) Two
   "Best practices" bullet lists whose items are separated by
   whitespace-only pseudo-blank lines; `remark` correctly treats the list
   as loose (blank lines between items), Prettier's direct pass keeps it
   tight.

4. **`audio-editing/using-realtime-effects.mdx`** — `<Notes>` and
   `<TipsAndTricks>` bullet lists with the same whitespace-only
   pseudo-blank-line separators, this time nested inside a JSX flow
   element. Prettier's bug is more severe here: it fails to recognize the
   `-` markers as list items at all and flattens all three items into one
   merged, word-wrapped paragraph. `roundTrip()` avoids this bug entirely
   (produces a correct loose list).

5. **`basics/audacity-editing.mdx`** — (a) An ordered list (`1.`/`2.`) with
   a whitespace-only blank-line separator, same tight/loose mismatch as
   #3(b). (b) A `<Callout type="info">` whose child paragraph starts
   immediately after the opening tag — same indentation mismatch as #1.

6. **`basics/installing-ffmpeg.mdx`** — Nearly the entire body lives inside
   `<Tabs>`/`<Tab label="...">` JSX flow elements (headings, ordered lists,
   nested `<Callout>`s, fenced code blocks), none indented in the source.
   The forced-indent mismatch from #1 applies pervasively throughout.

7. **`basics/recording-desktop-audio.mdx`** — Combines digit-period heading
   escapes (`1\.`, `2\.`, `3\.`), `<Tab>`/`<Callout>`/`<Pitfalls>`
   forced-indent mismatches, and ordered-list tight/loose mismatches
   (Soundflower and PulseAudio steps) from whitespace-only blank-line
   separators.

8. **`basics/recording-your-voice-and-microphone.mdx`** — Digit-period
   heading escapes (`1\.`, `2\.`, `3\.`) plus the severe list-flattening
   bug (#4) inside `<Callout>` and `<BestPractices>`.

9. **`basics/saving-and-exporting-projects.mdx`** — `<TipsAndTricks>`
   bullet list hits the same list-flattening bug as #4/#8.

10. **`new-in-audacity-4/changing-clip-color.mdx`** — A `<Callout
type="info">` paragraph starting immediately after the opening tag,
    containing `->`; same forced-indent-vs-verbatim-preserve mismatch as
    #1/#5(b).

11. **`special-uses/info-for-system-administrators.md`** — (a) `\-` at line
    47 loses its backslash on round trip, same as #3(a); note the
    identical " - " construct is _unescaped_ two paragraphs later in the
    same file (line 83), where both sides already agree — proof the
    source's own escaping is inconsistent for this construct. (b) An
    ordered list (compliance-form steps, line ~81) with the same
    whitespace-only blank-line tight/loose mismatch as #3(b)/#5(a).

Each of these files has one targeted `test.skip(...)` in
`src/mdx/idempotency.test.ts`, naming the file explicitly. All other files
in the corpus (227 of 238) pass the strict round-trip idempotency check.
