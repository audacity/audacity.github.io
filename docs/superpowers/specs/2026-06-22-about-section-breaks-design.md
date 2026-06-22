# /about — section breaks and bolder backgrounds

## Problem

The `/about` page currently runs one continuous scroll-driven gradient that lerps between nine colors (`src/pages/about.astro:84-94`). The drift is pleasant but too subtle to delineate sections — the eye gets no resting point and no signal that one section has ended and the next has begun.

## Goal

Give the eye explicit rests by replacing the continuous lerp with **per-section static backgrounds** in a **bolder palette**, and reserve **two interstitial slots** at chapter boundaries for future graphic-element breaks.

## Design

### 1. Per-section static backgrounds (replaces the scroll-lerp)

Remove the scroll-driven `--page-bg` interpolation from `about.astro`. Each section component instead claims its own background color and renders a hard edge at its top and bottom.

New palette (same hue families as today, much higher contrast):

| Section           | Color           | Mood               |
| ----------------- | --------------- | ------------------ |
| ScrollyLaptopTour | `rgb(8,11,32)`  | deep blue-black    |
| CoreEditing       | `rgb(28,18,46)` | purple-violet      |
| Workspaces        | `rgb(10,28,38)` | teal-blue          |
| CustomisableUI    | `rgb(8,40,50)`  | deep teal          |
| AudioCom          | `rgb(14,22,54)` | deep blue          |
| EffectWindows     | `rgb(34,14,38)` | purple-magenta     |
| MuseHub           | `rgb(52,24,30)` | warm crimson       |
| UnderTheHood      | `rgb(20,16,22)` | near-black neutral |
| CtaSection        | `rgb(2,2,4)`    | near-pure black    |

Implementation approach: keep the existing `.scroll-bg-page` wrapper as a layout container, but stop setting `--page-bg`. Each child section gets its background via a wrapper class added in `about.astro` (e.g. `<div class="about-section about-section--coreediting">…</div>`), with the colors defined once in `about.astro`'s `<style is:global>` block. This keeps the section components themselves untouched and the color palette centralized.

Override of `.bg-background-dark` → `transparent` stays so individual section Tailwind classes don't fight the wrapper.

### 2. Interstitial slots

A new lightweight component, `src/components/about/Interstitial.astro`, renders a full-bleed band with:

- A near-pure-black background (`rgb(2,2,4)`) so it reads as a definitive break against the saturated chapter colors on either side
- A `min-height` of ~40vh (placeholder; tunable) — large enough to feel like a chapter beat, not a hairline
- A `<slot />` for future graphic content
- For now: a single muted "Chapter" kicker label as placeholder content so the slot isn't visually empty

Two instances inserted into `about.astro`:

- **After AudioCom**, before EffectWindows — the narrative pivot from "the app" to "the ecosystem"
- **After UnderTheHood**, before CtaSection — the breath before the closer

### 3. What stays the same

- The site-header show/hide scroll behavior in `about.astro:144-177` is independent of color logic — leave it.
- All section components and their internal layouts — untouched.
- The overall section order (last reordered in `293e06b`).

## Scope

In scope: `src/pages/about.astro` (palette + interstitial wiring), one new `Interstitial.astro` component.

Out of scope: the actual graphic content for interstitials (graphics will be added later — slot is the seam); tuning of header colors against the new palette (handled if/when it visibly conflicts); v1/v2 about pages.

## Open questions

None blocking. Color values are first-pass and may need tuning once viewed at full scale in the browser.
