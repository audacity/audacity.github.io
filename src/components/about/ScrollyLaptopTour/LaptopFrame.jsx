import React from "react";

const LID_TRANSITION = "transform 760ms cubic-bezier(0.6, 0.05, 0.2, 1.05)";

function LaptopFrame({ children, frameRef, lidAngle = 0 }) {
  return (
    <div
      ref={frameRef}
      className="relative mx-auto"
      style={{
        width: "min(96vw, 1330px)",
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
          className="rounded-[28px] p-[21px] lg:p-[28px] shadow-[0_52px_140px_-35px_rgba(0,0,0,0.8)]"
          style={{
            background: "linear-gradient(180deg, #1f1f23 0%, #15151a 100%)",
            border: "1px solid rgba(255,255,255,0.05)",
            transformOrigin: "bottom center",
            transformStyle: "preserve-3d",
            transform: `rotateX(${lidAngle}deg)`,
            transition: LID_TRANSITION,
            willChange: "transform",
            backfaceVisibility: "hidden",
          }}
        >
          <div className="aspect-[16/9] rounded-[14px] overflow-hidden bg-black relative">
            {children}
          </div>
        </div>

        <div
          className="mx-auto"
          style={{
            width: "92%",
            height: 11,
            background: "linear-gradient(180deg, #2a2a2e 0%, #18181c 100%)",
          }}
        />
        <div
          style={{
            width: "108%",
            marginLeft: "-4%",
            height: 32,
            background: "linear-gradient(180deg, #1a1a1d 0%, #0a0a0d 100%)",
            clipPath: "polygon(3% 0, 97% 0, 100% 100%, 0 100%)",
            borderBottomLeftRadius: 24,
            borderBottomRightRadius: 24,
          }}
        />
        <div
          className="mx-auto"
          style={{
            width: "70%",
            height: 70,
            marginTop: 11,
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
