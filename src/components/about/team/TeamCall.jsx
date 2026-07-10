// src/components/about/team/TeamCall.jsx
import React, { useRef, useState } from "react";
import { TEAM_ROSTER } from "./teamRoster.js";
import CallTile from "./CallTile.jsx";
import CallControls from "./CallControls.jsx";
import ChatPanel from "./ChatPanel.jsx";
import { useSpeakerCycle } from "./useSpeakerCycle.js";
import { useInView } from "../../../hooks/useInView.js";
import { useEntrance } from "../../../hooks/useEntrance.js";

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
  const [isMobile, setIsMobile] = useState(false);
  const sectionRef = useRef(null);
  const inView = useInView(sectionRef);
  const headerEntrance = useEntrance();
  const { activeIndex, selectSpeaker } = useSpeakerCycle({
    length: TEAM_ROSTER.length,
    inView,
  });

  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const compute = () => setIsMobile(mq.matches);
    compute();
    mq.addEventListener("change", compute);
    return () => mq.removeEventListener("change", compute);
  }, []);

  const active = TEAM_ROSTER[activeIndex];
  const others = TEAM_ROSTER.filter((_, i) => i !== activeIndex);
  const effectiveView = isMobile ? "speaker" : view;

  return (
    <section ref={sectionRef} className="px-6 lg:px-10 py-20 lg:py-28">
      <div className="mx-auto w-full max-w-[980px]">
        <header
          ref={headerEntrance.ref}
          style={headerEntrance.style}
          className="mb-8 max-w-2xl"
        >
          <h2 className="font-harmony text-text-contrast text-4xl md:text-5xl lg:text-6xl leading-[1.05]">
            The team behind Audacity 4
          </h2>
          <p className="mt-4 text-text-contrast/70 text-base md:text-lg">
            We are fully remote, so a video call is how we see each other most
            days. Say hello.
          </p>
        </header>
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
            style={{
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              minHeight: 44,
            }}
          >
            {!isMobile && <ViewToggle view={view} onChange={setView} />}
          </div>

          {/* Stage */}
          <div className="flex">
            <div className="flex-1 p-3.5">
              {effectiveView === "grid" ? (
                // Fixed height on desktop (lg:h-[440px]) matches the speaker
                // view so toggling Speaker/Grid never resizes the card. Grid
                // view only renders at lg (below that the toggle is hidden and
                // speaker view is forced), so 4 cols × 3 rows holds all 11.
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 lg:grid-rows-3 gap-2.5 lg:h-[440px]">
                  {TEAM_ROSTER.map((m, i) => (
                    <CallTile
                      key={m.id}
                      member={m}
                      variant="grid"
                      fill
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
                /* Speaker + side grid when chat is closed. Below lg the
                   speaker's 4:3 aspect sets the height; at lg the row is
                   pinned to the same fixed height as the grid view
                   (lg:h-[440px]) so toggling never resizes the card, and the
                   speaker stretches to fill it (lg:aspect-auto). The side
                   column stretches to match and splits into 5 rows so all 10
                   members fit with nothing clipped. */
                <div className="flex flex-col sm:flex-row items-stretch gap-2.5 lg:h-[440px]">
                  <div className="w-full sm:w-[58%] aspect-[4/3] lg:aspect-auto">
                    <CallTile member={active} variant="speaker" active />
                  </div>
                  <div className="grid w-full sm:w-[42%] grid-cols-2 grid-rows-5 gap-2">
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

            {isMobile ? (
              chatOpen && (
                <div
                  className="fixed inset-0 z-50 flex"
                  style={{ background: "rgba(0,0,0,0.6)" }}
                  onClick={() => setChatOpen(false)}
                >
                  <div
                    className="ml-auto h-full"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ChatPanel open onClose={() => setChatOpen(false)} />
                  </div>
                </div>
              )
            ) : (
              <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
            )}
          </div>

          <CallControls
            chatOpen={chatOpen}
            onToggleChat={() => setChatOpen((o) => !o)}
          />
        </div>
      </div>
      <style>{`
          .about-section--team .team-tile:focus-visible,
          .about-section--team button:focus-visible {
            outline: 2px solid #7c9cff;
            outline-offset: 2px;
          }
        `}</style>
    </section>
  );
}

export default TeamCall;
