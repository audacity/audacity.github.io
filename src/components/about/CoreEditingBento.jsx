import React, { useRef } from "react";
import { CARDS } from "./CoreEditing.jsx";
import { useInView } from "../../hooks/useInView.js";

// Option 3 — Static bento grid.
// All six demos visible at once at varying sizes. No spotlight, no
// scroll choreography — just a dense, browsable wall that says "there's
// a lot here" without parading any one feature.
//
// Sizes are hand-tuned so the grid reads as deliberate composition,
// not a CSS auto-fill. Two large hero tiles anchor the top row, four
// medium tiles fill the bottom. Each demo only animates when the tile
// is in view.
const TILE_SIZES = [
  // [colSpan, rowSpan]
  [2, 2], // clip-handles — hero left
  [2, 2], // track-meters — hero right
  [1, 1], // vertical-meter
  [1, 1], // labels
  [1, 1], // looping
  [1, 1], // sample-editing
];

function CoreEditingBento() {
  return (
    <section className="ceb-section">
      <header className="ceb-header">
        <div className="ceb-eyebrow" aria-hidden>
          Also
        </div>
        <h2 className="ceb-title">Hundreds of smaller things</h2>
      </header>

      <div className="ceb-grid">
        {CARDS.map((c, idx) => (
          <BentoTile key={c.id} c={c} idx={idx} />
        ))}
      </div>

      <style>{`
        .ceb-section {
          padding: 6rem 1.5rem 8rem;
          max-width: 80rem;
          margin: 0 auto;
        }
        @media (min-width: 1024px) {
          .ceb-section { padding: 8rem 2.5rem 10rem; }
        }
        .ceb-header { max-width: 48rem; }
        .ceb-eyebrow {
          font-family: ui-monospace, monospace;
          font-size: 0.875rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.4);
        }
        .ceb-title {
          margin-top: 1rem;
          font-family: var(--font-harmony, sans-serif);
          font-size: clamp(2.25rem, 4vw, 3.75rem);
          line-height: 1.05;
          color: #fff;
        }
        .ceb-grid {
          margin-top: 3rem;
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }
        @media (min-width: 768px) {
          .ceb-grid {
            grid-template-columns: repeat(4, 1fr);
            grid-auto-rows: 14rem;
            gap: 1.25rem;
          }
        }
        @media (min-width: 1024px) {
          .ceb-grid {
            grid-auto-rows: 16rem;
            gap: 1.5rem;
          }
        }
        .ceb-tile {
          background: rgb(20, 16, 56);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 14px;
          overflow: hidden;
          position: relative;
          display: flex;
          flex-direction: column;
          aspect-ratio: 16 / 10;
        }
        @media (min-width: 768px) {
          .ceb-tile { aspect-ratio: auto; }
        }
        .ceb-tile__demo {
          flex: 1 1 auto;
          position: relative;
          overflow: hidden;
        }
        .ceb-tile__caption {
          flex: 0 0 auto;
          padding: 0.875rem 1rem 1rem;
          border-top: 1px solid rgba(255,255,255,0.08);
          background: rgba(0,0,0,0.2);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
        .ceb-tile__eyebrow {
          font-family: ui-monospace, monospace;
          font-size: 0.625rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(248,113,113,0.85);
        }
        .ceb-tile__title {
          margin: 0.35rem 0 0;
          font-family: var(--font-harmony, sans-serif);
          font-size: 1rem;
          line-height: 1.2;
          color: #fff;
        }
        @media (min-width: 1024px) {
          .ceb-tile--hero .ceb-tile__title { font-size: 1.25rem; }
        }
      `}</style>
    </section>
  );
}

function BentoTile({ c, idx }) {
  const ref = useRef(null);
  const inView = useInView(ref);
  const Demo = c.Demo;
  const [colSpan, rowSpan] = TILE_SIZES[idx] || [1, 1];
  const isHero = colSpan >= 2 && rowSpan >= 2;

  return (
    <div
      ref={ref}
      className={"ceb-tile" + (isHero ? " ceb-tile--hero" : "")}
      style={{
        gridColumn: `span ${colSpan}`,
        gridRow: `span ${rowSpan}`,
      }}
    >
      <div className="ceb-tile__demo">{inView && <Demo isActive />}</div>
      <div className="ceb-tile__caption">
        <div className="ceb-tile__eyebrow">{c.eyebrow}</div>
        <h3 className="ceb-tile__title">{c.title}</h3>
      </div>
    </div>
  );
}

export default CoreEditingBento;
