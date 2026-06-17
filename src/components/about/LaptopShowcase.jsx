import React, { useEffect, useRef, useState } from "react";

const CLOSED_ANGLE = -85;

function LaptopShowcase() {
  const sectionRef = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let rafId = null;
    const compute = () => {
      rafId = null;
      const node = sectionRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const viewportH = window.innerHeight || 800;
      // Start opening when the section's top hits 85% down the viewport;
      // fully open when it hits 35%.
      const start = viewportH * 0.85;
      const end = viewportH * 0.35;
      let p = (start - rect.top) / (start - end);
      p = Math.max(0, Math.min(1, p));
      // Round to 1% steps so we don't render on every sub-pixel scroll.
      const rounded = Math.round(p * 100) / 100;
      setProgress((prev) => (prev === rounded ? prev : rounded));
    };
    const onScroll = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(compute);
    };
    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  const angle = CLOSED_ANGLE * (1 - progress);

  return (
    <section
      ref={sectionRef}
      className="bg-background-dark px-6 lg:px-10 py-16 lg:py-24"
      style={{ perspective: 1800 }}
    >
      <div className="max-w-5xl mx-auto">
        <div className="relative" style={{ transformStyle: "preserve-3d" }}>
          {/* Lid + bezel — pivots at its bottom edge (the hinge) */}
          <div
            style={{
              transform: `rotateX(${angle}deg)`,
              transformOrigin: "bottom center",
              transformStyle: "preserve-3d",
              transition: "transform 80ms linear",
              willChange: "transform",
            }}
          >
            <div
              className="rounded-2xl p-3 lg:p-4 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]"
              style={{
                background: "linear-gradient(180deg, #1f1f23 0%, #15151a 100%)",
                border: "1px solid rgba(255,255,255,0.05)",
                backfaceVisibility: "hidden",
              }}
            >
              <div className="aspect-[16/9] rounded-lg overflow-hidden bg-black">
                <img
                  src="/workspace-snapshots/music.webp"
                  alt="Audacity 4 music workspace"
                  width={1280}
                  height={720}
                  loading="lazy"
                  decoding="async"
                  className="block w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Hinge — slightly narrower than the lid */}
          <div
            className="mx-auto"
            style={{
              width: "92%",
              height: 6,
              background: "linear-gradient(180deg, #2a2a2e 0%, #18181c 100%)",
            }}
          />

          {/* Base — trapezoid, wider than the lid */}
          <div
            style={{
              width: "108%",
              marginLeft: "-4%",
              height: 18,
              background: "linear-gradient(180deg, #1a1a1d 0%, #0a0a0d 100%)",
              clipPath: "polygon(3% 0, 97% 0, 100% 100%, 0 100%)",
              borderBottomLeftRadius: 14,
              borderBottomRightRadius: 14,
            }}
          />

          {/* Faint floor reflection */}
          <div
            className="mx-auto"
            style={{
              width: "70%",
              height: 80,
              marginTop: 12,
              background:
                "radial-gradient(ellipse at top, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 70%)",
            }}
          />
        </div>
      </div>
    </section>
  );
}

export default LaptopShowcase;
