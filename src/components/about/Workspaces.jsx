import React, { useEffect, useState } from "react";
import WorkspaceCanvas from "./workspaces/WorkspaceCanvas.jsx";
import { WORKSPACE_CONFIGS } from "./workspaces/workspaceConfigs.js";
import "@dilsonspickles/components/style.css";

const WORKSPACE_KEYS = ["classic", "music", "modern", "custom"];
const FADE_MS = 180;

function Workspaces() {
  const [activeKey, setActiveKey] = useState("music");
  const [displayedKey, setDisplayedKey] = useState(activeKey);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    if (displayedKey === activeKey) return;
    setOpacity(0);
    const t = setTimeout(() => {
      setDisplayedKey(activeKey);
      setOpacity(1);
    }, FADE_MS);
    return () => clearTimeout(t);
  }, [activeKey, displayedKey]);

  const active = WORKSPACE_CONFIGS[displayedKey] ?? WORKSPACE_CONFIGS.music;
  const labelActive = WORKSPACE_CONFIGS[activeKey] ?? WORKSPACE_CONFIGS.music;

  return (
    <section className="bg-background-dark px-6 lg:px-10 py-24 lg:py-32">
      <div className="max-w-screen-xl mx-auto">
        <header className="max-w-3xl">
          <h2 className="font-symphony text-text-contrast text-5xl md:text-6xl lg:text-7xl leading-[1.05]">
            Workspaces
          </h2>
          <p className="mt-6 text-text-contrast/70 text-base md:text-lg">
            Pick a workspace to see how Audacity adapts. Tools, panels, and
            shortcuts reshape around the way you actually work.
          </p>
        </header>

        <div
          role="tablist"
          aria-label="Workspaces"
          className="mt-10 lg:mt-12 flex flex-wrap gap-3"
        >
          {WORKSPACE_KEYS.map((key) => {
            const cfg = WORKSPACE_CONFIGS[key];
            const isActive = activeKey === key;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveKey(key)}
                className={
                  "px-5 py-2.5 rounded-md border font-muse-sans text-base transition-colors " +
                  (isActive
                    ? "bg-text-contrast text-background-dark border-text-contrast"
                    : "bg-background-dark text-text-contrast border-white/15 hover:border-white/30")
                }
              >
                {cfg.label}
              </button>
            );
          })}
        </div>

        <div className="mt-8 lg:mt-10 rounded-2xl border border-white/15 p-4 lg:p-6">
          <div
            role="tabpanel"
            aria-label={`${labelActive.label} workspace preview`}
            className="aspect-[64/9] rounded-xl bg-black overflow-hidden"
            style={{
              opacity,
              transition: `opacity ${FADE_MS}ms ease`,
            }}
          >
            <WorkspaceCanvas key={displayedKey} config={active} />
          </div>
          <p
            className="mt-4 text-text-contrast/70 text-sm lg:text-base font-muse-sans"
            style={{
              opacity,
              transition: `opacity ${FADE_MS}ms ease`,
            }}
          >
            {active.blurb}
          </p>
        </div>
      </div>
    </section>
  );
}

export default Workspaces;
