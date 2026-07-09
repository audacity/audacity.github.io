// Tour stop configs. Coordinates inside the laptop screen are expressed as
// percentages of the native 1280x720 workspace so they stay aligned no matter
// how the laptop is scaled. `laptop.x` and `laptop.y` are viewport-relative
// translates (vw / vh). With transform-origin centered, a positive `x` shifts
// the laptop right (exposing the left side of the canvas), and a negative `x`
// shifts it left (exposing the right side). A small negative `y` lifts the
// laptop to keep the base in frame when it scales up.
//
// The tour is one continuous narrative: each stop's edit persists into every
// subsequent stop. The laptop never resets — it just navigates around the
// canvas as new edits stack on top of the last.

// Reusable canvas coords (in % of the laptop screen aspect-[16/9] container)
//   Music bed s1: { x: 23.12, y: 41.94, w: 22.50, h: 15.83 }
//   Host h3 "Follow up": time 11.4, duration 3.2 → x≈47.66%, w≈10.00%
//   Envelope toggle:    { x: 16.17, y: 14.65, w: 2.19, h: 3.89 }
//   Split tool toggle:  { x: 18.52, y: 14.65, w: 2.19, h: 3.89 }
//
// mobileFocus: cinematic zoom/pan on mobile. { x, y } are % of the laptop
// element (NOT the screen area — accounts for bezels + base) that should
// land at the viewport centre; `zoom` scales the laptop up so detail is
// visible. Omit or set zoom=1 for a full-laptop view (intro/reveal).

export const STOPS = [
  {
    id: "intro",
    eyebrow: "Audacity 4",
    heading: "You're looking at the new Audacity",
    description: null,
    // Smaller + lower during the intro so the title sits above the laptop
    // without collision. Scrolling into the workspace stop expands the laptop
    // back to its full tour scale, which reads as a subtle zoom-in.
    laptop: { x: "0vw", y: "4vh", scale: 0.48, lidAngle: -85 },
    mobileFocus: { x: 50, y: 50, zoom: 0.72 },
    panelSide: "intro",
    target: null,
    overlay: null,
  },
  {
    id: "workspace",
    eyebrow: "01",
    heading: "Everything is where you left it",
    description:
      "The interface is new from top to bottom. It still feels like Audacity, and your muscle memory carries over.",
    // Per-stop heading tint. Walks a warm→cool pastel sequence so as the
    // reader scrolls the heading swap registers as a hue shift as well as
    // a text change (pink → coral → gold → mint → sky → lavender). All
    // sit in the same soft-brightness range so they read as a coordinated
    // palette rather than a random set.
    accentColor: "#FFB3BE",
    laptop: { x: "0vw", y: "0vh", scale: 0.62, lidAngle: 0 },
    panelSide: "reveal",
    target: null,
    overlay: null,
  },
  {
    id: "split-tool",
    eyebrow: "02",
    heading: "A dedicated split tool",
    description:
      "Press S, then click a clip to split it at that point. Ctrl+I (⌘I on Mac) splits at the playhead.",
    accentColor: "#FFB88A",
    laptop: { x: "28vw", y: "-2vh", scale: 1.0 },
    mobileFocus: { x: 34, y: 43, zoom: 2.1 },
    panelSide: "left",
    target: null,
    overlay: {
      kind: "split",
      button: { x: 18.52, y: 14.65, w: 2.19, h: 3.89 },
      clip: { x: 23.12, y: 41.94, w: 22.5, h: 15.83 },
      // Two cuts (as fractions of the clip's duration) — after the
      // first the LEFT half (s1) is selected, after the second the
      // selection moves to the middle clip (left half of the new cut).
      splits: [0.35, 0.7],
    },
  },
  {
    id: "drop-anywhere",
    eyebrow: "03",
    heading: "Drop a clip onto another",
    description:
      "Clips can now be dropped on top of each other, and the clip underneath makes room.",
    accentColor: "#F5D97A",
    laptop: { x: "28vw", y: "-2vh", scale: 1.0 },
    mobileFocus: { x: 42, y: 42, zoom: 1.75 },
    panelSide: "left",
    target: null,
    overlay: {
      kind: "drop",
      // Drags s1-b (the second half from the split) right onto neighbouring
      // host clip area. The clip underneath trims to make room.
    },
  },
  {
    id: "multi-select",
    eyebrow: "04",
    heading: "Multi-select clips",
    description:
      "Shift-click to add clips to the selection, then move, trim or stretch them together.",
    accentColor: "#9EE0B8",
    laptop: { x: "22vw", y: "0vh", scale: 0.85 },
    mobileFocus: { x: 47, y: 41, zoom: 1.5 },
    panelSide: "left",
    target: null,
    overlay: {
      kind: "multi-select",
    },
  },
  {
    id: "clip-groups",
    eyebrow: "05",
    heading: "Group clips",
    description:
      "Select a few clips and choose Group clips from the right-click menu. The group moves, trims and stretches as one until you ungroup it.",
    accentColor: "#8ECEE8",
    laptop: { x: "22vw", y: "0vh", scale: 0.85 },
    mobileFocus: { x: 48, y: 38, zoom: 1.8 },
    panelSide: "left",
    target: null,
    overlay: {
      kind: "clip-groups",
      // h2 (Host) + g2 (Guest) at their post-multi-select positions —
      // the clip-groups animation opens h2's context menu, picks the
      // "Group clips" action, then drags the new group as one unit.
      h2Clip: { x: 43.12, y: 25.83, w: 8.125, h: 15.83 },
      g2Clip: { x: 51.87, y: 58.05, w: 10.625, h: 15.83 },
      // Context-menu button sits at the top-right of the clip header.
      menuButton: { x: 50.5, y: 26.4, w: 1.2, h: 1.6 },
      // Where the context menu opens. "Group clips" is the 4th item.
      menuPos: { x: 50.7, y: 27.8 },
      groupItemX: 51.7,
      groupItemY: 40.7,
    },
  },
  {
    id: "clip-envelopes",
    eyebrow: "06",
    heading: "Clip gain envelopes",
    description:
      "Switch on the envelope tool and click to add points along a clip. Drag them to set the clip's gain, and it stays with the clip when you move or copy it.",
    accentColor: "#C8B5F5",
    laptop: { x: "28vw", y: "-2vh", scale: 1.0 },
    mobileFocus: { x: 28, y: 43, zoom: 2.4 },
    panelSide: "left",
    target: null,
    overlay: {
      kind: "envelopes",
      button: { x: 16.17, y: 14.65, w: 2.19, h: 3.89 },
      // s1 is now the FIRST split (~35% of the original 7.2s clip) — the
      // envelope demo points at this shorter clip, so coords reflect
      // the post-split width (22.5 * 0.35 ≈ 7.875).
      clip: { x: 23.12, y: 41.94, w: 7.875, h: 15.83 },
    },
  },
];
