import React, { useRef } from "react";
import { CARDS } from "./CoreEditing.jsx";
import { useInView } from "../../hooks/useInView.js";

// Option 2 — Sticky-scroll narrative.
// Each feature is its own ~70vh stage: demo on one side, copy on the
// other, alternating. Scroll drives through them; each demo only
// animates when its row is in view, so you only ever see one running
// at a time.
function CoreEditingScroll() {
  return (
    <section className="ces-section">
      <header className="ces-header">
        <div className="ces-eyebrow" aria-hidden>
          Also
        </div>
        <h2 className="ces-title">Hundreds of smaller things</h2>
      </header>

      <ol className="ces-list">
        {CARDS.map((c, idx) => (
          <ScrollItem key={c.id} c={c} idx={idx} />
        ))}
      </ol>

      <style>{`
        .ces-section {
          padding: 6rem 1.5rem 8rem;
          max-width: 80rem;
          margin: 0 auto;
        }
        @media (min-width: 1024px) {
          .ces-section { padding: 8rem 2.5rem 10rem; }
        }
        .ces-header { max-width: 48rem; }
        .ces-eyebrow {
          font-family: ui-monospace, monospace;
          font-size: 0.875rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.4);
        }
        .ces-title {
          margin-top: 1rem;
          font-family: var(--font-harmony, sans-serif);
          font-size: clamp(2.25rem, 4vw, 3.75rem);
          line-height: 1.05;
          color: #fff;
        }
        .ces-list {
          margin: 4rem 0 0;
          padding: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 5rem;
        }
        @media (min-width: 1024px) {
          .ces-list { gap: 7rem; }
        }
        .ces-item {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
          align-items: center;
        }
        @media (min-width: 1024px) {
          .ces-item {
            grid-template-columns: 3fr 2fr;
            gap: 4rem;
          }
          .ces-item--right {
            grid-template-columns: 2fr 3fr;
          }
          .ces-item--right .ces-item__demo {
            order: 2;
          }
          .ces-item--right .ces-item__copy {
            order: 1;
          }
        }
        .ces-item__demo {
          aspect-ratio: 16 / 9;
          background: rgb(20, 16, 56);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          overflow: hidden;
          position: relative;
        }
        .ces-item__num {
          font-family: ui-monospace, monospace;
          font-size: 0.7rem;
          letter-spacing: 0.28em;
          color: rgba(248,113,113,0.85);
        }
        .ces-item__eyebrow {
          margin-top: 0.5rem;
          font-family: ui-monospace, monospace;
          font-size: 0.7rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.5);
        }
        .ces-item__title {
          margin: 0.75rem 0 0;
          font-family: var(--font-harmony, sans-serif);
          font-size: clamp(1.5rem, 2.4vw, 2.25rem);
          line-height: 1.1;
          color: #fff;
        }
        .ces-item__desc {
          margin: 1rem 0 0;
          font-size: 1rem;
          line-height: 1.55;
          color: rgba(255,255,255,0.7);
        }
        @media (min-width: 768px) {
          .ces-item__desc { font-size: 1.0625rem; }
        }
      `}</style>
    </section>
  );
}

function ScrollItem({ c, idx }) {
  const ref = useRef(null);
  const inView = useInView(ref);
  const Demo = c.Demo;
  const isRight = idx % 2 === 1;

  return (
    <li ref={ref} className={"ces-item" + (isRight ? " ces-item--right" : "")}>
      <div className="ces-item__demo">{inView && <Demo isActive />}</div>
      <div className="ces-item__copy">
        <div className="ces-item__num">{String(idx + 1).padStart(2, "0")}</div>
        <div className="ces-item__eyebrow">{c.eyebrow}</div>
        <h3 className="ces-item__title">{c.title}</h3>
        <p className="ces-item__desc">{c.description}</p>
      </div>
    </li>
  );
}

export default CoreEditingScroll;
