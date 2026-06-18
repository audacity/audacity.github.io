// Tour stop configs. Coordinates inside the laptop screen are expressed as
// percentages of the native 1280x720 workspace so they stay aligned no matter
// how the laptop is scaled. `laptop.x` and `laptop.y` are viewport-relative
// translates (vw / vh). With transform-origin centered, a positive `x` shifts
// the laptop right (exposing the left side of the canvas), and a negative `x`
// shifts it left (exposing the right side). A small negative `y` lifts the
// laptop to keep the base in frame when it scales up.
//
// The camera path is designed to feel exploratory: closed lid → wide reveal
// of the whole UI → push in on the left of the canvas (split tool) → pan
// across and push in on the right (clip envelopes) → pull back out.

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
    id: "new-ui",
    eyebrow: "01",
    heading: "A workspace built for the work",
    description:
      "Audacity 4 puts your tracks, transport, meters, and effects on one calm canvas — nothing buried, nothing competing for attention.",
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
    laptop: { x: "30vw", y: "2vh", scale: 1.2 },
    panelSide: "left",
    target: { x: 22, y: 24, w: 18, h: 18 },
    overlay: {
      kind: "split",
      button: { x: 18.52, y: 14.65, w: 2.19, h: 3.89 },
      clip: { x: 23.12, y: 41.94, w: 22.5, h: 15.83 },
      splitX: 0.5,
    },
  },
  {
    id: "clip-envelopes",
    eyebrow: "03",
    heading: "Shape volume right on the clip",
    description:
      "Flip on the envelope tool and drop nodes straight on the clip. Curves live with the audio — move the clip, copy the clip, the shape comes with it.",
    laptop: { x: "22vw", y: "-2vh", scale: 1.05 },
    panelSide: "left",
    target: { x: 14, y: 5, w: 8, h: 6 },
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
