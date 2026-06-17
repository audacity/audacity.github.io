import React from "react";

function ScrollIndicator({ stops, activeIndex, onJump }) {
  return (
    <nav
      aria-label="Tour progress"
      className="absolute z-40 top-1/2 -translate-y-1/2 flex flex-col items-center gap-3"
      style={{ right: "max(2vw, 24px)" }}
    >
      {stops.map((s, i) => {
        const active = i === activeIndex;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onJump(i)}
            aria-label={`Jump to stop ${i + 1}: ${s.heading}`}
            aria-current={active ? "true" : "false"}
            style={{
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
            }}
          />
        );
      })}
    </nav>
  );
}

export default ScrollIndicator;
