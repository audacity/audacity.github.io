# Navbar scroll behaviour — design spec

**Date:** 2026-08-03

## Goal

Apply the navbar scroll behaviour from the Audacity 4 release page (`/about`) to all pages on the site.

## Behaviour overview

The release page navbar has two layered behaviours:

1. **Scroll-hide/reveal** — the navbar slides off the top of the viewport when the user scrolls down past 80 px, and slides back in when they scroll up, reach the top, or move their mouse within 80 px of the top edge. Controlled via `data-hidden` and `data-solid` attributes on `#site-header`.

2. **Transparent-to-frosted-glass** — at the very top of the page the navbar is fully transparent; once scrolled or hovered it transitions to `rgba(10, 13, 22, 0.85)` with `backdrop-filter: blur(12px)`. This only works visually on pages with a dark hero behind the nav.

## Decision

- **Scroll-hide/reveal**: apply globally to all pages.
- **Transparent-to-frosted-glass**: opt-in per page via a `transparentNav` prop on `BaseLayout`, because it requires a dark background behind the nav and would break readability on light-content pages (e.g. `/blog`, `/help`, `/download`).

## Implementation

### 1. `BaseLayout.astro` — scroll-hide (always on)

Add `transparentNav?: boolean` to the `Props` interface (default `false`).

Add a `<style is:global>` block that is always injected:

```css
#site-header {
  transition: transform 280ms ease;
  will-change: transform;
}
#site-header[data-hidden="true"] {
  transform: translateY(-100%);
}
```

The header remains `position: sticky` on non-transparent pages, so no content offset is needed. The transform slides it off-screen without affecting layout.

Add a `<script>` block (always injected) containing the scroll-hide/reveal logic:

- Listens to `scroll` (via `requestAnimationFrame`) and `mousemove`
- Sets `data-hidden="true"` on `#site-header` when scrolling down past 80 px
- Removes `data-hidden` when scrolling up, near the top (<80 px scroll position), or mouse within 80 px of the top edge
- Sets `data-solid="true"` when scroll position > 80 px; removes it at the top
- `data-solid` has no visual effect on non-transparent pages (no CSS reads it, so it is safely inert)

### 2. `BaseLayout.astro` — transparent-to-frosted (opt-in)

When `transparentNav={true}`, inject a second `<style is:global>` block:

```css
#site-header {
  position: fixed !important;
  top: 0;
  left: 0;
  right: 0;
  background-color: transparent;
  transition:
    transform 280ms ease,
    background-color 240ms ease,
    backdrop-filter 240ms ease;
}
#site-header nav {
  background-color: transparent;
  transition:
    background-color 240ms ease,
    backdrop-filter 240ms ease;
}
#site-header:hover nav,
#site-header:focus-within nav,
#site-header[data-solid="true"] nav {
  background-color: rgba(10, 13, 22, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
```

`position: fixed !important` overrides the Tailwind `sticky` on the `<header>` element. Pages using `transparentNav={true}` are expected to have a dark hero that can accept the overlay (as with `/about`).

### 3. `about.astro` — cleanup

- Pass `transparentNav={true}` to `<BaseLayout>`.
- Remove the `#site-header` CSS rules from its `<style is:global>` block — these are now in `BaseLayout`. Also remove the `.scroll-bg-page .bg-background-dark` override; it is redundant because `#site-header nav { background-color: transparent }` (specificity 1,0,1) already wins over the `.bg-background-dark` Tailwind utility. Retain all other page-specific section styles (backgrounds, `.about-section`, `.cta-finale`, `.scroll-bg-page`, etc.).
- Remove the scroll-hide/reveal `<script>` block. Retain the swoosh intersection observer logic.

## Files changed

| File                           | Change                                                                              |
| ------------------------------ | ----------------------------------------------------------------------------------- |
| `src/layouts/BaseLayout.astro` | Add `transparentNav` prop, global scroll-hide CSS + JS, conditional transparent CSS |
| `src/pages/about.astro`        | Pass `transparentNav={true}`, remove duplicate CSS + script                         |

## Out of scope

- Applying `transparentNav` to pages other than `/about` — left for future work as each page with a dark hero can opt in independently.
- Any change to nav link content or mobile hamburger behaviour.
