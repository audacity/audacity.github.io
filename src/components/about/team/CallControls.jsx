// src/components/about/team/CallControls.jsx
import React from "react";

// Bottom control bar. Only Chat is interactive; the other controls are
// decorative set-dressing (aria-hidden, not focusable) so assistive tech
// isn't offered fake buttons.
const ICON = {
  mic: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M6 11a6 6 0 0 0 12 0M12 17v4" />
    </>
  ),
  video: (
    <>
      <rect x="3" y="6" width="12" height="12" rx="2" />
      <path d="M15 10l6-3v10l-6-3" />
    </>
  ),
  hand: (
    <path d="M8 11V5.5a1.5 1.5 0 0 1 3 0V11m0-1V4.5a1.5 1.5 0 0 1 3 0V11m0-.5V6a1.5 1.5 0 0 1 3 0v7a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-3l-2-3.5a1.6 1.6 0 0 1 2.6-1.8L8 13" />
  ),
  chat: <path d="M4 5h16v11H8l-4 4z" />,
  people: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20a6 6 0 0 1 12 0M16 6a3 3 0 0 1 0 6M18 20a6 6 0 0 0-3-5" />
    </>
  ),
  leave: (
    <path d="M5 4a2 2 0 0 1 2-1.7l2 .3a2 2 0 0 1 1.7 2l-.3 2a2 2 0 0 1-1 1.5 12 12 0 0 0 4.8 4.8 2 2 0 0 1 1.5-1l2-.3a2 2 0 0 1 2 1.7l.3 2A2 2 0 0 1 20 20 16 16 0 0 1 4 4z" />
  ),
};

function Svg({ name, leave }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="17"
      height="17"
      fill={leave ? "#fff" : "none"}
      stroke={leave ? "#fff" : "#dfe6ee"}
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={leave ? { transform: "rotate(135deg)" } : undefined}
    >
      {ICON[name]}
    </svg>
  );
}

function DecorCtrl({ name, label }) {
  return (
    <div className="flex flex-col items-center gap-1.5" aria-hidden>
      <span
        className="flex items-center justify-center rounded-full"
        style={{ width: 40, height: 40, background: "#2a2f37" }}
      >
        <Svg name={name} />
      </span>
      <small style={{ fontSize: 9, fontWeight: 500, color: "#8a96a6" }}>
        {label}
      </small>
    </div>
  );
}

function CallControls({ chatOpen, onToggleChat }) {
  return (
    <div
      className="flex items-start justify-center gap-[18px] px-3.5 pb-3.5 pt-3"
      style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
    >
      <DecorCtrl name="mic" label="Mute" />
      <DecorCtrl name="video" label="Video" />
      <DecorCtrl name="hand" label="Raise hand" />

      <div className="flex flex-col items-center gap-1.5">
        <button
          type="button"
          onClick={onToggleChat}
          aria-pressed={chatOpen}
          aria-label="Toggle chat"
          className="flex items-center justify-center rounded-full border-0 cursor-pointer"
          style={{
            width: 40,
            height: 40,
            background: chatOpen ? "#3a63d8" : "#2a2f37",
          }}
        >
          <Svg name="chat" />
        </button>
        <small style={{ fontSize: 9, fontWeight: 500, color: "#8a96a6" }}>
          Chat
        </small>
      </div>

      <DecorCtrl name="people" label="People" />

      <div className="flex flex-col items-center gap-1.5" aria-hidden>
        <span
          className="flex items-center justify-center rounded-[20px]"
          style={{ width: 54, height: 40, background: "#e5484d" }}
        >
          <Svg name="leave" leave />
        </span>
        <small style={{ fontSize: 9, fontWeight: 500, color: "#8a96a6" }}>
          Leave
        </small>
      </div>
    </div>
  );
}

export default CallControls;
