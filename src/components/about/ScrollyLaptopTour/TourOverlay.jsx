import React from "react";

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

function SelectDemo({ targets }) {
  const parkX = 92;
  const parkY = 86;
  const stops = [
    { t: 0, x: parkX, y: parkY, op: 0 },
    { t: 4, x: parkX, y: parkY, op: 1 },
    { t: 10, x: targets[0].x, y: targets[0].y, op: 1 },
    { t: 20, x: targets[0].x, y: targets[0].y, op: 1 },
    { t: 25, x: targets[1].x, y: targets[1].y, op: 1 },
    { t: 35, x: targets[1].x, y: targets[1].y, op: 1 },
    { t: 40, x: targets[2].x, y: targets[2].y, op: 1 },
    { t: 50, x: targets[2].x, y: targets[2].y, op: 1 },
    { t: 55, x: targets[3].x, y: targets[3].y, op: 1 },
    { t: 87, x: targets[3].x, y: targets[3].y, op: 1 },
    { t: 95, x: parkX, y: parkY, op: 1 },
    { t: 100, x: parkX, y: parkY, op: 0 },
  ];
  const cursorKeyframes = stops
    .map((s) => `${s.t}% { left: ${s.x}%; top: ${s.y}%; opacity: ${s.op}; }`)
    .join("\n");

  const clickFrames = [10, 25, 40, 55];
  const pulseKeyframes = (() => {
    const lines = ["0% { transform: scale(1); }"];
    for (const t of clickFrames) {
      lines.push(`${Math.max(0, t - 0.4)}% { transform: scale(1); }`);
      lines.push(`${t}% { transform: scale(0.78); }`);
      lines.push(`${Math.min(100, t + 1.6)}% { transform: scale(1); }`);
    }
    lines.push("100% { transform: scale(1); }");
    return lines.join("\n");
  })();

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: `${parkX}%`,
          top: `${parkY}%`,
          width: 22,
          height: 26,
          transform: "translate(-3px, -2px)",
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.6))",
          animation: "sd-cursor 5s ease-in-out infinite",
          opacity: 0,
          zIndex: 3,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            transformOrigin: "3px 3px",
            animation: "sd-click 5s linear infinite",
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
      </div>

      <style>{`
        @keyframes sd-cursor {
          ${cursorKeyframes}
        }
        @keyframes sd-click {
          ${pulseKeyframes}
        }
      `}</style>
    </>
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
        <SelectDemo targets={overlay.targets} />
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
