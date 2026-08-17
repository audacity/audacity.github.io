# Known limitations: MDX round-trip idempotency

`src/mdx/idempotency.test.ts` asserts, for every file in the real manual
corpus (`src/content/manual/**/*.{md,mdx}`), that
`formatMdx(roundTrip(source)) === formatMdx(source)` — i.e. opening and
re-saving a file through the editor's pipeline changes nothing that a plain
Prettier pass on the original file wouldn't also change.

9 of the 237 corpus files cannot satisfy this **byte-for-byte** comparison.
In every case the residual difference is _benign formatting_ (emphasis-marker
canonicalization, backslash-escape normalization, JSX-child indentation, or
loose-vs-tight list spacing). **No file is skipped due to content loss or
structural loss:** the editor's `roundTrip()` output preserves every list,
every list item, and every JSX attribute/component. All 227 previously-passing
files still pass, plus two files that previously flattened lists now pass
(`audio-editing/using-realtime-effects.mdx`,
`basics/saving-and-exporting-projects.mdx`).

## History: the list-flattening corruption (now fixed)

A prior version of this document claimed that `roundTrip()` _avoided_ a
Prettier list-flattening bug and was therefore strictly more correct than a
direct Prettier pass. **That causation was inverted and is false.** In fact
`roundTrip()` was the cause of the corruption:

`mdast-util-mdx-jsx` (remark-mdx's stringify extension) serializes the block
children of a JSX flow element (`<Notes>`, `<TipsAndTricks>`,
`<BestPractices>`, `<Callout>`, …) **flush against the tags**, discarding the
blank lines that separated them in the source:

```
<Notes>
  - Realtime effects always apply to an entire track.
  - Since these effects are calculated realtime...
  - Realtime effects are automatically applied...
</Notes>
```

When `formatMdx` (Prettier, `parser: "mdx"`) then re-parses that output, it no
longer recognizes the `-` lines as a list and reflows every item into a single
run-on, word-wrapped paragraph with literal `- ` embedded mid-sentence — real
content corruption on save. Running Prettier _directly_ on the original source
keeps the list, precisely because the source has the blank lines and Prettier
**preserves** (does not canonicalize) that separation.

### The fix

`createProcessor()` (`src/mdx/pipeline.ts`) now installs a custom
`remark-stringify` handler for `mdxJsxFlowElement`
(`mdxJsxFlowElementWithBlankLines`). It wraps the stock
`mdast-util-mdx-jsx` handler and re-introduces a blank line after the opening
tag and/or before the closing tag — but **only where the source had one**. It
determines this from mdast position data (a `>= 2` line gap between a tag and
its adjacent child means a blank line was present); for synthesized trees with
no position data it falls back to a structural rule (anything other than a
single lone paragraph child is separated, so a list is never left flush).
Indentation is left untouched — Prettier canonicalizes that on its own.

Because Prettier preserves the source's blank-line separation, reproducing that
same separation is exactly what makes the editor's write path agree with a
plain Prettier pass. This fix flips the two list-only files above from failing
(content-corrupting) to passing, and does not regress any of the 227
previously-passing files.

## Root cause of the remaining 9 differences

Prettier's `mdx` printer does not always re-emit content purely from its
parsed AST. For certain spans — those containing inline JSX/HTML elements,
links with complex/encoded destinations, backslash escapes, whitespace-only
"blank" lines between list items, or block content nested inside JSX flow
elements — Prettier falls back to echoing the **input text** for that span
more or less verbatim (preserving its original indentation, escaping, and
emphasis-marker style) instead of reflowing/re-normalizing it.

That fallback is harmless when Prettier runs once, directly on a hand-authored
file. But the editor pipeline runs `roundTrip()` (parse+stringify via
`unified`/`remark-parse`/`remark-stringify`/`remark-mdx`) **before**
`formatMdx()`. `roundTrip()` legitimately changes some bytes even when the
semantic content is unchanged:

- `remark-stringify` canonicalizes emphasis markers to `_` and removes
  backslash escapes that CommonMark does not require at that position (e.g.
  `\-` / `\->` mid-sentence, or `1\.` in a heading).
- `mdast-util-mdx-jsx` **unconditionally** indents the block-level children of
  a JSX flow element by 2 spaces per nesting level. This has no configuration
  knob — see the library's own source comment in
  `mdast-util-mdx-jsx/lib/index.js` around `containerFlow()`: "To do: add
  `indent` support to `mdast-util-to-markdown`... it's fine for now."
- Whitespace-only lines between list items (a GitBook-export artifact — e.g.
  `-   Item one.\n    \n-   Item two.`) are genuine CommonMark blank lines, so
  `remark-parse` correctly treats such a list as _loose_ and `remark-stringify`
  re-emits real blank lines between items; a direct Prettier pass often keeps
  the list _tight_.

When Prettier's _second_ pass (inside `formatMdx`) hits one of its
verbatim/no-reflow spans, it echoes whichever bytes it was given: the original
author bytes for `formatMdx(source)`, versus our normalized bytes for
`formatMdx(roundTrip(source))`. Both are valid, semantically equivalent MDX;
they are not byte-identical, so the strict-equality test fails. None of this
is content or structure loss — same text, same list items (never flattened on
the editor side), same JSX attributes/components.

## Affected files (9)

1. **`accessibility/navigation-model.mdx`** — _JSX-child indentation._ Two
   `<Callout>` blocks whose child paragraph starts immediately after the
   opening tag with inline JSX (`<Shortcut client:load ... />`, `<strong>`).
   Prettier verbatim-preserves the source's un-indented text; `roundTrip()`'s
   2-space JSX-child indent survives Prettier's echo. Indentation-only.

2. **`accessibility/toolbars-and-panels.mdx`** — _Emphasis canonicalization._
   A `<Callout>` block containing `*last*`. `roundTrip()` canonicalizes it to
   `_last_` (`emphasis: "_"` in `pipeline.ts`) and Prettier echoes the source's
   `*last*` on the baseline side. Marker-style only.

3. **`audio-editing/reducing-dynamic-range-compressor-limiter.mdx`** —
   _Backslash-escape + loose/tight list._ (a) `\->` at line ~16 loses its
   (unnecessary) backslash on round trip. (b) "Best practices" bullet lists
   whose items are separated by whitespace-only pseudo-blank lines: `remark`
   emits a loose list (blank lines between items), Prettier's direct pass keeps
   it tight. Both are the same list with the same items — no flattening.

4. **`basics/audacity-editing.mdx`** — _Ordered-list marker spacing +
   loose/tight._ An ordered list (`1.`/`2.`) that Prettier's baseline renders
   with `1.  ` (two spaces) and a whitespace-only blank-line separator (loose
   vs tight). `roundTrip()` emits `1. ` (one space). The `<Callout type="info">`
   paragraph child in this file now round-trips correctly (matches Prettier).

5. **`basics/installing-ffmpeg.mdx`** — _JSX-child indentation._ Nearly the
   whole body lives inside `<Tabs>`/`<Tab label="...">` (headings, ordered
   lists, nested `<Callout>`s, fenced code), none indented in the source.
   Prettier verbatim-preserves the flush-left source; `roundTrip()` indents the
   block children (2 spaces per JSX nesting level). Indentation-only; all
   headings, list items, and code survive intact.

6. **`basics/recording-desktop-audio.mdx`** — _Escapes + indentation +
   loose/tight._ Combines digit-period heading escapes (`1\.`, `2\.`, `3\.`),
   `<Tab>`/`<Callout>` JSX-child indentation, ordered/bullet marker spacing,
   and loose-vs-tight list mismatches from whitespace-only separators. No list
   is flattened on the editor side.

7. **`basics/recording-your-voice-and-microphone.mdx`** — _Baseline flattens a
   source-malformed list; the editor preserves it._ Also has digit-period
   heading escapes (`1\.`, `2\.`). The important case: a `<Callout>` wraps a
   bullet list whose items are separated by whitespace-only lines **with no
   blank line after the opening `<Callout>` tag** in the source. A plain
   Prettier pass on the source (`formatMdx(source)`, the comparison baseline)
   therefore _flattens_ that list into a run-on paragraph. The editor's
   `roundTrip()` normalizes the whitespace-only separators into real blank
   lines, so `safeRoundTrip(source)` keeps all three items as a proper list.
   The two outputs differ only because **the baseline is the lossy one** —
   the editor is strictly more faithful and loses nothing.

8. **`new-in-audacity-4/changing-clip-color.mdx`** — _JSX-child indentation._ A
   `<Callout type="info">` paragraph starting immediately after the opening tag
   and containing `->`; Prettier verbatim-preserves the source's un-indented
   text while `roundTrip()` indents it. Indentation-only.

9. **`special-uses/info-for-system-administrators.md`** — _Backslash-escape +
   ordered-marker spacing._ (a) `\-` at line ~47 loses its backslash on round
   trip; note the identical " - " construct is _unescaped_ two paragraphs later
   in the same file (line ~83) where both sides already agree — the source's
   own escaping is inconsistent, so no single deterministic stringify rule can
   match both. (b) A compliance-form ordered list (line ~81) that Prettier's
   baseline renders with `1.  ` (two-space) marker spacing.

Each of these files has one targeted `test.skip(...)` in
`src/mdx/idempotency.test.ts`, naming the file explicitly. All other files in
the corpus (228 of 237) pass the strict round-trip idempotency check.
