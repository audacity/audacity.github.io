import React from "react";

function IntroOverlay({ visible, eyebrow, heading }) {
  return (
    <div
      className="absolute inset-0 z-20 pointer-events-none flex flex-col items-center justify-between"
      style={{
        paddingTop: "9vh",
        paddingBottom: "9vh",
        opacity: visible ? 1 : 0,
        transition: "opacity 320ms ease-out",
      }}
    >
      <div className="text-center px-6 max-w-3xl">
        <div
          className="font-mono text-sm tracking-[0.3em] uppercase"
          style={{ color: "rgba(255,255,255,0.55)" }}
        >
          {eyebrow}
        </div>
        <h2 className="font-harmony mt-4 text-5xl md:text-6xl lg:text-7xl leading-[1.05] text-text-contrast">
          {heading}
        </h2>
      </div>

      <ScrollChevron />

      <style>{`
        @keyframes scrolly-chevron-bob {
          0%, 100% { transform: translateY(0); opacity: 0.55; }
          50%      { transform: translateY(10px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function ScrollChevron() {
  return (
    <div className="flex flex-col items-center gap-2">
      <span
        className="font-mono text-xs tracking-[0.3em] uppercase"
        style={{ color: "rgba(255,255,255,0.55)" }}
      >
        Scroll
      </span>
      <svg
        width="28"
        height="36"
        viewBox="0 0 28 36"
        fill="none"
        aria-hidden
        style={{ animation: "scrolly-chevron-bob 1.8s ease-in-out infinite" }}
      >
        <rect
          x="3"
          y="3"
          width="22"
          height="30"
          rx="11"
          stroke="rgba(255,255,255,0.6)"
          strokeWidth="1.6"
          fill="none"
        />
        <rect
          x="13"
          y="9"
          width="2"
          height="6"
          rx="1"
          fill="rgba(255,255,255,0.8)"
        />
      </svg>
    </div>
  );
}

export default IntroOverlay;
