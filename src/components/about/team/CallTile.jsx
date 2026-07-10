// src/components/about/team/CallTile.jsx
import React from "react";

// One video-call tile. Avatar is the member's photo when present, else an
// initials circle in their colour. Rendered as a button so it's focusable
// and click-to-spotlight works for keyboard and pointer alike.
function CallTile({ member, variant = "grid", active = false, onSelect }) {
  const isSpeaker = variant === "speaker";
  const isFilm = variant === "filmstrip";

  const avatarSize = isSpeaker ? 92 : isFilm ? 26 : 40;
  const nameSize = isSpeaker ? 14 : 10;

  return (
    <button
      type="button"
      onClick={onSelect ? () => onSelect(member.id) : undefined}
      onMouseEnter={onSelect ? () => onSelect(member.id) : undefined}
      aria-pressed={active}
      aria-label={member.name}
      className={
        "team-tile relative flex items-center justify-center overflow-hidden rounded-[10px] border-0 p-0 cursor-pointer " +
        (isSpeaker ? "w-full h-full" : "aspect-[16/11]")
      }
      style={{
        background: "#262b33",
        boxShadow: active ? "0 0 0 2px #35c46a" : "none",
        transition: "box-shadow 220ms ease",
      }}
    >
      {member.photo ? (
        <img
          src={member.photo}
          alt={member.name}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <span
          aria-hidden
          className="flex items-center justify-center rounded-full font-semibold text-white"
          style={{
            width: avatarSize,
            height: avatarSize,
            background: member.avatarColor,
            fontSize: avatarSize * 0.34,
          }}
        >
          {member.initials}
        </span>
      )}

      {!isFilm && (
        <span
          className="absolute left-2 bottom-1.5 max-w-[calc(100%-16px)] truncate rounded-[5px] text-white"
          style={{
            background: "rgba(0,0,0,0.55)",
            padding: isSpeaker ? "6px 10px" : "3px 6px",
            fontSize: nameSize,
            fontWeight: 500,
          }}
        >
          {isSpeaker ? (
            <>
              {member.name}
              <span
                style={{ color: "#9fb0c3", fontWeight: 400, marginLeft: 7 }}
              >
                {member.role}
              </span>
            </>
          ) : (
            member.name
          )}
        </span>
      )}
    </button>
  );
}

export default CallTile;
