import React, { useLayoutEffect, useRef, useState } from "react";
import { CARDS } from "./CoreEditing.jsx";
import { useInView } from "../../hooks/useInView.js";

// Demos in this project are built around a ~720px-wide canvas. We render
// each thumbnail at that natural size inside a small frame and then
// transform-scale it to fit the thumbnail's measured width.
const DEMO_DESIGN_W = 720;
const DEMO_DESIGN_H = 405; // 16:10 of 720

// Variant of Option 3 (bento) — one large hero showing the SELECTED
// demo (live, animating), plus a row of thumbnails for the others.
// Each thumbnail is the actual demo at small size with pointer events
// disabled, so you can see-and-pick instead of read-and-click.
function CoreEditingBentoSelect() {
  const [activeIdx, setActiveIdx] = useState(0);
  const rootRef = useRef(null);
  const inView = useInView(rootRef);
  const active = CARDS[activeIdx];
  const ActiveDemo = active.Demo;

  return (
    <section className="cebs-section" ref={rootRef}>
      <header className="cebs-header">
        <div className="cebs-eyebrow" aria-hidden>
          Also
        </div>
        <h2 className="cebs-title">Hundreds of smaller things</h2>
      </header>

      <div className="cebs-stage">
        <div className="cebs-hero" key={`hero-${activeIdx}`}>
          <div className="cebs-hero__frame">
            {inView && <ActiveDemo isActive />}
          </div>
          <div className="cebs-hero__copy">
            <div className="cebs-hero__num">
              {String(activeIdx + 1).padStart(2, "0")}
              <span className="cebs-hero__of">
                {" "}
                / {String(CARDS.length).padStart(2, "0")}
              </span>
            </div>
            <div className="cebs-hero__eyebrow">{active.eyebrow}</div>
            <h3 className="cebs-hero__title">{active.title}</h3>
            <p className="cebs-hero__desc">{active.description}</p>
          </div>
        </div>

        <div className="cebs-thumbs" role="tablist" aria-label="Pick a feature">
          {CARDS.map((c, idx) => (
            <Thumb
              key={c.id}
              card={c}
              idx={idx}
              isActive={idx === activeIdx}
              parentInView={inView}
              onSelect={() => setActiveIdx(idx)}
            />
          ))}
        </div>
      </div>

      <style>{`
        .cebs-section {
          padding: 6rem 1.5rem 8rem;
          max-width: 80rem;
          margin: 0 auto;
        }
        @media (min-width: 1024px) {
          .cebs-section { padding: 8rem 2.5rem 10rem; }
        }
        .cebs-header { max-width: 48rem; }
        .cebs-eyebrow {
          font-family: ui-monospace, monospace;
          font-size: 0.875rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.4);
        }
        .cebs-title {
          margin-top: 1rem;
          font-family: var(--font-harmony, sans-serif);
          font-size: clamp(2.25rem, 4vw, 3.75rem);
          line-height: 1.05;
          color: #fff;
        }

        .cebs-stage {
          margin-top: 3rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        @media (min-width: 1024px) {
          .cebs-stage { gap: 2rem; }
        }

        .cebs-hero {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
          align-items: center;
          animation: cebsHeroIn 360ms ease;
        }
        @media (min-width: 1024px) {
          .cebs-hero {
            grid-template-columns: 3fr 2fr;
            gap: 3rem;
          }
        }
        .cebs-hero__frame {
          aspect-ratio: 16 / 9;
          background: rgb(20, 16, 56);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 14px;
          overflow: hidden;
          position: relative;
        }
        .cebs-hero__num {
          font-family: ui-monospace, monospace;
          font-size: 0.7rem;
          letter-spacing: 0.28em;
          color: rgba(248,113,113,0.85);
        }
        .cebs-hero__of { color: rgba(255,255,255,0.35); }
        .cebs-hero__eyebrow {
          margin-top: 0.5rem;
          font-family: ui-monospace, monospace;
          font-size: 0.7rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.55);
        }
        .cebs-hero__title {
          margin: 0.75rem 0 0;
          font-family: var(--font-harmony, sans-serif);
          font-size: clamp(1.5rem, 2.4vw, 2.25rem);
          line-height: 1.1;
          color: #fff;
        }
        .cebs-hero__desc {
          margin: 1rem 0 0;
          font-size: 1rem;
          line-height: 1.55;
          color: rgba(255,255,255,0.7);
        }
        @media (min-width: 768px) {
          .cebs-hero__desc { font-size: 1.0625rem; }
        }

        .cebs-thumbs {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
        }
        @media (min-width: 640px) {
          .cebs-thumbs { grid-template-columns: repeat(3, 1fr); }
        }
        @media (min-width: 1024px) {
          .cebs-thumbs {
            grid-template-columns: repeat(6, 1fr);
            gap: 1rem;
          }
        }
        .cebs-thumb {
          appearance: none;
          background: transparent;
          border: none;
          padding: 0;
          color: inherit;
          cursor: pointer;
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .cebs-thumb__frame {
          background: rgb(20, 16, 56);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          overflow: hidden;
          position: relative;
          transition: border-color 160ms ease, transform 160ms ease;
        }
        .cebs-thumb:hover .cebs-thumb__frame {
          border-color: rgba(255,255,255,0.25);
          transform: translateY(-2px);
        }
        .cebs-thumb--active .cebs-thumb__frame {
          border-color: rgba(248,113,113,0.85);
          box-shadow: 0 0 0 1px rgba(248,113,113,0.5);
        }
        /*
          Each thumbnail renders the live demo at its natural ~720x405
          design size, then transform-scales the whole canvas down to
          fit the thumbnail's measured width (set via inline style from
          a ResizeObserver). This keeps the design-system components
          laid out at their intended size — we just shrink the picture.
        */
        .cebs-thumb__scaler {
          position: absolute;
          top: 0;
          left: 0;
          width: ${DEMO_DESIGN_W}px;
          height: ${DEMO_DESIGN_H}px;
          transform-origin: top left;
          pointer-events: none;
        }
        .cebs-thumb__veil {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(20,16,56,0.0) 0%,
            rgba(20,16,56,0.35) 100%
          );
          transition: opacity 160ms ease;
        }
        .cebs-thumb:hover .cebs-thumb__veil { opacity: 0.4; }
        .cebs-thumb__caption {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
          padding: 0 0.25rem;
        }
        .cebs-thumb__num {
          font-family: ui-monospace, monospace;
          font-size: 0.625rem;
          letter-spacing: 0.22em;
          color: rgba(248,113,113,0.85);
        }
        .cebs-thumb__label {
          font-family: ui-monospace, monospace;
          font-size: 0.7rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.6);
          transition: color 160ms ease;
        }
        .cebs-thumb:hover .cebs-thumb__label,
        .cebs-thumb--active .cebs-thumb__label {
          color: #fff;
        }

        @keyframes cebsHeroIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}

function Thumb({ card, idx, isActive, parentInView, onSelect }) {
  const frameRef = useRef(null);
  const [scale, setScale] = useState(0.28);
  const Demo = card.Demo;

  useLayoutEffect(() => {
    const node = frameRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const apply = () => {
      const w = node.clientWidth;
      if (w > 0) setScale(w / DEMO_DESIGN_W);
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={onSelect}
      className={"cebs-thumb" + (isActive ? " cebs-thumb--active" : "")}
    >
      <div
        ref={frameRef}
        className="cebs-thumb__frame"
        aria-hidden
        style={{ aspectRatio: `${DEMO_DESIGN_W} / ${DEMO_DESIGN_H}` }}
      >
        {parentInView && (
          <div
            className="cebs-thumb__scaler"
            style={{ transform: `scale(${scale})` }}
          >
            <Demo isActive={isActive} />
          </div>
        )}
        {!isActive && <div className="cebs-thumb__veil" />}
      </div>
      <div className="cebs-thumb__caption">
        <span className="cebs-thumb__num">
          {String(idx + 1).padStart(2, "0")}
        </span>
        <span className="cebs-thumb__label">{card.eyebrow}</span>
      </div>
    </button>
  );
}

export default CoreEditingBentoSelect;
