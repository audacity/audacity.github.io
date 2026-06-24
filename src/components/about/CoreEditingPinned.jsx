import React, { useEffect, useRef, useState } from "react";
import { CARDS } from "./CoreEditing.jsx";

// Variant of Option 2 (sticky-scroll narrative) — Awwwards-style.
// The whole stage pins to the viewport while the user scrolls through
// a tall track. Each "step" is a viewport-height segment that swaps the
// demo + copy in place. No multiple demos in flight, no traveling
// scroll content — the page acts like a slide deck driven by the
// scroll bar.
const STEP_VH = 100; // each step takes one viewport of scroll

function CoreEditingPinned() {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [progress, setProgress] = useState(0); // 0..1 within current step

  useEffect(() => {
    let cleanup = () => {};
    let cancelled = false;

    (async () => {
      const gsapMod = await import("gsap");
      const stMod = await import("gsap/ScrollTrigger");
      if (cancelled) return;
      const gsap = gsapMod.default;
      const ScrollTrigger = stMod.ScrollTrigger || stMod.default;
      gsap.registerPlugin(ScrollTrigger);

      const section = sectionRef.current;
      const track = trackRef.current;
      if (!section || !track) return;

      const steps = CARDS.length;

      const trigger = ScrollTrigger.create({
        trigger: track,
        start: "top top",
        end: "bottom bottom",
        pin: section,
        pinSpacing: false,
        scrub: true,
        onUpdate: (self) => {
          // Map total progress (0..1) across all steps into (idx, localProgress).
          const totalP = self.progress * steps;
          const idx = Math.min(steps - 1, Math.floor(totalP));
          const local = Math.min(1, Math.max(0, totalP - idx));
          setActiveIdx((prev) => (prev === idx ? prev : idx));
          setProgress(local);
        },
      });

      cleanup = () => {
        trigger.kill();
      };
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  const card = CARDS[activeIdx];
  const Demo = card.Demo;

  // Crossfade window — fade copy out near end of step, in at start of next.
  const copyOpacity =
    progress < 0.15
      ? progress / 0.15
      : progress > 0.85
        ? (1 - progress) / 0.15
        : 1;

  return (
    <div className="cep-wrapper">
      <div
        ref={trackRef}
        className="cep-track"
        style={{ height: `${CARDS.length * STEP_VH}vh` }}
      >
        <section ref={sectionRef} className="cep-section">
          <div className="cep-header">
            <div className="cep-eyebrow" aria-hidden>
              Also
            </div>
            <h2 className="cep-title">Hundreds of smaller things</h2>
          </div>

          <div className="cep-stage">
            <div className="cep-demo" key={`demo-${activeIdx}`}>
              <Demo isActive />
            </div>
            <div className="cep-copy" style={{ opacity: copyOpacity }}>
              <div className="cep-copy__num">
                {String(activeIdx + 1).padStart(2, "0")}
                <span className="cep-copy__of">
                  {" "}
                  / {String(CARDS.length).padStart(2, "0")}
                </span>
              </div>
              <div className="cep-copy__eyebrow">{card.eyebrow}</div>
              <h3 className="cep-copy__title">{card.title}</h3>
              <p className="cep-copy__desc">{card.description}</p>
            </div>
          </div>

          <div className="cep-progress" aria-hidden>
            {CARDS.map((c, i) => (
              <div
                key={c.id}
                className={
                  "cep-progress__dot" +
                  (i < activeIdx ? " is-past" : "") +
                  (i === activeIdx ? " is-active" : "")
                }
              >
                <div
                  className="cep-progress__fill"
                  style={{
                    transform:
                      i < activeIdx
                        ? "scaleX(1)"
                        : i === activeIdx
                          ? `scaleX(${progress})`
                          : "scaleX(0)",
                  }}
                />
              </div>
            ))}
          </div>
        </section>
      </div>

      <style>{`
        .cep-wrapper {
          position: relative;
        }
        .cep-track {
          position: relative;
        }
        .cep-section {
          height: 100vh;
          display: flex;
          flex-direction: column;
          padding: 4rem 1.5rem 2rem;
          max-width: 80rem;
          margin: 0 auto;
          box-sizing: border-box;
        }
        @media (min-width: 1024px) {
          .cep-section { padding: 5rem 2.5rem 3rem; }
        }
        .cep-header { flex: 0 0 auto; max-width: 48rem; }
        .cep-eyebrow {
          font-family: ui-monospace, monospace;
          font-size: 0.875rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.4);
        }
        .cep-title {
          margin: 0.5rem 0 0;
          font-family: var(--font-harmony, sans-serif);
          font-size: clamp(1.875rem, 3.5vw, 3rem);
          line-height: 1.05;
          color: #fff;
        }
        .cep-stage {
          flex: 1 1 auto;
          margin-top: 1.5rem;
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
          align-items: center;
          min-height: 0;
        }
        @media (min-width: 1024px) {
          .cep-stage {
            grid-template-columns: 3fr 2fr;
            gap: 3rem;
          }
        }
        .cep-demo {
          aspect-ratio: 16 / 9;
          width: 100%;
          max-height: 100%;
          background: rgb(20, 16, 56);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 14px;
          overflow: hidden;
          position: relative;
          animation: cepDemoIn 480ms cubic-bezier(.2,.7,.2,1);
        }
        .cep-copy {
          transition: opacity 80ms linear;
        }
        .cep-copy__num {
          font-family: ui-monospace, monospace;
          font-size: 0.7rem;
          letter-spacing: 0.28em;
          color: rgba(248,113,113,0.85);
        }
        .cep-copy__of {
          color: rgba(255,255,255,0.35);
        }
        .cep-copy__eyebrow {
          margin-top: 0.5rem;
          font-family: ui-monospace, monospace;
          font-size: 0.7rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.55);
        }
        .cep-copy__title {
          margin: 0.75rem 0 0;
          font-family: var(--font-harmony, sans-serif);
          font-size: clamp(1.5rem, 2.6vw, 2.5rem);
          line-height: 1.1;
          color: #fff;
        }
        .cep-copy__desc {
          margin: 1rem 0 0;
          font-size: 1rem;
          line-height: 1.55;
          color: rgba(255,255,255,0.7);
        }
        @media (min-width: 768px) {
          .cep-copy__desc { font-size: 1.0625rem; }
        }
        .cep-progress {
          flex: 0 0 auto;
          margin-top: 1.5rem;
          display: flex;
          gap: 6px;
        }
        .cep-progress__dot {
          flex: 1 1 0;
          height: 2px;
          background: rgba(255,255,255,0.1);
          overflow: hidden;
          border-radius: 2px;
          position: relative;
        }
        .cep-progress__fill {
          position: absolute;
          inset: 0;
          background: rgba(248,113,113,0.85);
          transform-origin: left center;
          transform: scaleX(0);
        }
        .cep-progress__dot.is-past .cep-progress__fill {
          transform: scaleX(1);
        }
        @keyframes cepDemoIn {
          from { opacity: 0; transform: translateY(8px) scale(0.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

export default CoreEditingPinned;
