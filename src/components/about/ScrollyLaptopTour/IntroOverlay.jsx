import React from "react";

function IntroOverlay({
  visible,
  eyebrow,
  heading,
  description,
  compact,
  centerHeading,
  topAlign,
  dimProgress = 0,
  accentColor,
}) {
  const eyebrowClass = compact
    ? "font-mono text-sm tracking-[0.2em] uppercase"
    : "font-mono text-sm tracking-[0.3em] uppercase";
  // topAlign uses a slightly smaller heading than the vertically-centered
  // variant so the title stays on one line above the laptop rather than
  // wrapping mid-word ("Audacity" / "4").
  const headingColorClass = accentColor ? "" : "text-text-contrast";
  const headingClass = compact
    ? `font-harmony mt-4 text-5xl md:text-6xl leading-[1.03] ${headingColorClass}`
    : topAlign
      ? `font-harmony mt-4 text-5xl md:text-6xl leading-[1.05] ${headingColorClass}`
      : `font-harmony mt-4 text-5xl md:text-6xl lg:text-7xl leading-[1.05] ${headingColorClass}`;
  // When a stop passes an accentColor, tint the heading with it so
  // scrolling into this stop reads as a color change (see stops.js
  // for the per-stop palette).
  const headingStyleColor = accentColor ? { color: accentColor } : undefined;
  const headingContainerMax = topAlign ? "max-w-5xl" : "max-w-2xl";
  const dimOpacity = Math.max(0, Math.min(1, 1 - dimProgress));
  // Fade the text out very early in the lid-open scroll — by the time the
  // lid is ~10% open the heading should already be gone, so it never
  // overlaps the laptop visually as the lid lifts into its final position.
  // Tightened STAGGER too so the per-character delay doesn't drag the tail
  // of the heading on past where we want it visible.
  const textDim = Math.min(1, dimProgress * 10);
  const STAGGER = 0.15;
  const easeIn = (u) => u * u;

  // Split into word/whitespace tokens so the per-character animation
  // spans can be grouped inside a per-word `nowrap` container.
  // Without this the browser is free to break BETWEEN characters,
  // which is how "And we're only just getting started" was wrapping
  // as "just getting s" / "tarted" — every char is its own inline-
  // block, so the line can break at any of them. Grouping per word
  // keeps the word atomic at the wrap; the heading still breaks at
  // spaces as expected.
  const headingStr = String(heading || "");
  const tokens = headingStr.split(/(\s+)/).filter(Boolean);
  const total = Math.max(1, headingStr.length);

  const headingBlock = (
    <div
      className={`text-center px-6 ${headingContainerMax}`}
      style={{
        transform: `translateY(${-24 * textDim}px)`,
      }}
    >
      <div
        className={eyebrowClass}
        style={{
          color: "rgba(255,255,255,0.4)",
          opacity: Math.max(0, 1 - textDim * 1.6),
          transform: `translateY(${-18 * textDim}px)`,
          filter: `blur(${5 * textDim}px)`,
          letterSpacing: `${0.2 + 0.15 * textDim}em`,
          transition: "opacity 120ms linear",
          animation: topAlign
            ? "tour-eyebrow-enter 520ms cubic-bezier(0.16, 0.72, 0.24, 1) 160ms both"
            : undefined,
        }}
      >
        {eyebrow}
      </div>
      <h2
        className={headingClass}
        aria-label={heading}
        style={headingStyleColor}
      >
        {(() => {
          let charIdx = 0;
          const renderChar = (c, i) => {
            const delay = (i / total) * STAGGER;
            const denom = Math.max(0.001, 1 - STAGGER);
            const raw = (textDim - delay) / denom;
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
                {c === " " ? " " : c}
              </span>
            );
          };
          let wordIdx = 0;
          return tokens.map((token, ti) => {
            if (/^\s+$/.test(token)) {
              // Whitespace renders as a normal char so the browser
              // wraps here as it would in plain text.
              const node = renderChar(token, charIdx);
              charIdx += token.length;
              return <React.Fragment key={`s-${ti}`}>{node}</React.Fragment>;
            }
            // Word: nowrap container so its chars stay together when
            // the heading wraps. In the intro variant each word also
            // gets a small entrance stagger so the title reads like
            // it's being spoken onto the screen.
            const thisWordIdx = wordIdx++;
            const wordAnimation = topAlign
              ? `tour-word-enter 620ms cubic-bezier(0.16, 0.72, 0.24, 1) ${360 + thisWordIdx * 65}ms both`
              : undefined;
            return (
              <span
                key={`w-${ti}`}
                aria-hidden="true"
                style={{
                  display: "inline-block",
                  whiteSpace: "nowrap",
                  animation: wordAnimation,
                  willChange: topAlign
                    ? "opacity, transform, filter"
                    : undefined,
                }}
              >
                {Array.from(token).map((c) => {
                  const node = renderChar(c, charIdx);
                  charIdx += 1;
                  return node;
                })}
              </span>
            );
          });
        })()}
      </h2>
    </div>
  );

  // topAlign anchors the title card to the upper portion of the stage so
  // the intro composition can pair it with a smaller/lower laptop without
  // the heading colliding with the lid as it opens.
  const paddingTop = topAlign ? "13vh" : "9vh";
  // Reveal stops (the workspace stop) center a large laptop with the
  // description bottom-anchored via justify-between. On tall viewports that
  // leaves a wide gap between the laptop's lower edge and the copy, so pull
  // the copy up toward the laptop — but never past a 9vh floor, so on short
  // desktop windows (where the centered laptop nearly reaches the copy) it
  // can't collide. 50vh is the laptop's centre; ~350px clears its lower half
  // plus a small gap.
  const paddingBottom = topAlign ? "9vh" : "max(9vh, calc(50vh - 350px))";
  return (
    <div
      className="absolute inset-0 z-20 pointer-events-none flex flex-col items-center justify-between"
      style={{
        paddingTop,
        paddingBottom,
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

      {topAlign && description ? (
        <div className="flex flex-col items-center gap-5">
          <p className="text-center px-6 max-w-md text-base md:text-lg leading-relaxed text-text-contrast/70">
            {description}
          </p>
          <div style={{ opacity: dimOpacity }}>
            <ScrollChevron />
          </div>
        </div>
      ) : description ? (
        <p className="text-center px-6 max-w-lg text-lg md:text-xl leading-relaxed text-text-contrast/70">
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
