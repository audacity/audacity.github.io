import React, { useEffect, useState } from "react";

const ENTER_DURATION = 520;
const EXIT_DURATION = 260;
const ENTER_STAGGER = 80;
const EXIT_STAGGER = 50;
const EXIT_TOTAL = EXIT_DURATION + EXIT_STAGGER * 2;

const hasPanel = (stop) =>
  stop?.panelSide === "left" || stop?.panelSide === "right";

function TourPanel({ stop, panelRef }) {
  const [displayStop, setDisplayStop] = useState(hasPanel(stop) ? stop : null);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const incomingHasPanel = hasPanel(stop);
    if (stop?.id === displayStop?.id) return;

    if (displayStop) {
      setExiting(true);
      const t = setTimeout(() => {
        setExiting(false);
        setDisplayStop(incomingHasPanel ? stop : null);
      }, EXIT_TOTAL);
      return () => clearTimeout(t);
    }

    if (incomingHasPanel) {
      setDisplayStop(stop);
    }
  }, [stop?.id]);

  if (!displayStop) {
    return <div ref={panelRef} style={{ visibility: "hidden" }} />;
  }

  const enterAnim = (delay) =>
    `tour-line-in ${ENTER_DURATION}ms cubic-bezier(0.2, 0.7, 0.2, 1) ${delay}ms both`;
  const exitAnim = (delay) =>
    `tour-line-out ${EXIT_DURATION}ms cubic-bezier(0.4, 0, 1, 1) ${delay}ms both`;

  const line = (enterDelay, exitDelay) => ({
    animation: exiting ? exitAnim(exitDelay) : enterAnim(enterDelay),
    willChange: "opacity, transform, filter",
  });

  return (
    <div
      ref={panelRef}
      key={displayStop.id}
      className="max-w-[27rem] text-text-contrast"
    >
      <div
        className="font-mono text-sm tracking-[0.2em] uppercase"
        style={{
          color: "rgba(255,255,255,0.4)",
          ...line(0, EXIT_STAGGER * 2),
        }}
      >
        {displayStop.eyebrow}
      </div>
      <h3
        className="font-harmony mt-4 text-5xl md:text-6xl leading-[1.03]"
        data-tour-panel-heading
        style={{
          // Per-stop accent tint (see stops.js). Each stop advances the
          // hue so a heading swap reads as a color change too, not just
          // a text swap. Falls back to inherited white if a stop doesn't
          // declare one.
          color: displayStop.accentColor,
          ...line(ENTER_STAGGER, EXIT_STAGGER),
        }}
      >
        {displayStop.heading}
      </h3>
      <p
        className="mt-6 text-lg md:text-xl text-text-contrast/70 leading-relaxed"
        style={line(ENTER_STAGGER * 2, 0)}
      >
        {displayStop.description}
      </p>
      <style>{`
        @keyframes tour-line-in {
          from { opacity: 0; transform: translateY(18px); filter: blur(8px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        @keyframes tour-line-out {
          from { opacity: 1; transform: translateY(0); filter: blur(0); }
          to { opacity: 0; transform: translateY(-12px); filter: blur(6px); }
        }
      `}</style>
    </div>
  );
}

export default TourPanel;
