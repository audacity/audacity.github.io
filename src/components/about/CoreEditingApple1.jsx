import React, { useEffect, useRef, useState } from "react";
import { CARDS } from "./CoreEditing.jsx";
import { useInView } from "../../hooks/useInView.js";

// Apple Logic Pro pattern #1 — "Get to Know Logic Pro":
// Single card at a time with the demo as a hero, headline overlaid
// bottom-left, slim dot indicators + a play/pause toggle underneath.
// Card sized smaller than Apple's full-bleed treatment so it sits
// inside the page rather than dominating it.
const CYCLE_MS = 6500;

function CoreEditingApple1() {
  const sectionRef = useRef(null);
  const sectionInView = useInView(sectionRef);
  const [activeIdx, setActiveIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef(null);

  useEffect(() => {
    if (paused || !sectionInView) return;
    const t = setTimeout(() => {
      setActiveIdx((i) => (i + 1) % CARDS.length);
    }, CYCLE_MS);
    return () => clearTimeout(t);
  }, [paused, sectionInView, activeIdx]);

  const advance = (delta) => {
    setActiveIdx((i) => (i + delta + CARDS.length) % CARDS.length);
  };

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) {
      advance(dx < 0 ? 1 : -1);
      setPaused(true);
    }
    touchStartX.current = null;
  };

  const card = CARDS[activeIdx];
  const Demo = card.Demo;

  return (
    <section
      ref={sectionRef}
      className="bg-background-dark px-6 lg:px-10 py-24 lg:py-32"
    >
      <div className="max-w-screen-xl mx-auto">
        <header className="max-w-3xl">
          <div
            className="font-mono text-xs tracking-[0.3em] uppercase text-accent"
            aria-hidden
          >
            Apple pattern #1 · Get to Know
          </div>
          <h2 className="mt-4 font-harmony text-text-contrast text-4xl md:text-5xl lg:text-6xl leading-[1.05]">
            Hundreds of smaller things
          </h2>
          <p className="mt-5 text-text-contrast/70 text-base md:text-lg max-w-2xl">
            Single card with the demo as a hero, headline overlaid; slim dots +
            a play toggle below. Smaller than Apple's full-bleed so it sits
            inside the page rather than swallowing it.
          </p>
        </header>

        <div className="mt-10 lg:mt-12 max-w-4xl mx-auto">
          {/* Hero card — demo + bottom-left text overlay. */}
          <div
            className="rounded-2xl border border-white/10 bg-[rgb(20,16,56)] overflow-hidden relative"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            style={{ aspectRatio: "16/9" }}
          >
            {/* Only the active demo renders, so only one animation is
                running across the whole section. */}
            <Demo isActive />
            {/* Bottom gradient + text overlay (Apple's pattern). */}
            <div
              className="absolute inset-x-0 bottom-0 px-6 lg:px-9 pb-6 lg:pb-7 pt-16 pointer-events-none"
              style={{
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.4) 55%, transparent 100%)",
              }}
            >
              <div
                className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/75"
                aria-hidden
              >
                {card.eyebrow}
              </div>
              <h3 className="mt-2 font-harmony text-white text-2xl md:text-3xl lg:text-4xl leading-tight max-w-xl">
                {card.title}
              </h3>
            </div>
          </div>

          {/* Controls — dots + play toggle, Apple-style. */}
          <div className="mt-6 flex items-center justify-center gap-4">
            <div className="flex items-center gap-1.5">
              {CARDS.map((c, idx) => {
                const isActive = idx === activeIdx;
                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-label={`Show ${c.title}`}
                    onClick={() => {
                      setActiveIdx(idx);
                      setPaused(true);
                    }}
                    className="group relative h-2.5 transition-all rounded-full overflow-hidden"
                    style={{
                      width: isActive ? 28 : 8,
                      background: isActive
                        ? "rgba(255,255,255,0.18)"
                        : "rgba(255,255,255,0.22)",
                    }}
                  >
                    {isActive && (
                      <div
                        key={`p-${activeIdx}-${paused}`}
                        className="absolute inset-y-0 left-0 bg-white/85 rounded-full"
                        style={{
                          width: "100%",
                          transform: "scaleX(0)",
                          transformOrigin: "left",
                          animation: paused
                            ? "none"
                            : `coreEditingDotFill ${CYCLE_MS}ms linear forwards`,
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              aria-label={paused ? "Resume autoplay" : "Pause autoplay"}
              onClick={() => setPaused((p) => !p)}
              className="ml-2 w-8 h-8 rounded-full bg-white/[0.08] hover:bg-white/[0.16] border border-white/15 flex items-center justify-center transition-colors"
            >
              {paused ? (
                <svg width="10" height="12" viewBox="0 0 10 12" fill="none">
                  <path d="M0 0 L10 6 L0 12 Z" fill="white" />
                </svg>
              ) : (
                <svg width="10" height="12" viewBox="0 0 10 12" fill="none">
                  <rect x="0" y="0" width="3" height="12" fill="white" />
                  <rect x="7" y="0" width="3" height="12" fill="white" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes coreEditingDotFill {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
      `}</style>
    </section>
  );
}

export default CoreEditingApple1;
