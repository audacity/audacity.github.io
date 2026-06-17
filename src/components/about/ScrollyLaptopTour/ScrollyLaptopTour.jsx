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

function DesktopTour() {
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const laptopRef = useRef(null);
  const tourPanelRef = useRef(null);
  const panelRefs = useRef([]);
  const [stopIndex, setStopIndex] = useState(0);
  const [clipOverrides, setClipOverrides] = useState(null);
  const [renderStopId, setRenderStopId] = useState(STOPS[0].id);
  const config = WORKSPACE_CONFIGS.music;
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
    const currentId = renderStopId;
    const targetId = scrolledStop.id;
    if (currentId === targetId) return;
    const beatPairs = [
      ["intro", "clip-handles"],
      ["clip-handles", "intro"],
    ];
    const needsBeat = beatPairs.some(
      ([from, to]) => currentId === from && targetId === to,
    );
    if (needsBeat) {
      setRenderStopId("full-ui");
      const t = setTimeout(() => setRenderStopId(targetId), 1200);
      return () => clearTimeout(t);
    }
    setRenderStopId(targetId);
  }, [scrolledStop.id]);

  useEffect(() => {
    if (stop.id === "clip-handles") {
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

    if (stop.id === "multi-select") {
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

    setClipOverrides(null);
  }, [stop.id]);

  const panelOnLeft = stop.panelSide === "left";
  const panelOnRight = stop.panelSide === "right";
  const isIntro = stop.panelSide === "intro";
  const isOutro = stop.panelSide === "outro";
  const lidAngle = stop.laptop.lidAngle ?? 0;

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
          <LaptopFrame lidAngle={lidAngle}>
            <WorkspaceCanvas config={config} clipOverrides={clipOverrides} />
            <TourOverlay
              overlay={stop.overlay}
              targetId={stop.id}
              target={stop.target}
            />
          </LaptopFrame>
        </div>

        <div
          className="absolute top-1/2 z-20 px-8 lg:px-14 max-w-[440px]"
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
        />
        <IntroOverlay
          visible={isOutro}
          eyebrow={outroStop.eyebrow}
          heading={outroStop.heading}
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
                scrollSnapStop: "always",
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
