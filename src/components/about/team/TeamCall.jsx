// src/components/about/team/TeamCall.jsx
import React, { useRef, useState } from "react";
import { TEAM_ROSTER } from "./teamRoster.js";
import CallTile from "./CallTile.jsx";
import CallControls from "./CallControls.jsx";
import ChatPanel from "./ChatPanel.jsx";
import { useSpeakerCycle } from "./useSpeakerCycle.js";
import { useInView } from "../../../hooks/useInView.js";

function ViewToggle({ view, onChange }) {
  const opt = (key, label) => (
    <button
      type="button"
      onClick={() => onChange(key)}
      aria-pressed={view === key}
      className="rounded-2xl px-3 py-1.5 text-[11px] font-semibold"
      style={{
        background: view === key ? "#3a4150" : "transparent",
        color: view === key ? "#fff" : "#8a96a6",
      }}
    >
      {label}
    </button>
  );
  return (
    <div
      className="flex gap-0.5 rounded-2xl p-0.5"
      style={{ background: "#22262e" }}
      role="group"
      aria-label="Call view"
    >
      {opt("speaker", "Speaker")}
      {opt("grid", "Grid")}
    </div>
  );
}

function TeamCall() {
  const [view, setView] = useState("speaker");
  const [chatOpen, setChatOpen] = useState(false);
  const sectionRef = useRef(null);
  const inView = useInView(sectionRef);
  const { activeIndex, selectSpeaker } = useSpeakerCycle({
    length: TEAM_ROSTER.length,
    inView,
  });

  const active = TEAM_ROSTER[activeIndex];
  const others = TEAM_ROSTER.filter((_, i) => i !== activeIndex);

  return (
    <section ref={sectionRef} className="px-6 lg:px-10 py-20 lg:py-28">
      <div className="mx-auto w-full max-w-[980px]">
        <div
          className="overflow-hidden rounded-2xl"
          style={{
            background: "#0c0e12",
            boxShadow:
              "0 20px 60px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.06)",
          }}
        >
          {/* Top bar */}
          <div
            className="flex items-center justify-end px-3 py-2.5"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
          >
            <ViewToggle view={view} onChange={setView} />
          </div>

          {/* Stage */}
          <div className="flex">
            <div className="flex-1 p-3.5">
              {view === "grid" ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                  {TEAM_ROSTER.map((m, i) => (
                    <CallTile
                      key={m.id}
                      member={m}
                      variant="grid"
                      active={i === activeIndex}
                      onSelect={() => selectSpeaker(i)}
                    />
                  ))}
                </div>
              ) : chatOpen ? (
                /* Speaker + filmstrip when chat is open (needs the width) */
                <div className="flex flex-col gap-2" style={{ height: 300 }}>
                  <div className="flex-1">
                    <CallTile member={active} variant="speaker" active />
                  </div>
                  <div className="flex gap-1.5" style={{ height: 46 }}>
                    {others.map((m) => {
                      const realIndex = TEAM_ROSTER.findIndex(
                        (x) => x.id === m.id,
                      );
                      return (
                        <div key={m.id} className="flex-1">
                          <CallTile
                            member={m}
                            variant="filmstrip"
                            onSelect={() => selectSpeaker(realIndex)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Speaker + side grid when chat is closed. Speaker's 4:3 aspect
                   sets the height; the side column stretches to match and
                   splits into 5 rows so all 10 members fit with nothing
                   clipped. */
                <div className="flex items-stretch gap-2.5">
                  <div className="w-[58%]" style={{ aspectRatio: "4 / 3" }}>
                    <CallTile member={active} variant="speaker" active />
                  </div>
                  <div className="grid w-[42%] grid-cols-2 grid-rows-5 gap-2">
                    {others.map((m) => {
                      const realIndex = TEAM_ROSTER.findIndex(
                        (x) => x.id === m.id,
                      );
                      return (
                        <CallTile
                          key={m.id}
                          member={m}
                          variant="sidebar"
                          onSelect={() => selectSpeaker(realIndex)}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
          </div>

          <CallControls
            chatOpen={chatOpen}
            onToggleChat={() => setChatOpen((o) => !o)}
          />
        </div>
      </div>
    </section>
  );
}

export default TeamCall;
