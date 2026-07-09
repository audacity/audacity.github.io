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
  // Default to enabled so SSR can paint the intro state of the laptop
  // tour (closed lid, title overlay) rather than a blank section that
  // shows nothing until JS hydrates. Only reduced-motion falls back to
  // the simple stacked list — DesktopTour handles both desktop and
  // mobile layouts internally (see isMobile below).
  const [enabled, setEnabled] = useState(true);
  useEffect(() => {
    const mqMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const compute = () => setEnabled(!mqMotion.matches);
    compute();
    mqMotion.addEventListener("change", compute);
    return () => {
      mqMotion.removeEventListener("change", compute);
    };
  }, []);
  return enabled;
}

function ScrollyLaptopTour() {
  const enabled = useDesktopAnimation();
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
      // h2 + g2 + sfx1 selected across three tracks, shifted right by
      // 1.5s together — a question, the answer, and the SFX sting that
      // punctuates them, all moved as one moment. The dropped s1-c
      // loses its previous selection.
      const droppedClip = extraByTrack[1]?.find((c) => c.id === "s1-c");
      if (droppedClip) {
        droppedClip.selected = false;
        droppedClip.focused = false;
      }
      overrides.h2 = {
        ...(overrides.h2 || {}),
        selected: true,
        start: 6.5,
      };
      overrides.g2 = {
        ...(overrides.g2 || {}),
        selected: true,
        start: 9.3,
      };
      overrides.sfx1 = {
        ...(overrides.sfx1 || {}),
        selected: true,
        start: 6.1,
      };
    }

    if (id === "clip-groups") {
      // Two beats: we explicitly group h2+g2 via the right-click
      // context menu (no drag — just the grouping action). Then we
      // grab h3 — which was always in its own group with g3 — and
      // the pair slides together (+0.4s), demonstrating that groups
      // were always there. Engaging the second group deselects the
      // first, so the end state has only h3+g3 active. h2/g2 stay
      // at their multi-select positions.
      overrides.h2 = {
        ...(overrides.h2 || {}),
        selected: false,
        start: 6.5,
      };
      overrides.g2 = {
        ...(overrides.g2 || {}),
        selected: false,
        start: 9.3,
      };
      overrides.h3 = {
        ...(overrides.h3 || {}),
        selected: true,
        start: 11.8,
      };
      overrides.g3 = {
        ...(overrides.g3 || {}),
        selected: true,
        start: 15.2,
      };
      // sfx1 stays at its multi-select position.
      overrides.sfx1 = {
        ...(overrides.sfx1 || {}),
        selected: false,
        start: 6.1,
      };
    }

    if (id === "clip-envelopes") {
      // envelopeMode is driven ENTIRELY by the per-stop animation now —
      // setting it true here from cumulative state caused a flicker
      // when scrolling into the stop (cumulative flipped on, animation
      // immediately flipped it off again during its fade-in phase,
      // then back on at the click). Animation alone decides when the
      // mode is on. Envelope points themselves still persist here.
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
  // The intro stop config declares a closed lid (`lidAngle: -85`) so SSR/first
  // paint show the laptop shut. On mount we run an auto-open animation and
  // flip this to true; from then on the intro renders with the lid at 0deg,
  // so scrolling back to the intro doesn't re-close it.
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  // Mobile layout override: same animations and scroll drivers, but the
  // laptop stays centered (no per-stop x/y translates that push it out
  // of frame) and text panels drop below the laptop instead of the
  // side positioning designed for desktop viewports.
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const compute = () => setIsMobile(mq.matches);
    compute();
    mq.addEventListener("change", compute);
    return () => mq.removeEventListener("change", compute);
  }, []);
  const config = WORKSPACE_CONFIGS.podcast;
  const scrolledStop = STOPS[stopIndex];
  const stop = STOPS.find((s) => s.id === renderStopId) ?? scrolledStop;
  const introStop = STOPS.find((s) => s.panelSide === "intro") ?? STOPS[0];

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

      cleanup = () => {
        triggers.forEach((t) => t.kill());
      };
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  // Auto-open the laptop lid on mount. SSR paints the closed intro state
  // (lidAngle -85), and just after hydration we rAF-tween the transform
  // straight to the DOM (matching the previous scrub approach) so React
  // doesn't have to re-render 60x during the open. Once the animation
  // completes we flip `hasAutoOpened`, which promotes the intro's
  // resting lid angle to 0 — scrolling back to intro then keeps the
  // lid open rather than snapping shut.
  useEffect(() => {
    if (hasAutoOpened) return undefined;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setHasAutoOpened(true);
      return undefined;
    }
    const closedAngle = introStop.laptop?.lidAngle ?? -85;
    const openAngle = 0;
    // Timing choreographs with the CSS entrance animations on the laptop
    // and title wrappers:
    //   0-820ms   title drifts in (120ms delay + 700ms)
    //   300-1150ms laptop drifts up and fades in (300ms delay + 850ms)
    //   1000-2400ms lid opens — starts just as the laptop entrance
    //     completes so the whole intro reads as one 2.4s beat.
    const DURATION = 1400;
    const START_DELAY = 1000;
    // easeOutCubic — weighty settle without an overshoot that would
    // read as bounce on the lid hinge.
    const ease = (u) => 1 - Math.pow(1 - u, 3);
    let raf = 0;
    let t0 = 0;
    let cancelled = false;
    const tick = (now) => {
      if (cancelled) return;
      if (!t0) t0 = now;
      const p = Math.max(0, Math.min(1, (now - t0) / DURATION));
      const angle = closedAngle + (openAngle - closedAngle) * ease(p);
      if (lidRef.current) {
        lidRef.current.style.transition = "none";
        lidRef.current.style.transform = `rotateX(${angle}deg)`;
      }
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        if (lidRef.current) {
          lidRef.current.style.transition = "";
          lidRef.current.style.transform = "";
        }
        setHasAutoOpened(true);
      }
    };
    const delayTimer = setTimeout(() => {
      if (cancelled) return;
      raf = requestAnimationFrame(tick);
    }, START_DELAY);
    return () => {
      cancelled = true;
      clearTimeout(delayTimer);
      cancelAnimationFrame(raf);
    };
  }, [hasAutoOpened, introStop]);

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
      const easeOutCubic = (u) => 1 - Math.pow(1 - u, 3);
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

      // Phase end times as fractions of the full cycle. Trimmed for
      // snap — was 11s before, now 7s with the slack squeezed out of
      // lingers and approach windows.
      const CYCLE = 7000;
      const P_FADE_IN = 0.03;
      const P_TO_BUTTON = 0.13;
      const P_BUTTON_HOLD = 0.16;
      const P_TO_CLIP = 0.22;
      const P_TO_CUT_A = 0.32;
      const P_HOVER_A = 0.35;
      const P_CUT_A = 0.38;
      const P_LINGER_A = 0.44;
      const P_TO_CUT_B = 0.55;
      const P_HOVER_B = 0.58;
      const P_CUT_B = 0.61;
      const P_LINGER_B = 0.92;
      const P_FADE_OUT = 0.98;

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
          // easeOutCubic for cursor approaches — decelerating arrival
          // reads as natural hand motion, not the symmetric ease-in-out.
          const p = easeOutCubic((t - P_FADE_IN) / (P_TO_BUTTON - P_FADE_IN));
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
          const p = easeOutCubic(
            (t - P_BUTTON_HOLD) / (P_TO_CLIP - P_BUTTON_HOLD),
          );
          x = lerp(buttonCx, clipApproachX, p);
          y = lerp(buttonCy, clipMidY, p);
          opacity = 1;
          cursor = "split";
          buttonActive = true;
        } else if (t < P_TO_CUT_A) {
          const p = easeOutCubic((t - P_TO_CLIP) / (P_TO_CUT_A - P_TO_CLIP));
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
      // split-tool) BY ITS HEADER and drop it onto s2 (the bigger 5s
      // music bed outro). s2 splits at the drop edges and s1-c eats
      // the audio underneath where it lands.
      const easeInOut = (u) =>
        u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      // Asymmetric "natural" curve: fast start, slow approach. Closer
      // to how a real hand moves — most of the distance is covered in
      // the first half, then the cursor decelerates into the target.
      const easeOutCubic = (u) => 1 - Math.pow(1 - u, 3);
      // Back-out for the landing: tiny overshoot then settle.
      const easeBackOut = (u) => {
        const c1 = 1.4;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2);
      };
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
      // The clip's HEADER (its draggable strip) sits in the top ~13% of
      // the clip height; the cursor grabs there, not at the midpoint.
      const trackY = 41.94;
      const trackH = 15.83;
      const clipHeaderY = trackY + trackH * 0.13;
      // Arc the cursor up during the drag — the clip "lifts" before
      // travelling. Subtle (1.2% of the screen ≈ 9px on a 720px-tall
      // canvas) so it reads as natural hand motion, not a flourish.
      const DRAG_ARC = 1.4;

      const parkX = 92;
      const parkY = 86;

      const partA = FULL_S1_WAVEFORM.slice(0, SPLIT_IDX_A);
      const partB = FULL_S1_WAVEFORM.slice(SPLIT_IDX_A, SPLIT_IDX_B);
      const partC = FULL_S1_WAVEFORM.slice(SPLIT_IDX_B);

      // Trimmed from 5.5s → 4.5s — drag still reads but doesn't dawdle.
      const CYCLE = 4500;
      const P_FADE_IN = 0.03;
      const P_TO_SOURCE = 0.16;
      const P_GRAB = 0.22;
      const P_DRAG = 0.66;
      const P_DROP = 0.72;
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
        // Cursor glyph: arrow off-clip, open hand when hovering the
        // header, closed hand while click-dragging. Default is arrow.
        let cursor = "arrow";
        // Phases: "before" → idle on split-tool end state; "dragging"
        // → s1-c follows cursor; "dropped" → s2 splits, s1-c parked.
        let phase = "before";
        let dragStart = S1_C_START;

        if (t < P_FADE_IN) {
          opacity = t / P_FADE_IN;
          x = sourceCenterX;
          y = clipHeaderY - 22;
        } else if (t < P_TO_SOURCE) {
          // Cursor arrives at the header from above, decelerating into
          // place. Switch to the open-hand cursor for the final stretch
          // so it lands on the clip already showing the grab affordance.
          const p = easeOutCubic((t - P_FADE_IN) / (P_TO_SOURCE - P_FADE_IN));
          x = sourceCenterX;
          y = lerp(clipHeaderY - 22, clipHeaderY, p);
          opacity = 1;
          if (p > 0.6) cursor = "open";
        } else if (t < P_GRAB) {
          x = sourceCenterX;
          y = clipHeaderY;
          opacity = 1;
          clicking = true;
          cursor = "closed";
        } else if (t < P_DRAG) {
          const p = easeInOut((t - P_GRAB) / (P_DRAG - P_GRAB));
          // X moves with a slightly asymmetric curve, Y arcs upward
          // mid-drag (sine bow) then back down to the header line —
          // the clip "lifts" off the lane during the travel.
          x = lerp(sourceCenterX, targetCenterX, p);
          y = clipHeaderY - DRAG_ARC * Math.sin(p * Math.PI);
          opacity = 1;
          clicking = true;
          cursor = "closed";
          phase = "dragging";
          dragStart = lerp(S1_C_START, DROP_START, p);
        } else if (t < P_DROP) {
          // Drop with a tiny back-out: cursor overshoots target by a
          // hair then settles — same shape a real drop has when the
          // hand decelerates.
          const p = easeBackOut((t - P_DRAG) / (P_DROP - P_DRAG));
          x = targetCenterX;
          y = clipHeaderY;
          opacity = 1;
          clicking = t < P_DROP - 0.012;
          // Open the hand again the moment the click releases.
          cursor = clicking ? "closed" : "open";
          phase = t > P_DROP - 0.018 ? "dropped" : "dragging";
          dragStart = lerp(lerp(S1_C_START, DROP_START, 1), DROP_START, p);
        } else if (t < P_LINGER) {
          x = targetCenterX;
          y = clipHeaderY;
          opacity = 1;
          cursor = "open";
          phase = "dropped";
          dragStart = DROP_START;
        } else if (t < P_FADE_OUT) {
          const p = (t - P_LINGER) / (P_FADE_OUT - P_LINGER);
          x = targetCenterX;
          y = clipHeaderY;
          opacity = 1 - p;
          cursor = "open";
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
          cursor,
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
            // Selected the moment we grab it (real-app behaviour) and
            // stays selected through dragging + after the drop.
            focused: phase !== "before",
            selected: phase !== "before",
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
      // Cursor explicitly selects three clips across three tracks by
      // visiting each header (open hand on hover, brief closed-hand
      // click), then grabs h2 and drags the whole selection right by
      // 1.5s. Each click adds its clip to the selection — Audacity's
      // shift-click multi-select pattern.
      const easeInOut = (u) =>
        u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      const easeOutCubic = (u) => 1 - Math.pow(1 - u, 3);
      const lerp = (a, b, t) => a + (b - a) * t;

      const PCT_PER_SEC = 22.5 / 7.2;
      const PCT_AT_ZERO = 23.12 - 0.1 * PCT_PER_SEC;
      const timeToX = (t) => PCT_AT_ZERO + t * PCT_PER_SEC;

      const H2_START_FROM = 5.0;
      const H2_START_TO = 6.5;
      const H2_DURATION = 2.6;
      const G2_START_FROM = 7.8;
      const G2_START_TO = 9.3;
      const G2_DURATION = 3.4;
      const SFX1_START_FROM = 4.6;
      const SFX1_START_TO = 6.1;
      const SFX1_DURATION = 0.5;

      // Track Y positions. Music bed (track 1) is the visual anchor;
      // Host (track 0) sits above, Guest (track 2) below, SFX (track 3)
      // below that. Each header is at the top ~13% of its track.
      const TRACK_GAP_PCT = 2 / 720;
      const MUSIC_BED_Y = 41.94;
      const MUSIC_BED_H = 15.83;
      const SFX_H = (84 / 720) * 100; // ~11.67%
      const HOST_Y = MUSIC_BED_Y - MUSIC_BED_H - TRACK_GAP_PCT * 100;
      const GUEST_Y = MUSIC_BED_Y + MUSIC_BED_H + TRACK_GAP_PCT * 100;
      const SFX_Y = GUEST_Y + MUSIC_BED_H + TRACK_GAP_PCT * 100;
      const hostHeaderY = HOST_Y + MUSIC_BED_H * 0.13;
      const guestHeaderY = GUEST_Y + MUSIC_BED_H * 0.13;
      const sfxHeaderY = SFX_Y + SFX_H * 0.13;

      const DRAG_ARC = 1.2;

      // Clip header grab points (45% into the clip — same convention
      // as the other animations).
      const h2GrabFromX = timeToX(H2_START_FROM + H2_DURATION * 0.45);
      const h2GrabToX = timeToX(H2_START_TO + H2_DURATION * 0.45);
      const g2GrabX = timeToX(G2_START_FROM + G2_DURATION * 0.45);
      const sfx1GrabX = timeToX(SFX1_START_FROM + SFX1_DURATION * 0.45);

      const parkX = 92;
      const parkY = 6;

      const CYCLE = 7500;
      // Phase end times — selection then drag.
      const P_FADE_IN = 0.02;
      const P_TO_H2 = 0.1;
      const P_CLICK_H2 = 0.13; // h2 becomes selected at this point
      const P_TO_G2 = 0.22;
      const P_CLICK_G2 = 0.25; // g2 added to selection
      const P_TO_SFX1 = 0.34;
      const P_CLICK_SFX1 = 0.37; // sfx1 added
      const P_TO_GRAB = 0.46; // back over to h2 to grab the trio
      const P_GRAB = 0.49;
      const P_DRAG = 0.74;
      const P_DROP = 0.77;
      const P_LINGER = 0.94;
      const P_FADE_OUT = 0.98;

      const t0 = performance.now();
      let raf;
      const tick = (now) => {
        const t = ((now - t0) % CYCLE) / CYCLE;
        let x = parkX;
        let y = parkY;
        let opacity = 0;
        let clicking = false;
        let cursor = "arrow";
        let progress = 0;

        if (t < P_FADE_IN) {
          opacity = t / P_FADE_IN;
          x = h2GrabFromX;
        } else if (t < P_TO_H2) {
          const p = easeOutCubic((t - P_FADE_IN) / (P_TO_H2 - P_FADE_IN));
          x = h2GrabFromX;
          y = lerp(parkY, hostHeaderY, p);
          opacity = 1;
          if (p > 0.6) cursor = "open";
        } else if (t < P_CLICK_H2) {
          x = h2GrabFromX;
          y = hostHeaderY;
          opacity = 1;
          clicking = true;
          cursor = "closed";
        } else if (t < P_TO_G2) {
          const p = easeOutCubic((t - P_CLICK_H2) / (P_TO_G2 - P_CLICK_H2));
          x = lerp(h2GrabFromX, g2GrabX, p);
          y = lerp(hostHeaderY, guestHeaderY, p);
          opacity = 1;
          cursor = p > 0.6 ? "open" : "arrow";
        } else if (t < P_CLICK_G2) {
          x = g2GrabX;
          y = guestHeaderY;
          opacity = 1;
          clicking = true;
          cursor = "closed";
        } else if (t < P_TO_SFX1) {
          const p = easeOutCubic((t - P_CLICK_G2) / (P_TO_SFX1 - P_CLICK_G2));
          x = lerp(g2GrabX, sfx1GrabX, p);
          y = lerp(guestHeaderY, sfxHeaderY, p);
          opacity = 1;
          cursor = p > 0.6 ? "open" : "arrow";
        } else if (t < P_CLICK_SFX1) {
          x = sfx1GrabX;
          y = sfxHeaderY;
          opacity = 1;
          clicking = true;
          cursor = "closed";
        } else if (t < P_TO_GRAB) {
          // Travel back up to h2 to grab and drag.
          const p = easeOutCubic(
            (t - P_CLICK_SFX1) / (P_TO_GRAB - P_CLICK_SFX1),
          );
          x = lerp(sfx1GrabX, h2GrabFromX, p);
          y = lerp(sfxHeaderY, hostHeaderY, p);
          opacity = 1;
          cursor = p > 0.6 ? "open" : "arrow";
        } else if (t < P_GRAB) {
          x = h2GrabFromX;
          y = hostHeaderY;
          opacity = 1;
          clicking = true;
          cursor = "closed";
        } else if (t < P_DRAG) {
          const p = easeInOut((t - P_GRAB) / (P_DRAG - P_GRAB));
          x = lerp(h2GrabFromX, h2GrabToX, p);
          y = hostHeaderY - DRAG_ARC * Math.sin(p * Math.PI);
          opacity = 1;
          clicking = true;
          cursor = "closed";
          progress = p;
        } else if (t < P_DROP) {
          x = h2GrabToX;
          y = hostHeaderY;
          opacity = 1;
          clicking = t < P_DROP - 0.01;
          cursor = clicking ? "closed" : "open";
          progress = 1;
        } else if (t < P_LINGER) {
          x = h2GrabToX;
          y = hostHeaderY;
          opacity = 1;
          cursor = "open";
          progress = 1;
        } else if (t < P_FADE_OUT) {
          const p = (t - P_LINGER) / (P_FADE_OUT - P_LINGER);
          x = h2GrabToX;
          y = hostHeaderY;
          opacity = 1 - p;
          cursor = "open";
          progress = 1;
        } else {
          opacity = 0;
          progress = 1;
        }

        setSplitFrame({
          x,
          y,
          opacity,
          cursor,
          clicking,
          buttonActive: false,
          lineX: null,
          split: false,
        });

        // Selection accumulates as each click lands.
        const h2Selected = t >= P_CLICK_H2;
        const g2Selected = t >= P_CLICK_G2;
        const sfx1Selected = t >= P_CLICK_SFX1;

        const h2Start = lerp(H2_START_FROM, H2_START_TO, progress);
        const g2Start = lerp(G2_START_FROM, G2_START_TO, progress);
        const sfx1Start = lerp(SFX1_START_FROM, SFX1_START_TO, progress);
        setClipOverrides({
          h2: { selected: h2Selected, start: h2Start },
          g2: { selected: g2Selected, start: g2Start },
          sfx1: { selected: sfx1Selected, start: sfx1Start },
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

    if (stop.id === "clip-groups" && stop.overlay?.kind === "clip-groups") {
      // Open the clip's context menu, pick "Group clips", then drag
      // the new group as one unit. h2 + g2 come in already selected
      // from the multi-select stop.
      const { h2Clip, g2Clip, menuButton, menuPos, groupItemX, groupItemY } =
        stop.overlay;
      const easeInOut = (u) =>
        u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      const easeOutCubic = (u) => 1 - Math.pow(1 - u, 3);
      const lerp = (a, b, t) => a + (b - a) * t;

      const PCT_PER_SEC = 22.5 / 7.2;
      const PCT_AT_ZERO = 23.12 - 0.1 * PCT_PER_SEC;
      const timeToX = (t) => PCT_AT_ZERO + t * PCT_PER_SEC;

      // h2 + g2 stay where they are — we only group them via the menu,
      // no drag. Constants used by the cursor's grouping interaction.
      const H2_START = 6.5;
      const H2_DURATION = 2.6;
      const G2_START = 9.3;

      // Second beat — h3 is already in a group with g3. Grab h3, g3
      // follows (+0.4s on each — smaller delta because h3 has only
      // ~0.9s of slack to h4).
      const H3_START_FROM = 11.4;
      const H3_DURATION = 3.2;
      const G3_START_FROM = 14.8;
      const G3_DURATION = 4.6;
      const MOVE_DELTA_2 = 0.4;
      const H3_START_TO = H3_START_FROM + MOVE_DELTA_2;
      const G3_START_TO = G3_START_FROM + MOVE_DELTA_2;

      // Cursor targets
      const buttonCx = menuButton.x + menuButton.w / 2;
      const buttonCy = menuButton.y + menuButton.h / 2;
      // h3 lives on the Host track at the same y as h2 — derived from
      // the overlay's h2Clip rect (its top + 13% for the header strip).
      const headerY = h2Clip.y + h2Clip.h * 0.13;
      const h3GrabFromX = timeToX(H3_START_FROM + H3_DURATION * 0.45);
      const h3GrabToX = timeToX(H3_START_TO + H3_DURATION * 0.45);
      const DRAG_ARC = 1.2;

      const parkX = 92;
      const parkY = 6;

      // Trimmed cycle — removed the explicit-group drag, so the whole
      // sequence fits in ~6s.
      const CYCLE = 6000;
      // Phase end times (fraction of cycle).
      // First beat — open h2's menu, pick "Group clips" (no drag).
      const P_FADE_IN = 0.02;
      const P_TO_BUTTON = 0.1;
      const P_CLICK_BUTTON = 0.13;
      const P_MENU_OPEN = 0.16;
      const P_TO_GROUP = 0.24;
      const P_HOVER_GROUP = 0.27;
      const P_CLICK_GROUP = 0.3;
      const P_LINGER_GROUP = 0.36;
      // Second beat — grab h3 (already grouped with g3).
      const P_TO_H3 = 0.46;
      const P_GRAB_H3 = 0.5;
      const P_DRAG_H3 = 0.78;
      const P_DROP_H3 = 0.81;
      const P_LINGER_H3 = 0.95;
      const P_FADE_OUT = 0.99;

      const t0 = performance.now();
      let raf;
      const tick = (now) => {
        const t = ((now - t0) % CYCLE) / CYCLE;
        let x = parkX;
        let y = parkY;
        let opacity = 0;
        let clicking = false;
        let cursor = "arrow";
        let menuOpen = false;
        let hoverGroup = false;
        // 0 = ungrouped, 1 = grouped (animates in once the menu action lands).
        let grouped = 0;
        // Second beat: 0 → 1 progress on h3+g3.
        let moveP2 = 0;

        if (t < P_FADE_IN) {
          opacity = t / P_FADE_IN;
          x = buttonCx;
          y = buttonCy - 18;
        } else if (t < P_TO_BUTTON) {
          const p = easeOutCubic((t - P_FADE_IN) / (P_TO_BUTTON - P_FADE_IN));
          x = buttonCx;
          y = lerp(buttonCy - 18, buttonCy, p);
          opacity = 1;
        } else if (t < P_CLICK_BUTTON) {
          x = buttonCx;
          y = buttonCy;
          opacity = 1;
          clicking = true;
        } else if (t < P_MENU_OPEN) {
          x = buttonCx;
          y = buttonCy;
          opacity = 1;
          menuOpen = true;
        } else if (t < P_TO_GROUP) {
          const p = easeOutCubic(
            (t - P_MENU_OPEN) / (P_TO_GROUP - P_MENU_OPEN),
          );
          x = lerp(buttonCx, groupItemX, p);
          y = lerp(buttonCy, groupItemY, p);
          opacity = 1;
          menuOpen = true;
          hoverGroup = p > 0.6;
        } else if (t < P_HOVER_GROUP) {
          x = groupItemX;
          y = groupItemY;
          opacity = 1;
          menuOpen = true;
          hoverGroup = true;
        } else if (t < P_CLICK_GROUP) {
          x = groupItemX;
          y = groupItemY;
          opacity = 1;
          menuOpen = true;
          hoverGroup = true;
          clicking = true;
        } else if (t < P_LINGER_GROUP) {
          // Menu closes, h2+g2 are now grouped — brief pause to let
          // the grouping register before we move on to h3.
          x = groupItemX;
          y = groupItemY;
          opacity = 1;
          grouped = 1;
        } else if (t < P_TO_H3) {
          // Travel from the menu position straight over to h3 — no
          // explicit drag of the first group, just on to the next.
          const p = easeOutCubic(
            (t - P_LINGER_GROUP) / (P_TO_H3 - P_LINGER_GROUP),
          );
          x = lerp(groupItemX, h3GrabFromX, p);
          y = lerp(groupItemY, headerY, p);
          opacity = 1;
          grouped = 1;
          cursor = p > 0.6 ? "open" : "arrow";
        } else if (t < P_GRAB_H3) {
          x = h3GrabFromX;
          y = headerY;
          opacity = 1;
          cursor = "closed";
          clicking = true;
          grouped = 1;
        } else if (t < P_DRAG_H3) {
          const p = easeInOut((t - P_GRAB_H3) / (P_DRAG_H3 - P_GRAB_H3));
          x = lerp(h3GrabFromX, h3GrabToX, p);
          y = headerY - DRAG_ARC * Math.sin(p * Math.PI);
          opacity = 1;
          cursor = "closed";
          clicking = true;
          grouped = 1;
          moveP2 = p;
        } else if (t < P_DROP_H3) {
          x = h3GrabToX;
          y = headerY;
          opacity = 1;
          clicking = t < P_DROP_H3 - 0.012;
          cursor = clicking ? "closed" : "open";
          grouped = 1;
          moveP2 = 1;
        } else if (t < P_LINGER_H3) {
          x = h3GrabToX;
          y = headerY;
          opacity = 1;
          cursor = "open";
          grouped = 1;
          moveP2 = 1;
        } else if (t < P_FADE_OUT) {
          const p = (t - P_LINGER_H3) / (P_FADE_OUT - P_LINGER_H3);
          x = h3GrabToX;
          y = headerY;
          opacity = 1 - p;
          cursor = "open";
          grouped = 1;
          moveP2 = 1;
        } else {
          opacity = 0;
          grouped = 1;
          moveP2 = 1;
        }

        // h2 + g2 stay put — no explicit drag any more.
        const h2Start = H2_START;
        const g2Start = G2_START;
        const h3Start = lerp(H3_START_FROM, H3_START_TO, moveP2);
        const g3Start = lerp(G3_START_FROM, G3_START_TO, moveP2);

        // Live clip coords for the Group bracket — kept in sync with the
        // animated start positions so the bracket follows the drag.
        const h2ClipLive = {
          x: timeToX(h2Start),
          y: h2Clip.y,
          w: h2Clip.w,
          h: h2Clip.h,
        };
        const g2ClipLive = {
          x: timeToX(g2Start),
          y: g2Clip.y,
          w: g2Clip.w,
          h: g2Clip.h,
        };

        setSplitFrame({
          x,
          y,
          opacity,
          cursor,
          clicking,
          buttonActive: false,
          lineX: null,
          split: false,
          menuOpen,
          hoverGroup,
          grouped,
          groupedClips: [h2ClipLive, g2ClipLive],
        });

        // Selection model: clicking the second group's clip (the moment
        // we land on h3 to start beat 2) deselects the first group —
        // matches the app's "click-elsewhere-clears-selection" rule.
        const secondGroupEngaged = t >= P_TO_H3;
        setClipOverrides({
          h2: { selected: !secondGroupEngaged, start: h2Start },
          g2: { selected: !secondGroupEngaged, start: g2Start },
          h3: { selected: secondGroupEngaged, start: h3Start },
          g3: { selected: secondGroupEngaged, start: g3Start },
          // sfx1 also gets deselected when the second group engages.
          sfx1: { selected: !secondGroupEngaged, start: 6.1 },
          // Preserve previous stops' state so scroll-back is consistent.
          s1: {
            duration: S1_A_DUR,
            waveform: S1_PART_A,
            selected: false,
            focused: false,
          },
          s2: {
            duration: DROP_START - S2_START,
          },
        });
        setExtraClips({
          1: [
            {
              id: "s1-b",
              name: "Intro theme",
              start: S1_B_START,
              duration: S1_B_DUR,
              waveform: S1_PART_B,
              selected: false,
              focused: false,
            },
            {
              id: "s1-c",
              name: "Intro theme",
              start: DROP_START,
              duration: S1_C_DUR,
              waveform: S1_PART_C,
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
      const easeOutCubic = (u) => 1 - Math.pow(1 - u, 3);
      const lerp = (a, b, t) => a + (b - a) * t;

      // s1 here is the FIRST split (S1_A_DUR ≈ 2.52s), not the original
      // 7.2s clip. Envelope point times are fractions of THIS shorter
      // clip, so they land on the visible audio.
      const ENV_S1_DURATION = S1_A_DUR;
      // Trimmed from 11s → 7.5s — same beats, faster pace.
      const CYCLE = 7500;
      const parkX = 92;
      const parkY = 86;
      const buttonCx = button.x + button.w / 2;
      const buttonCy = button.y + button.h / 2;
      const lineY = clip.y + clip.h * 0.42;
      const dragEndY = clip.y + clip.h * 0.85;
      const pointATime = ENV_S1_DURATION * 0.2;
      const pointAX = clip.x + clip.w * 0.2;
      const pointBTime = ENV_S1_DURATION * 0.75;
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
          // travel to envelope button — decelerating arrival
          const p = easeOutCubic((t - 0.08) / 0.09);
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
          const p = easeOutCubic((t - 0.21) / 0.07);
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
          const p = easeOutCubic((t - 0.32) / 0.09);
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
          const p = easeOutCubic((t - 0.72) / 0.11);
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

        // Preserve the cumulative state from every prior stop. The
        // animation was overwriting this every frame which collapsed
        // the splits / drops / multi-select / clip-groups results.
        const s1Override = {
          duration: S1_A_DUR,
          waveform: S1_PART_A,
          selected: false,
          focused: focusClip,
        };
        if (envOn && points.length > 0) s1Override.envelopePoints = points;
        setClipOverrides({
          s1: s1Override,
          s2: { duration: DROP_START - S2_START },
          h2: { selected: false, start: 6.5 },
          g2: { selected: false, start: 9.3 },
          h3: { selected: true, start: 11.8 },
          g3: { selected: true, start: 15.2 },
          sfx1: { selected: false, start: 6.1 },
        });
        setExtraClips({
          1: [
            {
              id: "s1-b",
              name: "Intro theme",
              start: S1_B_START,
              duration: S1_B_DUR,
              waveform: S1_PART_B,
              selected: false,
              focused: false,
            },
            {
              id: "s1-c",
              name: "Intro theme",
              start: DROP_START,
              duration: S1_C_DUR,
              waveform: S1_PART_C,
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
        setEnvelopeFrame(null);
        // Reset on leave so a stale "envelope on" frame doesn't bleed
        // into the next stop while React processes the transition.
        setEnvelopeMode(undefined);
      };
    }

    setSplitFrame(null);
    setEnvelopeFrame(null);
  }, [stop.id]);

  const panelOnLeft = stop.panelSide === "left";
  const panelOnRight = stop.panelSide === "right";
  const isIntro = stop.panelSide === "intro";
  const isReveal = stop.panelSide === "reveal";
  // Intro config declares lidAngle -85 so the SSR/first client paint show a
  // closed laptop. Once the auto-open finishes we promote intro to a 0deg
  // resting state so scrolling back doesn't re-close the lid.
  const restingLidAngle =
    isIntro && hasAutoOpened ? 0 : (stop.laptop.lidAngle ?? 0);
  const lidAngle = restingLidAngle;

  // On mobile, ignore the per-stop x/y translates (they were tuned to
  // clear a side panel that doesn't exist in the mobile layout) and
  // apply a cinematic pan+zoom from `stop.mobileFocus` instead. The
  // laptop stays centred at scale 1 by default (workspace, intro);
  // focus stops shift the laptop so their point of interest
  // lands at viewport centre, then scale up.
  //
  // Math: `translate(shiftX%, shiftY%)` moves the laptop element by a
  // % of its OWN dimensions. To bring focus point (x, y) — in % of the
  // laptop element — to the centre, we translate by (50 - x, 50 - y).
  // Applying `scale(zoom)` after keeps the centre-aligned focus fixed
  // and enlarges everything around it.
  let transform;
  let laptopTransition;
  if (isMobile) {
    const focus = stop.mobileFocus ?? { x: 50, y: 50, zoom: 1 };
    const shiftX = 50 - focus.x;
    const shiftY = 50 - focus.y;
    transform = `translate(${shiftX}%, ${shiftY}%) scale(${focus.zoom})`;
    // Longer, slower-in-slower-out ease so the pan/zoom reads as a
    // camera move rather than an abrupt jump.
    laptopTransition = "transform 900ms cubic-bezier(0.65, 0.05, 0.36, 1)";
  } else {
    transform = `translate3d(${stop.laptop.x}, ${stop.laptop.y}, 0) scale(${stop.laptop.scale})`;
    // scroll-snap-stop: always forces a hard scroll landing on each
    // panel. Use a shorter fast-start ease so the laptop is
    // essentially in place by the time the snap finishes.
    laptopTransition = "transform 360ms cubic-bezier(0.2, 0, 0.2, 1)";
  }

  return (
    <section
      ref={sectionRef}
      className="relative bg-background-dark"
      style={{ overflow: "clip" }}
    >
      <style>{`
        @keyframes tour-laptop-enter {
          0%   { opacity: 0; transform: translateY(96px) scale(0.94); filter: blur(10px); }
          55%  { opacity: 1; }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @keyframes tour-title-enter {
          0%   { transform: translateY(14px); }
          100% { transform: translateY(0); }
        }
        @keyframes tour-eyebrow-enter {
          0%   { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes tour-word-enter {
          0%   { opacity: 0; transform: translateY(22px); filter: blur(6px); }
          100% { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        @keyframes tour-glow-enter {
          0%   { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes mobile-tour-panel-in {
          0%   { opacity: 0; transform: translateY(12px); filter: blur(4px); }
          100% { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        .mobile-tour-panel {
          animation: mobile-tour-panel-in 460ms cubic-bezier(0.2, 0.7, 0.2, 1) both;
        }
      `}</style>
      <div
        ref={stageRef}
        className={
          "sticky top-0 w-full flex items-center justify-center " +
          (isMobile ? "flex-col gap-12 pt-16 pb-16" : "")
        }
        style={{
          height: "100vh",
          // svh (not dvh) so the pinned tour container's height is
          // stable across mobile chrome toggles — dvh caused visible
          // reflow of the pinned laptop every time the URL bar hid.
          ...(typeof CSS !== "undefined" && CSS.supports("height: 100svh")
            ? { height: "100svh" }
            : {}),
          zIndex: 1,
        }}
      >
        {/* Ambient glow behind the laptop — soft radial that anchors the
            intro composition and gives the reveal a warmer, cinematic feel.
            Fades out as the user leaves the intro so other stops stay flat. */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 0,
            background:
              "radial-gradient(60% 45% at 50% 62%, rgba(120, 70, 200, 0.28) 0%, rgba(60, 40, 140, 0.14) 40%, rgba(0,0,0,0) 72%)",
            opacity: isIntro ? 1 : 0,
            transition: "opacity 520ms ease-out",
            animation: isIntro
              ? "tour-glow-enter 1200ms ease-out 200ms both"
              : undefined,
          }}
        />
        {/* Entrance wrapper — plays once on mount so the laptop drifts up into
            its resting closed pose. Nested transform composes with the
            stop-driven translate/scale below, so the entrance and stop
            transitions don't fight each other. */}
        <div
          style={{
            animation:
              "tour-laptop-enter 850ms cubic-bezier(0.16, 0.72, 0.24, 1) 300ms both",
            willChange: "opacity, transform",
          }}
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
            <LaptopFrame lidRef={lidRef} lidAngle={lidAngle}>
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
        </div>

        {!isMobile && (
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
        )}

        {!isMobile && (
          <>
            {/* Intro title card entrance — text drifts in and settles above the
                laptop. The wrapper's animation runs once on mount; IntroOverlay's
                own opacity transition still handles the exit when the user
                scrolls past the intro stop. */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                zIndex: 20,
                animation:
                  "tour-title-enter 700ms cubic-bezier(0.16, 0.72, 0.24, 1) 120ms both",
                willChange: "opacity, transform",
              }}
            >
              <IntroOverlay
                visible={isIntro}
                eyebrow={introStop.eyebrow}
                heading={introStop.heading}
                topAlign
              />
            </div>
            <IntroOverlay
              visible={isReveal}
              eyebrow={stop.eyebrow}
              heading={stop.heading}
              description={stop.description}
              compact
              accentColor={stop.accentColor}
            />
          </>
        )}

        {isMobile && (
          // Text card below the laptop for every stop — replaces the
          // desktop side-panel + IntroOverlay pair. Consistent layout
          // across every stop so scroll transitions read as smooth
          // laptop zoom/pan changes rather than layout jumps.
          // key={stop.id} remounts on stop change so the fade-in
          // animation restarts.
          <div
            key={stop.id}
            className="mobile-tour-panel px-6 text-center max-w-md z-20 relative"
          >
            <div
              className="font-mono text-xs tracking-[0.2em] uppercase"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              {stop.eyebrow}
            </div>
            <h3
              className="font-harmony mt-2 text-2xl sm:text-3xl leading-tight text-text-contrast"
              style={stop.accentColor ? { color: stop.accentColor } : undefined}
            >
              {stop.heading}
            </h3>
            {stop.description && (
              <p className="mt-2 text-sm text-text-contrast/75 leading-relaxed">
                {stop.description}
              </p>
            )}
          </div>
        )}

        <ScrollIndicator
          visible={!isIntro}
          orientation={isMobile ? "horizontal" : "vertical"}
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

      <div
        style={{
          marginTop: "-100vh",
          // svh to match the sticky container's svh — otherwise the
          // scroll drivers offset by a different unit than the pinned
          // area and the whole tour's scroll math misaligns as chrome
          // toggles.
          ...(typeof CSS !== "undefined" && CSS.supports("margin-top: -100svh")
            ? { marginTop: "-100svh" }
            : {}),
          position: "relative",
          zIndex: 2,
        }}
      >
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
                //
                // svh (not vh) so the driver height is in the same viewport
                // unit as the sticky container above. Any mismatch (e.g.
                // sticky=svh but drivers=vh) shows up on iOS as a wiggle
                // that matches the browser chrome height, because the
                // scroll region and the pinned region interpret viewport
                // differently as chrome toggles.
                height: "130svh",
                minHeight: "130svh",
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
