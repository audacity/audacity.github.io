import React, { useEffect, useRef, useState } from "react";
import { CARDS } from "./CoreEditing.jsx";
import { useInView } from "../../hooks/useInView.js";

// Filmstrip with focus:
// All cards in a horizontally-scrolling row. The browser handles
// scrolling via native overflow-x:auto + scroll-snap-type. The card
// nearest the viewport centre is the "active" one — bigger, fully
// opaque; neighbours sit dimmed on either side. Autoplay scrolls to
// the next card on a timer; click any card or dot to jump.
//
// Layout intentionally CSS-class-driven (not Tailwind utilities or
// React style props) so it can't be silently rewritten by a build
// step or shadowed by inline-style timing — the .cef-* classes are
// unique to this component and live in the <style> block below.
const CYCLE_MS = 6500;
const ACTIVE_RATIO = 0.62;
const INACTIVE_SCALE = 0.92;
const GAP = 24;

function CoreEditingFilmstrip() {
  const sectionRef = useRef(null);
  const sectionInView = useInView(sectionRef);
  const viewportRef = useRef(null);
  const cardRefs = useRef([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [viewportW, setViewportW] = useState(1200);
  const programmaticScrollRef = useRef(false);

  useEffect(() => {
    if (!viewportRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setViewportW(e.contentRect.width);
    });
    ro.observe(viewportRef.current);
    return () => ro.disconnect();
  }, []);

  // Detect which card is centred and sync activeIdx.
  useEffect(() => {
    if (!viewportRef.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        let best = null;
        for (const e of entries) {
          if (!best || e.intersectionRatio > best.intersectionRatio) best = e;
        }
        if (best && best.intersectionRatio > 0.5) {
          const idx = Number(best.target.dataset.cardIdx);
          if (idx !== activeIdx) {
            setActiveIdx(idx);
            if (!programmaticScrollRef.current) setPaused(true);
          }
        }
      },
      { root: viewportRef.current, threshold: [0.5, 0.75, 1.0] },
    );
    cardRefs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [activeIdx]);

  // Autoplay — scroll the next card into view on each tick.
  useEffect(() => {
    if (paused || !sectionInView) return;
    const t = setTimeout(() => {
      scrollToIdx((activeIdx + 1) % CARDS.length);
    }, CYCLE_MS);
    return () => clearTimeout(t);
  }, [paused, sectionInView, activeIdx]);

  const scrollToIdx = (idx) => {
    const target = cardRefs.current[idx];
    if (!target) return;
    programmaticScrollRef.current = true;
    target.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
    setTimeout(() => {
      programmaticScrollRef.current = false;
    }, 700);
  };

  const cardW = Math.max(360, Math.floor(viewportW * ACTIVE_RATIO));
  const cardH = Math.floor((cardW * 9) / 16);
  const sidePad = Math.max(0, Math.floor((viewportW - cardW) / 2));

  return (
    <section ref={sectionRef} className="cef-section">
      <header className="cef-header">
        <div className="cef-eyebrow" aria-hidden>
          Also
        </div>
        <h2 className="cef-title">Hundreds of smaller things</h2>
        <p className="cef-lede">
          We've touched almost every corner of the app. Here are a few you'll
          run into in your first session.
        </p>
      </header>

      <div ref={viewportRef} className="cef-viewport">
        <ul
          className="cef-row"
          style={{ paddingLeft: sidePad, paddingRight: sidePad }}
        >
          {CARDS.map((c, idx) => {
            const isActive = idx === activeIdx;
            const Demo = c.Demo;
            return (
              <li
                key={c.id}
                ref={(el) => (cardRefs.current[idx] = el)}
                data-card-idx={idx}
                className={"cef-card" + (isActive ? " cef-card--active" : "")}
                style={{ width: cardW, height: cardH }}
              >
                <button
                  type="button"
                  className="cef-card__btn"
                  onClick={() => scrollToIdx(idx)}
                  aria-label={`Show ${c.title}`}
                >
                  {isActive && <Demo isActive />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div key={`caption-${activeIdx}`} className="cef-caption">
        <div className="cef-caption__eyebrow" aria-hidden>
          {CARDS[activeIdx].eyebrow}
        </div>
        <h3 className="cef-caption__title">{CARDS[activeIdx].title}</h3>
        <p className="cef-caption__desc">{CARDS[activeIdx].description}</p>
      </div>

      {/* Timeline-style ticker — like an Audacity ruler. One major
          tick per feature, label sits underneath the active one, a
          play/pause sits at the right end. */}
      <div className="cef-timeline" role="tablist" aria-label="Features">
        <div className="cef-timeline__track">
          {CARDS.map((c, idx) => {
            const isActive = idx === activeIdx;
            return (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`Show ${c.title}`}
                onClick={() => {
                  setPaused(true);
                  scrollToIdx(idx);
                }}
                className={"cef-tick" + (isActive ? " cef-tick--active" : "")}
              >
                <span className="cef-tick__mark" />
                <span className="cef-tick__label">{c.eyebrow}</span>
                {isActive && (
                  <span
                    key={`fill-${activeIdx}-${paused}`}
                    className="cef-tick__progress"
                    style={{
                      animationPlayState: paused ? "paused" : "running",
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
          className="cef-playtoggle"
        >
          {paused ? (
            <svg width="10" height="12" viewBox="0 0 10 12">
              <path d="M0 0 L10 6 L0 12 Z" fill="currentColor" />
            </svg>
          ) : (
            <svg width="10" height="12" viewBox="0 0 10 12">
              <rect x="0" y="0" width="3" height="12" fill="currentColor" />
              <rect x="7" y="0" width="3" height="12" fill="currentColor" />
            </svg>
          )}
        </button>
      </div>

      <style>{`
        .cef-section {
          position: relative;
          padding: 6rem 0 8rem;
          background-color: transparent;
          overflow-x: hidden;
        }
        @media (min-width: 1024px) {
          .cef-section { padding: 8rem 0 10rem; }
        }
        .cef-header {
          max-width: 48rem;
          margin: 0 auto 2.5rem;
          padding: 0 1.5rem;
          text-align: center;
        }
        @media (min-width: 1024px) {
          .cef-header { padding: 0 2.5rem; margin-bottom: 3.5rem; }
        }
        .cef-eyebrow {
          font-family: ui-monospace, monospace;
          font-size: 0.875rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.4);
        }
        .cef-title {
          margin-top: 1rem;
          font-family: var(--font-harmony, sans-serif);
          font-size: clamp(2.25rem, 4vw, 3.75rem);
          line-height: 1.05;
          color: var(--text-contrast, #fff);
        }
        .cef-lede {
          margin-top: 1.25rem;
          font-size: 1rem;
          color: rgba(255,255,255,0.7);
        }
        @media (min-width: 768px) {
          .cef-lede { font-size: 1.125rem; }
        }
        .cef-viewport {
          width: 100%;
          overflow-x: auto;
          overflow-y: hidden;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .cef-viewport::-webkit-scrollbar { display: none; }
        .cef-row {
          display: flex !important;
          flex-direction: row !important;
          flex-wrap: nowrap !important;
          align-items: center;
          gap: ${GAP}px;
          list-style: none;
          margin: 0;
          padding: 0;
          width: max-content;
        }
        .cef-card {
          flex: 0 0 auto !important;
          scroll-snap-align: center;
          transform: scale(${INACTIVE_SCALE});
          opacity: 0.4;
          filter: saturate(0.7);
          transition: transform 380ms ease, opacity 380ms ease, filter 380ms ease;
          margin: 0;
          padding: 0;
        }
        .cef-card--active {
          transform: scale(1);
          opacity: 1;
          filter: none;
        }
        .cef-card__btn {
          display: block;
          width: 100%;
          height: 100%;
          padding: 0;
          margin: 0;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          background: rgb(20, 16, 56);
          overflow: hidden;
          position: relative;
          cursor: pointer;
          text-align: left;
          color: inherit;
          font: inherit;
          box-shadow: 0 12px 24px rgba(0,0,0,0.35);
        }
        .cef-card--active .cef-card__btn {
          box-shadow: 0 30px 60px rgba(0,0,0,0.55);
        }
        /* Caption — sits below the row as an editorial slab. */
        .cef-caption {
          margin: 2.25rem auto 0;
          padding: 0 1.5rem;
          max-width: 44rem;
          text-align: left;
          animation: cefCaptionIn 480ms ease;
        }
        @media (min-width: 768px) {
          .cef-caption { padding: 0 2.5rem; }
        }
        .cef-caption__eyebrow {
          font-family: ui-monospace, monospace;
          font-size: 0.7rem;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.5);
        }
        .cef-caption__title {
          margin: 0.5rem 0 0;
          font-family: var(--font-harmony, sans-serif);
          font-size: clamp(1.5rem, 2.4vw, 2.25rem);
          line-height: 1.1;
          color: var(--text-contrast, #fff);
        }
        .cef-caption__desc {
          margin: 0.75rem 0 0;
          font-size: 1rem;
          line-height: 1.55;
          color: rgba(255,255,255,0.7);
        }
        @media (min-width: 768px) {
          .cef-caption__desc { font-size: 1.0625rem; }
        }
        /* Audacity-style timeline ticker. Thin baseline with a tick per
           feature; the active tick has a tall fill mark + label and a
           progress sweep beneath. */
        .cef-timeline {
          margin: 2rem auto 0;
          padding: 0 1.5rem;
          max-width: 56rem;
          display: flex;
          align-items: flex-start;
          gap: 1rem;
        }
        @media (min-width: 768px) {
          .cef-timeline { padding: 0 2.5rem; }
        }
        .cef-timeline__track {
          flex: 1;
          display: grid;
          grid-auto-flow: column;
          grid-auto-columns: 1fr;
          gap: 1px;
          padding-top: 0.75rem;
          border-top: 1px solid rgba(255,255,255,0.18);
          position: relative;
        }
        .cef-tick {
          position: relative;
          padding: 0;
          background: transparent;
          border: none;
          color: inherit;
          cursor: pointer;
          min-height: 2.5rem;
          text-align: left;
          font: inherit;
        }
        .cef-tick__mark {
          position: absolute;
          top: -0.75rem;
          left: 0;
          width: 1px;
          height: 0.5rem;
          background: rgba(255,255,255,0.35);
          transform-origin: top center;
          transition: height 220ms ease, background 220ms ease, width 220ms ease;
        }
        .cef-tick--active .cef-tick__mark {
          height: 0.85rem;
          width: 2px;
          background: rgba(255,255,255,0.9);
        }
        .cef-tick__label {
          display: block;
          font-family: ui-monospace, monospace;
          font-size: 0.6rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.35);
          line-height: 1.4;
          padding: 0.35rem 0.5rem 0 0.25rem;
          transition: color 220ms ease;
        }
        .cef-tick--active .cef-tick__label {
          color: rgba(255,255,255,0.85);
        }
        .cef-tick:hover .cef-tick__label {
          color: rgba(255,255,255,0.7);
        }
        .cef-tick__progress {
          position: absolute;
          left: 0;
          right: 1px;
          top: -1px;
          height: 1px;
          background: rgba(255,255,255,0.85);
          transform: scaleX(0);
          transform-origin: left;
          animation: cefDotFill ${CYCLE_MS}ms linear forwards;
        }
        .cef-playtoggle {
          width: 1.75rem;
          height: 1.75rem;
          padding: 0;
          flex-shrink: 0;
          border-radius: 0;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.25);
          color: rgba(255,255,255,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: color 160ms ease, border-color 160ms ease;
        }
        .cef-playtoggle:hover {
          color: rgba(255,255,255,1);
          border-color: rgba(255,255,255,0.55);
        }
        @keyframes cefCaptionIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes cefDotFill {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
      `}</style>
    </section>
  );
}

export default CoreEditingFilmstrip;
