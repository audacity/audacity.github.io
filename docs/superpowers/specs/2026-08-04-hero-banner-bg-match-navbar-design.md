# Home page hero banner background — design spec

**Date:** 2026-08-04

## Goal

Remove the colour seam between the sticky navbar and the home page hero section by aligning the hero background to the `background-dark` design token.

## Problem

The navbar uses `bg-background-dark` (`#261F43`). The `HeroBanner` section has a hardcoded inline `style="background-color: #0C013A"` — a noticeably darker shade. This produces a visible horizontal stripe where the nav meets the hero.

## Decision

Replace the inline style with the Tailwind utility class `bg-background-dark`. This ties the hero to the same colour token as the navbar so any future token update keeps them in sync automatically.

## Implementation

**File:** `src/components/homepage/HeroBanner.astro`

Remove `style="background-color: #0C013A;"` from the `<section>` element and add `bg-background-dark` to its class list.

## Out of scope

- Applying `transparentNav` to the home page (separate decision).
- Any change to hero content, layout, or other sections.
