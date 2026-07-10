// src/components/about/team/ChatPanel.jsx
import React from "react";
import { CHAT_SCRIPT } from "./chatScript.js";
import { TEAM_ROSTER } from "./teamRoster.js";

const BY_ID = Object.fromEntries(TEAM_ROSTER.map((m) => [m.id, m]));

// Slide-in chat panel showing the scripted (static) conversation. Not live —
// the input is decorative.
function ChatPanel({ open, onClose }) {
  if (!open) return null;
  return (
    <div
      className="flex w-full flex-col lg:w-[300px]"
      style={{
        background: "#14171d",
        borderLeft: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div
        className="flex items-center justify-between px-3.5 py-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <span style={{ fontSize: 12, fontWeight: 600, color: "#c3ccd8" }}>
          Chat
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close chat"
          className="border-0 bg-transparent cursor-pointer"
          style={{ color: "#6b7684", fontSize: 14 }}
        >
          ✕
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-[11px] overflow-hidden px-3.5 py-3">
        {CHAT_SCRIPT.map((line, i) => {
          const author = BY_ID[line.authorId];
          return (
            <div key={i} className="flex gap-2">
              <span
                aria-hidden
                className="flex flex-shrink-0 items-center justify-center rounded-full font-semibold text-white"
                style={{
                  width: 24,
                  height: 24,
                  background: author.avatarColor,
                  fontSize: 9,
                }}
              >
                {author.initials}
              </span>
              <div className="min-w-0">
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#c9d3df",
                    marginBottom: 3,
                  }}
                >
                  {author.name}
                </div>
                <div
                  style={{ fontSize: 12, lineHeight: 1.35, color: "#9aa6b4" }}
                >
                  {line.text}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div
        aria-hidden
        className="m-3 rounded-lg px-3 py-2.5"
        style={{ background: "#22262e", fontSize: 11, color: "#5c6672" }}
      >
        Message the team…
      </div>
    </div>
  );
}

export default ChatPanel;
