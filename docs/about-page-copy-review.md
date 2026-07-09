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

### Section header _(revised 2026-07-09)_

- **Eyebrow:** Core interactions
- **Heading:** A new editing experience
- **Lede:** The moves you make every session got the same attention as the new features.

### Card — Clip handles _(revised 2026-07-09)_

- **Eyebrow:** Clip handles _(note: unused in render — dead markup, only a fallback for cards with no Demo, which never happens)_
- **Title:** Trim and stretch handles
- **Body:** The top handle trims the clip. The bottom handle stretches it.

### Card — Track meters _(revised 2026-07-09)_

- **Eyebrow:** Track meters _(unused in render, see note above)_
- **Title:** Per-track metering
- **Body:** Track meters show input levels while recording, and playback levels the rest of the time. Use them to dial in your mix.

### Card — Vertical playback meter _(revised 2026-07-09)_

- **Eyebrow:** Vertical playback meter _(unused in render, see note above)_
- **Title:** Vertical playback meter
- **Body:** The playback meter can now be positioned vertically, using the application's full height.
- ⚠️ Dropped "Long-requested" here — the same claim also appears on the "Master meter, your way" card in §4 Fully customisable UI. Revisit that card for the same fix.

### Card — Label tracks _(revised 2026-07-09)_

- **Eyebrow:** Label tracks _(unused in render, see note above)_
- **Title:** Markers and regions
- **Body:** Mark a point or a region on the timeline to annotate your project. Export audio based on your labels.

### Card — Looping _(revised 2026-07-09)_

- **Eyebrow:** Looping _(unused in render, see note above)_
- **Title:** Loop region controls
- **Body:** The loop range now has its own row in the timeline ruler, with a single toggle to turn it on or off.

### Card — Sample editing _(revised 2026-07-09)_

- **Eyebrow:** Sample editing _(unused in render, see note above)_
- **Title:** Direct sample editing
- **Body:** No need to switch to the Draw or Multi-tool. Zoom all the way in and drag the samples directly.

---

## 3. Workspaces

_Source: `src/components/about/Workspaces.jsx`, `src/components/about/workspaces/workspaceConfigs.js`_

### Section header _(lede revised 2026-07-09)_

- **Heading:** Pick a workspace, or build your own
- **Lede:** Each workspace changes the tools in your toolbar, and swaps the ruler between seconds and bars and beats. Build your own to personalise Audacity further. _(marked "for now, we can tweak")_

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
- **Lede** _(revised 2026-07-09)_: Set the new UI up however you like, from accent colors to themes.

### Card — Accent color _(revised 2026-07-09, US spelling per Alex's request)_

- **Title:** Accent color
- **Body:** Choose an accent color and it applies throughout the app.

### Card — Themes _(revised 2026-07-09)_

- **Title:** Themes
- **Body:** Switch between light and dark themes, each with a high-contrast variant.

### Card — Clip colors _(revised 2026-07-09, US spelling per Alex's request)_

- **Title:** Clip colors
- **Body:** Give each clip its own color, or keep the classic look from Audacity 3.

### Card — Vertical playback meter _(revised 2026-07-09 — reused from §2 Improvements throughout, duplicate removed there)_

- **Title:** Vertical playback meter
- **Body:** The playback meter can now be positioned vertically, using the application's full height.

> ⚠️ Spelling note: cards in this section now use US spelling ("color") per explicit request, while the section heading itself ("Fully customisable UI") and the rest of the page use UK spelling ("colour", "customisable", "licence"). Flagged for a possible site-wide spelling decision later.

---

## 5. Audio.com

_Source: `src/components/about/AudioCom.jsx`_

### Section header _(lede revised 2026-07-09)_

- **Heading:** Save to the cloud, share to the world. _(kept — Alex's favourite line so far)_
- **Lede:** Save your projects to the cloud, or share your audio with the world, using audio.com.

### Panel — Project page _(revised 2026-07-09)_

- **Eyebrow:** Project page
- **Title:** Keep track of your cloud projects
- **Body:** Open your cloud projects from the Cloud projects tab, or view them in audio.com.

### Panel — Audio.com _(revised 2026-07-09, heading changed to keep the outward/publish direction)_

- **Eyebrow:** Audio.com
- **Title:** Publish straight to audio.com
- **Body:** Upload your project to your audio.com profile, or export audio directly to your audio.com community.

---

## 6. Effects, redesigned

_Source: `src/components/about/EffectWindows.jsx`_

### Section header _(lede revised 2026-07-09)_

- **Heading:** Effects, redesigned _(kept, unchanged)_
- **Lede:** Every effect window has been rebuilt, inside and out, to match the rest of the app. _(dropped "real-time preview" — factually wrong, not all effects are real-time; some are destructive/offline)_

### Effect card labels (marquee)

Compressor · Filter Curve · Graphic EQ · Limiter · Reverb

---

## 7. MuseHub

_Source: `src/components/about/MuseHub.jsx`_

### Section header _(revised 2026-07-09)_

- **Heading:** Thousands of effects, built in
- **Lede:** Audacity 4 ships with MuseHub built in. Browse the whole catalog, free and paid, without leaving the editor.

### Panel — Get Effects _(revised 2026-07-09)_

- **Eyebrow:** Get Effects _(this eyebrow DOES render on screen for MuseHub/AudioCom panels — unlike the CoreEditing/CustomisableUI cards)_
- **Title:** Browse from inside the app
- **Body:** Open Get Effects and browse the whole MuseHub catalogue, free and paid, without a separate window or a browser tab.

### Panel — Background install _(revised 2026-07-09 — eyebrow and title changed to drop speed/ease claims)_

- **Eyebrow:** Background install _(was "One-click install" — factually wrong per Alex: install is not fast, "it's definitely not a one click process... the process is long and slow")_
- **Title:** Install without leaving the app
- **Body:** Choose a plugin and installation runs in the background while you keep working. It shows up in your effect chain once it's ready, no restart needed.
- Kept: "free and paid" framing (Alex confirmed this is good) and "no restart needed" (not contradicted). Cut: any claim of speed or one-click simplicity.

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
