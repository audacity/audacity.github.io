import React from "react";

const LID_TRANSITION = "transform 760ms cubic-bezier(0.6, 0.05, 0.2, 1.05)";

function LaptopFrame({
  children,
  frameRef,
  lidRef,
  lidAngle = 0,
  lidImmediate = false,
  // Override for callers that need to cap on both width and viewport
  // height — e.g. the pinned mobile tour, where a pure 96vw frame
  // would dominate the composition on landscape phones.
  maxWidth = "min(96vw, 1330px)",
}) {
  // All chunky dimensions scale off the frame's own width via
  // --frame-w so the case never looks proportionally too thick on
  // mobile. clamp() sets a sane minimum for tiny viewports and caps
  // at the values originally designed for the ~1330px desktop tour.
  const bezel = "clamp(9px, calc(var(--frame-w) * 0.021), 28px)";
  const outerRadius = "clamp(14px, calc(var(--frame-w) * 0.021), 28px)";
  const innerRadius = "clamp(6px, calc(var(--frame-w) * 0.0105), 14px)";
  const lipH = "clamp(5px, calc(var(--frame-w) * 0.0083), 11px)";
  const baseH = "clamp(16px, calc(var(--frame-w) * 0.024), 32px)";
  const baseRadius = "clamp(11px, calc(var(--frame-w) * 0.018), 24px)";
  const glowH = "clamp(28px, calc(var(--frame-w) * 0.053), 70px)";
  const shadowBlur = "clamp(48px, calc(var(--frame-w) * 0.105), 140px)";
  const shadowY = "clamp(18px, calc(var(--frame-w) * 0.039), 52px)";
  return (
    <div
      ref={frameRef}
      className="relative mx-auto"
      style={{
        "--frame-w": maxWidth,
        width: "var(--frame-w)",
        willChange: "transform",
        perspective: 3500,
      }}
    >
      <div
        style={{
          transformStyle: "preserve-3d",
          position: "relative",
        }}
      >
        <div
          ref={lidRef}
          style={{
            padding: bezel,
            borderRadius: outerRadius,
            boxShadow: `0 ${shadowY} ${shadowBlur} -35px rgba(0,0,0,0.8)`,
            background: "linear-gradient(180deg, #1f1f23 0%, #15151a 100%)",
            border: "1px solid rgba(255,255,255,0.05)",
            transformOrigin: "bottom center",
            transformStyle: "preserve-3d",
            transform: `rotateX(${lidAngle}deg)`,
            transition: lidImmediate ? "none" : LID_TRANSITION,
            willChange: "transform",
            backfaceVisibility: "hidden",
          }}
        >
          <div
            className="aspect-[16/9] overflow-hidden bg-black relative"
            style={{ borderRadius: innerRadius }}
          >
            {children}
          </div>
        </div>

        <div
          className="mx-auto"
          style={{
            width: "92%",
            height: lipH,
            background: "linear-gradient(180deg, #2a2a2e 0%, #18181c 100%)",
          }}
        />
        <div
          style={{
            width: "108%",
            marginLeft: "-4%",
            height: baseH,
            background: "linear-gradient(180deg, #1a1a1d 0%, #0a0a0d 100%)",
            clipPath: "polygon(3% 0, 97% 0, 100% 100%, 0 100%)",
            borderBottomLeftRadius: baseRadius,
            borderBottomRightRadius: baseRadius,
          }}
        />
        <div
          className="mx-auto"
          style={{
            width: "70%",
            height: glowH,
            marginTop: lipH,
            background:
              "radial-gradient(ellipse at center top, rgba(255,255,255,0.06) 0%, transparent 70%)",
            filter: "blur(10px)",
          }}
        />
      </div>
    </div>
  );
}

export default LaptopFrame;
