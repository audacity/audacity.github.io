import React, { useEffect, useRef, useState } from "react";
import { CARDS } from "./CoreEditing.jsx";
import { useInView } from "../../hooks/useInView.js";

// Apple Logic Pro pattern #1 — filmstrip with focus:
// All cards laid out side-by-side; the active one centers and pops to
// full size + full opacity, the others sit smaller and dimmed on
// either side. User still sees there's a row of stuff, but only one
// thing demands attention at a time.
const CYCLE_MS = 6500;

// Active card consumes 64% of the viewport width; non-active ones sit
// at 92% scale so they read as background context.
const ACTIVE_RATIO = 0.64;
const INACTIVE_SCALE = 0.92;
const GAP = 24;

function CoreEditingApple1() {
  const sectionRef = useRef(null);
  const sectionInView = useInView(sectionRef);
  const viewportRef = useRef(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [viewportW, setViewportW] = useState(1000);
  // Pointer drag — mouse, touch and pen all funnel through Pointer
  // Events so the same gesture works on desktop and mobile.
  const dragState = useRef({
    active: false,
    startX: 0,
    pointerId: null,
    maxDelta: 0,
  });
  // Set true when the user has dragged far enough that the next click
  // should be suppressed (so the gesture doesn't also promote whatever
  // card was under the pointer at release).
  const wasDragged = useRef(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [dragging, setDragging] = useState(false);

  // Measure the viewport so we can compute card width + translate
  // distances precisely.
  useEffect(() => {
    if (!viewportRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setViewportW(e.contentRect.width);
    });
    ro.observe(viewportRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (paused || !sectionInView || dragging) return;
    const t = setTimeout(() => {
      setActiveIdx((i) => (i + 1) % CARDS.length);
    }, CYCLE_MS);
    return () => clearTimeout(t);
  }, [paused, sectionInView, activeIdx, dragging]);

  const advance = (delta) => {
    setActiveIdx((i) => (i + delta + CARDS.length) % CARDS.length);
  };

  const cardW = Math.max(360, viewportW * ACTIVE_RATIO);
  // Translate the row so the active card's centre lands at the
  // viewport's centre.
  const trackX = viewportW / 2 - cardW / 2 - activeIdx * (cardW + GAP);

  const onPointerDown = (e) => {
    // Left mouse button only; let touch/pen through.
    if (e.pointerType === "mouse" && e.button !== 0) return;
    dragState.current = {
      active: true,
      startX: e.clientX,
      pointerId: e.pointerId,
      maxDelta: 0,
    };
    wasDragged.current = false;
    setDragging(true);
    setPaused(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!dragState.current.active) return;
    const dx = e.clientX - dragState.current.startX;
    dragState.current.maxDelta = Math.max(
      dragState.current.maxDelta,
      Math.abs(dx),
    );
    if (dragState.current.maxDelta > 5) wasDragged.current = true;
    setDragOffset(dx);
  };

  const endDrag = (e) => {
    if (!dragState.current.active) return;
    const dx = e.clientX - dragState.current.startX;
    dragState.current.active = false;
    try {
      e.currentTarget.releasePointerCapture(dragState.current.pointerId);
    } catch {}
    // Snap: anything past ~25% of a card-width advances one position;
    // bigger drags can jump multiple cards.
    const cardSlot = cardW + GAP;
    const steps =
      Math.abs(dx) > cardSlot * 0.25
        ? Math.round(-dx / cardSlot) || (dx < 0 ? 1 : -1)
        : 0;
    if (steps !== 0) advance(steps);
    setDragOffset(0);
    setDragging(false);
  };

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

      {/* Filmstrip viewport — full bleed so the offscreen neighbours
          can peek in past the section's normal padding. */}
      <div
        ref={viewportRef}
        className="mt-10 lg:mt-14 relative overflow-hidden select-none"
        style={{
          height: viewportW * ACTIVE_RATIO * (9 / 16) + 32,
          cursor: dragging ? "grabbing" : "grab",
          touchAction: "pan-y",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div
          className="absolute top-0 left-0 flex items-center"
          style={{
            gap: GAP,
            transform: `translateX(${trackX + dragOffset}px)`,
            // Snap-easing on release; no transition during drag so the
            // strip tracks the pointer 1:1.
            transition: dragging
              ? "none"
              : "transform 520ms cubic-bezier(0.4, 0, 0.2, 1)",
            height: "100%",
          }}
        >
          {CARDS.map((c, idx) => {
            const isActive = idx === activeIdx;
            const Demo = c.Demo;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  // Suppress click that follows a drag — otherwise
                  // releasing on a neighbour after a drag would also
                  // promote it.
                  if (wasDragged.current) {
                    wasDragged.current = false;
                    return;
                  }
                  setActiveIdx(idx);
                  setPaused(true);
                }}
                className="shrink-0 rounded-2xl border border-white/10 bg-[rgb(20,16,56)] overflow-hidden relative text-left"
                aria-label={`Show ${c.title}`}
                style={{
                  width: cardW,
                  aspectRatio: "16/9",
                  transform: `scale(${isActive ? 1 : INACTIVE_SCALE})`,
                  opacity: isActive ? 1 : 0.35,
                  filter: isActive ? "none" : "saturate(0.7)",
                  cursor: isActive ? "default" : "pointer",
                  transition:
                    "transform 520ms cubic-bezier(0.4, 0, 0.2, 1), opacity 520ms ease, filter 520ms ease",
                  boxShadow: isActive
                    ? "0 30px 60px rgba(0,0,0,0.55)"
                    : "0 12px 24px rgba(0,0,0,0.35)",
                }}
              >
                {/* Only the active demo gets isActive=true, so inactive
                    cards stay at rest and don't burn CPU. */}
                <Demo isActive={isActive} />
                {/* Bottom-left text overlay — Apple-style. z-index lifts
                    it above demo-internal positioned elements like
                    LoopingDemo's loop-region edge stalks (z-index 10)
                    that otherwise paint over the gradient. */}
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

      {/* Caption — single line of description for the active card,
          re-keyed on activeIdx so it cross-fades on each advance. */}
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
                  setActiveIdx(idx);
                  setPaused(true);
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
      `}</style>
    </section>
  );
}

export default CoreEditingApple1;
