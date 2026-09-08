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
  const [callEnded, setCallEnded] = useState(false);
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
            Meet the team
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
          {/* Top bar — always rendered to hold its height */}
          <div
            className="flex items-center justify-end px-3 py-2.5"
            style={{
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              minHeight: 44,
            }}
          >
            {!callEnded && !isMobile && (
              <ViewToggle view={view} onChange={setView} />
            )}
          </div>

          {/* Stage — relative so the chat panel can overlay without affecting layout */}
          <div className="relative flex">
            <div className="flex-1 p-3.5">
              {/* The call layout stays MOUNTED through the ended state,
                  visibility-hidden, and the ended panel overlays it — same
                  trick the control bar uses — so the window's height never
                  moves when leaving or rejoining. Tile videos park via
                  videoEnabled while ended. */}
              {callEnded && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5">
                  <p
                    className="font-sans font-semibold text-white"
                    style={{ fontSize: 18 }}
                  >
                    You left the call
                  </p>
                  <button
                    type="button"
                    onClick={() => setCallEnded(false)}
                    className="rounded-full border-0 cursor-pointer font-semibold text-white"
                    style={{
                      background: "#35c46a",
                      padding: "10px 24px",
                      fontSize: 14,
                    }}
                  >
                    Rejoin
                  </button>
                </div>
              )}
              <div className={callEnded ? "invisible" : undefined}>
                {effectiveView === "grid" ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 lg:grid-rows-3 gap-2.5 lg:h-[440px]">
                    {TEAM_ROSTER.map((m, i) => (
                      <CallTile
                        key={m.id}
                        member={m}
                        variant="grid"
                        fill
                        active={i === activeIndex}
                        videoEnabled={inView && !callEnded}
                        onSelect={() => selectSpeaker(i)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-stretch gap-2.5 lg:h-[440px]">
                    <div className="w-full sm:w-[58%] aspect-[4/3] lg:aspect-auto">
                      <CallTile
                        member={active}
                        variant="speaker"
                        active
                        videoEnabled={inView && !callEnded}
                      />
                    </div>
                    {/* h below sm: grid-rows-5 is 1fr rows, and 1fr of an auto
                      height grid sizes to content — tiles whose only content
                      is absolutely positioned (photos, videos) have none, so
                      pinning the one initials-only member deflated his row
                      and shrank the window. */}
                    <div className="grid w-full sm:w-[42%] grid-cols-2 grid-rows-5 gap-2 h-[240px] sm:h-auto">
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
            </div>

            {/* Chat — an overlay INSIDE the call window on every size. The
                mobile variant used to be a fixed full-screen takeover, which
                sat on top of the site nav; contained here, the page chrome
                stays reachable and the call still shows at the panel's edge. */}
            {!callEnded && chatOpen && (
              <div
                className="absolute inset-y-0 right-0 z-10"
                style={{ width: "min(85%, 300px)" }}
              >
                <ChatPanel open onClose={() => setChatOpen(false)} />
              </div>
            )}
          </div>

          <CallControls
            hidden={callEnded}
            chatOpen={chatOpen}
            onToggleChat={() => setChatOpen((o) => !o)}
            onLeave={() => {
              setChatOpen(false);
              setCallEnded(true);
            }}
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
