import React, { useEffect, useRef, useState } from "react";
import LaptopFrame from "./LaptopFrame.jsx";
import TourOverlay from "./TourOverlay.jsx";
import TourPanel from "./TourPanel.jsx";
import MobileFallback from "./MobileFallback.jsx";
import ScrollIndicator from "./ScrollIndicator.jsx";
import IntroOverlay from "./IntroOverlay.jsx";
import WorkspaceCanvas from "../workspaces/WorkspaceCanvas.jsx";
import { WORKSPACE_CONFIGS } from "../workspaces/workspaceConfigs.js";
import { STOPS } from "./stops.js";
import { generateDecayingSineWave } from "@dilsonspickles/components";

function useDesktopAnimation() {
  const [enabled, setEnabled] = useState(null);
  useEffect(() => {
    const mqMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mqWidth = window.matchMedia("(min-width: 1024px)");
    const compute = () => setEnabled(mqWidth.matches && !mqMotion.matches);
    compute();
    mqMotion.addEventListener("change", compute);
    mqWidth.addEventListener("change", compute);
    return () => {
      mqMotion.removeEventListener("change", compute);
      mqWidth.removeEventListener("change", compute);
    };
  }, []);
  return enabled;
}

function ScrollyLaptopTour() {
  const enabled = useDesktopAnimation();
  if (enabled === null) {
    return <section style={{ minHeight: "100vh" }} aria-hidden />;
  }
  if (!enabled) return <MobileFallback />;
  return <DesktopTour />;
}

// Cumulative canvas-state derivation. Returns the canvas state that should be
// applied after the given stop's edit lands. Each stop layers its edit on top
// of every preceding stop's edit so the laptop appears to carry every change
// the tour has made so far.

// s1 (Music bed → "Intro theme") starts at 0.1s for 7.2s. The split-tool stop
// cuts it twice at SPLIT_FRAC_A and SPLIT_FRAC_B (fractions of the duration),
// leaving three clips. Tracking the waveform slices and frac constants in
// one place so the animation and the end-state can stay aligned.
const S1_START = 0.1;
const S1_DURATION = 7.2;
const SPLIT_FRAC_A = 0.35;
const SPLIT_FRAC_B = 0.7;
const FULL_S1_WAVEFORM = generateDecayingSineWave(S1_DURATION);
const SPLIT_IDX_A = Math.floor(FULL_S1_WAVEFORM.length * SPLIT_FRAC_A);
const SPLIT_IDX_B = Math.floor(FULL_S1_WAVEFORM.length * SPLIT_FRAC_B);
const S1_PART_A = FULL_S1_WAVEFORM.slice(0, SPLIT_IDX_A);
const S1_PART_B = FULL_S1_WAVEFORM.slice(SPLIT_IDX_A, SPLIT_IDX_B);
const S1_PART_C = FULL_S1_WAVEFORM.slice(SPLIT_IDX_B);
const S1_A_DUR = S1_DURATION * SPLIT_FRAC_A;
const S1_B_DUR = S1_DURATION * (SPLIT_FRAC_B - SPLIT_FRAC_A);
const S1_C_DUR = S1_DURATION * (1 - SPLIT_FRAC_B);
const S1_A_START = S1_START;
const S1_B_START = S1_START + S1_A_DUR;
const S1_C_START = S1_START + S1_DURATION * SPLIT_FRAC_B;

// drop-anywhere: the rightmost split (s1-c) is the SMALLER clip we pick up,
// dragged onto s2 (the bigger 5s "Outro music"). s2 gets sliced at the
// dropped clip's edges so it visually splits into two; the smaller clip
// eats the audio underneath where it landed.
const S2_START = 9.0;
const S2_DURATION = 5.0;
const DROP_START = 10.5;
const DROP_END = DROP_START + S1_C_DUR;

function computeCumulativeState(stopIndex) {
  const overrides = {};
  const extraByTrack = {};
  let envMode = undefined;

  for (let i = 0; i <= stopIndex; i++) {
    const id = STOPS[i]?.id;
    if (!id) continue;

    if (id === "split-tool") {
      // Two cuts at SPLIT_FRAC_A and SPLIT_FRAC_B → three clips. In real
      // Audacity, splitting selects the LEFT half of the cut; after the
      // second cut the middle clip (left half of cut B) carries the
      // selection.
      overrides.s1 = {
        ...(overrides.s1 || {}),
        duration: S1_A_DUR,
        waveform: S1_PART_A,
        focused: false,
        selected: false,
      };
      extraByTrack[1] = [
        {
          id: "s1-b",
          name: "Intro theme",
          start: S1_B_START,
          duration: S1_B_DUR,
          waveform: S1_PART_B,
          selected: true,
          focused: true,
        },
        {
          id: "s1-c",
          name: "Intro theme",
          start: S1_C_START,
          duration: S1_C_DUR,
          waveform: S1_PART_C,
          focused: false,
        },
      ];
    }

    if (id === "drop-anywhere") {
      // Drop s1-c onto s2: s1-c moves to DROP_START, s2 splits at the
      // dropped clip's edges, and selection transfers to the dropped
      // clip (real-app behavior: the dropped clip becomes the focus).
      extraByTrack[1] = extraByTrack[1] || [];
      const middleClip = extraByTrack[1].find((c) => c.id === "s1-b");
      if (middleClip) {
        middleClip.selected = false;
        middleClip.focused = false;
      }
      const sourceClip = extraByTrack[1].find((c) => c.id === "s1-c");
      if (sourceClip) {
        sourceClip.start = DROP_START;
        sourceClip.selected = true;
        sourceClip.focused = true;
      }
      // s2 keeps its original start but truncates to where the drop
      // begins, and we add s2-b for the right-hand remainder.
      overrides.s2 = {
        ...(overrides.s2 || {}),
        duration: DROP_START - S2_START,
      };
      if (!extraByTrack[1].find((c) => c.id === "s2-b")) {
        extraByTrack[1].push({
          id: "s2-b",
          name: "Outro music",
          start: DROP_END,
          duration: S2_START + S2_DURATION - DROP_END,
        });
      }
    }

    if (id === "multi-select") {
      // h2 + g2 selected, shifted right by 0.4s together. The dropped
      // s1-c also loses its previous selection — only the multi-select
      // pair is now active.
      const droppedClip = extraByTrack[1]?.find((c) => c.id === "s1-c");
      if (droppedClip) {
        droppedClip.selected = false;
        droppedClip.focused = false;
      }
      overrides.h2 = {
        ...(overrides.h2 || {}),
        selected: true,
        start: 5.4,
      };
      overrides.g2 = {
        ...(overrides.g2 || {}),
        selected: true,
        start: 8.2,
      };
    }

    if (id === "clip-groups") {
      overrides.h2 = {
        ...(overrides.h2 || {}),
        selected: true,
      };
      overrides.g2 = {
        ...(overrides.g2 || {}),
        selected: true,
      };
    }

    if (id === "clip-envelopes") {
      envMode = true;
      overrides.s1 = {
        ...(overrides.s1 || {}),
        envelopePoints: [
          { time: 0.5, db: 0 }, // 20% into s1's 2.52s
          { time: 1.9, db: -25 }, // 75% into s1's 2.52s
        ],
      };
    }
  }

  const hasOverrides = Object.keys(overrides).length > 0;
  const hasExtras = Object.keys(extraByTrack).length > 0;
  return {
    clipOverrides: hasOverrides ? overrides : null,
    extraClips: hasExtras ? extraByTrack : null,
    envelopeMode: envMode,
  };
}

function DesktopTour() {
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const laptopRef = useRef(null);
  const lidRef = useRef(null);
  const tourPanelRef = useRef(null);
  const panelRefs = useRef([]);
  const [stopIndex, setStopIndex] = useState(0);
  const [clipOverrides, setClipOverrides] = useState(null);
  const [extraClips, setExtraClips] = useState(null);
  const [splitFrame, setSplitFrame] = useState(null);
  const [envelopeMode, setEnvelopeMode] = useState(undefined);
  const [envelopeFrame, setEnvelopeFrame] = useState(null);
  const [renderStopId, setRenderStopId] = useState(STOPS[0].id);
  const [liveLidAngle, setLiveLidAngle] = useState(null);
  const config = WORKSPACE_CONFIGS.podcast;
  const scrolledStop = STOPS[stopIndex];
  const stop = STOPS.find((s) => s.id === renderStopId) ?? scrolledStop;
  const introStop = STOPS.find((s) => s.panelSide === "intro") ?? STOPS[0];
  const outroStop =
    STOPS.find((s) => s.panelSide === "outro") ?? STOPS[STOPS.length - 1];

  useEffect(() => {
    let cleanup = () => {};
    let cancelled = false;

    (async () => {
      const gsapMod = await import("gsap");
      const stMod = await import("gsap/ScrollTrigger");
      if (cancelled) return;
      const gsap = gsapMod.default;
      const ScrollTrigger = stMod.ScrollTrigger || stMod.default;
      gsap.registerPlugin(ScrollTrigger);

      const triggers = panelRefs.current
        .map((panelEl, i) => {
          if (!panelEl) return null;
          return ScrollTrigger.create({
            trigger: panelEl,
            start: "top center",
            end: "bottom center",
            onEnter: () => setStopIndex(i),
            onEnterBack: () => setStopIndex(i),
          });
        })
        .filter(Boolean);

      const introIdx = STOPS.findIndex((s) => s.id === "intro");
      const introPanel = panelRefs.current[introIdx];
      const closedAngle = STOPS[introIdx]?.laptop?.lidAngle ?? -85;
      if (introPanel) {
        const lidTrigger = ScrollTrigger.create({
          trigger: introPanel,
          start: "top top",
          end: "bottom top",
          scrub: true,
          onUpdate: (self) => {
            // Write the lid transform straight to the DOM during scrub so
            // scrolling doesn't trigger 60 React re-renders per second.
            const angle = closedAngle + -closedAngle * self.progress;
            if (lidRef.current) {
              lidRef.current.style.transition = "none";
              lidRef.current.style.transform = `rotateX(${angle}deg)`;
            }
          },
          onLeave: () => {
            // Hand control back to React for the discrete stop state.
            if (lidRef.current) lidRef.current.style.transition = "";
            setLiveLidAngle(null);
          },
          onLeaveBack: () => {
            if (lidRef.current) lidRef.current.style.transition = "";
            setLiveLidAngle(closedAngle);
          },
        });
        triggers.push(lidTrigger);
      }

      cleanup = () => {
        triggers.forEach((t) => t.kill());
      };
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  useEffect(() => {
    setRenderStopId(scrolledStop.id);
  }, [scrolledStop.id]);

  // Apply the cumulative state for the current stop whenever we move between
  // stops. Per-stop animations may transiently override this during their
  // gesture, but the canonical state is whatever the cumulative computation
  // says — so scrolling back and forth lands on consistent canvas state.
  useEffect(() => {
    const next = computeCumulativeState(stopIndex);
    setClipOverrides(next.clipOverrides);
    setExtraClips(next.extraClips);
    setEnvelopeMode(next.envelopeMode);
  }, [stopIndex]);

  useEffect(() => {
    // Legacy clip-handles branch removed; the equivalent overrides are now
    // applied via computeCumulativeState. New stops drop-anywhere,
    // multi-select, and clip-groups also rely on cumulative state for their
    // canvas changes until per-gesture animations are layered in.
    if (false && stop.id === "clip-handles") {
      const CYCLE = 8000;
      const V1_FULL = 2.6;
      const V1_TRIM = 1.6;
      const D4_FULL = 1.6;
      const D4_STRETCH = 2.6;
      const D4_SF_MAX = D4_STRETCH / D4_FULL;
      const ease = (u) =>
        u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      const t0 = performance.now();
      let raf;
      const tick = (now) => {
        const t = ((now - t0) % CYCLE) / CYCLE;
        if (t < 0.5) {
          let dur = V1_FULL;
          if (t < 0.08) dur = V1_FULL;
          else if (t < 0.2)
            dur = V1_FULL + (V1_TRIM - V1_FULL) * ease((t - 0.08) / 0.12);
          else if (t < 0.32) dur = V1_TRIM;
          else if (t < 0.44)
            dur = V1_TRIM + (V1_FULL - V1_TRIM) * ease((t - 0.32) / 0.12);
          setClipOverrides({
            v1: {
              duration: dur,
              fullDuration: V1_FULL,
              selected: true,
              focused: true,
            },
          });
        } else {
          let dur = D4_FULL;
          let sf = 1;
          if (t < 0.55) {
            dur = D4_FULL;
            sf = 1;
          } else if (t < 0.67) {
            const p = ease((t - 0.55) / 0.12);
            dur = D4_FULL + (D4_STRETCH - D4_FULL) * p;
            sf = 1 + (D4_SF_MAX - 1) * p;
          } else if (t < 0.79) {
            dur = D4_STRETCH;
            sf = D4_SF_MAX;
          } else if (t < 0.91) {
            const p = ease((t - 0.79) / 0.12);
            dur = D4_STRETCH + (D4_FULL - D4_STRETCH) * p;
            sf = D4_SF_MAX + (1 - D4_SF_MAX) * p;
          }
          setClipOverrides({
            d4: {
              duration: dur,
              fullDuration: D4_FULL,
              selected: true,
              focused: true,
              stretchFactor: sf,
            },
          });
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }

    if (false && stop.id === "multi-select") {
      const CYCLE = 7000;
      const STARTS = { v1: 0.4, v2: 3.4, d1: 0.1, d3: 3.5 };
      const VOCALS = new Set(["v1", "v2"]);
      const MOVE_OFFSET = 0.35;
      const ease = (u) =>
        u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      const t0 = performance.now();
      let raf;
      const tick = (now) => {
        const t = ((now - t0) % CYCLE) / CYCLE;
        let selected = [];
        let focusVocals = false;
        let focusDrums = false;
        let offset = 0;

        if (t < 0.05) {
          // empty
        } else if (t < 0.15) {
          selected = ["v1"];
          focusVocals = true;
        } else if (t < 0.28) {
          selected = ["v1", "v2"];
          focusVocals = true;
        } else if (t < 0.42) {
          selected = ["v1", "v2", "d1"];
          focusDrums = true;
        } else if (t < 0.58) {
          selected = ["v1", "v2", "d1", "d3"];
          focusDrums = true;
        } else if (t < 0.68) {
          selected = ["v1", "v2", "d1", "d3"];
          focusDrums = true;
          offset = MOVE_OFFSET * ease((t - 0.58) / 0.1);
        } else if (t < 0.82) {
          selected = ["v1", "v2", "d1", "d3"];
          focusDrums = true;
          offset = MOVE_OFFSET;
        } else if (t < 0.92) {
          selected = ["v1", "v2", "d1", "d3"];
          focusDrums = true;
          offset = MOVE_OFFSET * (1 - ease((t - 0.82) / 0.1));
        } else if (t < 0.95) {
          selected = ["v1", "v2", "d1", "d3"];
          focusDrums = true;
        }

        if (selected.length === 0) {
          setClipOverrides(null);
        } else {
          const next = {};
          for (const id of selected) {
            const onVocals = VOCALS.has(id);
            next[id] = {
              selected: true,
              focused: onVocals ? focusVocals : focusDrums,
              start: STARTS[id] + offset,
            };
          }
          setClipOverrides(next);
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }

    if (false && stop.id === "clip-groups") {
      const CYCLE = 10000;
      const t0 = performance.now();
      let raf;
      const tick = (now) => {
        const t = ((now - t0) % CYCLE) / CYCLE;
        let selected = [];
        let focusVocals = false;
        if (t < 0.14) {
          // empty / approaching
        } else if (t < 0.24) {
          selected = ["v1"];
          focusVocals = true;
        } else if (t < 0.56) {
          // v2 added (shift-click) and stays through menu interaction
          selected = ["v1", "v2"];
          focusVocals = true;
        } else if (t < 0.59) {
          // deselect about to happen
          selected = ["v1", "v2"];
          focusVocals = true;
        } else if (t < 0.69) {
          // deselected, traveling to v1
        } else if (t < 0.96) {
          // single-click on v1 selects both because they're grouped
          selected = ["v1", "v2"];
          focusVocals = true;
        }

        if (selected.length === 0) {
          setClipOverrides(null);
        } else {
          const next = {};
          for (const id of selected) {
            next[id] = { selected: true, focused: focusVocals };
          }
          setClipOverrides(next);
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }

    if (stop.id === "split-tool" && stop.overlay?.kind === "split") {
      const {
        button,
        clip,
        splits = [SPLIT_FRAC_A, SPLIT_FRAC_B],
      } = stop.overlay;
      const [fracA, fracB] = splits;
      const easeInOut = (u) =>
        u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      const lerp = (a, b, t) => a + (b - a) * t;
      const SYNTH_TRACK_INDEX = 1;

      // Cursor coords (in % of laptop-screen container)
      const parkX = 92;
      const parkY = 86;
      const buttonCx = button.x + button.w / 2;
      const buttonCy = button.y + button.h / 2;
      const splitXa = clip.x + clip.w * fracA;
      const splitXb = clip.x + clip.w * fracB;
      const clipApproachX = clip.x + clip.w * 0.12;
      const clipMidY = clip.y + clip.h * 0.5;

      // Waveform slices for the three-clip end state.
      const partA = FULL_S1_WAVEFORM.slice(0, SPLIT_IDX_A);
      const partAB = FULL_S1_WAVEFORM.slice(SPLIT_IDX_A);
      const partB = FULL_S1_WAVEFORM.slice(SPLIT_IDX_A, SPLIT_IDX_B);
      const partC = FULL_S1_WAVEFORM.slice(SPLIT_IDX_B);

      // Phase end times as fractions of the full cycle.
      const CYCLE = 11000;
      const P_FADE_IN = 0.03;
      const P_TO_BUTTON = 0.13;
      const P_BUTTON_HOLD = 0.16;
      const P_TO_CLIP = 0.22;
      const P_TO_CUT_A = 0.32;
      const P_HOVER_A = 0.36;
      const P_CUT_A = 0.4;
      const P_LINGER_A = 0.48;
      const P_TO_CUT_B = 0.56;
      const P_HOVER_B = 0.6;
      const P_CUT_B = 0.64;
      const P_LINGER_B = 0.9;
      const P_FADE_OUT = 0.97;

      const t0 = performance.now();
      let raf;
      const tick = (now) => {
        const t = ((now - t0) % CYCLE) / CYCLE;
        let cursor = "arrow";
        let x = parkX;
        let y = parkY;
        let opacity = 0;
        let clicking = false;
        let buttonActive = false;
        let lineX = null;
        let cutsDone = 0;

        if (t < P_FADE_IN) {
          opacity = t / P_FADE_IN;
        } else if (t < P_TO_BUTTON) {
          const p = easeInOut((t - P_FADE_IN) / (P_TO_BUTTON - P_FADE_IN));
          x = lerp(parkX, buttonCx, p);
          y = lerp(parkY, buttonCy, p);
          opacity = 1;
        } else if (t < P_BUTTON_HOLD) {
          x = buttonCx;
          y = buttonCy;
          opacity = 1;
          clicking = true;
          buttonActive = t > P_BUTTON_HOLD - 0.015;
        } else if (t < P_TO_CLIP) {
          const p = easeInOut(
            (t - P_BUTTON_HOLD) / (P_TO_CLIP - P_BUTTON_HOLD),
          );
          x = lerp(buttonCx, clipApproachX, p);
          y = lerp(buttonCy, clipMidY, p);
          opacity = 1;
          cursor = "split";
          buttonActive = true;
        } else if (t < P_TO_CUT_A) {
          const p = easeInOut((t - P_TO_CLIP) / (P_TO_CUT_A - P_TO_CLIP));
          x = lerp(clipApproachX, splitXa, p);
          y = clipMidY;
          opacity = 1;
          cursor = "split";
          buttonActive = true;
          lineX = x;
        } else if (t < P_HOVER_A) {
          x = splitXa;
          y = clipMidY;
          opacity = 1;
          cursor = "split";
          buttonActive = true;
          lineX = splitXa;
        } else if (t < P_CUT_A) {
          x = splitXa;
          y = clipMidY;
          opacity = 1;
          cursor = "split";
          clicking = true;
          buttonActive = true;
          lineX = splitXa;
          cutsDone = t > P_CUT_A - 0.012 ? 1 : 0;
        } else if (t < P_LINGER_A) {
          x = splitXa;
          y = clipMidY;
          opacity = 1;
          cursor = "split";
          buttonActive = true;
          cutsDone = 1;
        } else if (t < P_TO_CUT_B) {
          const p = easeInOut((t - P_LINGER_A) / (P_TO_CUT_B - P_LINGER_A));
          x = lerp(splitXa, splitXb, p);
          y = clipMidY;
          opacity = 1;
          cursor = "split";
          buttonActive = true;
          lineX = x;
          cutsDone = 1;
        } else if (t < P_HOVER_B) {
          x = splitXb;
          y = clipMidY;
          opacity = 1;
          cursor = "split";
          buttonActive = true;
          lineX = splitXb;
          cutsDone = 1;
        } else if (t < P_CUT_B) {
          x = splitXb;
          y = clipMidY;
          opacity = 1;
          cursor = "split";
          clicking = true;
          buttonActive = true;
          lineX = splitXb;
          cutsDone = t > P_CUT_B - 0.012 ? 2 : 1;
        } else if (t < P_LINGER_B) {
          x = splitXb;
          y = clipMidY;
          opacity = 1;
          cursor = "split";
          buttonActive = true;
          cutsDone = 2;
        } else if (t < P_FADE_OUT) {
          const p = (t - P_LINGER_B) / (P_FADE_OUT - P_LINGER_B);
          x = splitXb;
          y = clipMidY;
          opacity = 1 - p;
          cursor = "split";
          buttonActive = t < P_FADE_OUT - 0.03;
          cutsDone = 2;
        } else {
          opacity = 0;
          cutsDone = 2;
        }

        setSplitFrame({
          x,
          y,
          opacity,
          cursor,
          clicking,
          buttonActive,
          lineX,
          // `split` was a single-cut flag in the old animation — used by
          // the overlay to hide the indicator line at the cut moment. We
          // keep the same semantic: true whenever any cut has landed.
          split: cutsDone > 0,
        });

        if (cutsDone === 0) {
          if (cursor === "split") {
            setClipOverrides({ s1: { focused: true } });
          } else {
            setClipOverrides(null);
          }
          setExtraClips(null);
        } else if (cutsDone === 1) {
          // After cut #1: 2 clips. LEFT half (s1) is selected.
          setClipOverrides({
            s1: {
              duration: S1_A_DUR,
              waveform: partA,
              selected: true,
              focused: true,
            },
          });
          setExtraClips({
            [SYNTH_TRACK_INDEX]: [
              {
                id: "s1-b",
                name: "Intro theme",
                start: S1_B_START,
                duration: S1_DURATION - S1_A_DUR,
                waveform: partAB,
              },
            ],
          });
        } else {
          // After cut #2: 3 clips. MIDDLE (s1-b) is the new "left of
          // cut B" so it carries the selection; s1 (cut A's left) is
          // deselected.
          setClipOverrides({
            s1: {
              duration: S1_A_DUR,
              waveform: partA,
              selected: false,
              focused: false,
            },
          });
          setExtraClips({
            [SYNTH_TRACK_INDEX]: [
              {
                id: "s1-b",
                name: "Intro theme",
                start: S1_B_START,
                duration: S1_B_DUR,
                waveform: partB,
                selected: true,
                focused: true,
              },
              {
                id: "s1-c",
                name: "Intro theme",
                start: S1_C_START,
                duration: S1_C_DUR,
                waveform: partC,
              },
            ],
          });
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => {
        cancelAnimationFrame(raf);
        setSplitFrame(null);
      };
    }

    if (stop.id === "drop-anywhere" && stop.overlay?.kind === "drop") {
      // Pick up the smaller clip (s1-c — rightmost split from
      // split-tool) and drop it onto s2 (the bigger 5s music bed
      // outro). s2 splits at the drop edges and s1-c eats the audio
      // underneath where it lands.
      const easeInOut = (u) =>
        u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      const lerp = (a, b, t) => a + (b - a) * t;

      const SYNTH_TRACK_INDEX = 1;
      // Timeline → screen-% mapping derived from the split overlay's
      // reference clip (s1: x=23.12% at t=0.1, w=22.5% over 7.2s →
      // 3.125% per second).
      const PCT_PER_SEC = 22.5 / 7.2;
      const PCT_AT_ZERO = 23.12 - 0.1 * PCT_PER_SEC;
      const timeToX = (t) => PCT_AT_ZERO + t * PCT_PER_SEC;
      const sourceCenterX = timeToX(S1_C_START + S1_C_DUR / 2);
      const targetCenterX = timeToX(DROP_START + S1_C_DUR / 2);

      // Music bed track y/h matches the split overlay's reference clip.
      const trackY = 41.94;
      const trackH = 15.83;
      const clipMidY = trackY + trackH / 2;

      const parkX = 92;
      const parkY = 86;

      const partA = FULL_S1_WAVEFORM.slice(0, SPLIT_IDX_A);
      const partB = FULL_S1_WAVEFORM.slice(SPLIT_IDX_A, SPLIT_IDX_B);
      const partC = FULL_S1_WAVEFORM.slice(SPLIT_IDX_B);

      const CYCLE = 7500;
      const P_FADE_IN = 0.03;
      const P_TO_SOURCE = 0.15;
      const P_GRAB = 0.2;
      const P_DRAG = 0.65;
      const P_DROP = 0.7;
      const P_LINGER = 0.92;
      const P_FADE_OUT = 0.98;

      const t0 = performance.now();
      let raf;
      const tick = (now) => {
        const t = ((now - t0) % CYCLE) / CYCLE;
        let x = parkX;
        let y = parkY;
        let opacity = 0;
        let clicking = false;
        // Phases: "before" → idle on split-tool end state; "dragging"
        // → s1-c follows cursor; "dropped" → s2 splits, s1-c parked.
        let phase = "before";
        let dragStart = S1_C_START;

        if (t < P_FADE_IN) {
          opacity = t / P_FADE_IN;
          x = sourceCenterX;
          y = clipMidY - 22;
        } else if (t < P_TO_SOURCE) {
          const p = easeInOut((t - P_FADE_IN) / (P_TO_SOURCE - P_FADE_IN));
          x = sourceCenterX;
          y = lerp(clipMidY - 22, clipMidY, p);
          opacity = 1;
        } else if (t < P_GRAB) {
          x = sourceCenterX;
          y = clipMidY;
          opacity = 1;
          clicking = true;
        } else if (t < P_DRAG) {
          const p = easeInOut((t - P_GRAB) / (P_DRAG - P_GRAB));
          x = lerp(sourceCenterX, targetCenterX, p);
          y = clipMidY;
          opacity = 1;
          clicking = true;
          phase = "dragging";
          dragStart = lerp(S1_C_START, DROP_START, p);
        } else if (t < P_DROP) {
          x = targetCenterX;
          y = clipMidY;
          opacity = 1;
          clicking = t < P_DROP - 0.01;
          phase = t > P_DROP - 0.015 ? "dropped" : "dragging";
          dragStart = DROP_START;
        } else if (t < P_LINGER) {
          x = targetCenterX;
          y = clipMidY;
          opacity = 1;
          phase = "dropped";
          dragStart = DROP_START;
        } else if (t < P_FADE_OUT) {
          const p = (t - P_LINGER) / (P_FADE_OUT - P_LINGER);
          x = targetCenterX;
          y = clipMidY;
          opacity = 1 - p;
          phase = "dropped";
          dragStart = DROP_START;
        } else {
          opacity = 0;
          phase = "dropped";
          dragStart = DROP_START;
        }

        setSplitFrame({
          x,
          y,
          opacity,
          cursor: "arrow",
          clicking,
          buttonActive: false,
          lineX: null,
          split: false,
        });

        const overrides = {
          s1: {
            duration: S1_A_DUR,
            waveform: partA,
            selected: false,
            focused: false,
          },
        };
        if (phase === "dropped") {
          overrides.s2 = {
            ...(overrides.s2 || {}),
            duration: DROP_START - S2_START,
          };
        }
        setClipOverrides(overrides);

        const extras = [
          {
            id: "s1-b",
            name: "Intro theme",
            start: S1_B_START,
            duration: S1_B_DUR,
            waveform: partB,
            // Carries split-tool's selection until the user starts dragging.
            selected: phase === "before",
            focused: phase === "before",
          },
          {
            id: "s1-c",
            name: "Intro theme",
            start: dragStart,
            duration: S1_C_DUR,
            waveform: partC,
            focused: phase !== "before",
            selected: phase === "dropped",
          },
        ];
        if (phase === "dropped") {
          extras.push({
            id: "s2-b",
            name: "Outro music",
            start: DROP_END,
            duration: S2_START + S2_DURATION - DROP_END,
          });
        }
        setExtraClips({ [SYNTH_TRACK_INDEX]: extras });

        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => {
        cancelAnimationFrame(raf);
        setSplitFrame(null);
      };
    }

    if (stop.id === "multi-select" && stop.overlay?.kind === "multi-select") {
      // Both clips are already selected by cumulative state. The
      // animation just shows the cursor grabbing them and shifting
      // them right by 0.4s.
      const easeInOut = (u) =>
        u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      const lerp = (a, b, t) => a + (b - a) * t;

      // Same time→x mapping as the drop animation.
      const PCT_PER_SEC = 22.5 / 7.2;
      const PCT_AT_ZERO = 23.12 - 0.1 * PCT_PER_SEC;
      const timeToX = (t) => PCT_AT_ZERO + t * PCT_PER_SEC;

      const H2_START_FROM = 5.0;
      const H2_START_TO = 5.4;
      const H2_DURATION = 2.6;
      const G2_START_FROM = 7.8;
      const G2_START_TO = 8.2;

      // Music bed is track 1 at y=41.94, h=15.83 — Host (track 0) sits
      // one track + 2px-gap above that.
      const TRACK_GAP_PCT = 2 / 720; // 720px native screen height
      const MUSIC_BED_Y = 41.94;
      const MUSIC_BED_H = 15.83;
      const HOST_Y = MUSIC_BED_Y - MUSIC_BED_H - TRACK_GAP_PCT * 100;
      const hostMidY = HOST_Y + MUSIC_BED_H / 2;

      const h2CenterFrom = timeToX(H2_START_FROM + H2_DURATION / 2);
      const h2CenterTo = timeToX(H2_START_TO + H2_DURATION / 2);

      const parkX = 92;
      const parkY = 6; // approach from top so it sweeps across the toolbar

      const CYCLE = 6500;
      const P_FADE_IN = 0.04;
      const P_TO_CLIP = 0.18;
      const P_GRAB = 0.24;
      const P_DRAG = 0.62;
      const P_DROP = 0.68;
      const P_LINGER = 0.92;
      const P_FADE_OUT = 0.98;

      const t0 = performance.now();
      let raf;
      const tick = (now) => {
        const t = ((now - t0) % CYCLE) / CYCLE;
        let x = parkX;
        let y = parkY;
        let opacity = 0;
        let clicking = false;
        // Animate both h2 and g2 in sync by the same delta.
        let progress = 0; // 0 = original position, 1 = final
        if (t < P_FADE_IN) {
          opacity = t / P_FADE_IN;
          x = h2CenterFrom;
        } else if (t < P_TO_CLIP) {
          const p = easeInOut((t - P_FADE_IN) / (P_TO_CLIP - P_FADE_IN));
          x = h2CenterFrom;
          y = lerp(parkY, hostMidY, p);
          opacity = 1;
        } else if (t < P_GRAB) {
          x = h2CenterFrom;
          y = hostMidY;
          opacity = 1;
          clicking = true;
        } else if (t < P_DRAG) {
          const p = easeInOut((t - P_GRAB) / (P_DRAG - P_GRAB));
          x = lerp(h2CenterFrom, h2CenterTo, p);
          y = hostMidY;
          opacity = 1;
          clicking = true;
          progress = p;
        } else if (t < P_DROP) {
          x = h2CenterTo;
          y = hostMidY;
          opacity = 1;
          clicking = t < P_DROP - 0.01;
          progress = 1;
        } else if (t < P_LINGER) {
          x = h2CenterTo;
          y = hostMidY;
          opacity = 1;
          progress = 1;
        } else if (t < P_FADE_OUT) {
          const p = (t - P_LINGER) / (P_FADE_OUT - P_LINGER);
          x = h2CenterTo;
          y = hostMidY;
          opacity = 1 - p;
          progress = 1;
        } else {
          opacity = 0;
          progress = 1;
        }

        setSplitFrame({
          x,
          y,
          opacity,
          cursor: "arrow",
          clicking,
          buttonActive: false,
          lineX: null,
          split: false,
        });

        const h2Start = lerp(H2_START_FROM, H2_START_TO, progress);
        const g2Start = lerp(G2_START_FROM, G2_START_TO, progress);
        setClipOverrides({
          h2: {
            selected: true,
            start: h2Start,
          },
          g2: {
            selected: true,
            start: g2Start,
          },
          // Preserve the previous stop's split + drop end state.
          s1: {
            duration: S1_A_DUR,
            waveform: FULL_S1_WAVEFORM.slice(0, SPLIT_IDX_A),
            selected: false,
            focused: false,
          },
          s2: {
            duration: DROP_START - S2_START,
          },
        });
        // Keep the music-bed extras from drop-anywhere in place.
        setExtraClips({
          1: [
            {
              id: "s1-b",
              name: "Intro theme",
              start: S1_B_START,
              duration: S1_B_DUR,
              waveform: FULL_S1_WAVEFORM.slice(SPLIT_IDX_A, SPLIT_IDX_B),
              selected: false,
              focused: false,
            },
            {
              id: "s1-c",
              name: "Intro theme",
              start: DROP_START,
              duration: S1_C_DUR,
              waveform: FULL_S1_WAVEFORM.slice(SPLIT_IDX_B),
              selected: false,
              focused: false,
            },
            {
              id: "s2-b",
              name: "Outro music",
              start: DROP_END,
              duration: S2_START + S2_DURATION - DROP_END,
            },
          ],
        });

        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => {
        cancelAnimationFrame(raf);
        setSplitFrame(null);
      };
    }

    if (stop.id === "clip-envelopes" && stop.overlay?.kind === "envelopes") {
      const { button, clip } = stop.overlay;
      const easeInOut = (u) =>
        u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      const lerp = (a, b, t) => a + (b - a) * t;

      const S1_DURATION = 7.2;
      const CYCLE = 11000;
      const parkX = 92;
      const parkY = 86;
      const buttonCx = button.x + button.w / 2;
      const buttonCy = button.y + button.h / 2;
      const lineY = clip.y + clip.h * 0.42;
      const dragEndY = clip.y + clip.h * 0.85;
      const pointATime = S1_DURATION * 0.2;
      const pointAX = clip.x + clip.w * 0.2;
      const pointBTime = S1_DURATION * 0.75;
      const pointBX = clip.x + clip.w * 0.75;

      const pA = { time: pointATime, db: 0 };
      const pBLow = { time: pointBTime, db: -25 };

      const t0 = performance.now();
      let raf;
      const tick = (now) => {
        const t = ((now - t0) % CYCLE) / CYCLE;
        let x = parkX;
        let y = parkY;
        let opacity = 0;
        let clicking = false;
        let buttonActive = false;
        let envOn = false;
        let points = [];

        if (t < 0.08) {
          // drift in + fade in at park (ease-out: decelerates into place)
          const p = t / 0.08;
          const ease = 1 - Math.pow(1 - p, 3);
          x = parkX + 5 * (1 - ease);
          y = parkY + 8 * (1 - ease);
          opacity = ease;
        } else if (t < 0.17) {
          // travel to envelope button
          const p = easeInOut((t - 0.08) / 0.09);
          x = lerp(parkX, buttonCx, p);
          y = lerp(parkY, buttonCy, p);
          opacity = 1;
        } else if (t < 0.21) {
          // click button ON
          x = buttonCx;
          y = buttonCy;
          opacity = 1;
          clicking = t < 0.19;
          buttonActive = t > 0.19;
          envOn = t > 0.19;
        } else if (t < 0.28) {
          // travel to point A
          const p = easeInOut((t - 0.21) / 0.07);
          x = lerp(buttonCx, pointAX, p);
          y = lerp(buttonCy, lineY, p);
          opacity = 1;
          buttonActive = true;
          envOn = true;
        } else if (t < 0.32) {
          // click → add point A
          x = pointAX;
          y = lineY;
          opacity = 1;
          clicking = t < 0.3;
          buttonActive = true;
          envOn = true;
          if (t > 0.3) points = [pA];
        } else if (t < 0.41) {
          // travel to point B position
          const p = easeInOut((t - 0.32) / 0.09);
          x = lerp(pointAX, pointBX, p);
          y = lineY;
          opacity = 1;
          buttonActive = true;
          envOn = true;
          points = [pA];
        } else if (t < 0.45) {
          // click → add point B at 0dB
          x = pointBX;
          y = lineY;
          opacity = 1;
          clicking = t < 0.43;
          buttonActive = true;
          envOn = true;
          points = [pA];
          if (t > 0.43) points.push({ time: pointBTime, db: 0 });
        } else if (t < 0.58) {
          // drag point B down
          const p = easeInOut((t - 0.45) / 0.13);
          x = pointBX;
          y = lerp(lineY, dragEndY, p);
          opacity = 1;
          buttonActive = true;
          envOn = true;
          points = [pA, { time: pointBTime, db: lerp(0, -25, p) }];
        } else if (t < 0.72) {
          // hold, admire the curve
          x = pointBX;
          y = dragEndY;
          opacity = 1;
          buttonActive = true;
          envOn = true;
          points = [pA, pBLow];
        } else if (t < 0.83) {
          // travel back to envelope button
          const p = easeInOut((t - 0.72) / 0.11);
          x = lerp(pointBX, buttonCx, p);
          y = lerp(dragEndY, buttonCy, p);
          opacity = 1;
          buttonActive = true;
          envOn = true;
          points = [pA, pBLow];
        } else if (t < 0.87) {
          // click button OFF — mode flips, points clear
          x = buttonCx;
          y = buttonCy;
          opacity = 1;
          clicking = t < 0.85;
          buttonActive = t < 0.85;
          envOn = t < 0.85;
          if (t < 0.85) points = [pA, pBLow];
        } else if (t < 0.97) {
          // drift away from button + fade out (ease-in: accelerates out)
          const p = (t - 0.87) / 0.1;
          const ease = p * p * p;
          x = buttonCx - 5 * ease;
          y = buttonCy - 8 * ease;
          opacity = 1 - ease;
        } else {
          opacity = 0;
        }

        setEnvelopeFrame({ x, y, opacity, clicking, buttonActive });
        setEnvelopeMode(envOn);
        const focusClip = envOn && t > 0.21 && t < 0.87;
        if (envOn && points.length > 0) {
          setClipOverrides({
            s1: { envelopePoints: points, focused: true },
          });
        } else if (focusClip) {
          setClipOverrides({ s1: { focused: true } });
        } else {
          setClipOverrides(null);
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => {
        cancelAnimationFrame(raf);
        setEnvelopeFrame(null);
      };
    }

    setSplitFrame(null);
    setEnvelopeFrame(null);
  }, [stop.id]);

  const panelOnLeft = stop.panelSide === "left";
  const panelOnRight = stop.panelSide === "right";
  const isIntro = stop.panelSide === "intro";
  const isOutro = stop.panelSide === "outro";
  const isReveal = stop.panelSide === "reveal";
  const lidAngle = liveLidAngle ?? stop.laptop.lidAngle ?? 0;
  const lidImmediate = liveLidAngle !== null;
  const introClosedAngle = introStop.laptop.lidAngle ?? -85;
  const introDim =
    liveLidAngle === null
      ? 0
      : (liveLidAngle - introClosedAngle) / -introClosedAngle;

  const transform = `translate3d(${stop.laptop.x}, ${stop.laptop.y}, 0) scale(${stop.laptop.scale})`;
  // scroll-snap-stop: always forces a hard scroll landing on each panel.
  // The previous 720ms slow-in-out laptop transition was still mid-animation
  // when the snap settled — read as judder on every panel except the intro
  // (whose lid is scrubbed by scroll, not by CSS transition). Use a shorter
  // fast-start ease so the laptop is essentially in place by the time the
  // snap finishes.
  const laptopTransition = "transform 360ms cubic-bezier(0.2, 0, 0.2, 1)";

  return (
    <section
      ref={sectionRef}
      className="relative bg-background-dark"
      style={{ overflow: "clip" }}
    >
      <div
        ref={stageRef}
        className="sticky top-0 h-screen w-full flex items-center justify-center"
        style={{ zIndex: 1 }}
      >
        <div
          ref={laptopRef}
          className="relative z-10"
          style={{
            transform,
            transformOrigin: "center center",
            transition: laptopTransition,
            willChange: "transform",
          }}
        >
          <LaptopFrame
            lidRef={lidRef}
            lidAngle={lidAngle}
            lidImmediate={lidImmediate}
          >
            <WorkspaceCanvas
              config={config}
              clipOverrides={clipOverrides}
              extraClips={extraClips}
              envelopeModeOverride={envelopeMode}
              splitToolActive={!!splitFrame?.buttonActive}
            />
            <TourOverlay
              overlay={stop.overlay}
              targetId={stop.id}
              target={stop.target}
              splitFrame={splitFrame}
              envelopeFrame={envelopeFrame}
            />
          </LaptopFrame>
        </div>

        <div
          className="absolute top-1/2 z-20 px-8 lg:px-12 max-w-[380px]"
          style={{
            // Inset the panel from the viewport edge so it clears the scroll
            // indicators (which now live at left: max(2vw, 24px)).
            [panelOnRight ? "right" : "left"]: "max(72px, 5vw)",
            transform: "translateY(-50%)",
            opacity: panelOnLeft || panelOnRight ? 1 : 0,
            transition: "opacity 280ms ease-out",
            textAlign: panelOnRight ? "right" : "left",
            pointerEvents: panelOnLeft || panelOnRight ? "auto" : "none",
          }}
        >
          <TourPanel stop={stop} panelRef={tourPanelRef} />
        </div>

        <IntroOverlay
          visible={isIntro}
          eyebrow={introStop.eyebrow}
          heading={introStop.heading}
          centerHeading
          dimProgress={introDim}
        />
        <IntroOverlay
          visible={isOutro}
          eyebrow={outroStop.eyebrow}
          heading={outroStop.heading}
        />
        <IntroOverlay
          visible={isReveal}
          eyebrow={stop.eyebrow}
          heading={stop.heading}
          description={stop.description}
          compact
        />

        <ScrollIndicator
          visible={!isIntro}
          stops={STOPS.filter(
            (s) => !s.noScrollPanel && s.panelSide !== "intro",
          )}
          activeIndex={Math.max(
            0,
            STOPS.filter(
              (s) => !s.noScrollPanel && s.panelSide !== "intro",
            ).findIndex((s) => s.id === scrolledStop.id),
          )}
          onJump={(i) => {
            const visible = STOPS.filter(
              (s) => !s.noScrollPanel && s.panelSide !== "intro",
            );
            const originalIdx = STOPS.findIndex((s) => s.id === visible[i].id);
            const target = panelRefs.current[originalIdx];
            if (target) {
              target.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }}
        />
      </div>

      <div style={{ marginTop: "-100vh", position: "relative", zIndex: 2 }}>
        {STOPS.map((s, i) =>
          s.noScrollPanel ? null : (
            <section
              key={s.id}
              ref={(el) => (panelRefs.current[i] = el)}
              data-panel-index={i}
              style={{
                // Taller panels make it harder to fly past multiple stops in
                // a single wheel/trackpad gesture, without needing global
                // CSS scroll-snap (which was making the rest of the page
                // judder in sections with continuous animations).
                height: "130vh",
                minHeight: "130vh",
                pointerEvents: "none",
              }}
              aria-label={s.heading}
            />
          ),
        )}
      </div>
    </section>
  );
}

export default ScrollyLaptopTour;
