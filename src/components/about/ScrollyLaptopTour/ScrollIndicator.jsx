import React from "react";

function ScrollIndicator({
  stops,
  activeIndex,
  onJump,
  visible = true,
  orientation = "vertical",
}) {
  const isHorizontal = orientation === "horizontal";
  // Horizontal variant lives along the bottom of the sticky area
  // (mobile) — the vertical variant sits inset from the left edge
  // (desktop). Both use pill dots that grow along the axis on active.
  const wrapperStyle = isHorizontal
    ? {
        left: "50%",
        // Static px so the indicator's position doesn't shift as the
        // iOS URL bar toggles. env(safe-area-inset-bottom) changes
        // between chrome-visible (~90px) and chrome-hidden (~34px)
        // states, which made the pills visibly jump on every scroll.
        // 24px still clears the iPhone home-indicator area (~34px)
        // when the sticky container is inset from the viewport bottom
        // by the mobile chrome bar.
        bottom: "24px",
        transform: "translateX(-50%)",
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transition: "opacity 240ms ease-out",
      }
    : {
        left: "max(2vw, 24px)",
        top: "50%",
        transform: "translateY(-50%)",
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transition: "opacity 240ms ease-out",
      };
  const wrapperClass = isHorizontal
    ? "absolute z-40 flex flex-row items-center gap-3"
    : "absolute z-40 flex flex-col items-center gap-3";

  return (
    <nav
      aria-label="Tour progress"
      className={wrapperClass}
      style={wrapperStyle}
    >
      {stops.map((s, i) => {
        const active = i === activeIndex;
        const dotStyle = isHorizontal
          ? {
              width: active ? 36 : 10,
              height: 6,
              borderRadius: 999,
              background: active
                ? "rgba(255,255,255,0.92)"
                : "rgba(255,255,255,0.28)",
              border: 0,
              padding: 0,
              cursor: "pointer",
              transition:
                "width 280ms cubic-bezier(0.65,0.05,0.2,1), background-color 200ms ease-out",
            }
          : {
              width: 6,
              height: active ? 36 : 10,
              borderRadius: 999,
              background: active
                ? "rgba(255,255,255,0.92)"
                : "rgba(255,255,255,0.28)",
              border: 0,
              padding: 0,
              cursor: "pointer",
              transition:
                "height 280ms cubic-bezier(0.65,0.05,0.2,1), background-color 200ms ease-out",
            };
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onJump(i)}
            aria-label={`Jump to stop ${i + 1}: ${s.heading}`}
            aria-current={active ? "true" : "false"}
            style={dotStyle}
          />
        );
      })}
    </nav>
  );
}

export default ScrollIndicator;
