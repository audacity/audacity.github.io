# /about Section Breaks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the continuous scroll-driven background lerp on `/about` with per-section static backgrounds in a bolder palette, and insert two interstitial slots at chapter boundaries (after AudioCom, after UnderTheHood) for future graphic-element breaks.

**Architecture:** Each section is wrapped in `about.astro` with a per-section class that paints a flat background color. The scroll-lerp script is reduced to just the header show/hide logic. A new `Interstitial.astro` component renders a near-pure-black band with a `<slot />` for future content; two instances are inserted between sections.

**Tech Stack:** Astro, React (for existing section components), TailwindCSS, Bun.

## Global Constraints

- Use Bun for any install/run command (`bun install`, `bun run …`, `bunx …`).
- Conventional Commits for all commit messages.
- Keep changes scoped to the request — do not refactor unrelated code.
- Don't touch v1 or v2 about pages (`src/pages/about-v1.astro`, `src/pages/about-v2.astro`).
- Section components themselves stay untouched — all wiring happens in `about.astro` and the new `Interstitial.astro`.
- Validate with Playwright MCP when reasonable.

## Reference

- Spec: `docs/superpowers/specs/2026-06-22-about-section-breaks-design.md`
- Current page: `src/pages/about.astro`

## Palette (reference for both tasks)

| Section           | CSS class                        | Color           |
| ----------------- | -------------------------------- | --------------- |
| ScrollyLaptopTour | `about-section--scrolly`         | `rgb(8,11,32)`  |
| CoreEditing       | `about-section--core-editing`    | `rgb(28,18,46)` |
| Workspaces        | `about-section--workspaces`      | `rgb(10,28,38)` |
| CustomisableUI    | `about-section--customisable-ui` | `rgb(8,40,50)`  |
| AudioCom          | `about-section--audiocom`        | `rgb(14,22,54)` |
| EffectWindows     | `about-section--effect-windows`  | `rgb(34,14,38)` |
| MuseHub           | `about-section--musehub`         | `rgb(52,24,30)` |
| UnderTheHood      | `about-section--under-the-hood`  | `rgb(20,16,22)` |
| CtaSection        | `about-section--cta`             | `rgb(2,2,4)`    |
| Interstitial      | `about-interstitial`             | `rgb(2,2,4)`    |

---

### Task 1: Create the `Interstitial.astro` component

**Files:**

- Create: `src/components/about/Interstitial.astro`

**Interfaces:**

- Consumes: nothing.
- Produces: default-exported Astro component `Interstitial` that accepts a `<slot />`. Renders a `<section class="about-interstitial">` with min-height ~40vh and centered slot content. Background is `rgb(2,2,4)` and is set by `.about-interstitial` styles defined within the component's own `<style>` block (scoped) so the component is self-contained.

- [ ] **Step 1: Create the component file**

Create `src/components/about/Interstitial.astro` with:

```astro
---
// Full-bleed chapter break between /about sections.
// Renders a near-pure-black band with a slot for future graphic content.
// For now, falls back to a muted "Chapter" kicker when no slot content is provided.
---

<section class="about-interstitial">
  <div class="about-interstitial__inner">
    <slot>
      <span class="about-interstitial__kicker">Chapter</span>
    </slot>
  </div>
</section>

<style>
  .about-interstitial {
    background-color: rgb(2, 2, 4);
    min-height: 40vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4rem 1.5rem;
  }

  .about-interstitial__inner {
    max-width: 60ch;
    text-align: center;
  }

  .about-interstitial__kicker {
    font-size: 0.75rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.45);
  }
</style>
```

- [ ] **Step 2: Verify the file compiles (no consumer yet)**

Run: `bunx astro check`
Expected: completes without errors related to the new file. (Pre-existing warnings elsewhere are not blockers.)

- [ ] **Step 3: Commit**

```bash
git add src/components/about/Interstitial.astro
git commit -m "feat(about): add Interstitial component for chapter breaks"
```

---

### Task 2: Replace scroll-lerp with per-section palette and insert interstitials

**Files:**

- Modify: `src/pages/about.astro` (palette wrappers, remove color-lerp from script, insert two `<Interstitial />` instances)

**Interfaces:**

- Consumes: `src/components/about/Interstitial.astro` (default export from Task 1).
- Produces: nothing new for downstream tasks.

**What changes:**

1. Each top-level child of `.scroll-bg-page` gets wrapped in a `<div class="about-section about-section--<name>">…</div>`.
2. `<style is:global>` gains `.about-section { … }` (covers body fill and section min-height) and one rule per `about-section--<name>` setting `background-color`. The existing `--page-bg` body fill becomes a fallback only.
3. The `<script>` keeps the header show/hide logic but drops the `COLORS` array, `parsed`/`lerp`/`tick` color logic, and the `--page-bg` setter. The script no longer reads `scrollHeight` for color purposes.
4. Two `<Interstitial />` instances are inserted: between AudioCom and EffectWindows, and between UnderTheHood and CtaSection.

- [ ] **Step 1: Import `Interstitial` in `about.astro`**

In `src/pages/about.astro`, add this import alongside the existing imports (after the `CtaSection` import on line 11):

```astro
import Interstitial from "../components/about/Interstitial.astro";
```

- [ ] **Step 2: Replace the body of `.scroll-bg-page` with wrapped sections + interstitials**

Replace lines 23–33 (the entire `<div class="scroll-bg-page">` block) with:

```astro
<div class="scroll-bg-page">
  <div class="about-section about-section--scrolly">
    <ScrollyLaptopTour client:visible />
  </div>
  <div class="about-section about-section--core-editing">
    <CoreEditing client:visible />
  </div>
  <div class="about-section about-section--workspaces">
    <Workspaces client:visible />
  </div>
  <div class="about-section about-section--customisable-ui">
    <CustomisableUI client:visible />
  </div>
  <div class="about-section about-section--audiocom">
    <AudioCom />
  </div>
  <Interstitial />
  <div class="about-section about-section--effect-windows">
    <EffectWindows client:visible />
  </div>
  <div class="about-section about-section--musehub">
    <MuseHub />
  </div>
  <div class="about-section about-section--under-the-hood">
    <UnderTheHood />
  </div>
  <Interstitial />
  <div class="about-section about-section--cta">
    <CtaSection />
  </div>
</div>
```

- [ ] **Step 3: Add per-section background rules and adjust layout rules in `<style is:global>`**

In the existing `<style is:global>` block in `src/pages/about.astro`, replace the two existing layout rules:

```css
.scroll-bg-page .bg-background-dark {
  background-color: transparent !important;
}
.scroll-bg-page > section:nth-child(n + 2),
.scroll-bg-page > *:nth-child(n + 2) section {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
```

…with the new palette + layout rules:

```css
.scroll-bg-page .bg-background-dark {
  background-color: transparent !important;
}

.about-section {
  position: relative;
}

.scroll-bg-page > .about-section:nth-child(n + 2),
.scroll-bg-page > .about-section:nth-child(n + 2) section {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.about-section--scrolly {
  background-color: rgb(8, 11, 32);
}
.about-section--core-editing {
  background-color: rgb(28, 18, 46);
}
.about-section--workspaces {
  background-color: rgb(10, 28, 38);
}
.about-section--customisable-ui {
  background-color: rgb(8, 40, 50);
}
.about-section--audiocom {
  background-color: rgb(14, 22, 54);
}
.about-section--effect-windows {
  background-color: rgb(34, 14, 38);
}
.about-section--musehub {
  background-color: rgb(52, 24, 30);
}
.about-section--under-the-hood {
  background-color: rgb(20, 16, 22);
}
.about-section--cta {
  background-color: rgb(2, 2, 4);
}
```

Leave the `html { --page-bg: rgb(10, 13, 26); }` and `body { background-color: var(--page-bg) !important; }` rules in place — they become the fallback fill behind the sections, which prevents the white flash on Safari rubber-band overscroll.

- [ ] **Step 4: Trim the script to just the header logic**

Replace the entire `<script>` block (lines 83–211) with the slimmed version below. This drops the `COLORS` array, the `parsed`/`lerp`/`tick` color interpolation, and the `--page-bg` setter; it keeps the scroll-direction header show/hide and the mouse-near-top reveal.

```astro
<script>
  function init() {
    const host = document.querySelector<HTMLElement>(".scroll-bg-page");
    if (!host) return;

    // Hide the site header when the user scrolls down. Show it again on
    // scroll up, near the very top of the page, or when the cursor moves
    // near the top edge of the viewport.
    const header = document.getElementById("site-header");
    let lastY = window.scrollY;
    let scrollHidden = false;
    let mouseAtTop = false;
    const HIDE_AFTER = 80; // px from top before scroll-hide kicks in
    const MOUSE_REVEAL_AT = 80; // px from top edge where the nav reappears
    const DELTA = 6; // ignore tiny scroll jitter

    function applyHeaderState() {
      if (!header) return;
      const shouldHide = scrollHidden && !mouseAtTop;
      if (shouldHide) header.setAttribute("data-hidden", "true");
      else header.removeAttribute("data-hidden");
    }

    function updateHeader() {
      const y = window.scrollY;
      const dy = y - lastY;
      if (Math.abs(dy) < DELTA) return;
      if (y < HIDE_AFTER) scrollHidden = false;
      else if (dy > 0) scrollHidden = true;
      else if (dy < 0) scrollHidden = false;
      lastY = y;
      applyHeaderState();
    }

    function onMouseMove(e: MouseEvent) {
      const near = e.clientY < MOUSE_REVEAL_AT;
      if (near !== mouseAtTop) {
        mouseAtTop = near;
        applyHeaderState();
      }
    }
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    let raf: number | null = null;
    function onScroll() {
      if (raf !== null) return;
      raf = requestAnimationFrame(() => {
        updateHeader();
        raf = null;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
</script>
```

- [ ] **Step 5: Type-check**

Run: `bunx astro check`
Expected: no new errors introduced by `src/pages/about.astro` or `src/components/about/Interstitial.astro`. Pre-existing warnings elsewhere are not blockers.

- [ ] **Step 6: Visual verification in the dev server**

Run: `bun run dev` (background)
Then open `http://localhost:4321/about` (port may differ — use the URL the dev server prints).

Walk through the checklist:

1. Each section has its own flat background color matching the palette table — no smooth gradient drift between them.
2. Adjacent sections show a hard color edge.
3. Two interstitial bands appear: between AudioCom → EffectWindows, and between UnderTheHood → CtaSection. Each shows the muted "Chapter" kicker on a near-black background.
4. Site header still hides on scroll down, reappears on scroll up, and reappears when the cursor moves near the top of the viewport.
5. No console errors.
6. Scroll all the way to the bottom; no white flash on rubber-band overscroll.

If Playwright MCP is available, take a screenshot at the AudioCom → Interstitial → EffectWindows boundary and the UnderTheHood → Interstitial → CtaSection boundary to attach in the implementation summary.

- [ ] **Step 7: Commit**

```bash
git add src/pages/about.astro
git commit -m "feat(about): per-section static palette with chapter interstitials"
```

---

## Done criteria

- [ ] `/about` shows flat per-section backgrounds in the bolder palette.
- [ ] Two `Interstitial.astro` bands appear at the correct positions.
- [ ] Header show/hide behavior on scroll and mouse-near-top works as before.
- [ ] `bunx astro check` passes with no new errors.
- [ ] Two commits land on the branch: `feat(about): add Interstitial component for chapter breaks` and `feat(about): per-section static palette with chapter interstitials`.
