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

export const STOPS = [
  {
    id: "intro",
    eyebrow: "A guided tour",
    heading: "See what's new in Audacity 4",
    description: null,
    laptop: { x: "0vw", y: "4vh", scale: 0.514, lidAngle: -85 },
    panelSide: "intro",
    target: null,
    overlay: null,
  },
  {
    id: "workspace",
    eyebrow: "01",
    heading: "A workspace built for the work",
    description:
      "Audacity 4 puts your tracks, transport, meters and effects on one calm canvas. Nothing buried, nothing competing for attention.",
    laptop: { x: "0vw", y: "0vh", scale: 0.62, lidAngle: 0 },
    panelSide: "reveal",
    target: null,
    overlay: null,
  },
  {
    id: "split-tool",
    eyebrow: "02",
    heading: "Split clips where it counts",
    description:
      "Drop the split tool anywhere on a clip and Audacity cuts cleanly on the sample. Two clips, no mess, undo at any time.",
    laptop: { x: "28vw", y: "-2vh", scale: 1.0 },
    panelSide: "left",
    target: null,
    overlay: {
      kind: "split",
      button: { x: 18.52, y: 14.65, w: 2.19, h: 3.89 },
      clip: { x: 23.12, y: 41.94, w: 22.5, h: 15.83 },
      splitX: 0.5,
    },
  },
  {
    id: "drop-anywhere",
    eyebrow: "03",
    heading: "Drop a clip onto another",
    description:
      "Remember 'there is not enough room available to paste the selection'? Gone. Drag a clip onto another and it makes room. Pull the handle back and the audio's still there.",
    laptop: { x: "28vw", y: "-2vh", scale: 1.0 },
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
    heading: "Select many, move once",
    description:
      "Shift-click or lasso to grab any clips across any tracks, then move, trim or fade them as one. Obvious in hindsight. Strange to go back.",
    laptop: { x: "22vw", y: "0vh", scale: 0.85 },
    panelSide: "left",
    target: null,
    overlay: {
      kind: "multi-select",
    },
  },
  {
    id: "clip-groups",
    eyebrow: "05",
    heading: "Group what belongs together",
    description:
      "Bind related takes into a group and they move and edit as one. Permanent, until you ungroup. Nothing destructive about it.",
    laptop: { x: "22vw", y: "0vh", scale: 0.85 },
    panelSide: "left",
    target: null,
    overlay: {
      kind: "clip-groups",
    },
  },
  {
    id: "clip-envelopes",
    eyebrow: "06",
    heading: "Shape volume right on the clip",
    description:
      "Flip on the envelope tool and drop nodes straight on the clip. Curves live with the audio. Move the clip, copy the clip, the shape comes with it.",
    laptop: { x: "28vw", y: "-2vh", scale: 1.0 },
    panelSide: "left",
    target: null,
    overlay: {
      kind: "envelopes",
      button: { x: 16.17, y: 14.65, w: 2.19, h: 3.89 },
      clip: { x: 23.12, y: 41.94, w: 22.5, h: 15.83 },
    },
  },
  {
    id: "outro",
    eyebrow: "That's the tour",
    heading: "And we're only just getting started",
    description: null,
    laptop: { x: "0vw", y: "0vh", scale: 0.571, lidAngle: 0 },
    panelSide: "outro",
    target: null,
    overlay: null,
  },
];
