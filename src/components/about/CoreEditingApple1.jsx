import React, { useEffect, useRef, useState } from "react";
import { CARDS } from "./CoreEditing.jsx";
import { useInView } from "../../hooks/useInView.js";

// Apple Logic Pro pattern #1 — "Get to Know Logic Pro":
// Big horizontal feature carousel. One large card visible at a time
// (one demo running at a time), big hero canvas + headline below.
// Tab indicators along the bottom for jump-navigation; autoplay walks
// the row; swipe on touch.
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
            One big card at a time, autoplay walks the row, tabs along the
            bottom jump to any feature.
          </p>
        </header>

        <div
          className="mt-10 lg:mt-12 rounded-3xl border border-white/10 bg-[rgb(20,16,56)] overflow-hidden relative"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* Demo canvas — takes up the full card area. */}
          <div
            className="relative w-full"
            style={{ aspectRatio: "16/9", minHeight: 360 }}
          >
            {/* Only render the active demo, so only one animation runs
                at a time across the whole section. */}
            <Demo isActive />
          </div>

          {/* Headline + description under the hero. */}
          <div className="px-8 py-7 lg:px-10 lg:py-9 border-t border-white/10">
            <div
              className="font-mono text-[10px] tracking-[0.3em] uppercase text-text-contrast/45"
              aria-hidden
            >
              {card.eyebrow}
            </div>
            <h3 className="mt-3 font-harmony text-text-contrast text-2xl md:text-3xl leading-tight">
              {card.title}
            </h3>
            <p className="mt-3 text-text-contrast/70 text-base md:text-lg max-w-3xl">
              {card.description}
            </p>
          </div>
        </div>

        {/* Tab indicators */}
        <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
          {CARDS.map((c, idx) => {
            const isActive = idx === activeIdx;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setActiveIdx(idx);
                  setPaused(true);
                }}
                className={
                  "px-4 py-2 rounded-full text-xs font-mono tracking-[0.18em] uppercase transition-all " +
                  (isActive
                    ? "bg-text-contrast text-background-dark"
                    : "bg-white/[0.05] text-text-contrast/65 border border-white/15 hover:border-white/35")
                }
              >
                {c.eyebrow}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default CoreEditingApple1;
