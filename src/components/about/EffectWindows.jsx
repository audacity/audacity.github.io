import React, { useEffect, useRef } from "react";
import { useEntrance } from "../../hooks/useEntrance.js";

const EFFECTS = [
  { id: "compressor", name: "Compressor", image: "/effects/Compressor.webp" },
  {
    id: "filter-curve",
    name: "Filter Curve",
    image: "/effects/Filter_curve.webp",
  },
  { id: "graphic-eq", name: "Graphic EQ", image: "/effects/Graphic_EQ.webp" },
  // The Limiter is the smallest dialog of the set. Held back so its
  // controls draw at roughly the same size as the other cards' rather
  // than magnified to fill the card.
  {
    id: "limiter",
    name: "Limiter",
    image: "/effects/Limiter.webp",
    scale: 0.7,
  },
  { id: "reverb", name: "Reverb", image: "/effects/Reverb.webp" },
];

function EffectCard({ effect }) {
  return (
    <li className="effect-card shrink-0 w-[min(86vw,520px)] flex flex-col items-center">
      <div className="relative w-full" style={{ aspectRatio: "16 / 11" }}>
        <img
          src={effect.image}
          alt={`${effect.name} effect window`}
          loading="lazy"
          decoding="async"
          className="effect-image"
          draggable={false}
          style={
            effect.scale
              ? {
                  // Centre the held-back image in the full-size card box so
                  // the row's rhythm and caption positions stay aligned.
                  width: `${effect.scale * 100}%`,
                  height: `${effect.scale * 100}%`,
                  position: "absolute",
                  inset: 0,
                  margin: "auto",
                }
              : undefined
          }
        />
      </div>
      <div className="mt-6 text-center">
        <h3 className="font-sans font-semibold text-text-contrast text-base md:text-lg leading-tight">
          {effect.name}
        </h3>
      </div>
    </li>
  );
}

function EffectWindows() {
  const stripRef = useRef(null);
  const rowRef = useRef(null);

  useEffect(() => {
    const BASE_VELOCITY = -0.7; // px/frame, negative = leftward
    let velocity = BASE_VELOCITY;
    let translateX = 0;
    let setWidth = 0;
    let visible = false;
    let raf = null;

    const measure = () => {
      const total = rowRef.current?.scrollWidth || 0;
      setWidth = total / 2;
    };

    measure();
    const ro = new ResizeObserver(measure);
    if (rowRef.current) ro.observe(rowRef.current);

    const tick = () => {
      velocity = velocity * 0.92 + BASE_VELOCITY * 0.08;
      translateX += velocity;
      if (setWidth > 0) {
        if (translateX <= -setWidth) translateX += setWidth;
        else if (translateX >= 0) translateX -= setWidth;
      }
      if (rowRef.current) {
        rowRef.current.style.transform = `translate3d(${translateX}px, 0, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };

    // Only run the marquee when the strip is on screen.
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && raf === null) {
          raf = requestAnimationFrame(tick);
        } else if (!visible && raf !== null) {
          cancelAnimationFrame(raf);
          raf = null;
        }
      },
      { rootMargin: "200px 0px" },
    );
    if (stripRef.current) io.observe(stripRef.current);

    const handleWheel = (e) => {
      if (Math.abs(e.deltaX) > 0) {
        velocity -= e.deltaX * 0.35;
      }
    };

    const stripEl = stripRef.current;
    stripEl?.addEventListener("wheel", handleWheel, { passive: true });

    return () => {
      if (raf !== null) cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      stripEl?.removeEventListener("wheel", handleWheel);
    };
  }, []);

  const headerEntrance = useEntrance();
  const stripEntrance = useEntrance({ delayMs: 160 });
  return (
    <section className="bg-background-dark relative">
      <div className="max-w-screen-xl mx-auto px-6 lg:px-10 pt-24 lg:pt-32">
        <header
          ref={headerEntrance.ref}
          className="max-w-3xl"
          style={headerEntrance.style}
        >
          <h2 className="font-harmony text-text-contrast text-5xl md:text-6xl lg:text-7xl leading-[1.05]">
            Effects, redesigned
          </h2>
          <p className="mt-6 text-text-contrast/70 text-base md:text-lg">
            Every effect window has been rebuilt, inside and out.
          </p>
        </header>
      </div>

      <div
        ref={(el) => {
          stripRef.current = el;
          stripEntrance.ref.current = el;
        }}
        className="mt-14 lg:mt-20 pb-24 lg:pb-32 effect-strip"
        style={stripEntrance.style}
      >
        <ul
          ref={rowRef}
          className="flex items-start gap-10 lg:gap-16"
          style={{ width: "max-content", willChange: "transform" }}
        >
          {EFFECTS.map((effect) => (
            <EffectCard key={`a-${effect.id}`} effect={effect} />
          ))}
          {EFFECTS.map((effect) => (
            <EffectCard key={`b-${effect.id}`} effect={effect} />
          ))}
        </ul>
      </div>

      <style>{`
        .effect-strip {
          overflow-x: clip;
          overflow-y: visible;
          cursor: grab;
        }
        .effect-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
          user-select: none;
          filter: drop-shadow(0 30px 50px rgba(0, 0, 0, 0.5));
        }
      `}</style>
    </section>
  );
}

export default EffectWindows;
