// Tour stop configs. Coordinates inside the laptop screen are expressed as
// percentages of the native 1280x720 workspace so they stay aligned no matter
// how the laptop is scaled. `laptop.x` and `laptop.y` are viewport-relative
// translates (vw / vh). With transform-origin centered, a positive `x` shifts
// the laptop right; a small negative `y` lifts it to keep the base in frame
// when it scales up.

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
    id: "full-ui",
    eyebrow: "01",
    heading: "Your whole project, at a glance",
    description:
      "Audacity 4 lays everything you need on one canvas — tracks, transport, meters, and effects all visible without burrowing through menus.",
    laptop: { x: "0vw", y: "0vh", scale: 0.571, lidAngle: 0 },
    panelSide: null,
    target: null,
    overlay: null,
    noScrollPanel: true,
  },
  {
    id: "clip-handles",
    eyebrow: "02",
    heading: "Trim from either edge",
    description:
      "Every clip has handles on both sides. Drag them in to trim, drag them back out to recover audio — the source material is always there.",
    laptop: { x: "44vw", y: "6vh", scale: 1.4 },
    panelSide: "left",
    target: { x: 25.68, y: 30.45, w: 8.23, h: 16.86 },
    overlay: {
      kind: "trim",
      clip: { x: 25.68, y: 30.45, w: 8.23, h: 16.86 },
      endW: 5.06,
      stretchClip: { x: 40.48, y: 63.5, w: 4.53, h: 14.56 },
      stretchEndW: 7.36,
    },
  },
  {
    id: "multi-select",
    eyebrow: "03",
    heading: "Select many, edit once",
    description:
      "Shift-click or lasso to grab any combination of clips across any tracks. Move, fade, or process them together — the project keeps up.",
    laptop: { x: "26vw", y: "-2vh", scale: 0.857 },
    panelSide: "left",
    target: { x: 22, y: 24, w: 22, h: 56 },
    overlay: {
      kind: "select-demo",
      targets: [
        { id: "v1", x: 26.3, y: 32 },
        { id: "v2", x: 34.7, y: 32 },
        { id: "d1", x: 23.8, y: 69 },
        { id: "d3", x: 34.4, y: 69 },
      ],
    },
  },
  {
    id: "clip-groups",
    eyebrow: "04",
    heading: "Group clips that belong together",
    description:
      "Bind related takes into a single group so they move and edit as one. Ungroup any time — nothing is destructive.",
    laptop: { x: "-26vw", y: "-2vh", scale: 0.971 },
    panelSide: "right",
    target: { x: 22, y: 24, w: 17, h: 16 },
    overlay: {
      kind: "group",
      clips: [
        { x: 22, y: 24, w: 9, h: 16 },
        { x: 32, y: 24, w: 7, h: 16 },
      ],
    },
  },
  {
    id: "drop-anywhere",
    eyebrow: "05",
    heading: "Drop clips anywhere",
    description:
      "Drop a clip on top of another and Audacity sorts it out. Overlaps preserve both clips, so you can layer takes and pick the best parts later.",
    laptop: { x: "26vw", y: "-2vh", scale: 1.0 },
    panelSide: "left",
    target: { x: 22, y: 24, w: 12, h: 16 },
    overlay: {
      kind: "overlap",
      base: { x: 22, y: 24, w: 9, h: 16 },
      drop: { x: 27, y: 26, w: 9, h: 16 },
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
