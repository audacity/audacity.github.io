import React, { useEffect, useRef, useState } from "react";
import { CARDS } from "./CoreEditing.jsx";
import { useInView } from "../../hooks/useInView.js";

// Apple Logic Pro pattern #1 — filmstrip with focus, rebuilt on native
// CSS scroll-snap. The viewport is a horizontally-scrollable container;
// each card has scroll-snap-align:center so the browser handles
// momentum + snapping. Active card is tracked via IntersectionObserver
// so we can dim/scale neighbours, autoplay can advance, dots can
// indicate position, etc.
const CYCLE_MS = 6500;

// Active card consumes ~64% of the viewport width; non-active ones sit
// at 92% scale so they read as background context.
const ACTIVE_RATIO = 0.64;
const INACTIVE_SCALE = 0.92;
const GAP = 24;

function CoreEditingApple1() {
  const sectionRef = useRef(null);
  const sectionInView = useInView(sectionRef);
  const viewportRef = useRef(null);
  const cardRefs = useRef([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [viewportW, setViewportW] = useState(1000);
  const programmaticScrollRef = useRef(false);

  // Measure viewport for card sizing.
  useEffect(() => {
    if (!viewportRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setViewportW(e.contentRect.width);
    });
    ro.observe(viewportRef.current);
    return () => ro.disconnect();
  }, []);

  // Track which card is currently centered in the viewport.
  useEffect(() => {
    if (!viewportRef.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        // Pick whichever card has the highest visible ratio.
        let best = { idx: activeIdx, ratio: 0 };
        for (const e of entries) {
          const idx = Number(e.target.dataset.cardIdx);
          if (e.intersectionRatio > best.ratio) {
            best = { idx, ratio: e.intersectionRatio };
          }
        }
        if (best.ratio > 0 && best.idx !== activeIdx) {
          setActiveIdx(best.idx);
          if (!programmaticScrollRef.current) {
            // User-driven scroll → pause autoplay so they can dwell.
            setPaused(true);
          }
        }
      },
      {
        root: viewportRef.current,
        threshold: [0.4, 0.6, 0.8, 1.0],
      },
    );
    cardRefs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [activeIdx]);

  // Autoplay: scroll to next card every CYCLE_MS.
  useEffect(() => {
    if (paused || !sectionInView) return;
    const t = setTimeout(() => {
      const nextIdx = (activeIdx + 1) % CARDS.length;
      scrollToIdx(nextIdx);
    }, CYCLE_MS);
    return () => clearTimeout(t);
  }, [paused, sectionInView, activeIdx]);

  const scrollToIdx = (idx) => {
    const target = cardRefs.current[idx];
    const viewport = viewportRef.current;
    if (!target || !viewport) return;
    programmaticScrollRef.current = true;
    // smooth-scroll the target into view, centered.
    target.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
    // Reset the programmatic flag once the scroll has settled.
    setTimeout(() => {
      programmaticScrollRef.current = false;
    }, 600);
  };

  const cardW = Math.max(360, viewportW * ACTIVE_RATIO);
  const cardH = (cardW * 9) / 16;
  const sidePad = Math.max(0, (viewportW - cardW) / 2);

  return (
    <section
      ref={sectionRef}
      className="bg-background-dark py-24 lg:py-32 overflow-hidden relative"
    >
      <div className="px-6 lg:px-10">
        <header className="max-w-3xl mx-auto text-center">
          <div
            className="font-mono text-sm tracking-[0.2em] uppercase text-text-contrast/40"
            aria-hidden
          >
            Also
          </div>
          <h2 className="mt-4 font-harmony text-text-contrast text-4xl md:text-5xl lg:text-6xl leading-[1.05]">
            Hundreds of smaller things
          </h2>
          <p className="mt-5 text-text-contrast/70 text-base md:text-lg">
            We've touched almost every corner of the app. Here are a few you'll
            run into in your first session.
          </p>
        </header>
      </div>

      {/* Native horizontally-scrolling filmstrip with scroll-snap. */}
      <div
        ref={viewportRef}
        className="mt-10 lg:mt-14 overflow-x-auto overflow-y-hidden scrollbar-hide"
        style={{
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          // Padding pushes the first and last cards' snap points to
          // the centre of the viewport.
          paddingLeft: sidePad,
          paddingRight: sidePad,
          // Visible height accommodates the card + a touch of padding.
          height: cardH + 32,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "nowrap",
            alignItems: "center",
            gap: GAP,
            height: "100%",
            // sum-of-children width keeps cards on one line.
            width: "max-content",
          }}
        >
          {CARDS.map((c, idx) => {
            const isActive = idx === activeIdx;
            const Demo = c.Demo;
            return (
              <button
                key={c.id}
                ref={(el) => (cardRefs.current[idx] = el)}
                data-card-idx={idx}
                type="button"
                onClick={() => scrollToIdx(idx)}
                className="rounded-2xl border border-white/10 bg-[rgb(20,16,56)] overflow-hidden relative text-left"
                aria-label={`Show ${c.title}`}
                style={{
                  flexShrink: 0,
                  flexGrow: 0,
                  flexBasis: "auto",
                  width: cardW,
                  height: cardH,
                  scrollSnapAlign: "center",
                  transform: `scale(${isActive ? 1 : INACTIVE_SCALE})`,
                  opacity: isActive ? 1 : 0.35,
                  filter: isActive ? "none" : "saturate(0.7)",
                  cursor: isActive ? "default" : "pointer",
                  transition:
                    "transform 380ms ease, opacity 380ms ease, filter 380ms ease",
                  boxShadow: isActive
                    ? "0 30px 60px rgba(0,0,0,0.55)"
                    : "0 12px 24px rgba(0,0,0,0.35)",
                }}
              >
                {/* Only the active card mounts its Demo — keeps any
                    positioned demo internals (playhead stalks etc.)
                    from rendering in inactive cards. */}
                {isActive && <Demo isActive />}
                <div
                  className="absolute inset-x-0 bottom-0 px-6 lg:px-8 pb-5 lg:pb-6 pt-14 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.4) 55%, transparent 100%)",
                    zIndex: 20,
                  }}
                >
                  <div
                    className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/75"
                    aria-hidden
                  >
                    {c.eyebrow}
                  </div>
                  <h3 className="mt-1.5 font-harmony text-white text-xl md:text-2xl lg:text-3xl leading-tight max-w-lg">
                    {c.title}
                  </h3>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Caption */}
      <div className="mt-6 px-6 lg:px-10 min-h-[3.5rem] flex items-start justify-center">
        <p
          key={`caption-${activeIdx}`}
          className="text-text-contrast/70 text-base md:text-lg text-center max-w-2xl"
          style={{ animation: "coreEditingCaptionIn 480ms ease" }}
        >
          {CARDS[activeIdx].description}
        </p>
      </div>

      {/* Controls — dots + play toggle. */}
      <div className="mt-2 flex items-center justify-center gap-3 px-6">
        <div className="flex items-center gap-1.5">
          {CARDS.map((c, idx) => {
            const isActive = idx === activeIdx;
            return (
              <button
                key={c.id}
                type="button"
                aria-label={`Show ${c.title}`}
                onClick={() => {
                  setPaused(true);
                  scrollToIdx(idx);
                }}
                className="relative h-2 rounded-full overflow-hidden transition-all"
                style={{
                  width: isActive ? 28 : 8,
                  background: "rgba(255,255,255,0.22)",
                }}
              >
                {isActive && (
                  <div
                    key={`p-${activeIdx}-${paused}`}
                    className="absolute inset-y-0 left-0 bg-white/85"
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
            <svg width="10" height="12" viewBox="0 0 10 12">
              <path d="M0 0 L10 6 L0 12 Z" fill="white" />
            </svg>
          ) : (
            <svg width="10" height="12" viewBox="0 0 10 12">
              <rect x="0" y="0" width="3" height="12" fill="white" />
              <rect x="7" y="0" width="3" height="12" fill="white" />
            </svg>
          )}
        </button>
      </div>

      <style>{`
        @keyframes coreEditingDotFill {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        @keyframes coreEditingCaptionIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { scrollbar-width: none; }
      `}</style>
    </section>
  );
}

export default CoreEditingApple1;
