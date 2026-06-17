import React, { useEffect, useState } from "react";

function computePath({ from, to, side }) {
  const elbowX =
    side === "left"
      ? from.x + (to.x - from.x) * 0.6
      : from.x - (from.x - to.x) * 0.6;
  return [
    { x: from.x, y: from.y },
    { x: elbowX, y: from.y },
    { x: elbowX, y: to.y },
    { x: to.x, y: to.y },
  ];
}

function TourArrow({ stage, panelRef, stop, version }) {
  const [path, setPath] = useState(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const stageEl = stage?.current;
    if (!stageEl || !stop || !stop.panelSide) {
      setPath(null);
      return;
    }
    const compute = () => {
      const stageRect = stageEl.getBoundingClientRect();
      setSize({ w: stageRect.width, h: stageRect.height });

      const panelEl = panelRef?.current;
      const targetEl = stageEl.querySelector(`[data-tour-target="${stop.id}"]`);
      if (!panelEl || !targetEl) {
        setPath(null);
        return;
      }
      const headingEl =
        panelEl.querySelector("[data-tour-panel-heading]") || panelEl;
      const panelRect = headingEl.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();

      const fromX =
        stop.panelSide === "left"
          ? panelRect.right - stageRect.left + 12
          : panelRect.left - stageRect.left - 12;
      const fromY = panelRect.top + panelRect.height / 2 - stageRect.top;

      const toX =
        stop.panelSide === "left"
          ? targetRect.left - stageRect.left - 4
          : targetRect.right - stageRect.left + 4;
      const toY = targetRect.top + targetRect.height / 2 - stageRect.top;

      setPath(
        computePath({
          from: { x: fromX, y: fromY },
          to: { x: toX, y: toY },
          side: stop.panelSide,
        }),
      );
    };

    setPath(null);
    let settled = false;
    const settle = () => {
      if (settled) return;
      settled = true;
      compute();
    };
    const onTransitionEnd = (e) => {
      if (e.propertyName === "transform") settle();
    };
    stageEl.addEventListener("transitionend", onTransitionEnd, true);
    const fallback = setTimeout(settle, 820);
    const ro = new ResizeObserver(() => {
      if (settled) compute();
    });
    ro.observe(stageEl);
    const onResize = () => {
      if (settled) compute();
    };
    window.addEventListener("resize", onResize);
    return () => {
      stageEl.removeEventListener("transitionend", onTransitionEnd, true);
      clearTimeout(fallback);
      ro.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [stage, panelRef, stop, version]);

  if (!path || !stop || !stop.panelSide) return null;

  const d = path
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");
  const head = path[path.length - 1];
  const dotRadius = 4;

  return (
    <svg
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        overflow: "visible",
      }}
      viewBox={`0 0 ${size.w || 1} ${size.h || 1}`}
      preserveAspectRatio="none"
    >
      <path
        d={d}
        fill="none"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          strokeDasharray: 2000,
          strokeDashoffset: 0,
          filter: "drop-shadow(0 0 6px rgba(255,255,255,0.35))",
          animation: "tour-arrow-draw 420ms ease-out",
        }}
      />
      <circle
        cx={head.x}
        cy={head.y}
        r={dotRadius}
        fill="#ffffff"
        style={{
          filter: "drop-shadow(0 0 6px rgba(255,255,255,0.45))",
        }}
      />
      <style>{`@keyframes tour-arrow-draw{from{stroke-dashoffset:1000}to{stroke-dashoffset:0}}`}</style>
    </svg>
  );
}

export default TourArrow;
