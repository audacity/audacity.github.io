# About Page — Copy Review

All user-facing text on `/about` (`src/pages/about.astro`), extracted verbatim in page order.
Branch: `release/audacity-4` · Extracted: 2026-07-09

**Tone of voice target:** Open source, friendly, assertive, confident, excitable — without being braggy, marketing-slogan heavy, or cheesy.

---

## 0. Page metadata

_Source: `src/pages/about.astro`_

| Field            | Copy                                       |
| ---------------- | ------------------------------------------ |
| Page title       | Audacity ® \| Audacity 4                   |
| Meta description | Flagship tour of what's new in Audacity 4. |

---

## 1. Scrolly laptop tour (hero)

_Source: `src/components/about/ScrollyLaptopTour/stops.js`_

### Intro _(revised 2026-07-09)_

- **Eyebrow:** Audacity 4
- **Heading:** You're looking at the new Audacity
- Microcopy below hero: **Scroll** (chevron prompt)

### Stop 01 — Workspace _(revised 2026-07-09)_

- **Eyebrow:** 01
- **Heading:** Everything is where you left it
- **Body:** The interface is new from top to bottom. It still feels like Audacity, and your muscle memory carries over.

### Stop 02 — Split tool _(revised 2026-07-09)_

- **Eyebrow:** 02
- **Heading:** A dedicated split tool
- **Body:** Press S, then click a clip to split it at that point. Ctrl+I (⌘I on Mac) splits at the playhead.

### Stop 03 — Drop anywhere _(revised 2026-07-09)_

- **Eyebrow:** 03
- **Heading:** Drop a clip onto another
- **Body:** Clips can now be dropped on top of each other, and the clip underneath makes room. _(Note: dropped the 'not enough room to paste' error reference — that error wasn't caused by this; factually wrong to link them.)_

### Stop 04 — Multi-select _(revised 2026-07-09)_

- **Eyebrow:** 04
- **Heading:** Multi-select clips
- **Body:** Shift-click to add clips to the selection, then move, trim or stretch them together. _(Note: removed "lasso" and "fade" — neither exists yet; trim/move/stretch are the real operations.)_

### Stop 05 — Clip groups _(revised 2026-07-09)_

- **Eyebrow:** 05
- **Heading:** Group clips
- **Body:** Select a few clips and choose Group clips from the right-click menu. The group moves, trims and stretches as one until you ungroup it.

### Stop 06 — Clip envelopes _(revised 2026-07-09)_

- **Eyebrow:** 06
- **Heading:** Clip gain envelopes
- **Body:** Switch on the envelope tool and click to add points along a clip. Drag them to set the clip's gain, and it stays with the clip when you move or copy it.

### Outro _(removed 2026-07-09)_

- ~~Eyebrow: That's the tour~~ ~~Heading: And we're only just getting started~~
- Cut entirely: a scroll page shouldn't close its own chapters. The tour now ends on stop 06 and flows straight into "Also new / Improvements throughout."

---

## 2. Improvements throughout (CoreEditing carousel)

_Source: `src/components/about/CoreEditing.jsx`_

### Section header

- **Eyebrow:** Also new
- **Heading:** Improvements throughout
- **Lede:** We've touched almost every corner of the app. Here are a few you'll run into in your first session.

### Card — Clip handles

- **Eyebrow:** Clip handles
- **Title:** Trim or stretch, same gesture
- **Body:** Grab a handle on either edge of a clip. Drag to trim, or hold to time-stretch — the source is always there if you change your mind.

### Card — Track meters

- **Eyebrow:** Track meters
- **Title:** See every level at a glance
- **Body:** Per-track meters next to every channel and a master meter in the transport — peaks held, recents shown, calibrated to dBFS.

### Card — Vertical master meter

- **Eyebrow:** Vertical master meter
- **Title:** Stand it up
- **Body:** Long-requested: dock the master meter vertically. Stays out of the transport's way and shows more headroom at a glance.

### Card — Label tracks

- **Eyebrow:** Label tracks
- **Title:** Mark up your project
- **Body:** Drop labels on the timeline to mark takes, edits or sections. They travel with the audio and survive every move.

### Card — Looping

- **Eyebrow:** Looping
- **Title:** Loop any region, instantly
- **Body:** Set a loop range with two clicks and iterate. The range stays visible and you can drag the edges to refine without losing your place.

### Card — Sample editing

- **Eyebrow:** Sample editing
- **Title:** Zoom in, edit samples directly
- **Body:** No mode to enter, no setting to flip. Zoom all the way in and Audacity hands you the samples — drag them by hand and zoom back out.

---

## 3. Workspaces

_Source: `src/components/about/Workspaces.jsx`, `src/components/about/workspaces/workspaceConfigs.js`_

### Section header

- **Heading:** Pick a workspace, or build your own
- **Lede:** Tools, panels, and shortcuts reshape around the way you actually work.

### Workspace tabs (chip labels)

Classic · Music · Modern · Custom

### Workspace blurbs

> ⚠️ Defined in `workspaceConfigs.js` and passed into the preview config, but not currently rendered anywhere in the UI. Review anyway in case they come back.

- **Classic:** As close to Audacity 3 as it gets. Cut, copy, paste right in the transport, time in seconds, no tempo to fight with.
- **Music:** Built for tracking and mixing. Tempo and time signature live in the transport, the ruler counts in bars and beats.
- **Podcast** (not a tab, used as demo project): Voice-first projects with mono speakers, a music bed, and sound effects all on one canvas.
- **Modern:** Envelopes front and centre, cut-copy-paste off the transport. Modern editing trusts you to drag and drop instead.
- **Custom:** Start from any preset and rearrange. Add or remove any tool group, switch ruler formats, and save the result as your own workspace.

---

## 4. Fully customisable UI

_Source: `src/components/about/CustomisableUI.jsx`_

### Section header

- **Heading:** Fully customisable UI
- **Lede:** Workspaces are the starting point. From there, almost everything bends to fit.

### Card — Accent colour

- **Title:** Accent colour
- **Body:** Tag the whole app with the colour you like.

### Card — Themes

- **Title:** Themes
- **Body:** Light, dark, and high contrast — your call.

### Card — Clip colours

- **Title:** Clip colours
- **Body:** Colour-code clips so projects read at a glance.

### Card — Master meter

- **Title:** Master meter, your way
- **Body:** Keep the master meter docked horizontally inside the transport, or stand it up vertically beside the tracks. Long-requested, finally here.

---

## 5. Audio.com

_Source: `src/components/about/AudioCom.jsx`_

### Section header

- **Heading:** Save to the cloud, share to the world.
- **Lede:** Sign in with your audio.com account and the editor and the web meet in the middle — projects on one side, listeners on the other.

### Panel — Project page

- **Eyebrow:** Project page
- **Title:** Every project, one home
- **Body:** Open recents, manage local projects, and pull anything from audio.com into your session without leaving Audacity.

### Panel — Audio.com

- **Eyebrow:** Audio.com
- **Title:** Publish in two clicks
- **Body:** Upload straight from the editor to your audio.com workspace. Listeners get a shareable page, you get cloud storage and revision history.

---

## 6. Effects, redesigned

_Source: `src/components/about/EffectWindows.jsx`_

### Section header

- **Heading:** Effects, redesigned
- **Lede:** Every built-in effect now lives in a focused window — clear controls, real-time preview, and the same vocabulary across the whole suite.

### Effect card labels (marquee)

Compressor · Filter Curve · Graphic EQ · Limiter · Reverb

---

## 7. MuseHub

_Source: `src/components/about/MuseHub.jsx`_

### Section header

- **Heading:** And even more from MuseHub
- **Lede:** Audacity 4 ships with MuseHub built in — thousands of plugins, instruments, and samples, browsed and installed without ever leaving the editor.

### Panel — Get Effects

- **Eyebrow:** Get Effects
- **Title:** Browse from inside the app
- **Body:** Open Get Effects and you're looking at the whole MuseHub catalogue — free and paid — without a separate window or a browser tab.

### Panel — One-click install

- **Eyebrow:** One-click install
- **Title:** Pick it, install it, it's there
- **Body:** Choose a plugin, install in the background, and it shows up in your effect chain the next time you reach for it. No restarts.

---

## 8. Under the hood

_Source: `src/components/about/UnderTheHood.jsx`_

### Section header

- **Eyebrow:** Foundation
- **Heading:** Under the hood
- **Lede:** The work you can't see — the foundation that makes everything else feel quick and dependable.
- **Button:** View the source → github.com/audacity/audacity

### Column — Framework

- **Tag:** Framework
- **Headline:** Built on Qt
- **Body:** The interface is rebuilt on Qt — one modern codebase, native on macOS, Windows and Linux.

### Column — Plugins

- **Tag:** Plugins
- **Headline:** LV2 + VST3 + AU
- **Body:** Open-standard LV2 plugins load right alongside VST3 and Audio Units — no wrappers required.

### Column — Compatibility

- **Tag:** Compatibility
- **Headline:** .aup3 opens natively
- **Body:** Every .aup3 file from Audacity 3 opens directly in Audacity 4 — your sessions, edits, and undo history come with you.

### Column — License

- **Tag:** License
- **Headline:** Free, GPL v3
- **Body:** Same free, open-source licence Audacity has always shipped under — auditable, redistributable, no strings attached.

---

## 9. Closing CTA

_Source: `src/components/about/CtaSection.jsx`_

- **Heading:** Free, and always will be.
- **Body:** Audacity 4 is free, open source, and available now for macOS, Windows, and Linux.
- **Primary button:** Download Audacity 4 → `/download`
- **Secondary button:** Read the manual → `/manual`

---

## Appendix — Functional / accessibility strings

Not marketing copy, but user-visible or read by screen readers:

- Tour progress dots: `Jump to stop {n}: {heading}` (aria-label), nav labelled "Tour progress"
- Workspace preview: `{label} workspace preview` (aria-label on tab panel)
- Audio.com / MuseHub panel images: alt text is `{title} — {eyebrow}`
- Effect cards: alt text is `{name} effect window`
- Demo mockup UI text (context menu in clip-groups demo): Rename clip · Cut · Copy · Group clips · Delete
- Demo track/clip names (visible in animated mockups): Host, Guest, Music bed, Intro theme, Outro music, Vocals, Harmonies, Drums, Kick & Snare, Bass, Synth lead, Take 1/2, Verse 1/2, Chorus, Bridge, Intro, Outro, Mix bus, Voice, Ambient, FX, Room tone, etc.

## Notes for review

- British vs American spelling is mixed: "customisable" / "colour" / "licence" (UK) vs "License" tag heading (US). Worth picking a side.
- "Long-requested" appears twice (Vertical master meter card and Master meter, your way card) — the two cards also cover the same feature from different angles.
- The Audio.com heading ends with a period ("Save to the cloud, share to the world.") while most other headings don't — CTA heading also has one ("Free, and always will be."). Check intentionality.
- Workspace blurbs are currently unrendered (see §3) — decide whether to wire them up or cut them.
