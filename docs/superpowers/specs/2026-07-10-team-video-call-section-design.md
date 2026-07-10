# Team "Video Call" Section — Design Spec

**Date:** 2026-07-10
**Page:** `src/pages/about.astro`
**Status:** Approved design, pending implementation plan

## Purpose

The Audacity team is 100% remote — the shared daily reality is a video call, so
we introduce the team _as_ a video call. A mock call interface auto-spotlights
each teammate, with a grid view and a hidden-gag chat panel. Honest to how the
team actually works, and playful without being cheesy.

Not branded as Zoom. Generic video-call visual language only (dark tiles, green
active-speaker ring, standard control bar). Referred to in any copy as "a video
call," never "Zoom." No third-party logos, wordmarks, or brand colours.

## Placement

A new `about-section` in `about.astro`, inserted **immediately before the CTA
section** ("Free, and always will be."):

```
… UnderTheHood → [Team call section] → CTA
```

The page uses per-section background colours plus `Interstitial` swoosh bridges
(see `about.astro` `<style>`). The team section gets its own dark call-surface
background (~`#0c0e12`) and the interstitial chain is adjusted so the swooshes
still bridge cleanly: `under-the-hood (#120927)` → team → `cta (rgb(8,6,28))`.
Exact interstitial placement/colours finalised during build to match the
existing swoosh system.

## Layout & views

Two view modes, switched by a **Speaker ⇄ Grid** segmented toggle (top-right of
the call frame):

- **Speaker view (default):** one large active-speaker tile on the left, the
  remaining teammates as a side grid on the right (approved "Layout C").
- **Grid view:** all 11 tiles equal size (gallery), the active-speaker ring
  moving between them.

Call chrome:

- **Top bar:** the view toggle only. No recording indicator, no participant
  count (both explicitly cut).
- **Control bar (bottom):** mute, video, raise-hand, chat, people, red leave.
  Generic inline-SVG icons.

## Motion

- The active speaker **auto-cycles** through the roster on a timer (~3–4s per
  person), the name/role label and green ring moving with it.
- **Hover or click any tile** promotes that person to active speaker and
  **pauses** auto-cycling (visitor takes over the call). Auto-cycle resumes
  after ~8s of no interaction.
- No "Speaking" badge / no audio implication.

## Interactivity scope (v1)

**Interactive:** the Speaker/Grid toggle, tile hover/click takeover, and the
**Chat** button (opens the chat panel). Everything else on the control bar
(mute, video, raise-hand, people, leave) is **decorative set-dressing** — no
behaviour, and marked non-interactive for assistive tech. Raise-hand / people
behaviours are explicitly deferred to a possible v2.

## Chat panel

Clicking **Chat** slides in a right-hand panel showing a **scripted, static team
conversation** (not real, not live). The Chat control shows an active state
while open; a close control dismisses it. In speaker view the video area
reflows to make room (speaker + filmstrip on the left, chat on the right).

The conversation script is **placeholder** in this build (light dev/audio
banter). Final copy is a separate copy pass owned by the design lead, and any
lines attributed to a named teammate should be cleared with that person before
launch. Script lives in its own data module so it can be edited without touching
component code.

## Roster & data

11 teammates (name + role). Locations not collected yet → **role labels only**
for now; location is an optional future field.

1. Alex Dawson — Product Designer
2. Anton Chinakov — QA Manual Engineer
3. Dmitry Makarenko — C++ Developer
4. Elnur Ismailzada — C++ Developer
5. Gabriel Sartori — C++ Developer
6. Grzegorz Wojciechowski — C++ Developer
7. Johan Althoff — Audacity Product Design
8. Matthieu Hodgkinson — Senior Audio Developer
9. Paul Martin — Audio Developer
10. Sergey Lapysh — QA Manual Engineer
11. Yana Larina — Project Manager

**Photos:** real webcam-style headshots arriving today. Build with
**initials-on-coloured-circle placeholders**; photos drop into `public/` and are
referenced from the roster module, so swapping them in is a data-only change.

## Component architecture

Follows existing about-page patterns: a React island imported into `about.astro`
with `client:visible`, wrapped in an `about-section` div, reusing the shared
`useEntrance` / `useInView` / `useHoverCapable` hooks.

- **`TeamCall.jsx`** — orchestrator. Owns state: current view (`speaker`|`grid`),
  active-speaker index, auto-cycle timer, `chatOpen`. Renders top bar, stage,
  control bar, chat panel.
- **`teamRoster.js`** — roster data: `{ id, name, role, photo, initials,
avatarColor }[]`.
- **`CallTile.jsx`** — one video tile. Props for size variant (`speaker` big /
  `grid` / `filmstrip` small), photo-or-placeholder, name/role label, active
  ring. Rendered as a `<button>` so it's keyboard-focusable and click-to-spotlight
  works for everyone.
- **`CallControls.jsx`** — bottom control bar. The decorative buttons + the live
  Chat toggle + Leave.
- **`ChatPanel.jsx`** — slide-in chat rendering the script.
- **`chatScript.js`** — the conversation lines: `{ authorId, text }[]`.

Each unit has one job and a clear interface; `TeamCall` is the only stateful
piece, the rest are presentational.

## Responsive

- **Desktop/tablet:** full experience (both views, side grid, chat panel).
- **Mobile (small screens):** drop to **speaker-view only, auto-cycling**, no
  side grid and no view toggle (grid of 11 is unreadable on a phone). Chat panel
  becomes a full-width overlay rather than a side rail. Exact breakpoint matches
  the page's existing `lg`/`sm` usage.

## Accessibility

- **Reduced motion:** respect `prefers-reduced-motion` — no auto-cycling; render
  a static, readable state (matches how the laptop tour handles reduced motion).
- **Keyboard:** tiles are focusable buttons; the view toggle and chat are
  standard buttons. Visible focus states.
- **Decorative controls:** mute/video/raise-hand/people/leave are `aria-hidden`
  / non-focusable so screen-reader users aren't offered fake buttons.
- **Images:** each photo/placeholder has the teammate's name as alt text.
- The section is fundamentally a **list of team members**; it must be
  understandable as such without the animation.

## Out of scope (v1)

- Real audio / any actual call functionality.
- Functional mute/video/raise-hand/people/leave behaviours.
- Real-time or editable chat.
- Locations on tiles.
- Final chat script copy (separate copy pass).

## Open items carried into build

- Exact interstitial colours/placement to bridge the new section into the swoosh
  chain.
- Final placeholder→photo swap once assets land today.
