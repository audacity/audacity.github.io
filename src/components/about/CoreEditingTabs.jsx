import React, { useState } from "react";
import { CARDS } from "./CoreEditing.jsx";

// Option 1 — Tabbed grid.
// Tiny chip tabs along the top, one full-size demo below. Reads as an
// engineer's interface, not a feature reel. All six feature names are
// visible at once; only one demo runs at a time.
function CoreEditingTabs() {
  const [activeIdx, setActiveIdx] = useState(0);
  const card = CARDS[activeIdx];
  const Demo = card.Demo;

  return (
    <section className="cet-section">
      <header className="cet-header">
        <div className="cet-eyebrow" aria-hidden>
          Also
        </div>
        <h2 className="cet-title">Hundreds of smaller things</h2>
      </header>

      <div className="cet-tabs" role="tablist">
        {CARDS.map((c, idx) => {
          const isActive = idx === activeIdx;
          return (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveIdx(idx)}
              className={"cet-tab" + (isActive ? " cet-tab--active" : "")}
            >
              <span className="cet-tab__num">
                {String(idx + 1).padStart(2, "0")}
              </span>
              <span className="cet-tab__label">{c.eyebrow}</span>
            </button>
          );
        })}
      </div>

      <div className="cet-stage">
        <div className="cet-frame" key={`frame-${activeIdx}`}>
          <Demo isActive />
        </div>
        <div className="cet-copy" key={`copy-${activeIdx}`}>
          <h3 className="cet-copy__title">{card.title}</h3>
          <p className="cet-copy__desc">{card.description}</p>
        </div>
      </div>

      <style>{`
        .cet-section {
          padding: 6rem 1.5rem 8rem;
          max-width: 80rem;
          margin: 0 auto;
        }
        @media (min-width: 1024px) {
          .cet-section { padding: 8rem 2.5rem 10rem; }
        }
        .cet-header { max-width: 48rem; }
        .cet-eyebrow {
          font-family: ui-monospace, monospace;
          font-size: 0.875rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.4);
        }
        .cet-title {
          margin-top: 1rem;
          font-family: var(--font-harmony, sans-serif);
          font-size: clamp(2.25rem, 4vw, 3.75rem);
          line-height: 1.05;
          color: #fff;
        }
        .cet-tabs {
          margin-top: 2.5rem;
          display: flex;
          flex-wrap: wrap;
          gap: 1px;
          border-top: 1px solid rgba(255,255,255,0.14);
          border-bottom: 1px solid rgba(255,255,255,0.14);
          background: rgba(255,255,255,0.14);
        }
        .cet-tab {
          flex: 1 1 0;
          min-width: max-content;
          padding: 1rem 1.25rem;
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.55);
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.35rem;
          transition: color 160ms ease, background 160ms ease;
          text-align: left;
        }
        .cet-tab:hover {
          color: rgba(255,255,255,0.85);
          background: rgba(255,255,255,0.04);
        }
        .cet-tab--active {
          color: #fff;
          background: rgba(255,255,255,0.06);
        }
        .cet-tab__num {
          font-family: ui-monospace, monospace;
          font-size: 0.625rem;
          letter-spacing: 0.22em;
          color: rgba(248,113,113,0.85);
        }
        .cet-tab__label {
          font-family: ui-monospace, monospace;
          font-size: 0.75rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }
        .cet-stage {
          margin-top: 2.5rem;
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
        }
        @media (min-width: 1024px) {
          .cet-stage {
            grid-template-columns: 3fr 2fr;
            gap: 3rem;
          }
        }
        .cet-frame {
          aspect-ratio: 16 / 9;
          background: rgb(20, 16, 56);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          overflow: hidden;
          position: relative;
          animation: cetFrameIn 360ms ease;
        }
        .cet-copy {
          padding-top: 1rem;
          animation: cetFrameIn 360ms ease;
        }
        @media (min-width: 1024px) {
          .cet-copy { padding-top: 2rem; }
        }
        .cet-copy__title {
          margin: 0;
          font-family: var(--font-harmony, sans-serif);
          font-size: clamp(1.5rem, 2.4vw, 2.25rem);
          line-height: 1.1;
          color: #fff;
        }
        .cet-copy__desc {
          margin: 1rem 0 0;
          font-size: 1rem;
          line-height: 1.55;
          color: rgba(255,255,255,0.7);
        }
        @media (min-width: 768px) {
          .cet-copy__desc { font-size: 1.0625rem; }
        }
        @keyframes cetFrameIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}

export default CoreEditingTabs;
