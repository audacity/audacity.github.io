import React, { useEffect, useRef, useState } from "react";
import { CARDS } from "./CoreEditing.jsx";
import { useInView } from "../../hooks/useInView.js";

// Apple Logic Pro pattern #2 — "Plug-Ins and Sounds":
// Index column on the left (every feature visible), big single demo on
// the right. Active feature gets a progress bar; click to jump; swipe
// on touch advances; one animation runs at a time.
const CYCLE_MS = 6500;

function CoreEditingApple2() {
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
            Apple pattern #2 · Plug-Ins & Sounds
          </div>
          <h2 className="mt-4 font-harmony text-text-contrast text-4xl md:text-5xl lg:text-6xl leading-[1.05]">
            Hundreds of smaller things
          </h2>
          <p className="mt-5 text-text-contrast/70 text-base md:text-lg max-w-2xl">
            List of names down the side — click any one to jump to it. One demo
            canvas, one animation at a time.
          </p>
        </header>

        <div className="mt-10 lg:mt-12 grid lg:grid-cols-[280px_1fr] gap-6 lg:gap-10">
          {/* Index column */}
          <ul className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible scrollbar-hide">
            {CARDS.map((c, idx) => {
              const isActive = idx === activeIdx;
              return (
                <li key={c.id} className="shrink-0 lg:shrink">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveIdx(idx);
                      setPaused(true);
                    }}
                    className={
                      "w-full text-left rounded-lg px-4 py-3 transition-colors relative overflow-hidden " +
                      (isActive
                        ? "bg-white/[0.06] text-text-contrast"
                        : "text-text-contrast/55 hover:text-text-contrast/85 hover:bg-white/[0.03]")
                    }
                  >
                    <div
                      className="font-mono text-[10px] tracking-[0.22em] uppercase opacity-65"
                      aria-hidden
                    >
                      {c.eyebrow}
                    </div>
                    <div className="mt-1 font-harmony text-base md:text-lg leading-tight">
                      {c.title}
                    </div>
                    {/* Progress bar under the active item — restarts via
                        React key whenever activeIdx changes. */}
                    {isActive && (
                      <div className="absolute inset-x-0 bottom-0 h-[2px] bg-white/[0.08]">
                        <div
                          key={`p-${activeIdx}`}
                          className="h-full bg-white/55 origin-left"
                          style={{
                            animation: `coreEditingProgress ${CYCLE_MS}ms linear forwards`,
                            animationPlayState: paused ? "paused" : "running",
                          }}
                        />
                      </div>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Demo + description */}
          <div className="min-w-0">
            <div
              className="rounded-2xl border border-white/10 bg-[rgb(20,16,56)] overflow-hidden relative"
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              <div
                className="relative w-full"
                style={{ aspectRatio: "16/9", minHeight: 360 }}
              >
                <Demo isActive />
              </div>
            </div>
            <p className="mt-5 text-text-contrast/70 text-base md:text-lg max-w-2xl">
              {card.description}
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes coreEditingProgress {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { scrollbar-width: none; }
      `}</style>
    </section>
  );
}

export default CoreEditingApple2;
