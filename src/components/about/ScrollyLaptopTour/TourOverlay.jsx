import React, { useEffect, useState } from "react";

const rectStyle = ({ x, y, w, h }, extra = {}) => ({
  position: "absolute",
  left: `${x}%`,
  top: `${y}%`,
  width: `${w}%`,
  height: `${h}%`,
  ...extra,
});

function Handles({ clip }) {
  const stroke = "#fef08a";
  const glow = "0 0 12px rgba(254, 240, 138, 0.55)";
  return (
    <>
      <div
        style={rectStyle(clip, {
          border: `2px solid ${stroke}`,
          borderRadius: 6,
          boxShadow: glow,
          transition: "opacity 200ms ease-out",
        })}
      />
      <div
        style={rectStyle(
          { x: clip.x - 0.6, y: clip.y + clip.h / 2 - 2.5, w: 1.2, h: 5 },
          {
            background: stroke,
            borderRadius: 2,
            boxShadow: glow,
          },
        )}
      />
      <div
        style={rectStyle(
          {
            x: clip.x + clip.w - 0.6,
            y: clip.y + clip.h / 2 - 2.5,
            w: 1.2,
            h: 5,
          },
          {
            background: stroke,
            borderRadius: 2,
            boxShadow: glow,
          },
        )}
      />
    </>
  );
}

function TrimDemo({ clip, endW, stretchClip, stretchEndW }) {
  const handleOffsetPct = 3.0;

  // Trim target (v1)
  const trimRightStart = clip.x + clip.w;
  const trimRightEnd = clip.x + (endW ?? clip.w * 0.62);
  const trimY = clip.y + 6.6;
  const trimParkX = trimRightStart + 5;

  // Stretch target (d4) — falls back to trim clip if not provided
  const sc = stretchClip ?? clip;
  const seW = stretchEndW ?? sc.w * 1.625;
  const stretchRightStart = sc.x + sc.w;
  const stretchRightEnd = sc.x + seW;
  const stretchY = sc.y + 11.0;
  const stretchParkX = stretchRightStart + 5;

  return (
    <>
      <div
        style={{
          position: "absolute",
          top: `${trimY}%`,
          left: `${trimParkX}%`,
          width: 22,
          height: 26,
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.6))",
          animation: "td-cursor 8s ease-in-out infinite",
          opacity: 0,
          zIndex: 30,
          pointerEvents: "none",
        }}
      >
        <svg width="22" height="26" viewBox="0 0 22 26">
          <path
            d="M2 2 L2 19 L7 15 L10.5 23.5 L13.5 22.3 L10 14 L17 14 Z"
            fill="#ffffff"
            stroke="#000000"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <style>{`
        @keyframes td-cursor {
          0%, 3% { left: ${trimParkX}%; top: ${trimY}%; opacity: 0; }
          8% { left: ${trimRightStart + handleOffsetPct}%; top: ${trimY}%; opacity: 1; }
          20% { left: ${trimRightEnd + handleOffsetPct}%; top: ${trimY}%; opacity: 1; }
          32% { left: ${trimRightEnd + handleOffsetPct}%; top: ${trimY}%; opacity: 1; }
          44% { left: ${trimRightStart + handleOffsetPct}%; top: ${trimY}%; opacity: 1; }
          48% { left: ${trimRightStart + handleOffsetPct}%; top: ${trimY}%; opacity: 0; }
          50% { left: ${stretchParkX}%; top: ${stretchY}%; opacity: 0; }
          55% { left: ${stretchRightStart + handleOffsetPct}%; top: ${stretchY}%; opacity: 1; }
          67% { left: ${stretchRightEnd + handleOffsetPct}%; top: ${stretchY}%; opacity: 1; }
          79% { left: ${stretchRightEnd + handleOffsetPct}%; top: ${stretchY}%; opacity: 1; }
          91% { left: ${stretchRightStart + handleOffsetPct}%; top: ${stretchY}%; opacity: 1; }
          94%, 100% { left: ${stretchParkX}%; top: ${stretchY}%; opacity: 0; }
        }
        @keyframes td-trim-handle {
          0%, 3% { transform: scale(1); }
          7% { transform: scale(1.22); }
          11% { transform: scale(1.08); }
          41% { transform: scale(1.08); }
          45% { transform: scale(1.22); }
          48%, 100% { transform: scale(1); }
        }
        @keyframes td-stretch-handle {
          0%, 50% { transform: scale(1); }
          54% { transform: scale(1.22); }
          58% { transform: scale(1.08); }
          88% { transform: scale(1.08); }
          92% { transform: scale(1.22); }
          95%, 100% { transform: scale(1); }
        }
        .clip-display--selected .clip-display__handle--trim-right {
          animation: td-trim-handle 8s ease-in-out infinite;
        }
        .clip-display--selected .clip-display__handle--stretch-right {
          animation: td-stretch-handle 8s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}

function Selection({ clips }) {
  const stroke = "#67e8f9";
  return (
    <>
      {clips.map((c, i) => (
        <div
          key={i}
          style={rectStyle(c, {
            border: `2px solid ${stroke}`,
            borderRadius: 6,
            boxShadow: "0 0 14px rgba(103, 232, 249, 0.5)",
            background: "rgba(103, 232, 249, 0.08)",
          })}
        />
      ))}
    </>
  );
}

function Group({ clips }) {
  if (clips.length === 0) return null;
  const minX = Math.min(...clips.map((c) => c.x));
  const maxX = Math.max(...clips.map((c) => c.x + c.w));
  const minY = Math.min(...clips.map((c) => c.y));
  const bracket = { x: minX - 1, y: minY - 4, w: maxX - minX + 2, h: 2.5 };
  const tint = "#a78bfa";
  return (
    <>
      {clips.map((c, i) => (
        <div
          key={i}
          style={rectStyle(c, {
            border: `2px solid ${tint}`,
            borderRadius: 6,
            boxShadow: "0 0 14px rgba(167, 139, 250, 0.45)",
          })}
        />
      ))}
      <div
        style={rectStyle(bracket, {
          background: tint,
          borderRadius: 2,
        })}
      />
      <div
        style={rectStyle(
          { x: bracket.x, y: bracket.y, w: 0.4, h: 4 },
          { background: tint, borderRadius: 1 },
        )}
      />
      <div
        style={rectStyle(
          { x: bracket.x + bracket.w - 0.4, y: bracket.y, w: 0.4, h: 4 },
          { background: tint, borderRadius: 1 },
        )}
      />
    </>
  );
}

function Overlap({ base, drop }) {
  return (
    <>
      <div
        style={rectStyle(base, {
          border: "2px dashed rgba(255, 255, 255, 0.5)",
          borderRadius: 6,
          background: "rgba(0, 0, 0, 0.25)",
        })}
      />
      <div
        style={rectStyle(drop, {
          border: "2px solid #fb923c",
          borderRadius: 6,
          boxShadow: "0 8px 28px rgba(251, 146, 60, 0.55)",
          background: "rgba(251, 146, 60, 0.18)",
        })}
      />
    </>
  );
}

const ArrowCursor = () => (
  <svg width="22" height="26" viewBox="0 0 22 26">
    <path
      d="M2 2 L2 19 L7 15 L10.5 23.5 L13.5 22.3 L10 14 L17 14 Z"
      fill="#ffffff"
      stroke="#000000"
      strokeWidth="0.8"
      strokeLinejoin="round"
    />
  </svg>
);

const HAND_STYLE = {
  fontSize: 22,
  lineHeight: 1,
  userSelect: "none",
  display: "block",
  filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.45))",
};

const OpenHandCursor = () => (
  <div style={HAND_STYLE} aria-hidden="true">
    🖐
  </div>
);

const ClosedHandCursor = () => (
  <div style={HAND_STYLE} aria-hidden="true">
    ✊
  </div>
);

function lerp(a, b, t) {
  return a + (b - a) * t;
}

const easeInOut = (u) =>
  u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;

function SelectDemo({ targets, moveOffsetX = 0 }) {
  const [frame, setFrame] = useState(null);

  useEffect(() => {
    let raf;
    const t0 = performance.now();
    const CYCLE = 7000;
    const parkX = 92;
    const parkY = 86;

    const tick = (now) => {
      const t = ((now - t0) % CYCLE) / CYCLE;
      let cursor = "arrow";
      let x = parkX;
      let y = parkY;
      let opacity = 0;
      let clicking = false;

      if (t < 0.04) {
        // hidden, parked
      } else if (t < 0.09) {
        const p = (t - 0.04) / 0.05;
        x = targets[0].x;
        y = targets[0].y;
        opacity = p;
        cursor = "open";
      } else if (t < 0.13) {
        x = targets[0].x;
        y = targets[0].y;
        opacity = 1;
        cursor = "open";
      } else if (t < 0.15) {
        x = targets[0].x;
        y = targets[0].y;
        opacity = 1;
        cursor = "open";
        clicking = true;
      } else if (t < 0.22) {
        const p = (t - 0.15) / 0.07;
        x = lerp(targets[0].x, targets[1].x, p);
        y = lerp(targets[0].y, targets[1].y, p);
        opacity = 1;
      } else if (t < 0.25) {
        x = targets[1].x;
        y = targets[1].y;
        opacity = 1;
        cursor = "open";
        clicking = t > 0.235;
      } else if (t < 0.32) {
        const p = (t - 0.25) / 0.07;
        x = lerp(targets[1].x, targets[2].x, p);
        y = lerp(targets[1].y, targets[2].y, p);
        opacity = 1;
      } else if (t < 0.36) {
        x = targets[2].x;
        y = targets[2].y;
        opacity = 1;
        cursor = "open";
        clicking = t > 0.345;
      } else if (t < 0.43) {
        const p = (t - 0.36) / 0.07;
        x = lerp(targets[2].x, targets[3].x, p);
        y = lerp(targets[2].y, targets[3].y, p);
        opacity = 1;
      } else if (t < 0.47) {
        x = targets[3].x;
        y = targets[3].y;
        opacity = 1;
        cursor = "open";
        clicking = t > 0.455;
      } else if (t < 0.55) {
        // Hover with open hand, ready to drag
        x = targets[3].x;
        y = targets[3].y;
        opacity = 1;
        cursor = "open";
      } else if (t < 0.58) {
        // Mouse down — close hand
        x = targets[3].x;
        y = targets[3].y;
        opacity = 1;
        cursor = "closed";
      } else if (t < 0.68) {
        // Drag right, in sync with clip move
        const p = easeInOut((t - 0.58) / 0.1);
        x = targets[3].x + moveOffsetX * p;
        y = targets[3].y;
        opacity = 1;
        cursor = "closed";
      } else if (t < 0.82) {
        // Hold at moved position
        x = targets[3].x + moveOffsetX;
        y = targets[3].y;
        opacity = 1;
        cursor = "closed";
      } else if (t < 0.92) {
        // Drag back
        const p = easeInOut((t - 0.82) / 0.1);
        x = targets[3].x + moveOffsetX * (1 - p);
        y = targets[3].y;
        opacity = 1;
        cursor = "closed";
      } else if (t < 0.95) {
        // Release — open hand
        x = targets[3].x;
        y = targets[3].y;
        opacity = 1;
        cursor = "open";
      } else {
        const p = (t - 0.95) / 0.05;
        x = targets[3].x;
        y = targets[3].y;
        opacity = 1 - p;
        cursor = "open";
      }

      setFrame({ x, y, opacity, cursor, clicking });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [targets, moveOffsetX]);

  if (!frame) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: `${frame.x}%`,
        top: `${frame.y}%`,
        opacity: frame.opacity,
        transform: `translate(-3px, -2px) ${frame.clicking ? "scale(0.78)" : ""}`,
        transformOrigin: "3px 3px",
        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.6))",
        pointerEvents: "none",
        zIndex: 30,
      }}
    >
      {frame.cursor === "arrow" && <ArrowCursor />}
      {frame.cursor === "open" && <OpenHandCursor />}
      {frame.cursor === "closed" && <ClosedHandCursor />}
    </div>
  );
}

function TourOverlay({ overlay, targetId, target }) {
  if (!overlay && !target) return null;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        transition: "opacity 200ms ease-out",
      }}
    >
      {overlay?.kind === "handles" && <Handles clip={overlay.clip} />}
      {overlay?.kind === "trim" && (
        <TrimDemo
          clip={overlay.clip}
          endW={overlay.endW}
          stretchClip={overlay.stretchClip}
          stretchEndW={overlay.stretchEndW}
        />
      )}
      {overlay?.kind === "select-demo" && (
        <SelectDemo
          targets={overlay.targets}
          moveOffsetX={overlay.moveOffsetX}
        />
      )}
      {overlay?.kind === "selection" && <Selection clips={overlay.clips} />}
      {overlay?.kind === "group" && <Group clips={overlay.clips} />}
      {overlay?.kind === "overlap" && (
        <Overlap base={overlay.base} drop={overlay.drop} />
      )}
      {target && (
        <div
          data-tour-target={targetId}
          style={rectStyle(target, { opacity: 0 })}
        />
      )}
    </div>
  );
}

export default TourOverlay;
