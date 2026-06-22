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
const FULL_S1_WAVEFORM = generateDecayingSineWave(7.2);
const SPLIT_IDX = Math.floor(FULL_S1_WAVEFORM.length * 0.5);
const S1_FIRST_HALF = FULL_S1_WAVEFORM.slice(0, SPLIT_IDX);
const S1_SECOND_HALF = FULL_S1_WAVEFORM.slice(SPLIT_IDX);

function computeCumulativeState(stopIndex) {
  const overrides = {};
  const extraByTrack = {};
  let envMode = undefined;

  for (let i = 0; i <= stopIndex; i++) {
    const id = STOPS[i]?.id;
    if (!id) continue;

    if (id === "split-tool") {
      overrides.s1 = {
        ...(overrides.s1 || {}),
        duration: 3.6,
        waveform: S1_FIRST_HALF,
        focused: true,
      };
      extraByTrack[1] = [
        {
          id: "s1-b",
          name: "Intro theme",
          start: 3.7,
          duration: 3.6,
          waveform: S1_SECOND_HALF,
          focused: true,
        },
      ];
    }

    if (id === "drop-anywhere") {
      // s1-b drags right onto s2; s2 trims back
      if (extraByTrack[1]?.[0]?.id === "s1-b") {
        extraByTrack[1][0] = { ...extraByTrack[1][0], start: 8.5 };
      }
      overrides.s2 = { start: 11.0, duration: 3.0 };
    }

    if (id === "multi-select") {
      // h2 + g2 selected, shifted right by 0.4s together
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
          { time: 0.72, db: 0 }, // 20% into s1's 3.6s
          { time: 2.7, db: -25 }, // 75% into s1's 3.6s
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
      const { button, clip, splitX = 0.5 } = stop.overlay;
      const easeInOut = (u) =>
        u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      const lerp = (a, b, t) => a + (b - a) * t;
      const S1_START = 0.1;
      const S1_DURATION = 7.2;
      const splitTime = S1_START + S1_DURATION * splitX;
      const firstDuration = splitTime - S1_START;
      const secondDuration = S1_START + S1_DURATION - splitTime;
      const SYNTH_TRACK_INDEX = 1;
      const fullWaveform = generateDecayingSineWave(S1_DURATION);
      const splitSampleIdx = Math.floor(fullWaveform.length * splitX);
      const firstHalfWaveform = fullWaveform.slice(0, splitSampleIdx);
      const secondHalfWaveform = fullWaveform.slice(splitSampleIdx);

      const CYCLE = 8000;
      const parkX = 92;
      const parkY = 86;
      const buttonCx = button.x + button.w / 2;
      const buttonCy = button.y + button.h / 2;
      const splitXPct = clip.x + clip.w * splitX;
      const clipApproachX = clip.x + clip.w * 0.15;
      const clipMidY = clip.y + clip.h * 0.5;

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
        let split = false;

        if (t < 0.04) {
          opacity = t / 0.04;
        } else if (t < 0.2) {
          const p = easeInOut((t - 0.04) / 0.16);
          x = lerp(parkX, buttonCx, p);
          y = lerp(parkY, buttonCy, p);
          opacity = 1;
        } else if (t < 0.24) {
          x = buttonCx;
          y = buttonCy;
          opacity = 1;
          clicking = true;
          buttonActive = t > 0.22;
        } else if (t < 0.34) {
          const p = easeInOut((t - 0.24) / 0.1);
          x = lerp(buttonCx, clipApproachX, p);
          y = lerp(buttonCy, clipMidY, p);
          opacity = 1;
          cursor = "split";
          buttonActive = true;
        } else if (t < 0.54) {
          const p = easeInOut((t - 0.34) / 0.2);
          x = lerp(clipApproachX, splitXPct, p);
          y = clipMidY;
          opacity = 1;
          cursor = "split";
          buttonActive = true;
          lineX = x;
        } else if (t < 0.58) {
          x = splitXPct;
          y = clipMidY;
          opacity = 1;
          cursor = "split";
          clicking = t < 0.56;
          buttonActive = true;
          lineX = splitXPct;
          split = t > 0.56;
        } else if (t < 0.86) {
          x = splitXPct;
          y = clipMidY;
          opacity = 1;
          cursor = "split";
          buttonActive = true;
          split = true;
        } else if (t < 0.96) {
          const p = (t - 0.86) / 0.1;
          x = splitXPct;
          y = clipMidY;
          opacity = 1 - p;
          cursor = "split";
          buttonActive = t < 0.92;
          split = t < 0.92;
        } else {
          opacity = 0;
        }

        setSplitFrame({
          x,
          y,
          opacity,
          cursor,
          clicking,
          buttonActive,
          lineX,
          split,
        });
        const focusClip = cursor === "split" || split;
        if (split) {
          setClipOverrides({
            s1: {
              duration: firstDuration,
              waveform: firstHalfWaveform,
              focused: true,
            },
          });
          setExtraClips({
            [SYNTH_TRACK_INDEX]: [
              {
                id: "s1-b",
                name: "Intro theme",
                start: splitTime,
                duration: secondDuration,
                waveform: secondHalfWaveform,
                focused: true,
              },
            ],
          });
        } else if (focusClip) {
          setClipOverrides({ s1: { focused: true } });
          setExtraClips(null);
        } else {
          setClipOverrides(null);
          setExtraClips(null);
        }
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
            transition: "transform 720ms cubic-bezier(0.65, 0.05, 0.2, 1)",
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
            [panelOnRight ? "right" : "left"]: 0,
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
          stops={STOPS.filter((s) => !s.noScrollPanel)}
          activeIndex={Math.max(
            0,
            STOPS.filter((s) => !s.noScrollPanel).findIndex(
              (s) => s.id === scrolledStop.id,
            ),
          )}
          onJump={(i) => {
            const visible = STOPS.filter((s) => !s.noScrollPanel);
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
                height: "100vh",
                minHeight: "100vh",
                scrollSnapAlign: "start",
                // Force a hard stop on each panel so a fast wheel flick can't
                // pass over multiple stops — except on the outro, where the
                // forced stop fights any attempt to scroll past into the next
                // section (the laptop's big scale-down animation is still
                // running and the snap-back reads as judder).
                scrollSnapStop: s.panelSide === "outro" ? "normal" : "always",
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
