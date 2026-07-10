// src/components/about/team/TeamCall.jsx
import React from "react";
import { TEAM_ROSTER } from "./teamRoster.js";
import CallTile from "./CallTile.jsx";

// Team section rendered as a generic video call. This minimal version shows
// all members in a static grid; view toggle, motion, controls, and chat are
// added in later tasks.
function TeamCall() {
  return (
    <section className="px-6 lg:px-10 py-20 lg:py-28">
      <div className="mx-auto max-w-[980px]">
        <div
          className="overflow-hidden rounded-2xl"
          style={{
            background: "#0c0e12",
            boxShadow:
              "0 20px 60px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.06)",
          }}
        >
          <div className="p-3.5">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {TEAM_ROSTER.map((m) => (
                <CallTile key={m.id} member={m} variant="grid" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default TeamCall;
