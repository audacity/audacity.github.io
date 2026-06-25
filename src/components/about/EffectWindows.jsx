import React, { useEffect, useRef } from "react";
import { useEntrance } from "../../hooks/useEntrance.js";

const EFFECTS = [
  {
    id: "compressor",
    name: "Compressor",
    image: "/effects/Compressor.png",
    accentSoft: "rgba(248, 113, 113, 0.25)",
  },
  {
    id: "filter-curve",
    name: "Filter Curve",
    image: "/effects/Filter_curve.png",
    accentSoft: "rgba(52, 211, 153, 0.22)",
  },
  {
    id: "graphic-eq",
    name: "Graphic EQ",
    image: "/effects/Graphic_EQ.png",
    accentSoft: "rgba(167, 139, 250, 0.25)",
  },
  {
    id: "limiter",
    name: "Limiter",
    image: "/effects/Limiter.png",
    accentSoft: "rgba(251, 191, 36, 0.22)",
  },
  {
    id: "reverb",
    name: "Reverb",
    image: "/effects/Reverb.png",
    accentSoft: "rgba(124, 196, 255, 0.25)",
  },
];

function EffectCard({ effect }) {
  return (
    <li
      className="effect-card shrink-0 w-[min(86vw,520px)] flex flex-col items-center"
      style={{ "--accent-soft": effect.accentSoft }}
    >
      <div className="relative w-full" style={{ aspectRatio: "16 / 11" }}>
        <img
          src={effect.image}
          alt={`${effect.name} effect window`}
          loading="lazy"
          decoding="async"
          className="effect-image"
          draggable={false}
        />
      </div>
      <div className="mt-6 text-center">
        <h3 className="font-harmony text-text-contrast text-2xl md:text-3xl leading-tight">
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
    const BASE_VELOCITY = -1.2; // px/frame, negative = leftward
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
            Every built-in effect now lives in a focused window — clear
            controls, real-time preview, and the same vocabulary across the
            whole suite.
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
          filter:
            drop-shadow(0 30px 50px rgba(0, 0, 0, 0.5))
            drop-shadow(0 0 28px var(--accent-soft));
        }
      `}</style>
    </section>
  );
}

export default EffectWindows;
