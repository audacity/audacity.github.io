import React from "react";

function IntroOverlay({
  visible,
  eyebrow,
  heading,
  description,
  compact,
  centerHeading,
  dimProgress = 0,
}) {
  const eyebrowClass = compact
    ? "font-mono text-sm tracking-[0.2em] uppercase"
    : "font-mono text-sm tracking-[0.3em] uppercase";
  const headingClass = compact
    ? "font-harmony mt-3 text-4xl md:text-5xl leading-[1.05] text-text-contrast"
    : "font-harmony mt-4 text-5xl md:text-6xl lg:text-7xl leading-[1.05] text-text-contrast";
  const dimOpacity = Math.max(0, Math.min(1, 1 - dimProgress));
  const STAGGER = 0.35;
  const easeIn = (u) => u * u;
  const chars = String(heading || "").split("");
  const total = Math.max(1, chars.length);

  const headingBlock = (
    <div
      className="text-center px-6 max-w-2xl"
      style={{
        transform: `translateY(${-24 * dimProgress}px)`,
      }}
    >
      <div
        className={eyebrowClass}
        style={{
          color: "rgba(255,255,255,0.4)",
          opacity: Math.max(0, 1 - dimProgress * 1.6),
          transform: `translateY(${-18 * dimProgress}px)`,
          filter: `blur(${5 * dimProgress}px)`,
          letterSpacing: `${0.2 + 0.15 * dimProgress}em`,
          transition: "opacity 120ms linear",
        }}
      >
        {eyebrow}
      </div>
      <h2
        className={headingClass}
        aria-label={heading}
        style={{ display: "inline-block" }}
      >
        {chars.map((c, i) => {
          const delay = (i / total) * STAGGER;
          const denom = Math.max(0.001, 1 - STAGGER);
          const raw = (dimProgress - delay) / denom;
          const cp = Math.max(0, Math.min(1, raw));
          const eased = easeIn(cp);
          return (
            <span
              key={i}
              aria-hidden="true"
              style={{
                display: "inline-block",
                whiteSpace: "pre",
                opacity: 1 - eased,
                transform: `translateY(${-70 * eased}px) scale(${1 - 0.18 * eased})`,
                filter: `blur(${10 * eased}px)`,
                willChange: "opacity, transform, filter",
              }}
            >
              {c === " " ? " " : c}
            </span>
          );
        })}
      </h2>
    </div>
  );

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
      {centerHeading ? (
        <>
          <div />
          {headingBlock}
        </>
      ) : (
        headingBlock
      )}

      {description ? (
        <p className="text-center px-6 max-w-md text-base md:text-lg leading-relaxed text-text-contrast/70">
          {description}
        </p>
      ) : (
        <div style={{ opacity: dimOpacity }}>
          <ScrollChevron />
        </div>
      )}

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
